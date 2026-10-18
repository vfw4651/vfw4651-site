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
     Google Calendar: the next event whose title contains meetingTitle.
     Move or rename the meeting on the calendar and the site follows.

     If the calendar can't be reached, the site falls back to the
     last-Wednesday rule, adjusted by the list below
     ("usual date": "new date", or "" for "date to be announced").            */
  meetingTitle: "Post Members Meeting",
  meetingChanges: {
    // e.g. "2026-12-30": "2026-12-16"   (moved from the last Thursday to the last Wednesday, Oct 2026)
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
     apiKey: a free Google Calendar API key (see SETUP.md, step 3).
     Leave blank to fall back to the embedded Google Calendar.
     Every Google Calendar listed must be set to "Make available to public".
     category is one of: post | area | benefits | community
     (You can override per event by typing #post #area #benefits or #community
      anywhere in the event's description.)                                    */
  calendar: {
    timezone: "America/New_York",
    apiKey: "AIzaSyARzwefl5E7tiKClIxdIGOWbbVdq8xWkU0",   // public by design; locked in Google Cloud to vfw4651.org and the Calendar API
    calendars: [
      { id: "a5a5c40d454630ff2b756e708a15d080c71144c16aec55b2b0f772350cffb6e4@group.calendar.google.com",
        label: "Post 4651 Calendar", category: "post", primary: true }
      // Add more shared/public calendars here, for example:
      // { id: "xxxx@group.calendar.google.com", label: "Area Veteran Events", category: "area" },
      // { id: "yyyy@group.calendar.google.com", label: "Benefits & Services", category: "benefits" },
    ],
    // Hand-curated events for outside organizations live in data/events-area.json
    staticFile: "data/events-area.json"
  },

  categories: {
    post:      { label: "Post & Auxiliary",       color: "#1b4f9c" },
    area:      { label: "Veteran & Military",     color: "#b3202a" },
    benefits:  { label: "Benefits & Services",    color: "#2f7d5b" },
    community: { label: "Community & Family",     color: "#a6741a" }
  }
};
