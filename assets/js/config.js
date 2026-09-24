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
  meetings: "Last Thursday of each month, 6:00 p.m.",
  hours: "",                                               // e.g. "Fri–Sat 4–10 p.m."
  emblem: "",                                              // e.g. "assets/img/emblem.png" (your VFW emblem file); blank = simple "4651" badge

  links: {
    joinForm: "https://docs.google.com/forms/d/e/1FAIpQLSc60vdcybZhGdgXvSCTSftDnt-2YWr2RN_MvZJvyhWqJe9JiQ/viewform",
    eligibility: "https://www.vfw.org/join/eligibility",
    deptCalendar: "https://vfwri.org/di/vfw/v2/default.asp?pid=6013&caltype=Department",
    facebook: "https://www.facebook.com/groups/1127909195301580/",   // currently a Facebook GROUP
    facebookPage: "",        // if you create a Facebook PAGE, paste its URL here to show a live timeline
    instagram: "https://www.instagram.com/vfwpost4651/",
    instagramHandle: "vfwpost4651",
    auxiliary: ""            // link to Auxiliary info/page when ready
  },

  /* ---------- SOCIAL FEEDS ----------
     Facebook: the timeline plugin works only for Facebook PAGES (not groups).
       Set links.facebookPage above and the feed appears automatically.
     Instagram: create a free feed at https://behold.so (connect the account
       once), then paste the Feed ID here. Blank = a "Follow us" card shows.   */
  instagramFeedId: "",

  /* ---------- CALENDAR ----------
     apiKey: a free Google Calendar API key (see SETUP.md, step 3).
     Leave blank to fall back to the embedded Google Calendar.
     Every Google Calendar listed must be set to "Make available to public".
     category is one of: post | area | benefits | community
     (You can override per event by typing #post #area #benefits or #community
      anywhere in the event's description.)                                    */
  calendar: {
    timezone: "America/New_York",
    apiKey: "",
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
