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
  function normStatic(e, i) {
    const allDay = !!e.allDay || (e.start && e.start.length === 10);
    const start = allDay ? parseLocalDate(e.start.slice(0, 10)) : new Date(e.start);
    const end = e.end ? (allDay ? parseLocalDate(e.end.slice(0, 10)) : new Date(e.end)) : start;
    const desc = e.description || "";
    return {
      id: "s-" + i, title: e.title, start, end, allDay, location: e.location || "", desc,
      url: e.url || "", category: detectCategory(desc, e.category || "area"), source: e.source || "", external: true
    };
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
    return (j.items || []).filter(i => i.status !== "cancelled" && i.start).map(i => normGoogle(i, cal));
  }
  async function fromStatic(from, to) {
    if (!C.staticFile) return [];
    const r = await fetch(C.staticFile, { cache: "no-cache" });
    if (!r.ok) throw new Error("Static events file: HTTP " + r.status);
    const j = await r.json();
    return (j.events || []).map(normStatic).filter(e => e.end >= from && e.start <= to);
  }

  async function loadEvents(from, to) {
    const errors = [];
    const jobs = [fromStatic(from, to).catch(e => { errors.push(e.message); return []; })];
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
      ${e.url ? `<p><a href="${esc(e.url)}" target="_blank" rel="noopener">${e.external ? "Organizer's page" : "View on Google Calendar"} ↗</a>${e.source ? " <span class='meta'>(" + esc(e.source) + ")</span>" : ""}</p>` : ""}
    </details>` : "";
    li.innerHTML = `<div class="date" aria-hidden="true"><div class="m">${e.start.toLocaleDateString("en-US", { month: "short" })}</div><div class="d">${e.start.getDate()}</div><div class="w">${e.start.toLocaleDateString("en-US", { weekday: "short" })}</div></div>
      <div><h3>${esc(e.title)}</h3><div class="meta"><span class="tag">${esc(cat.label)}</span><time datetime="${e.start.toISOString()}">${fmtDate(e.start, { weekday: "long", month: "long", day: "numeric" })}</time> · ${whenText(e)}${loc}</div></div>
      ${opts.compact ? "" : `<div class="actions"><a class="btn outline sm" target="_blank" rel="noopener" href="${esc(googleAddUrl(e))}">+ Google</a><button class="btn outline sm" type="button" data-ics="${esc(e.id)}">.ics</button></div>`}
      ${more}`;
    return li;
  }

  window.VFWEvents = { loadEvents, eventCard, downloadIcs, googleAddUrl, esc, linkify, whenText, fmtDate, fmtTime, dayKey, CATS };
})();
