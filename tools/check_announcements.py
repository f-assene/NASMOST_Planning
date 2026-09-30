"""
Vérifie le dossier announcements/ avant que les étudiants ne reçoivent les annonces.

Une annonce = des fichiers de même nom (hors extension) :
    2026-09-20_Marche_JISU.jpeg   pièce jointe : image (.png .jpg .jpeg .webp), .pdf, .docx ou .xlsx
    2026-09-20_Marche_JISU.txt    description : 1re ligne = titre, puis le texte, et les lignes
                                   facultatives "Départements: NMSI, GCO" (ou TOUS) et "Expire: AAAA-MM-JJ"

Erreurs (l'action GitHub échoue, croix rouge) : titre manquant, date d'expiration illisible,
code de département inconnu. Avertissements : fichier ignoré par l'application, plusieurs pièces
jointes pour une même annonce, annonce déjà expirée.

Usage : python tools/check_announcements.py [racine_du_depot]
"""

import datetime as dt
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ANNOUNCEMENT_DIRS = ("announcements", "annonces")
DESCRIPTION = ".txt"
ATTACHMENTS = {".png", ".jpg", ".jpeg", ".webp", ".pdf", ".docx", ".xlsx"}
# Départements connus de l'application (Departments.kt) ; les dossiers du dépôt s'y ajoutent.
APP_DEPARTMENTS = {"STMO", "SGMP", "GCO", "PEM", "GEM", "GMM", "GMP", "NMSI", "GOHM", "ANCR", "SSIP"}
ALL = {"TOUS", "TOUT", "ALL"}
NOT_DEPARTMENTS = {"LOGOS", "ANNOUNCEMENTS", "ANNONCES", "TOOLS", ".GITHUB", ".GIT"}

errors = 0


def plain(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def report(level: str, path: Path, message: str, root: Path) -> None:
    """Message lisible dans le journal et annotation sur le fichier dans GitHub."""
    global errors
    rel = path.relative_to(root).as_posix()
    print(f"::{level} file={rel}::{message}")
    if level == "error":
        errors += 1


def check_description(path: Path, departments: set, root: Path) -> None:
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    title = None
    for raw in text.splitlines():
        line = plain(raw.strip())
        dep = re.match(r"(?i)^departements?\s*:\s*(.*)$", line)
        exp = re.match(r"(?i)^expire\s*:\s*(.*)$", line)
        if dep:
            codes = {c.strip().upper() for c in re.split(r"[,; ]+", dep.group(1)) if c.strip()}
            unknown = sorted(codes - departments - ALL)
            if not codes:
                report("error", path, "ligne « Départements: » vide (écrire TOUS ou des codes, ex. NMSI, GCO)", root)
            elif unknown:
                report("error", path, f"département(s) inconnu(s) : {', '.join(unknown)} "
                                      f"(connus : {', '.join(sorted(departments))} ou TOUS)", root)
        elif exp:
            value = exp.group(1).strip()
            try:
                expires = dt.date.fromisoformat(value)
                if expires < dt.date.today():
                    report("warning", path, f"annonce expirée depuis le {expires:%d/%m/%Y} : elle n'est plus affichée", root)
            except ValueError:
                report("error", path, f"date d'expiration illisible « {value} » (format attendu : AAAA-MM-JJ, ex. 2026-10-15)", root)
        elif title is None and raw.strip():
            title = raw.strip()
    if not title:
        report("error", path, "titre manquant : la 1re ligne du fichier .txt sert de titre", root)


def main(root: Path) -> int:
    departments = set(APP_DEPARTMENTS)
    departments |= {p.name.upper() for p in root.iterdir() if p.is_dir() and p.name.upper() not in NOT_DEPARTMENTS}

    checked = 0
    for name in ANNOUNCEMENT_DIRS:
        folder = root / name
        if not folder.is_dir():
            continue
        groups = defaultdict(list)
        for path in sorted(folder.iterdir()):
            if path.is_dir():
                report("warning", path, "sous-dossier ignoré : déposer les fichiers directement dans announcements/", root)
                continue
            ext = path.suffix.lower()
            if ext == DESCRIPTION or ext in ATTACHMENTS:
                groups[path.with_suffix("").name].append(path)
            elif path.name.lower() not in ("readme.md", ".gitkeep"):
                report("warning", path, f"format {ext or 'sans extension'} non pris en charge : fichier ignoré par "
                                        "l'application (formats : image, .pdf, .docx, .xlsx, description .txt)", root)

        for stem, files in groups.items():
            checked += 1
            attachments = [f for f in files if f.suffix.lower() != DESCRIPTION]
            if len(attachments) > 1:
                report("warning", attachments[1], f"plusieurs pièces jointes pour l'annonce « {stem} » : "
                                                   f"seule {attachments[0].name} sera affichée", root)
            for f in files:
                if f.suffix.lower() == DESCRIPTION:
                    check_description(f, departments, root)

    print(f"{checked} annonce(s) vérifiée(s), {errors} erreur(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()))
