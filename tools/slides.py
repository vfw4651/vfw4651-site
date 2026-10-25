#!/usr/bin/env python3
"""Build 1920x1080 slides for the Post's TV screen (EZ-AD) in the house style.

    python3 tools/slides.py data/slides.json            # all slides
    python3 tools/slides.py data/slides.json trivia     # one slide, by id

Needs Pillow and qrcode (pip install pillow qrcode). Fonts are in tools/fonts/
(Barlow Condensed and Source Sans 3, SIL Open Font License).

The JSON file is a list of slides. Every slide has an "id" (file name) and a
"layout":

  story    photo on one side (faded into the navy), text on the other.
           Fields: kicker, headline (use *word* to turn a word gold), line,
           photo, photo_side ("left" or "right"), url + cta (adds a QR code),
           cta2 (second line under the QR).
  notice   no photo: a big date block beside the text. Fields: kicker,
           headline, line, when (two or three short lines, e.g.
           ["THU", "NOV 5", "7 p.m."]), url + cta.
  officer  round headshot and name/office/one line. Fields: photo, name,
           office, line, kicker.
  photo    full-bleed photo with a caption band. Fields: photo, headline,
           line, photo_anchor (0-1, which part of a tall photo to keep).
  list     a titled list (menu, hours). Fields: kicker, headline, items
           (list of strings), note, photo (optional, faded on the right).

Output: Claude outputs/screen/vfw4651-screen-<id>.jpg (1920x1080, JPEG).
"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "tools", "fonts")
OUT = os.path.join(ROOT, "Claude outputs", "screen")
W, H = 1920, 1080
NAVY = (10, 34, 64); NAVY2 = (6, 23, 44); GOLD = (201, 162, 74); RED = (179, 32, 42)
BLUE = (27, 79, 156); WHITE = (255, 255, 255); MUTED = (205, 213, 228)
FOOT_H = 96

_fc = {}
def font(kind, size):
    f = {"head": "barlow-condensed-latin-800-normal.ttf", "cond": "barlow-condensed-latin-700-normal.ttf",
         "body": "source-sans-3-latin-400-normal.ttf", "semi": "source-sans-3-latin-600-normal.ttf",
         "bold": "source-sans-3-latin-700-normal.ttf"}[kind]
    k = (f, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(os.path.join(FONTS, f), size)
    return _fc[k]

def find(path):
    for base in (os.getcwd(), ROOT, os.path.join(ROOT, "Claude outputs", "screen", "src"), os.path.join(ROOT, "assets", "img")):
        p = os.path.join(base, path)
        if os.path.exists(p): return p
    raise SystemExit("photo not found: " + path)

def cover(im, w, h, anchor=0.5):
    """Scale and crop an image to fill w x h, keeping `anchor` (0 top/left .. 1 bottom/right) of the long axis."""
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = round((im.width - w) * (anchor if im.width > w else 0.5)); y = round((im.height - h) * (anchor if im.height > h else 0.5))
    return im.crop((x, y, x + w, y + h))

def tint(im, strength=0.45):
    """Darken and push a photo toward navy so white text stays readable over it."""
    navy = Image.new("RGB", im.size, NAVY2)
    return Image.blend(im, navy, strength)

def fade_photo(canvas, im, side, width, strength=0.45):
    """Paste a photo on one side, fading it into the navy toward the middle."""
    ph = H - FOOT_H
    im = tint(cover(im.convert("RGB"), width, ph, 0.5), strength)
    mask = Image.new("L", (width, ph), 255)
    md = ImageDraw.Draw(mask)
    fade = int(width * 0.45)
    for i in range(fade):
        a = int(255 * (i / fade) ** 1.6)
        x = i if side == "right" else width - 1 - i
        md.line([(x, 0), (x, ph)], fill=a)
    x0 = W - width if side == "right" else 0
    canvas.paste(im, (x0, 0), mask)

def footer(d, canvas):
    y = H - FOOT_H
    d.rectangle([0, y, W, H], fill=NAVY2)
    third = W // 3
    d.rectangle([0, y - 10, third, y], fill=RED); d.rectangle([third, y - 10, 2 * third, y], fill=WHITE); d.rectangle([2 * third, y - 10, W, y], fill=BLUE)
    em = Image.open(find("emblem.png")).convert("RGBA"); em.thumbnail((66, 66))
    canvas.paste(em, (90, y + (FOOT_H - em.height) // 2), em)
    f = font("cond", 40)
    d.text((182, y + FOOT_H // 2), "VFW POST 4651 · NELSON-MACK NARRAGANSETT", font=f, fill=MUTED, anchor="lm")
    d.text((W - 90, y + FOOT_H // 2), "VFW4651.ORG", font=f, fill=MUTED, anchor="rm")

def wrap(text, f, maxw, d):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t.replace("*", ""), font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def draw_rich(d, x, y, line, f, color, gold=GOLD):
    """Draw a line; words wrapped in *...* come out gold."""
    cx = x
    for tok in re.split(r"(\*[^*]+\*)", line):
        if not tok: continue
        if tok.startswith("*") and tok.endswith("*"): t, c = tok[1:-1], gold
        else: t, c = tok, color
        d.text((cx, y), t, font=f, fill=c)
        cx += d.textlength(t, font=f)

def headline(d, x, y, text, size, maxw, color=WHITE, lh=0.92):
    f = font("head", size)
    lines = wrap(text, f, maxw, d)
    # shrink to fit three lines
    while len(lines) > 3 and size > 60:
        size -= 8; f = font("head", size); lines = wrap(text, f, maxw, d)
    for ln in lines:
        draw_rich(d, x, y, ln.upper(), f, color); y += int(size * lh)
    return y

def body(d, x, y, text, size, maxw, color=WHITE, kind="body", lh=1.25):
    f = font(kind, size)
    for ln in wrap(text, f, maxw, d):
        draw_rich(d, x, y, ln, f, color); y += int(size * lh)
    return y

def qr_block(canvas, d, x, y, url, cta, cta2=None, size=230):
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
    q.add_data(url); q.make(fit=True)
    qi = q.make_image(fill_color=NAVY2, back_color="white").convert("RGB").resize((size - 24, size - 24), Image.NEAREST)
    card = Image.new("RGB", (size, size), "white")
    card.paste(qi, (12, 12))
    rounded = Image.new("L", (size, size), 0); ImageDraw.Draw(rounded).rounded_rectangle([0, 0, size - 1, size - 1], 22, fill=255)
    canvas.paste(card, (x, y), rounded)
    ty = y + size // 2 - (28 if cta2 else 0) - 22
    d.text((x + size + 30, ty), cta, font=font("body", 46), fill=MUTED)
    if cta2: draw_rich(d, x + size + 30, ty + 58, cta2, font("body", 46), MUTED, gold=WHITE)

def text_and_qr(canvas, d, s, x, y, maxw, head_size):
    """Headline, line and QR that fit above the footer: the line shrinks if it has to."""
    limit = H - FOOT_H - 40
    for size in (52, 48, 44, 40, 36):
        # measure without drawing
        f = font("semi", size); n = len(wrap(s.get("line", ""), f, maxw, d)) if s.get("line") else 0
        need = int(size * 1.25) * n + 40 + (260 if s.get("url") else 0)
        if y + need <= limit or size == 36: break
    if s.get("line"): y = body(d, x, y, s["line"], size, maxw, kind="semi") + 40
    if s.get("url"): qr_block(canvas, d, x, min(max(y, H - FOOT_H - 290), H - FOOT_H - 260), s["url"], s.get("cta", "Scan for details"), s.get("cta2"))

def kicker(d, x, y, text):
    f = font("cond", 46)
    # letter-spaced
    cx = x
    for ch in text.upper():
        d.text((cx, y), ch, font=f, fill=GOLD); cx += d.textlength(ch, font=f) + 7
    return y + 78

# ---------------- layouts ----------------
def layout_story(s):
    canvas = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(canvas)
    side = s.get("photo_side", "right"); pw = 1000
    if s.get("photo"): fade_photo(canvas, Image.open(find(s["photo"])), side, pw)
    x = 110 if side == "right" else W - 110 - 980; maxw = 980
    y = 95
    if s.get("kicker"): y = kicker(d, x, y, s["kicker"])
    y = headline(d, x, y, s["headline"], s.get("size", 150), maxw) + 30
    text_and_qr(canvas, d, s, x, y, maxw, s.get("size", 150))
    return canvas

def layout_notice(s):
    canvas = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(canvas)
    if s.get("photo"): fade_photo(canvas, Image.open(find(s["photo"])), "right", 900)
    # date block at right
    bw, bh = 520, 560; bx, by = W - 110 - bw, (H - FOOT_H - bh) // 2
    d.rounded_rectangle([bx, by, bx + bw, by + bh], 28, fill=NAVY2, outline=GOLD, width=4)
    when = s.get("when", [])
    cy = by + 40
    sizes = [70, 190, 80, 64]
    for i, t in enumerate(when[:4]):
        f = font("head", sizes[i]); color = GOLD if i == 1 else WHITE
        d.text((bx + bw // 2, cy), t.upper(), font=f, fill=color, anchor="ma"); cy += int(sizes[i] * 1.05)
    x, maxw, y = 110, W - 110 - bw - 300, 95
    if s.get("kicker"): y = kicker(d, x, y, s["kicker"])
    y = headline(d, x, y, s["headline"], s.get("size", 124), maxw) + 30
    text_and_qr(canvas, d, s, x, y, maxw, s.get("size", 124))
    return canvas

def layout_officer(s):
    canvas = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(canvas)
    if s.get("photo_bg"): fade_photo(canvas, Image.open(find(s["photo_bg"])), "right", 760, 0.68)
    # round headshot, gold ring
    size = 620; px, py = 130, (H - FOOT_H - size) // 2
    im = cover(Image.open(find(s["photo"])).convert("RGB"), size, size)
    mask = Image.new("L", (size, size), 0); ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    d.ellipse([px - 10, py - 10, px + size + 10, py + size + 10], fill=GOLD)
    canvas.paste(im, (px, py), mask)
    x, maxw, y = px + size + 110, W - (px + size + 110) - 110, 170
    y = kicker(d, x, y, s.get("kicker", "Post officers"))
    y = headline(d, x, y, s["name"], 150, maxw) + 10
    y = body(d, x, y, s["office"], 70, maxw, color=GOLD, kind="semi", lh=1.1) + 30
    if s.get("line"): y = body(d, x, y, s["line"], 46, maxw, color=MUTED, kind="body")
    return canvas

def layout_photo(s):
    canvas = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(canvas)
    im = cover(Image.open(find(s["photo"])).convert("RGB"), W, H - FOOT_H, s.get("photo_anchor", 0.5))
    canvas.paste(im, (0, 0))
    # caption band
    band_h = 300
    grad = Image.new("L", (1, band_h)); gd = ImageDraw.Draw(grad)
    for i in range(band_h): gd.point((0, i), fill=int(235 * (i / band_h) ** 1.2))
    grad = grad.resize((W, band_h))
    canvas.paste(Image.new("RGB", (W, band_h), NAVY2), (0, H - FOOT_H - band_h), grad)
    y = H - FOOT_H - 230
    f = font("head", 96); d.text((110, y), s["headline"].upper(), font=f, fill=WHITE); y += 100
    if s.get("line"): body(d, 110, y, s["line"], 44, W - 220, color=MUTED, kind="semi")
    return canvas

def layout_list(s):
    canvas = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(canvas)
    if s.get("photo"): fade_photo(canvas, Image.open(find(s["photo"])), "right", 820)
    x, y = 110, 95
    if s.get("kicker"): y = kicker(d, x, y, s["kicker"])
    y = headline(d, x, y, s["headline"], 120, 1000) + 36
    items = s.get("items", []); cols = 2 if len(items) > 6 else 1
    per = -(-len(items) // cols); colw = 470
    f = font("semi", 44)
    for c in range(cols):
        cy = y
        for it in items[c * per:(c + 1) * per]:
            d.ellipse([x + colw * c, cy + 20, x + colw * c + 12, cy + 32], fill=GOLD)
            d.text((x + colw * c + 32, cy), it, font=f, fill=WHITE); cy += 62
    if s.get("note"): body(d, x, H - FOOT_H - 110, s["note"], 38, 1000, color=MUTED)
    return canvas

LAYOUTS = {"story": layout_story, "notice": layout_notice, "officer": layout_officer, "photo": layout_photo, "list": layout_list}

def main():
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    slides = json.load(open(sys.argv[1], encoding="utf-8"))
    only = set(sys.argv[2:])
    os.makedirs(OUT, exist_ok=True)
    for s in slides:
        if only and s["id"] not in only: continue
        canvas = LAYOUTS[s.get("layout", "story")](s)
        footer(ImageDraw.Draw(canvas), canvas)
        p = os.path.join(OUT, "vfw4651-screen-%s.jpg" % s["id"])
        canvas.save(p, "JPEG", quality=90, optimize=True)
        print("wrote", os.path.relpath(p, ROOT))

if __name__ == "__main__":
    main()
