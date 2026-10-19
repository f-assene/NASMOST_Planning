"""
Prépare les flux de la version web (un navigateur ne peut pas lire directement Google Actualités
ni la plupart des sites) : actualités maritimes et offres des libellés d'Opportunités, enregistrées
en JSON dans le site publié par GitHub Pages. Mêmes sources et même tri que l'application mobile.

Usage : python tools/build_web_feeds.py <dépôt> <dossier_de_sortie>
"""

import datetime as dt
import email.utils
import json
import re
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


def google_news(query, hl, gl, lang):
    return f"https://news.google.com/rss/search?q={query}&hl={hl}&gl={gl}&ceid={gl}:{lang}"


# Mêmes flux que NewsSources (application mobile).
NEWS_FEEDS = [
    ("GULF_OF_GUINEA", "fr", google_news("%22golfe+de+Guin%C3%A9e%22+(maritime+OR+port+OR+oc%C3%A9an+OR+piraterie+OR+p%C3%AAche)+when:30d", "fr", "CM", "fr"), None),
    ("GULF_OF_GUINEA", "en", google_news("%22Gulf+of+Guinea%22+(maritime+OR+port+OR+ocean+OR+piracy+OR+fisheries)+when:30d", "en-NG", "NG", "en"), None),
    ("AFRICA", "fr", google_news("(port+OR+maritime+OR+oc%C3%A9an+OR+%22%C3%A9conomie+bleue%22)+Afrique+when:30d", "fr", "SN", "fr"), None),
    ("AFRICA", "en", google_news("Africa+(port+OR+shipping+OR+maritime+OR+%22blue+economy%22)+when:30d", "en-ZA", "ZA", "en"), None),
    ("WORLD", "fr", google_news("(%22transport+maritime%22+OR+oc%C3%A9anographie+OR+portuaire)+when:14d", "fr", "FR", "fr"), None),
    ("WORLD", "en", google_news("(%22ocean+science%22+OR+oceanography)+when:14d", "en-US", "US", "en"), None),
    ("WORLD", "en", "https://gcaptain.com/feed/", "gCaptain"),
]
MAX_FEED_ITEMS = 6  # offres gardées par flux, comme dans l'application


def plain(text):
    return "".join(c for c in unicodedata.normalize("NFD", text or "") if unicodedata.category(c) != "Mn").lower()


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "NASMOSTPlanning-web/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def rss_items(url, publisher=None):
    """(titre, lien, source, date ISO) de chaque article d'un flux RSS 2.0."""
    root = ET.fromstring(fetch(url))
    items = []
    for item in root.iter("item"):
        title = re.sub(r"\s+", " ", item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        source_el = item.find("source")
        source = (source_el.text or "").strip() if source_el is not None and source_el.text else (publisher or "")
        source_url = source_el.get("url") if source_el is not None else None
        if source and title.endswith(" - " + source):
            title = title[: -len(" - " + source)]
        published = None
        if item.findtext("pubDate"):
            try:
                published = email.utils.parsedate_to_datetime(item.findtext("pubDate")).astimezone(dt.timezone.utc).isoformat()
            except (TypeError, ValueError):
                published = None
        items.append({"title": title, "link": link, "source": source, "sourceUrl": source_url, "published": published})
    return items


def build_news():
    news = []
    for region, language, url, publisher in NEWS_FEEDS:
        try:
            for item in rss_items(url, publisher):
                news.append({**item, "region": region, "language": language})
        except Exception as error:  # un flux en panne n'empêche pas les autres
            print(f"::warning::actualités : {url[:80]} : {error}")
    return news


def feed_filter(text):
    """Listes « Mots-clés: », « Offres: », « Exclure: » de flux.txt (casse et accents ignorés)."""
    def words(*names):
        for line in text.splitlines():
            head, _, rest = line.partition(":")
            if rest and plain(head).strip() in names:
                return [plain(w).strip() for w in rest.split(",") if w.strip()]
        return []
    return words("mots-cles", "mots cles", "keywords"), words("offres", "offers"), words("exclure", "exclude")


def accepts(title, keywords, offers, excluded):
    t = plain(title)
    return ((not keywords or any(w in t for w in keywords)) and (not offers or any(w in t for w in offers))
            and not any(w in t for w in excluded))


def build_opportunities(repo):
    """Offres lues dans les flux de chaque libellé (opportunites/<libellé>/flux.txt)."""
    result = {}
    for flux in sorted((repo / "opportunites").glob("*/flux.txt")):
        label = flux.parent.name
        text = flux.read_text(encoding="utf-8")
        keywords, offers, excluded = feed_filter(text)
        offers_found = []
        for url in dict.fromkeys(l.strip() for l in text.splitlines() if l.strip().startswith("https://")):
            try:
                items = [i for i in rss_items(url, label.replace("_", " ")) if accepts(i["title"], keywords, offers, excluded)]
                items.sort(key=lambda i: i["published"] or "", reverse=True)
                offers_found += items[:MAX_FEED_ITEMS]
            except Exception as error:
                print(f"::warning::opportunités {label} : {url[:80]} : {error}")
        seen = set()
        result[label] = [o for o in offers_found if not (o["link"] in seen or seen.add(o["link"]))]
    return result


def main(repo, out):
    out.mkdir(parents=True, exist_ok=True)
    generated = dt.datetime.now(dt.timezone.utc).isoformat()
    news = build_news()
    (out / "news.json").write_text(json.dumps({"generated": generated, "items": news}, ensure_ascii=False), encoding="utf-8")
    opportunities = build_opportunities(repo)
    (out / "opportunites.json").write_text(json.dumps({"generated": generated, "labels": opportunities}, ensure_ascii=False), encoding="utf-8")
    print(f"{len(news)} actualité(s), " + ", ".join(f"{k} : {len(v)}" for k, v in opportunities.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()))
