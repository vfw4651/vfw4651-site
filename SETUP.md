# VFW Post 4651 website — setup & upkeep

This is a plain website (no database, no monthly fee). Everything you'll ever edit is in
`assets/js/config.js`, the calendar itself (Google Calendar), and `data/events-area.json`.

## 1. Preview it
Unzip and double-click `index.html`. (The calendar's event loading needs a web server, so use step 2 to see the real thing.)

## 2. Put it on vfw4651.org (free hosting, keeps your domain)
Recommended: **Cloudflare Pages** (or Netlify — same idea).
1. Create a free account and choose *Create project → Direct Upload*. Drag in the whole `vfw4651-site` folder.
2. In the project, choose *Custom domains → Add* `vfw4651.org` and `www.vfw4651.org`. It will tell you the DNS records to set.
3. Update the DNS at wherever you registered the domain (currently pointing at Google Sites). The old site keeps working until you switch, so you can launch when ready. Switching takes minutes to a few hours.
4. To update the site later, upload the folder again (or connect a GitHub repo for automatic updates).

## 3. Turn on the full custom calendar (one-time, ~10 minutes)
Without this step the Calendar page still works: it shows your embedded Google Calendar plus the outside events list.
With it, all calendars merge into one filterable list/month view with "Add to Google/Apple" buttons.
1. Go to console.cloud.google.com, create a project ("VFW 4651 site"), then *APIs & Services → Library → Google Calendar API → Enable*.
2. *Credentials → Create credentials → API key*. Then click the key and set **Application restrictions → Websites** to `https://vfw4651.org/*` and `https://www.vfw4651.org/*`, and **API restrictions → Google Calendar API**. (The key is visible on the website by design; these restrictions keep it safe.)
3. Paste the key into `apiKey` in `config.js`.
4. Make sure every calendar you list is public: Google Calendar → calendar *Settings and sharing → Access permissions → Make available to public*.

## 4. Build the calendar's "area events" layers
Categories: **Post & Auxiliary**, **Veteran & Military**, **Benefits & Services**, **Community & Family**.
Two ways to add outside events (use either or both):
- **Extra Google Calendars** (easiest for volunteers): create calendars named e.g. "Area Veteran Events" and "Benefits & Services" in the Post's Google account, make them public, and add them to `calendars` in `config.js` with the right `category`. Anyone with edit access can then add events from their phone.
- **`data/events-area.json`**: add an entry per event (three real examples are included). Handy for events you copy from other organizations' pages.
- Any event can be re-categorized by typing `#post`, `#area`, `#benefits` or `#community` in its description.

Good places to check monthly for events worth adding: RI Office of Veterans Services (vets.ri.gov/events), VFW Dept. of RI calendar (vfwri.org), VA Providence events (va.gov/providence-health-care/events), Operation Stand Down RI (osdri.org/events-news), WaterFire, the City of Cranston, and neighboring VFW posts.
The RI Office of Veterans Services publishes its events through Google Calendars; if you find their public calendar IDs, add them as `area` calendars and their events flow in automatically.

## 5. Facebook & Instagram
- **Facebook:** the post currently uses a Facebook *Group*. Facebook does not allow groups to be embedded on other websites, so the site shows a button to the group. To get a live feed on the site, create a Facebook *Page* for the post (a group and page can coexist), then put its URL in `facebookPage` in `config.js`. The timeline appears automatically.
- **Instagram:** create a free account at behold.so, connect @vfwpost4651 (whoever manages the Instagram login has to approve this once), copy the Feed ID and paste it into `instagramFeedId`. The feed then updates itself whenever the post shares a photo.
- Since someone else manages the accounts, forward them steps above and ask them to send you the Page URL and Feed ID.

## 6. Things to fill in before launch
Everything below is flagged in the files:
- Phone and address zip (taken from a 2025 news article and listings; confirm them). Meetings are set to the last Thursday of the month at 6 p.m.
- A Post email address (`email` in config). A free option is a Google Workspace for Nonprofits or a forwarding alias from your domain registrar.
- Your VFW emblem file: save as `assets/img/emblem.png` and set `emblem` in config. (Only use the official emblem as VFW brand rules allow.)
- The Mission, Event Spaces (rooms, rates, policies, photos) and Join pages have marked draft copy for you to replace.
- Photos: add a hero photo or two of the Post or events.
- A contact form is not included since a static site can't send email; the site uses phone, Facebook and Instagram. A Google Form or Formspree form can be added later.
