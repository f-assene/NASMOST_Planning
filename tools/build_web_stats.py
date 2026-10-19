"""
Statistiques de fréquentation de la version web, pour sa page d'administration (#/admin).

Les visites sont comptées par GoatCounter (sans cookies ni données personnelles). Cette commande lit
ses chiffres agrégés avec la clé d'API (secret GitHub GOATCOUNTER_TOKEN, jamais publiée) et écrit
un résumé public : visites par jour, par pays, pages, navigateurs, systèmes, tailles d'écran.

Usage : GOATCOUNTER_CODE=... GOATCOUNTER_TOKEN=... python tools/build_web_stats.py <dossier_de_sortie>
"""

import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

LAUNCH = dt.date(2026, 10, 20)


def api(code, token, path, **params):
    url = f"https://{code}.goatcounter.com/api/v0/{path}?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                                   "User-Agent": "NASMOSTPlanning-web/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())


def rows(data):
    """Liste {name, count} quel que soit l'emballage renvoyé par GoatCounter."""
    items = data.get("stats") or data.get("hits") or []
    return [{"id": i.get("id") or i.get("path") or i.get("name"), "name": i.get("name") or i.get("title") or i.get("path") or i.get("id"),
             "count": i.get("count") or i.get("count_unique") or 0} for i in items]


def period(code, token, start, end):
    p = {"start": start.isoformat() + "T00:00:00Z", "end": end.isoformat() + "T23:59:59Z"}
    total = api(code, token, "stats/total", **p)
    days = [{"day": d.get("day"), "count": d.get("daily", 0)} for d in total.get("stats", [])]
    out = {"start": start.isoformat(), "end": end.isoformat(), "total": total.get("total", sum(d["count"] for d in days)), "days": days}
    for name in ("locations", "browsers", "systems", "sizes"):
        out[name] = rows(api(code, token, f"stats/{name}", limit=100, **p))
    out["pages"] = rows(api(code, token, "stats/hits", limit=20, **p))
    return out


def main(out_dir):
    code, token = os.environ.get("GOATCOUNTER_CODE", ""), os.environ.get("GOATCOUNTER_TOKEN", "")
    if not code or not token:
        print("GOATCOUNTER_CODE / GOATCOUNTER_TOKEN absents : pas de statistiques.")
        return 0
    today = dt.datetime.now(dt.timezone.utc).date()
    stats = {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(),
        "last30": period(code, token, today - dt.timedelta(days=29), today),
        "all": period(code, token, min(LAUNCH, today), today),
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "stats.json").write_text(json.dumps(stats, ensure_ascii=False), encoding="utf-8")
    print(f"statistiques : {stats['all']['total']} visite(s) depuis le lancement, {len(stats['all']['locations'])} pays")
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1]).resolve()))
