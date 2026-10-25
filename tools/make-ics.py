#!/usr/bin/env python3
"""Build calendar.ics from data/events-post.json.

Run from the site folder after editing the Post's events:

    python3 tools/make-ics.py

Repeating rules become RRULEs (so the feed never runs out), moved or
cancelled occurrences become EXDATEs plus a one-off event for the new date,
and one-off events are copied as they are. Members subscribe to
https://vfw4651.org/calendar.ics and their phones refresh it on their own.
Standard library only; no third-party packages.
"""
import json, os, re, sys, datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "events-post.json")
OUT = os.path.join(ROOT, "calendar.ics")
TZ = "America/New_York"
DOW = {"monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH", "friday": "FR", "saturday": "SA", "sunday": "SU"}
WD = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
NTH = {"first": 1, "second": 2, "third": 3, "fourth": 4, "last": -1}

# Eastern time, written out once so every calendar app reads the times the same way.
VTIMEZONE = """BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE"""


def esc(s):
    return re.sub(r"([\\;,])", r"\\\1", str(s or "")).replace("\n", "\\n")


def fold(line):
    """RFC 5545: lines longer than 75 bytes continue on the next line after a space."""
    out, b = [], line.encode("utf-8")
    while len(b) > 75:
        cut = 75
        while cut > 0 and (b[cut] & 0xC0) == 0x80:  # don't split a multi-byte character
            cut -= 1
        out.append(b[:cut].decode("utf-8")); b = b" " + b[cut:]
    out.append(b.decode("utf-8"))
    return "\r\n".join(out)


def local(date, hhmm):
    h, m = (hhmm or "00:00").split(":")
    return date.strftime("%Y%m%d") + "T" + h.zfill(2) + m.zfill(2) + "00"


def nth_weekday(y, m, wd, which):
    if which == -1:
        d = dt.date(y + (m == 12), (m % 12) + 1, 1) - dt.timedelta(days=1)
        return d - dt.timedelta(days=(d.weekday() - wd) % 7)
    d = dt.date(y, m, 1)
    return d + dt.timedelta(days=(wd - d.weekday()) % 7 + 7 * (which - 1))


def first_on_or_after(d, wd):
    return d + dt.timedelta(days=(wd - d.weekday()) % 7)


def vevent(uid, start, end, title, location, desc, url, stamp, extra=()):
    lines = ["BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + stamp,
             "DTSTART;TZID=%s:%s" % (TZ, start), "DTEND;TZID=%s:%s" % (TZ, end),
             "SUMMARY:" + esc(title)]
    if location: lines.append("LOCATION:" + esc(location))
    if desc or url: lines.append("DESCRIPTION:" + esc((desc or "") + ("\n" + url if url else "")))
    if url: lines.append("URL:" + url)
    lines += list(extra) + ["END:VEVENT"]
    return lines


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VFW Post 4651//vfw4651.org//EN", "CALSCALE:GREGORIAN",
             "METHOD:PUBLISH", "X-WR-CALNAME:VFW Post 4651", "X-WR-TIMEZONE:" + TZ,
             "X-PUBLISHED-TTL:PT12H", "REFRESH-INTERVAL;VALUE=DURATION:PT12H"] + VTIMEZONE.split("\n")

    for r in data.get("repeating", []):
        rid = r.get("id") or re.sub(r"[^a-z0-9]+", "-", r["title"].lower())
        wdname = r["weekday"].lower(); wd = WD[wdname]
        start_d = dt.date.fromisoformat(r["from"]) if r.get("from") else dt.date.today().replace(day=1)
        which = NTH[(r.get("which") or "last").lower()]
        if r.get("every") == "week":
            first = first_on_or_after(start_d, wd)
            rrule = "RRULE:FREQ=WEEKLY;BYDAY=" + DOW[wdname]
        else:
            first = nth_weekday(start_d.year, start_d.month, wd, which)
            if first < start_d:
                nm = start_d.replace(day=1) + dt.timedelta(days=32)
                first = nth_weekday(nm.year, nm.month, wd, which)
            rrule = "RRULE:FREQ=MONTHLY;BYDAY=%s%s" % (which, DOW[wdname])
        if r.get("until"):
            rrule += ";UNTIL=" + dt.date.fromisoformat(r["until"]).strftime("%Y%m%d") + "T235959"
        moves, skip = r.get("moves") or {}, r.get("skip") or []
        exdates = sorted(set(list(moves.keys()) + list(skip)))
        extra = [rrule] + ["EXDATE;TZID=%s:%s" % (TZ, local(dt.date.fromisoformat(d), r.get("time"))) for d in exdates]
        end_time = r.get("end") or r.get("time")
        lines += vevent(rid + "@vfw4651.org", local(first, r.get("time")), local(first, end_time),
                        r["title"], r.get("location"), r.get("description"), r.get("url"), stamp, extra)
        for usual, new in moves.items():
            if not new: continue  # moved, new date not set yet
            nd = dt.date.fromisoformat(new)
            lines += vevent("%s-%s@vfw4651.org" % (rid, new), local(nd, r.get("time")), local(nd, end_time),
                            r["title"], r.get("location"), (r.get("description") or "") + "\nMoved from the usual date (%s)." % usual,
                            r.get("url"), stamp)

    for i, e in enumerate(data.get("events", [])):
        s = e["start"]; allday = e.get("allDay") or len(s) == 10
        if allday:
            d0 = dt.date.fromisoformat(s[:10]); d1 = (dt.date.fromisoformat(e["end"][:10]) if e.get("end") else d0) + dt.timedelta(days=1)
            ev = ["BEGIN:VEVENT", "UID:post-%d-%s@vfw4651.org" % (i, s[:10]), "DTSTAMP:" + stamp,
                  "DTSTART;VALUE=DATE:" + d0.strftime("%Y%m%d"), "DTEND;VALUE=DATE:" + d1.strftime("%Y%m%d"), "SUMMARY:" + esc(e["title"])]
            if e.get("location"): ev.append("LOCATION:" + esc(e["location"]))
            if e.get("description") or e.get("url"): ev.append("DESCRIPTION:" + esc((e.get("description") or "") + ("\n" + e["url"] if e.get("url") else "")))
            if e.get("url"): ev.append("URL:" + e["url"])
            lines += ev + ["END:VEVENT"]
        else:
            st = s.replace("-", "").replace(":", "") + ("00" if len(s) == 16 else "")
            en = (e.get("end") or s).replace("-", "").replace(":", "")
            if len(en) == 13: en += "00"
            if not e.get("end"):  # no end given: show one hour
                t = dt.datetime.fromisoformat(s) + dt.timedelta(hours=1); en = t.strftime("%Y%m%dT%H%M%S")
            lines += vevent("post-%d-%s@vfw4651.org" % (i, s[:10]), st, en, e["title"], e.get("location"), e.get("description"), e.get("url"), stamp)

    lines.append("END:VCALENDAR")
    text = "\r\n".join(fold(l) for l in lines) + "\r\n"
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    n_rep, n_one = len(data.get("repeating", [])), len(data.get("events", []))
    print("Wrote %s: %d repeating rule(s), %d one-off event(s)." % (os.path.relpath(OUT, ROOT), n_rep, n_one))


if __name__ == "__main__":
    sys.exit(main())
