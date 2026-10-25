/* Shared event loading + helpers (used by home and calendar pages) */
(function () {
  const S = window.SITE, C = S.calendar;
  const CATS = S.categories;
  const pad = n => String(n).padStart(2, "0");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // Escape, then turn plain URLs into links (safe: escape happens first)
  function linkify(s) {
    return esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
  function stripHtml(s) {
    if (!s) return "";
    const t = String(s).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<[^>]+>/g, "");
    const d = document.createElement("textarea"); d.innerHTML = t; return d.value.trim();
  }
  function parseLocalDate(s) { // "YYYY-MM-DD" -> local midnight
    const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d);
  }
  function detectCategory(text, fallback) {
    const m = /#(post|area|benefits|community)\b/i.exec(text || "");
    return m ? m[1].toLowerCase() : (fallback || "post");
  }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function normGoogle(item, cal) {
    const allDay = !!(item.start && item.start.date);
    const start = allDay ? parseLocalDate(item.start.date) : new Date(item.start.dateTime);
    let end = allDay ? parseLocalDate(item.end.date) : new Date(item.end.dateTime);
    if (allDay) end = new Date(end.getTime() - 86400000); // Google's all-day end is exclusive
    const desc = stripHtml(item.description || "");
    return {
      id: "g-" + item.id, title: item.summary || "(untitled)", start, end, allDay,
      location: item.location || "", desc, url: item.htmlLink || "",
      category: detectCategory(desc, cal.category), source: cal.label
    };
  }
  function normStatic(e, i, opts) {
    opts = opts || {};
    const allDay = !!e.allDay || (e.start && e.start.length === 10);
    const start = allDay ? parseLocalDate(e.start.slice(0, 10)) : new Date(e.start);
    const end = e.end ? (allDay ? parseLocalDate(e.end.slice(0, 10)) : new Date(e.end)) : start;
    const desc = e.description || "";
    return {
      id: (opts.prefix || "s-") + i, title: e.title, start, end, allDay, location: e.location || "", desc,
      url: e.url || "", category: detectCategory(desc, e.category || opts.category || "area"),
      source: e.source || opts.source || "", external: opts.external !== false
    };
  }

  // ----- repeating Post events (data/events-post.json "repeating") -----
  // A rule is expanded into dated instances inside [from, to]. See the file's _help for the fields.
  const DOW = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const NTH = { first: 1, second: 2, third: 3, fourth: 4, last: -1 };
  function nthWeekday(y, m, dow, which) {           // which: 1..4 or -1 for last; m is 0-based
    if (which === -1) { const d = new Date(y, m + 1, 0); d.setDate(d.getDate() - ((d.getDay() - dow + 7) % 7)); return d; }
    const d = new Date(y, m, 1); d.setDate(1 + ((dow - d.getDay() + 7) % 7) + 7 * (which - 1)); return d;
  }
  function expandRule(r, from, to) {
    const dow = DOW[String(r.weekday || "").toLowerCase()], which = NTH[String(r.which || "last").toLowerCase()];
    if (dow == null) return [];
    const lo = r.from ? parseLocalDate(r.from) : new Date(from.getFullYear(), from.getMonth(), 1);
    const hi = r.until ? parseLocalDate(r.until) : to;
    const moves = r.moves || {}, skip = new Set(r.skip || []);
    const days = [];
    if (r.every === "week") {
      const d = new Date(Math.max(lo, from)); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
      for (; d <= to && d <= hi; d.setDate(d.getDate() + 7)) days.push(new Date(d));
    } else {
      for (let y = from.getFullYear(), m = from.getMonth(); new Date(y, m, 1) <= to; m++) {
        if (m > 11) { m = 0; y++; }
        days.push(nthWeekday(y, m, dow, which));
      }
    }
    const out = [];
    days.forEach(d => {
      const k = dayKey(d);
      if (skip.has(k) || moves[k] === "") return;             // cancelled, or moved with no new date yet
      const day = moves[k] ? parseLocalDate(moves[k]) : d;
      if (day < lo || day > hi) return;
      const [h1, n1] = (r.time || "00:00").split(":").map(Number);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h1, n1);
      let end = start;
      if (r.end) { const [h2, n2] = r.end.split(":").map(Number); end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h2, n2); if (end < start) end.setDate(end.getDate() + 1); }
      if (end < from || start > to) return;
      out.push({ id: "r-" + (r.id || r.title) + "-" + dayKey(day), title: r.title, start, end, allDay: !r.time,
        location: r.location || "", desc: r.description || "", url: r.url || "",
        category: detectCategory(r.description, r.category || "post"), source: "Post 4651", external: false,
        moved: moves[k] ? k : "" });
    });
    return out;
  }

  async function fromGoogle(cal, from, to) {
    const u = new URL("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(cal.id) + "/events");
    u.search = new URLSearchParams({
      key: C.apiKey, singleEvents: "true", orderBy: "startTime", maxResults: "250",
      timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: C.timezone
    });
    const r = await fetch(u);
    if (!r.ok) throw new Error(cal.label + ": HTTP " + r.status);
    const j = await r.json();
    // Skip events the public can only see as "busy" (no title): on a calendar shared as free/busy only,
    // an event shows here only if its own visibility is set to Public.
    return (j.items || []).filter(i => i.status !== "cancelled" && i.start && i.summary).map(i => normGoogle(i, cal));
  }
  async function fromStatic(from, to) {           // outside events: data/events-area.json
    if (!C.staticFile) return [];
    const r = await fetch(C.staticFile, { cache: "no-cache" });
    if (!r.ok) throw new Error("Area events file: HTTP " + r.status);
    const j = await r.json();
    return (j.events || []).map((e, i) => normStatic(e, i)).filter(e => e.end >= from && e.start <= to);
  }
  async function fromPost(from, to) {             // the Post's own calendar: data/events-post.json
    if (!C.postFile) return [];
    const r = await fetch(C.postFile, { cache: "no-cache" });
    if (!r.ok) throw new Error("Post events file: HTTP " + r.status);
    const j = await r.json();
    const one = (j.events || []).map((e, i) => normStatic(e, i, { prefix: "p-", category: "post", source: "Post 4651", external: false }));
    const rep = (j.repeating || []).flatMap(rule => expandRule(rule, from, to));
    return one.concat(rep).filter(e => e.end >= from && e.start <= to);
  }

  async function loadEvents(from, to) {
    const errors = [];
    const jobs = [fromPost(from, to), fromStatic(from, to)].map(p => p.catch(e => { errors.push(e.message); return []; }));
    if (C.apiKey) C.calendars.forEach(cal => jobs.push(fromGoogle(cal, from, to).catch(e => { errors.push(e.message); return []; })));
    const all = (await Promise.all(jobs)).flat().sort((a, b) => a.start - b.start);
    return { events: all, errors };
  }

  const fmtDate = (d, o) => d.toLocaleDateString("en-US", o || { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const fmtTime = d => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "");
  function whenText(e) {
    if (e.allDay) {
      return dayKey(e.start) === dayKey(e.end) ? "All day" : "All day · through " + fmtDate(e.end, { month: "short", day: "numeric" });
    }
    let t = fmtTime(e.start);
    if (e.end && e.end > e.start) t += " – " + fmtTime(e.end);
    return t;
  }

  // "Add to calendar" helpers
  const utc = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  const ymd = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  function googleAddUrl(e) {
    let dates;
    if (e.allDay) { const x = new Date(e.end.getTime() + 86400000); dates = ymd(e.start) + "/" + ymd(x); }
    else { const end = e.end > e.start ? e.end : new Date(e.start.getTime() + 3600000); dates = utc(e.start) + "/" + utc(end); }
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, details: (e.desc ? e.desc + "\n\n" : "") + (e.url || ""), location: e.location || "" });
    return "https://calendar.google.com/calendar/render?" + p;
  }
  function icsText(e) {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VFW Post 4651//EN", "BEGIN:VEVENT",
      "UID:" + e.id + "@vfw4651.org", "DTSTAMP:" + utc(new Date())];
    if (e.allDay) { lines.push("DTSTART;VALUE=DATE:" + ymd(e.start), "DTEND;VALUE=DATE:" + ymd(new Date(e.end.getTime() + 86400000))); }
    else { const end = e.end > e.start ? e.end : new Date(e.start.getTime() + 3600000); lines.push("DTSTART:" + utc(e.start), "DTEND:" + utc(end)); }
    const t = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    lines.push("SUMMARY:" + t(e.title), "LOCATION:" + t(e.location), "DESCRIPTION:" + t(e.desc + (e.url ? "\n" + e.url : "")), "END:VEVENT", "END:VCALENDAR");
    return lines.join("\r\n");
  }
  function downloadIcs(e) {
    const blob = new Blob([icsText(e)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = e.title.replace(/[^\w]+/g, "-").slice(0, 40) + ".ics";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function eventCard(e, opts) {
    opts = opts || {};
    const cat = CATS[e.category] || CATS.post;
    const li = document.createElement("li");
    li.className = "ev" + (e.end < new Date() ? " past" : "");
    li.style.setProperty("--cat", cat.color);
    li.dataset.id = e.id;
    const loc = e.location ? " · " + esc(e.location) : "";
    const more = (e.desc || e.url) && !opts.compact ? `<details><summary>Details</summary>
      ${e.desc ? `<div class="desc">${linkify(e.desc)}</div>` : ""}
      ${e.url ? `<p><a href="${esc(e.url)}" target="_blank" rel="noopener">${e.id.startsWith("g-") ? "View on Google Calendar" : e.external ? "Organizer's page" : "Tickets & details"} ↗</a>${e.source ? " <span class='meta'>(" + esc(e.source) + ")</span>" : ""}</p>` : ""}
    </details>` : "";
    li.innerHTML = `<div class="date" aria-hidden="true"><div class="m">${e.start.toLocaleDateString("en-US", { month: "short" })}</div><div class="d">${e.start.getDate()}</div><div class="w">${e.start.toLocaleDateString("en-US", { weekday: "short" })}</div></div>
      <div><h3>${esc(e.title)}</h3><div class="meta"><span class="tag">${esc(cat.label)}</span><time datetime="${e.start.toISOString()}">${fmtDate(e.start, { weekday: "long", month: "long", day: "numeric" })}</time> · ${whenText(e)}${loc}</div></div>
      ${opts.compact ? "" : `<div class="actions"><a class="btn outline sm" target="_blank" rel="noopener" href="${esc(googleAddUrl(e))}">+ Google</a><button class="btn outline sm" type="button" data-ics="${esc(e.id)}">.ics</button></div>`}
      ${more}`;
    return li;
  }

  window.VFWEvents = { loadEvents, expandRule, eventCard, downloadIcs, googleAddUrl, esc, linkify, whenText, fmtDate, fmtTime, dayKey, CATS };
})();
