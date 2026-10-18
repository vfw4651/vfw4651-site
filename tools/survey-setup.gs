/* ============================================================
   VFW POST 4651 — SURVEY SETUP (run once, in Google Apps Script)

   What it does: creates the Google Form behind vfw4651.org/survey.html,
   a Google Sheet that collects the answers, and a "Summary" tab in that
   Sheet that counts every answer by itself as responses come in.

   How to run it:
     1. Signed in to the Post's Google account, open script.google.com
        and click "New project".
     2. Delete what is in the editor, paste this whole file, and save.
     3. Pick "setUpSurvey" in the function menu at the top and click Run.
        Google asks you to approve access to Forms and Sheets: approve.
     4. When it finishes, the Execution log shows a block that starts
        "survey: {". Copy it and send it to Claude (or paste it into
        assets/js/config.js in place of the empty survey block).

   Run it only once. Running it again makes a second form and sheet.
   The questions below are copied from assets/js/survey.js; the wording
   must match the website exactly.
   ============================================================ */

const QUESTIONS = [
  {
    "key": "who",
    "type": "check",
    "max": 0,
    "q": "Which describes you?",
    "hint": "Check all that apply.",
    "options": [
      "Veteran",
      "Currently serving (active duty / Guard / Reserve)",
      "Spouse or family of a veteran or service member",
      "Neighbor or community member",
      "Other"
    ]
  },
  {
    "key": "age",
    "type": "radio",
    "q": "Your age?",
    "options": [
      "Under 30",
      "30 to 44",
      "45 to 59",
      "60 to 74",
      "75 and over"
    ]
  },
  {
    "key": "visits",
    "type": "radio",
    "q": "Have you been to the Post on Haven Avenue?",
    "options": [
      "I'm a member",
      "I come by, but I'm not a member",
      "Once or a few times",
      "Never, but I've heard of it",
      "First I've heard of it"
    ]
  },
  {
    "key": "barriers",
    "type": "check",
    "max": 2,
    "q": "What keeps you from coming more often?",
    "hint": "Pick up to two.",
    "options": [
      "I didn't know I'd be welcome",
      "Not sure what goes on there",
      "The times don't fit my schedule",
      "It seems like just a bar",
      "I don't know anyone there",
      "Not much for families or kids",
      "Getting there / parking / access",
      "Nothing. I'm already there"
    ]
  },
  {
    "key": "wants",
    "type": "check",
    "max": 3,
    "q": "What would bring you in?",
    "hint": "Pick up to three.",
    "options": [
      "Family and kids' events",
      "Career and job help",
      "Help with VA benefits and claims",
      "Food and social nights",
      "Sports on TV at the canteen",
      "Meeting other veterans",
      "Volunteering in Cranston",
      "History talks and veterans' stories"
    ]
  }
];

function setUpSurvey() {
  const form = FormApp.create("VFW Post 4651 — Five Quick Questions");
  form.setDescription("Answers from vfw4651.org/survey.html. Please share the website link, not this form.")
      .setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setAllowResponseEdits(false)
      .setShowLinkToRespondAgain(false)
      .setConfirmationMessage("Thank you for helping VFW Post 4651.");
  try { form.setRequireLogin(false); } catch (e) { /* only exists on Workspace accounts */ }

  const items = {};
  QUESTIONS.forEach(q => {
    let it;
    if (q.type === "check") {
      it = form.addCheckboxItem().setTitle(q.q).setChoiceValues(q.options);
      if (q.max) it.setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(q.max).build());
    } else {
      it = form.addMultipleChoiceItem().setTitle(q.q).setChoiceValues(q.options);
    }
    if (q.hint) it.setHelpText(q.hint);
    items[q.key] = { item: it, q: q };
  });
  items.note = { item: form.addParagraphTextItem().setTitle("Anything else?") };
  items.src  = { item: form.addTextItem().setTitle("Source (filled in by the website)") };

  // Find the entry.NNN name of each question by building a pre-filled link.
  const keys = Object.keys(items);
  const resp = form.createResponse();
  keys.forEach(k => {
    const item = items[k].item, q = items[k].q;
    if (!q) resp.withItemResponse(item.createResponse("x"));
    else if (q.type === "check") resp.withItemResponse(item.createResponse([q.options[0]]));
    else resp.withItemResponse(item.createResponse(q.options[0]));
  });
  const ids = resp.toPrefilledUrl().match(/entry\.\d+/g);
  const entries = {};
  keys.forEach((k, i) => { entries[k] = ids[i]; });

  // The response sheet, and a Summary tab in front of it.
  const ss = SpreadsheetApp.create("VFW Post 4651 — Survey responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(3000);
  const respSheet = ss.getSheets().filter(s => s.getFormUrl())[0] || ss.getSheets()[0];
  const R = "'" + respSheet.getName() + "'!";
  const summary = ss.getSheetByName("Sheet1") || ss.insertSheet();
  summary.setName("Summary");
  ss.setActiveSheet(summary);
  ss.moveActiveSheet(1);

  const cols = ["B", "C", "D", "E", "F", "G", "H"];   // column A is the timestamp
  const reEsc = s => s.replace(/[.*+?^$()[\]{}|\\]/g, "\\$&");
  const rows = [["VFW Post 4651 — survey summary", "", ""],
                ["Responses so far", "=COUNTA(" + R + "A:A)-1", ""],
                ["", "", ""]];
  QUESTIONS.forEach((q, i) => {
    const col = R + cols[i] + ":" + cols[i];   // whole column: Forms inserts rows, which would shift "B2:B"
    rows.push([(i + 1) + ". " + q.q + (q.hint ? "  (" + q.hint + ")" : ""), "Count", "Share of responses"]);
    q.options.forEach(o => {
      const r = rows.length + 1;
      // Checkbox answers arrive as "A, B, C"; match each option as a whole item.
      const f = q.type === "check"
        ? '=SUMPRODUCT(--REGEXMATCH(' + col + ', "(^|, )' + reEsc(o) + '(,|$)"))'
        : '=COUNTIF(' + col + ', "' + o + '")';
      rows.push(["   " + o, f, '=IF($B$2=0, "", B' + r + '/$B$2)']);
    });
    rows.push(["", "", ""]);
  });
  rows.push(["Where people came from (the ?src= tag on the link)", "Count", ""]);
  summary.getRange(1, 1, rows.length, 3).setValues(rows);
  summary.getRange(rows.length + 1, 1).setFormula(
    '=IFERROR(QUERY(' + R + 'H:H, "select H, count(H) where H is not null group by H order by count(H) desc label count(H) \'\'", 1), "(none yet)")');
  summary.getRange("C:C").setNumberFormat("0%");
  summary.getRange("A1").setFontSize(14).setFontWeight("bold");
  rows.forEach((r, i) => {
    if (r[1] === "Count") summary.getRange(i + 1, 1, 1, 3).setFontWeight("bold").setBackground("#e8edf5");
  });
  summary.setColumnWidth(1, 430);
  summary.setColumnWidths(2, 2, 140);
  summary.setFrozenRows(2);

  const viewUrl = form.getPublishedUrl();
  const action = viewUrl.replace(/\/viewform.*$/, "/formResponse");
  Logger.log("Form (edit):  " + form.getEditUrl());
  Logger.log("Sheet:        " + ss.getUrl());
  Logger.log("Copy the block below into assets/js/config.js, or send it to Claude:\n\n" +
    "  survey: {\n" +
    '    action: "' + action + '",\n' +
    '    fallback: "' + viewUrl + '",\n' +
    "    entries: " + JSON.stringify(entries) + "\n" +
    "  },");
}

/* ------------------------------------------------------------
   fixSummary — one-time repair for the Sheet made on Oct 18, 2026 (9:16 a.m. build).
   Google Forms adds each answer by inserting a row, which pushed the
   Summary's "B2:B"-style ranges down a row (so the first answer was
   missed). This points every Summary formula at whole columns instead.
   Run it once from the same Apps Script project. Safe to run again.
   ------------------------------------------------------------ */
function fixSummary() {
  const ss = SpreadsheetApp.openById("1mpGLA4eiO11Sa5ZCbREH4LCQBTM1v1OIVSp3mm3pQEk");
  const sum = ss.getSheetByName("Summary");
  sum.createTextFinder("!([A-H])\\d+:").useRegularExpression(true).matchFormulaText(true).replaceAllWith("!$1:");
  const b2 = sum.getRange("B2");
  b2.setFormula(b2.getFormula().replace(/COUNTA\(([^)]*)\)(-1)?/, "COUNTA($1)-1"));
  sum.createTextFinder('"(none yet)"').matchFormulaText(true).findAll().forEach(c => {
    c.setFormula(c.getFormula().replace(/, 0\), "\(none yet\)"\)/, ', 1), "(none yet)")'));
  });
  SpreadsheetApp.flush();
  Logger.log("Responses counted: " + b2.getValue() + "  (should match the rows on the responses tab)");
}
