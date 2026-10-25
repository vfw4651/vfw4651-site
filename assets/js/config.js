/* ============================================================
   VFW POST 4651 — SITE SETTINGS
   This is the ONE file to edit for contact info, calendars and
   social media. Items marked  ⚠ VERIFY  came from a 2025 news
   article or public listings — please confirm before launch.
   ============================================================ */
window.SITE = {
  name: "Nelson-Mack Narragansett VFW Post 4651",
  short: "VFW Post 4651",
  tagline: "Cranston, Rhode Island",
  address: ["7 Haven Ave", "Cranston, RI"],                 // ⚠ VERIFY (add zip)
  phone: "401-942-9768",                                   // ⚠ VERIFY
  email: "",                                               // add a post email (e.g. commander@vfw4651.org)
  meetings: "Last Wednesday of each month, 6:00 p.m.",
  meetingTime: "6:00 p.m.",

  /* ---------- NEXT MEETING ----------
     The "Next meeting" line on Home and Join Us is read from the Post's
     own calendar file, data/events-post.json: the next event whose title
     contains meetingTitle. To move a meeting, add the usual date and the
     new one to that rule's "moves" (or "skip" to cancel one).

     meetingChanges below is only the fallback if the file can't be read:
     "usual date": "new date", or "" for "date to be announced".             */
  meetingTitle: "Post Members Meeting",
  meetingChanges: {
    // e.g. "2026-12-30": "2026-12-16"
  },

  /* Who a prospective member should ask for (first names, shown on Home and Join Us). */
  greeters: ["Garry", "Bernie", "Eddie"],
  hours: "",                                               // e.g. "Fri–Sat 4–10 p.m."
  emblem: "assets/img/emblem.png",            // official VFW seal, added Oct 1, 2026

  /* ---------- ROOM FOR RENT (5 Haven Ave) ----------
     available: true  -> homepage banner shows, housing.html says "Available now"
     available: false -> banner hides, housing.html says "Currently rented"     */
  housing: { available: true, page: "housing.html" },

  links: {
    joinForm: "https://docs.google.com/forms/d/e/1FAIpQLSc60vdcybZhGdgXvSCTSftDnt-2YWr2RN_MvZJvyhWqJe9JiQ/viewform",
    eligibility: "https://www.vfw.org/join/eligibility",
    deptCalendar: "https://vfwri.org/di/vfw/v2/default.asp?pid=6013&caltype=Department",
    facebook: "https://www.facebook.com/groups/1127909195301580/",   // the members' Facebook GROUP
    facebookPage: "https://www.facebook.com/vfwpost4651",        // the Post's public Facebook PAGE. Paste its URL here and the site switches over:
                             // header/footer "Facebook" links go to the Page, a live timeline shows on
                             // Home and Community, and the Group is listed as "Members' Facebook group".
                             // Also add the Page URL to "sameAs" in index.html.
    instagram: "https://www.instagram.com/vfwpost4651/",
    instagramHandle: "vfwpost4651",
    auxiliary: ""            // link to Auxiliary info/page when ready
  },

  /* ---------- SOCIAL FEEDS ----------
     Facebook: the timeline plugin works only for Facebook PAGES (not groups).
       Set links.facebookPage above and the feed appears automatically.
     Instagram: create a free feed at https://behold.so (connect the account
       once), then paste the Feed ID here. Blank = a "Follow us" card shows.   */
  instagramFeedId: "iBiittcOruurApcZ2Eus",

  /* ---------- SURVEY (survey.html, unlisted) ----------
     Filled in from what tools/survey-setup.gs prints after it builds the
     Post's Google Form. Blank = the page shows but sends nothing.
     Share as vfw4651.org/survey.html?src=fb (or ?src=coaster, ?src=meeting…)
     and the Sheet records where each answer came from.                     */
  survey: {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSc0jN8QWBLvUHlyN-MNe3cKpuC-X8YmE7ybu4wjkm575BJFuA/formResponse",
    fallback: "https://docs.google.com/forms/d/e/1FAIpQLSc0jN8QWBLvUHlyN-MNe3cKpuC-X8YmE7ybu4wjkm575BJFuA/viewform",
    entries: { who: "entry.446531098", age: "entry.275505919", visits: "entry.1621868863", barriers: "entry.782871276",
               wants: "entry.1689079832", note: "entry.2096332872", src: "entry.1509392537" }
  },

  /* ---------- CALENDAR ----------
     The site's calendar is built from two files in data/ (no Google
     Calendar, no API key):
       postFile   — the Post's own events: repeating rules (meetings,
                    Sunday football) plus one-off Post events. Authoritative.
       staticFile — hand-curated outside events (area, benefits, community),
                    refreshed weekly.
     calendar.ics in the site root is generated from postFile by
     tools/make-ics.py so members can subscribe on their phones.
     category is one of: post | area | benefits | community
     (Override per event by typing #post #area #benefits or #community
      anywhere in the event's description.)
     Optional: a Google Calendar API key and public calendars can still be
     merged in — set apiKey and calendars as before (see SETUP.md).         */
  calendar: {
    timezone: "America/New_York",
    postFile: "data/events-post.json",
    staticFile: "data/events-area.json",
    icsFile: "calendar.ics",
    apiKey: "",
    calendars: []
  },

  categories: {
    post:      { label: "Post & Auxiliary",       color: "#1b4f9c" },
    area:      { label: "Veteran & Military",     color: "#b3202a" },
    benefits:  { label: "Benefits & Services",    color: "#2f7d5b" },
    community: { label: "Community & Family",     color: "#a6741a" }
  }
};
