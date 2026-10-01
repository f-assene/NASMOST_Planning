"""
Écrit index.json : la liste de tous les fichiers du dépôt (chemin, empreinte Git, taille).

L'application NASMOST Planning lit ce fichier sur raw.githubusercontent.com au lieu d'interroger
l'API GitHub, limitée à 60 requêtes par heure et par adresse IP : sur le Wi-Fi de l'école, des
centaines de téléphones partagent la même adresse et épuiseraient cette limite en quelques minutes.

Le format reprend celui de l'API GitHub (git/trees?recursive=1) : {"tree": [{"path", "type", "sha", "size"}]}.
Usage (après avoir enregistré les fichiers, dans le dépôt) : python tools/build_index.py
"""

import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

INDEX = "index.json"


def main(root: Path) -> int:
    # Fichiers de la dernière version enregistrée (commit HEAD), avec leur empreinte Git.
    listing = subprocess.run(
        ["git", "-c", "core.quotepath=off", "ls-tree", "-r", "-l", "-z", "HEAD"],
        cwd=root, check=True, capture_output=True,
    ).stdout.decode("utf-8")

    # Semaine réelle de chaque emploi du temps source (lue dans son en-tête par timetable_to_ics.py) :
    # l'application s'en sert pour proposer le PDF même si son nom ne contient pas les dates.
    weeks = {}
    manifest = root / "timetables.json"
    if manifest.exists():
        for item in json.loads(manifest.read_text(encoding="utf-8")):
            info = weeks.setdefault(item["source"], {"week": [item["start"], item["end"]], "departments": set(),
                                                     "signed": bool(item.get("scan"))})
            info["departments"].add(item["department"])

    tree = []
    for entry in filter(None, listing.split("\0")):
        meta, path = entry.split("\t", 1)
        _mode, kind, sha, size = meta.split()
        if kind != "blob" or path == INDEX or path.startswith(".github/") or ":" in path:
            continue
        item = {"path": path, "type": "blob", "sha": sha, "size": int(size)}
        if path in weeks:
            item["week"] = weeks[path]["week"]
            item["departments"] = sorted(weeks[path]["departments"])
            if weeks[path]["signed"]:
                item["signed"] = True  # version scannée après signature : proposée en priorité
        tree.append(item)

    index = {
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tree": sorted(tree, key=lambda item: item["path"]),
    }
    target = root / INDEX
    previous = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
    if previous.get("tree") == index["tree"]:
        print("index.json déjà à jour.")
        return 0
    target.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"index.json écrit : {len(tree)} fichier(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()))
