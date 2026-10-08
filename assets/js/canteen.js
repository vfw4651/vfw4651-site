/* The Canteen: the regular menu and this week's games and specials, drawn from data/canteen.json.
   Used by canteen.html (#canteen) and by the Home page note ([data-canteen-teaser]).
   A week stops showing by itself once its "to" date has passed. */
(function () {
  const page = document.getElementById("canteen");
  const teasers = document.querySelectorAll("[data-canteen-teaser]");
  if (!page && !teasers.length) return;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const local = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const now = new Date();
  const today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  const long = s => local(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  function span(from, to) {                       // "October 10–11" or "October 31 – November 1"
    const a = local(from), b = local(to), mo = d => d.toLocaleDateString("en-US", { month: "long" });
    if (from === to) return mo(a) + " " + a.getDate();
    return mo(a) === mo(b) ? mo(a) + " " + a.getDate() + "–" + b.getDate() : mo(a) + " " + a.getDate() + " – " + mo(b) + " " + b.getDate();
  }

  function teaser(d) {
    const w = d.week, st = d.standing;
    if (w && w.to >= today) {
      const f = w.football && w.football.featured;
      const bits = [];
      if (f) bits.push(esc(f.game) + " at " + esc(f.time) + " Sunday");
      if (w.specials && w.specials.length) bits.push("weekend specials");
      if (w.buckets) bits.push("beer buckets");
      return `<b>This weekend at the Canteen.</b> ${esc(w.title)}, ${span(w.from, w.to)}${bits.length ? ": " + bits.join(", ") : ""}. <a href="canteen.html">See the games and the menu</a>.`;
    }
    if (st && (!st.until || st.until >= today)) return `<b>${esc(st.title)}.</b> ${esc(st.text)} <a href="canteen.html">Details</a>.`;
    return "";
  }

  function render(d) {
    const w = d.week, st = d.standing, mn = d.menu;
    const current = w && w.to >= today;
    const secs = [];                                  // one entry per section; backgrounds alternate
    const item = i => `<li>
          <div class="row"><span class="name">${esc(i.name)}</span>${i.price ? `<span class="price">${esc(i.price)}</span>` : ""}</div>
          ${i.tag ? `<div class="tag">${esc(i.tag)}</div>` : ""}
          ${i.desc ? `<p>${esc(i.desc)}</p>` : ""}
          ${(i.options || []).map(o => `<div class="row opt"><span>${esc(o.label)}</span><span class="price">${esc(o.price)}</span></div>`).join("")}
        </li>`;
    if (current) {
      const fb = w.football, bk = w.buckets;
      let h = `<div class="kicker">This weekend · ${span(w.from, w.to)}</div><h2>${esc(w.title)}</h2>
        <ul class="canteen-days">${(w.days || []).map(x => `<li><b>${esc(x.label)}</b><span>${long(x.date)}${x.hours ? " · " + esc(x.hours) : ""}</span></li>`).join("")}</ul>
        <div class="grid2 canteen-top">`;
      if (fb) h += `<div class="card gameday">
          <div class="kicker">Sunday Football</div>
          <h3>${esc(fb.featured.game)} <span>· ${esc(fb.featured.time)}</span></h3>
          <p class="when">${long(fb.date)}${fb.hours ? " · " + esc(fb.hours) : ""}</p>
          <div class="slots">${(fb.slots || []).map(s => `<div><h4>${esc(s.time)}</h4><ul>${s.games.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>`).join("")}</div>
          ${fb.note ? `<p class="fine">${esc(fb.note)}</p>` : ""}
        </div>`;
      if (bk) h += `<div class="card">
          <div class="kicker">${esc(bk.sub || "")}</div><h3>${esc(bk.title)}</h3>
          <ul class="menu">${bk.items.map(i => `<li><div class="row"><span class="name">${esc(i.label)}</span><span class="price">${esc(i.price)}</span></div></li>`).join("")}</ul>
          ${bk.note ? `<p class="fine">${esc(bk.note)}</p>` : ""}
        </div>`;
      secs.push(h + `</div>`);
      if (w.specials && w.specials.length) secs.push(`<div class="kicker">This weekend only · ${span(w.from, w.to)}</div><h2>${esc(w.specialsTitle || "Specials")}</h2>
        <ul class="menu two">${w.specials.map(item).join("")}</ul>
        ${w.specialsNote ? `<p class="fine">${esc(w.specialsNote)}</p>` : ""}`);
    } else {
      const on = st && (!st.until || st.until >= today);
      secs.push(`${on ? `<div class="kicker">Every Sunday</div><h2>${esc(st.title)}</h2><p>${esc(st.text)}</p>` : `<h2>At the Canteen</h2>`}
        <p>This week's games and specials are posted here before the weekend. For today's hours, call the Post.</p>`);
    }
    if (mn && mn.items && mn.items.length) {
      const wg = mn.wings;
      secs.push(`<div class="kicker">On the menu</div><h2 id="menu">${esc(mn.title || "Menu")}</h2>
        <div class="grid2 canteen-menu">
          <ul class="menu">${mn.items.map(item).join("")}</ul>
          ${wg ? `<div class="card wings"><h3>${esc(wg.title)}</h3>${wg.text ? `<p>${esc(wg.text)}</p>` : ""}
            <div class="slots">${(wg.groups || []).map(g => `<div><h4>${esc(g.title)}</h4><ul>${g.flavors.map(f => `<li>${esc(f.name)}${f.spicy ? ` <span class="hot">Spicy</span>` : ""}</li>`).join("")}</ul></div>`).join("")}</div>
          </div>` : ""}
        </div>
        ${mn.note ? `<p class="fine">${esc(mn.note)}</p>` : ""}`);
    }
    page.innerHTML = secs.map((x, i) => `<section class="block${i % 2 ? " alt" : ""}"><div class="wrap">${x}</div></section>`).join("");
    const find = document.getElementById("canteen-find");
    if (find) find.classList.toggle("alt", secs.length % 2 === 1);
  }

  fetch("data/canteen.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(d => {
    if (page) render(d);
    const t = teaser(d);
    teasers.forEach(el => { if (t) { el.innerHTML = t; el.hidden = false; } });
  }).catch(() => {
    if (page) page.innerHTML = `<section class="block"><div class="wrap"><p class="empty">This week's details could not be loaded. Please call the Post.</p></div></section>`;
  });
})();
