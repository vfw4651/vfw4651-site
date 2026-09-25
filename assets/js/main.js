/* Shared header, footer, home-page widgets, social panels */
(function () {
  const S = window.SITE;
  const E = window.VFWEvents;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = (document.body.dataset.page || "home");

  const NAV = [
    ["home", "index.html", "Home"],
    ["mission", "our-mission.html", "Our Mission"],
    ["calendar", "calendar.html", "Calendar"],
    ["community", "community.html", "Community"],
    ["auxiliary", "auxiliary.html", "Auxiliary"],
    ["spaces", "event-spaces.html", "Event Spaces"],
    ["contact", "contact.html", "Contact"],
    ["join", "join-us.html", "Join Us", "cta"]
  ];

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
        <div><h3>Explore</h3><ul>${NAV.map(([k, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
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
