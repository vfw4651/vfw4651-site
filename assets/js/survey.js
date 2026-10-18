/* ============================================================
   VFW POST 4651 — FIVE-QUESTION SURVEY (survey.html)
   Answers are sent to a Google Form owned by the Post, which
   files each one as a row in its Google Sheet.

   ⚠ The option wording below must match the Google Form word for
   word, or Google drops the answer. The same list is in
   tools/survey-setup.gs. Change both together (or re-run setup).
   ============================================================ */
window.SURVEY_QUESTIONS = [
  { key: "who", type: "check", max: 0,
    q: "Which describes you?", hint: "Check all that apply.",
    options: [
      "Veteran",
      "Currently serving (active duty / Guard / Reserve)",
      "Spouse or family of a veteran or service member",
      "Neighbor or community member",
      "Other"
    ] },
  { key: "age", type: "radio",
    q: "Your age?",
    options: ["Under 30", "30 to 44", "45 to 59", "60 to 74", "75 and over"] },
  { key: "visits", type: "radio",
    q: "Have you been to the Post on Haven Avenue?",
    options: [
      "I'm a member",
      "I come by, but I'm not a member",
      "Once or a few times",
      "Never, but I've heard of it",
      "First I've heard of it"
    ] },
  { key: "barriers", type: "check", max: 2,
    q: "What keeps you from coming more often?", hint: "Pick up to two.",
    options: [
      "I didn't know I'd be welcome",
      "Not sure what goes on there",
      "The times don't fit my schedule",
      "It seems like just a bar",
      "I don't know anyone there",
      "Not much for families or kids",
      "Getting there / parking / access",
      "Nothing. I'm already there"
    ] },
  { key: "wants", type: "check", max: 3,
    q: "What would bring you in?", hint: "Pick up to three.",
    options: [
      "Family and kids' events",
      "Career and job help",
      "Help with VA benefits and claims",
      "Food and social nights",
      "Sports on TV at the canteen",
      "Meeting other veterans",
      "Volunteering in Cranston",
      "History talks and veterans' stories"
    ] }
];

(function () {
  const S = (window.SITE && window.SITE.survey) || {};
  const Q = window.SURVEY_QUESTIONS;
  const form = document.getElementById("survey");
  if (!form) return;
  const live = !!(S.action && S.entries && S.entries.who);
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Draw the questions */
  const list = form.querySelector(".sv-questions");
  list.innerHTML = Q.map((x, i) => `
    <fieldset class="sv-q" data-key="${x.key}" data-max="${x.max || 0}">
      <legend><span class="sv-num">${i + 1}</span>${esc(x.q)}${x.hint ? ` <small>${esc(x.hint)}</small>` : ""}</legend>
      <div class="sv-opts">${x.options.map((o, j) => `
        <label class="sv-opt"><input type="${x.type === "check" ? "checkbox" : "radio"}" name="${x.key}" value="${esc(o)}" id="${x.key}-${j}"><span>${esc(o)}</span></label>`).join("")}
      </div>
    </fieldset>`).join("");

  /* "Pick up to N": grey out the rest once N are ticked */
  list.querySelectorAll(".sv-q[data-max]").forEach(fs => {
    const max = +fs.dataset.max;
    if (!max) return;
    fs.addEventListener("change", () => {
      const boxes = [...fs.querySelectorAll("input")];
      const n = boxes.filter(b => b.checked).length;
      boxes.forEach(b => { if (!b.checked) { b.disabled = n >= max; b.closest(".sv-opt").classList.toggle("off", n >= max); } });
    });
  });

  /* Where the visitor came from: survey.html?src=fb, ?src=coaster, ?src=qr ... */
  const src = (new URLSearchParams(location.search).get("src") || "direct").slice(0, 40);

  const msg = form.querySelector(".sv-msg");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form.querySelector('[name="website"]').value) return;       // bot trap
    const data = new FormData();
    let answered = 0;
    Q.forEach(x => {
      form.querySelectorAll(`[name="${x.key}"]:checked`).forEach(b => { data.append(S.entries[x.key] || x.key, b.value); answered++; });
    });
    const note = form.querySelector('[name="note"]').value.trim();
    if (note) { data.append(S.entries.note || "note", note.slice(0, 1000)); answered++; }
    data.append(S.entries.src || "src", src);
    if (!answered) { msg.textContent = "Pick at least one answer, then send."; msg.className = "sv-msg warn"; return; }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending…";
    if (!live) {                                                     // not wired to the Google Form yet
      msg.textContent = "Preview only: this survey isn't collecting answers yet."; msg.className = "sv-msg warn";
      btn.disabled = false; btn.textContent = "Send my answers"; return;
    }
    try {
      // Google Forms doesn't allow reading its reply from another site, so this
      // is sent "no-cors": it goes through, but the page can't see Google's answer.
      await fetch(S.action, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
      form.hidden = true;
      document.getElementById("survey-done").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      msg.innerHTML = `That didn't go through. Check your connection and try again${S.fallback ? `, or <a href="${S.fallback}" target="_blank" rel="noopener">use the Google Form</a>` : ""}.`;
      msg.className = "sv-msg warn";
      btn.disabled = false; btn.textContent = "Send my answers";
    }
  });
})();
