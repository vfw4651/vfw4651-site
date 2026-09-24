/* Calendar page */
(function () {
  const S = window.SITE, C = S.calendar, E = window.VFWEvents;
  const $ = s => document.querySelector(s);
  const esc = E.esc;
  const state = { view: "list", cats: new Set(Object.keys(S.categories)), q: "", cursor: new Date(), events: [] };
  state.cursor.setDate(1);
  const hasKey = !!C.apiKey;

  // ----- toolbar -----
  const chips = $("#chips");
  Object.entries(S.categories).forEach(([k, c]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.style.setProperty("--c", c.color);
    b.setAttribute("aria-pressed", "true"); b.textContent = c.label; b.dataset.k = k;
    b.onclick = () => { state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k); b.setAttribute("aria-pressed", state.cats.has(k)); render(); };
    chips.appendChild(b);
  });
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
    state.view = b.dataset.view;
    document.querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-pressed", x === b));
    render();
  });
  $("#q").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $("#print").onclick = () => window.print();

  // ----- subscribe box -----
  const sub = $("#subscribe-links");
  C.calendars.forEach(c => {
    const enc = encodeURIComponent(c.id);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${esc(c.label)}</strong>: <a target="_blank" rel="noopener" href="https://calendar.google.com/calendar/u/0/r?cid=${enc}">Add to Google Calendar</a> · <a href="webcal://calendar.google.com/calendar/ical/${enc}/public/basic.ics">Apple / Outlook (iCal)</a>`;
    sub.appendChild(li);
  });

  // ----- data -----
  function filtered() {
    return state.events.filter(e => state.cats.has(e.category) &&
      (!state.q || (e.title + " " + e.location + " " + e.desc + " " + e.source).toLowerCase().includes(state.q)));
  }

  const out = $("#out");
  function render() {
    if (state.view === "month") renderMonth(); else renderList();
  }

  function renderList() {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const list = filtered().filter(e => e.end >= now);
    out.innerHTML = "";
    if (!list.length) { out.innerHTML = `<div class="empty">No matching upcoming events. Try turning on more categories or clearing the search.</div>`; return; }
    let lastMonth = "", ul = null;
    list.forEach(e => {
      const m = e.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (m !== lastMonth) {
        const h = document.createElement("h2"); h.className = "month-h"; h.textContent = m; out.appendChild(h);
        ul = document.createElement("ul"); ul.className = "ev-list"; out.appendChild(ul); lastMonth = m;
      }
      ul.appendChild(E.eventCard(e));
    });
  }

  function renderMonth() {
    const y = state.cursor.getFullYear(), m = state.cursor.getMonth();
    const first = new Date(y, m, 1), startOffset = first.getDay();
    const gridStart = new Date(y, m, 1 - startOffset);
    const evs = filtered();
    const byDay = {};
    evs.forEach(e => { // spread multi-day events across days
      const d = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate());
      const last = new Date(e.end.getFullYear(), e.end.getMonth(), e.end.getDate());
      for (let i = 0; d <= last && i < 31; i++, d.setDate(d.getDate() + 1)) (byDay[E.dayKey(d)] = byDay[E.dayKey(d)] || []).push(e);
    });
    const todayK = E.dayKey(new Date());
    let cells = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      if (i >= 35 && d.getMonth() !== m) break;
      const k = E.dayKey(d), list = byDay[k] || [];
      const pills = list.slice(0, 3).map(e => `<button class="pill" style="--cat:${E.CATS[e.category].color}" data-id="${esc(e.id)}" title="${esc(e.title)}">${e.allDay ? "" : E.fmtTime(e.start) + " "}${esc(e.title)}</button>`).join("");
      cells += `<div class="cell ${d.getMonth() !== m ? "out" : ""} ${k === todayK ? "today" : ""}"><span class="n">${d.getDate()}</span>${pills}${list.length > 3 ? `<span class="more">+${list.length - 3} more</span>` : ""}</div>`;
    }
    out.innerHTML = `<div class="month-nav"><button type="button" id="prev" aria-label="Previous month">‹</button><h2>${state.cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button type="button" id="next" aria-label="Next month">›</button></div><div class="grid-cal" role="grid">${cells}</div><p class="meta" style="margin-top:.6rem">Tap an event for details. Switch to List view for a phone-friendly agenda.</p>`;
    $("#prev").onclick = () => { state.cursor.setMonth(state.cursor.getMonth() - 1); renderMonth(); };
    $("#next").onclick = () => { state.cursor.setMonth(state.cursor.getMonth() + 1); renderMonth(); };
  }

  // ----- detail dialog + ics -----
  const dlg = $("#dlg");
  function openDialog(id) {
    const e = state.events.find(x => x.id === id); if (!e) return;
    const ul = document.createElement("ul"); ul.className = "ev-list"; ul.appendChild(E.eventCard(e));
    ul.querySelector("details")?.setAttribute("open", "");
    $("#dlg-body").innerHTML = ""; $("#dlg-body").appendChild(ul); dlg.showModal();
  }
  document.addEventListener("click", ev => {
    const pill = ev.target.closest(".pill"); if (pill) return openDialog(pill.dataset.id);
    const ics = ev.target.closest("[data-ics]");
    if (ics) { const e = state.events.find(x => x.id === ics.dataset.ics); if (e) E.downloadIcs(e); }
  });
  $("#dlg-x").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  // ----- no-API-key fallback: embedded Google Calendar for the post calendar -----
  if (!hasKey) {
    const p = C.calendars.find(c => c.primary) || C.calendars[0];
    if (p) {
      const src = "https://calendar.google.com/calendar/embed?" + new URLSearchParams({ src: p.id, ctz: C.timezone, mode: "AGENDA", showTitle: "0", showPrint: "0", showTz: "0", color: "#1b4f9c" });
      $("#fallback").hidden = false;
      $("#fallback-frame").innerHTML = `<iframe class="gcal" title="Post 4651 calendar" src="${esc(src)}" loading="lazy"></iframe>`;
    }
    $("#area-h").hidden = false;
    // In fallback mode the custom views show outside events only
    state.cats.delete("post"); const pc = chips.querySelector('[data-k="post"]'); if (pc) pc.setAttribute("aria-pressed", "false");
  }

  // ----- go -----
  out.innerHTML = `<div class="empty">Loading events…</div>`;
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1), to = new Date(now.getFullYear(), now.getMonth() + 13, 0);
  E.loadEvents(from, to).then(({ events, errors }) => {
    state.events = events; render();
    if (errors.length) { const n = $("#errs"); n.hidden = false; n.textContent = "Some calendars could not be loaded right now (" + errors.join("; ") + "). Please try again later."; }
  });
})();
