/* Shared header, footer, home-page widgets, social panels */
(function () {
  const S = window.SITE;
  const E = window.VFWEvents;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = (document.body.dataset.page || "home");

  const NAV = [
    ["home", "index.html", "Home"],
    ["mission", "our-mission.html", "Our Mission"],
    ["history", "history.html", "History"],
    ["calendar", "calendar.html", "Calendar"],
    ["community", "community.html", "Community"],
    ["auxiliary", "auxiliary.html", "Auxiliary"],
    ["spaces", "event-spaces.html", "Event Spaces"],
    ["contact", "contact.html", "Contact"],
    ["join", "join-us.html", "Join Us", "cta"]
  ];
  // Footer "Explore" list: the menu pages plus Post Officers, which is not in the menu.
  const FOOT = NAV.flatMap(n => n[0] === "history" ? [n, ["officers", "officers.html", "Post Officers"]] : [n]);

  function header() {
    const mark = S.emblem ? `<img src="${esc(S.emblem)}" alt="">` : `<span class="mark" aria-hidden="true">4651</span>`;
    const links = NAV.map(([k, href, label, cls]) =>
      `<li><a href="${href}" ${cls ? `class="${cls}"` : ""} ${k === page ? 'aria-current="page"' : ""}>${label}</a></li>`).join("");
    return `<a class="skip" href="#main">Skip to content</a>
    <div class="topbar"><div class="wrap"><span>${esc(S.address.join(", "))}${S.meetings ? " · Meetings: " + esc(S.meetings) : ""}</span>
      <span>${S.phone ? `<a href="tel:${esc(S.phone.replace(/\D/g, ""))}">${esc(S.phone)}</a> · ` : ""}<a href="${esc(S.links.facebook)}" target="_blank" rel="noopener">Facebook</a> · <a href="${esc(S.links.instagram)}" target="_blank" rel="noopener">Instagram</a></span></div></div>
    <header class="site-header"><div class="wrap">
      <a class="brand" href="index.html">${mark}<span><span class="t1">${esc(S.short)}</span><span class="t2">${esc(S.tagline)}</span></span></a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav id="nav" aria-label="Main"><ul>${links}</ul></nav>
    </div></header>`;
  }

  function footer() {
    return `<footer><div class="wrap">
      <div class="cols">
        <div><h3>${esc(S.name)}</h3><p>Veterans of Foreign Wars of the United States, Post 4651.<br>An active social and mutual-aid club for veteran fellowship and citizenship.</p></div>
        <div><h3>Visit</h3><p>${S.address.map(esc).join("<br>")}<br>${S.phone ? `<a href="tel:${esc(S.phone.replace(/\D/g, ""))}">${esc(S.phone)}</a><br>` : ""}${S.email ? `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a><br>` : ""}${S.meetings ? "Meetings: " + esc(S.meetings) : ""}</p></div>
        <div><h3>Explore</h3><ul>${FOOT.map(([k, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
        <div><h3>Follow</h3><ul><li><a href="${esc(S.links.facebook)}" target="_blank" rel="noopener">Facebook</a></li><li><a href="${esc(S.links.instagram)}" target="_blank" rel="noopener">Instagram @${esc(S.links.instagramHandle)}</a></li><li><a href="${esc(S.links.deptCalendar)}" target="_blank" rel="noopener">VFW Dept. of RI calendar</a></li></ul></div>
      </div>
      <div class="legal">© <span id="yr"></span> ${esc(S.name)}. VFW and Veterans of Foreign Wars are marks of the Veterans of Foreign Wars of the U.S. This site is maintained by post volunteers.</div>
    </div></footer>`;
  }

  document.body.insertAdjacentHTML("afterbegin", header());
  document.body.insertAdjacentHTML("beforeend", footer());
  const yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
  const btn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  btn.addEventListener("click", () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });

  // ----- placeholders: [data-site="phone"] etc. -----
  document.querySelectorAll("[data-site]").forEach(el => {
    const k = el.dataset.site;
    const map = { phone: S.phone, email: S.email, address: S.address.join(", "), meetings: S.meetings, name: S.name, joinForm: S.links.joinForm, eligibility: S.links.eligibility, facebook: S.links.facebook, instagram: S.links.instagram };
    const v = map[k] || "";
    if (el.tagName === "A") { el.href = k === "phone" ? "tel:" + v.replace(/\D/g, "") : k === "email" ? "mailto:" + v : v; if (!el.textContent.trim()) el.textContent = v; if (!v) el.hidden = true; }
    else el.textContent = v;
  });

  // ----- next meeting: [data-next-meeting], worked out from the "last Thursday" rule -----
  // S.meetingChanges maps a usual date to a moved date ("" = not set yet).
  (function () {
    const els = document.querySelectorAll("[data-next-meeting]");
    if (!els.length) return;
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const changes = S.meetingChanges || {}, now = new Date();
    let text = "";
    for (let i = 0; i < 12 && !text; i++) {
      const last = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);        // last day of that month
      last.setDate(last.getDate() - ((last.getDay() - 4 + 7) % 7));                // back up to Thursday
      const moved = changes[iso(last)];
      const month = last.toLocaleDateString("en-US", { month: "long" });
      if (moved === "") {                                                          // moved, new date not set
        if (new Date(last.getFullYear(), last.getMonth() + 1, 1) > now) text = month + " date to be announced";
        continue;
      }
      const day = moved ? new Date(moved + "T12:00") : last;
      if (new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20) < now) continue;   // already over
      text = day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + (S.meetingTime ? ", " + S.meetingTime : "");
    }
    els.forEach(el => { el.textContent = text || S.meetings; });

    // With a calendar key, the Post's Google Calendar is the source of truth.
    const C = S.calendar || {};
    if (!C.apiKey || !S.meetingTitle || !E) return;
    const want = S.meetingTitle.toLowerCase(), tz = C.timezone;
    E.loadEvents(now, new Date(now.getTime() + 100 * 86400000)).then(({ events }) => {
      const m = events.find(e => !e.external && !e.allDay && e.end >= now && e.title.toLowerCase().includes(want));
      if (!m) return;
      const day = m.start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz });
      const time = m.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).replace(/\s?AM$/, " a.m.").replace(/\s?PM$/, " p.m.");
      els.forEach(el => { el.textContent = day + ", " + time; });
    }).catch(() => {});
  })();
  document.querySelectorAll("[data-greeters]").forEach(el => {
    const g = S.greeters || [];
    el.textContent = !g.length ? "a Post officer" : g.length < 3 ? g.join(" or ") : g.slice(0, -1).join(", ") + ", or " + g[g.length - 1];
  });

  // ----- room for rent: homepage banner + status on housing.html -----
  const H = S.housing;
  if (H) {
    const st = document.getElementById("housing-status");
    if (st && !H.available) st.removeAttribute("data-open");
    const hero = document.querySelector(".hero");
    if (H.available && hero) hero.insertAdjacentHTML("afterend",
      `<div class="housing-banner"><div class="wrap"><span><b>Room for rent</b> upstairs at the Post, 5 Haven Ave. Utilities &amp; WiFi included.</span><a class="btn sm" href="${esc(H.page)}">Details</a></div></div>`);
  }

  // ----- home: next events -----
  const up = document.getElementById("upcoming");
  if (up) {
    const now = new Date(), to = new Date(now.getTime() + 120 * 86400000);
    E.loadEvents(new Date(now.getFullYear(), now.getMonth(), now.getDate()), to).then(({ events }) => {
      const next = events.filter(e => e.end >= now).slice(0, 4);
      up.innerHTML = "";
      if (!next.length) { up.innerHTML = `<li class="empty">No upcoming events posted yet — check the <a href="calendar.html">full calendar</a>.</li>`; return; }
      next.forEach(e => up.appendChild(E.eventCard(e, { compact: true })));
    });
  }

  // ----- social panels -----
  // Add id="social" to any page's markup to render Facebook + Instagram panels there.
  // Add data-only="instagram" (or "facebook") on that element to show just one platform.
  document.querySelectorAll("#social, [data-social]").forEach(soc => {
    const L = S.links;
    const only = soc.dataset.only || "";
    const ig = S.instagramFeedId
      ? `<behold-widget feed-id="${esc(S.instagramFeedId)}"></behold-widget>`
      : `<div class="follow"><p>See photos and updates from the post on Instagram.</p><a class="btn navy" target="_blank" rel="noopener" href="${esc(L.instagram)}">Follow @${esc(L.instagramHandle)}</a></div>`;
    let fb;
    if (L.facebookPage) {
      const src = "https://www.facebook.com/plugins/page.php?" + new URLSearchParams({ href: L.facebookPage, tabs: "timeline", width: "500", height: "600", small_header: "true", adapt_container_width: "true", hide_cover: "false", show_facepile: "false" });
      fb = `<iframe title="Post 4651 on Facebook" src="${esc(src)}" height="600" loading="lazy" allow="encrypted-media"></iframe>`;
    } else {
      fb = `<div class="follow"><p>Join the conversation, RSVP and see announcements in our Facebook group.</p><a class="btn navy" target="_blank" rel="noopener" href="${esc(L.facebook)}">Open our Facebook group</a></div>`;
    }
    const panels = { facebook: `<div class="panel"><header>Facebook</header><div class="body">${fb}</div></div>`,
                      instagram: `<div class="panel"><header>Instagram</header><div class="body">${ig}</div></div>` };
    soc.innerHTML = only ? (panels[only] || "") : panels.facebook + panels.instagram;
    if (S.instagramFeedId && (!only || only === "instagram")) { const s = document.createElement("script"); s.type = "module"; s.src = "https://w.behold.so/widget.js"; document.head.appendChild(s); }
  });
})();
