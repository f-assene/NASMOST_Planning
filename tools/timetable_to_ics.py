"""
Convertit les emplois du temps officiels (.docx ou .pdf) du dépôt en fichiers .ics lus par
l'application NASMOST Planning.

Chaque page (PDF) ou document (.docx) est un emploi du temps. Le département, le niveau et la
semaine sont lus d'abord dans l'EN-TÊTE du document, puis à défaut dans le nom du fichier et le
dossier :
    NIVEAU : 1 SGMP / NIVEAU: STMO I / NIVEAU: GOHM 3 / TROISIEME ANNEE ... (GMM) / 3e ANNÉE GNM
    Semaine du 02 MARS au 08 MARS 2026 / SEMAINE DU 09-15 Mars 2026 / semaine du 29 juin au 05 juillet 2026
Un PDF regroupant plusieurs classes (une par page) produit un .ics par classe, rangé dans le
dossier de son département :
    <DEPARTEMENT>/<DEPARTEMENT>_N<niveau>_JJ_MM_JJ_MM_AAAA.ics
Quand une même classe et une même semaine existent plusieurs fois, la source retenue est, dans
l'ordre : le .docx, un PDF propre à la classe, puis la page d'un PDF groupé.

Écrit aussi timetables.json (source de chaque semaine, utilisé pour index.json).
Code de sortie 1 si un fichier n'a pas pu être lu (les autres sont tout de même convertis).

Usage : python tools/timetable_to_ics.py [racine_du_depot]
"""

import datetime as dt
import json
import re
import sys
import unicodedata
from pathlib import Path

IGNORED_DIRS = {"logos", "announcements", "annonces", "tools", ".github", ".git"}
GENERATED_MARK = "X-NASMOST-GENERATED:timetable_to_ics"
MANIFEST = "timetables.json"
TIMEZONE = "Africa/Douala"
DEFAULT_LOCATION = "Campus Ebouyè"

# Départements de l'application (Departments.kt) et variantes rencontrées dans les documents.
DEPARTMENTS = {"STMO", "SGMP", "GCO", "PEM", "GEM", "GMM", "GMP", "NMSI", "GOHM", "ANCR", "SSIP"}
ALIASES = {"SGPM": "SGMP", "GNM": "NMSI", "STM": "STMO"}

DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MONTHS = {
    "jan": 1, "janv": 1, "janvier": 1, "fev": 2, "fevr": 2, "fevrier": 2, "mar": 3, "mars": 3,
    "avr": 4, "avril": 4, "mai": 5, "juin": 6, "jun": 6, "jul": 7, "juil": 7, "juillet": 7,
    "aou": 8, "aout": 8, "sep": 9, "sept": 9, "septembre": 9, "oct": 10, "octobre": 10,
    "nov": 11, "novembre": 11, "dec": 12, "decembre": 12,
}
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
ORDINALS = {"PREMIERE": 1, "DEUXIEME": 2, "TROISIEME": 3, "QUATRIEME": 4, "CINQUIEME": 5}

NUMERIC_DATES = re.compile(r"(\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{4})")
FRENCH_DATES = re.compile(
    r"(?<!\d)(\d{1,2})[\s_-]+(?:([a-z]+)\.?[\s_-]+)?(\d{1,2})[\s_-]+([a-z]+)\.?[\s_-]+(\d{4}|\d{2})(?!\d)"
)
HEADER_WEEK = re.compile(
    r"SEMAINE\s+DU\s+(\d{1,2})\s*(?:([A-Z]+)\.?\s*)?(?:AU|-|_)\s*(\d{1,2})\s+([A-Z]+)\.?\s+(\d{4})"
)
TIME = re.compile(r"(\d{1,2})\s*[hH:]\s*(\d{2})")
CODE = re.compile(r"^[A-Z]{2,5}[- ]?[0-9X]{3,5}$")
HOURS = re.compile(r"\b(CM|TD|TP|TPE)\s*:?\s*\d")
TEACHER = re.compile(r"^(/|Dr\b|Dr\.|Pr\b|Pr\.|Prof|Col\b|Col\.|Cdt|Cpt|Capt|Lt|Ing|M\.|Mme|Mr\b|Mlle)")
ROOM = re.compile(r"^\(?\s*(?:salle\s*:\s*)?((?:salle|hall|amphi|labo|laboratoire|atelier|campus|site|bâtiment|batiment)\b.*?)\)?$", re.I)
FREE = ("ETUDE", "FERIE", "CONGE", "VACANCES", "BIBLIOTHEQUE")

problems = {"errors": 0}


def plain(text) -> str:
    """Minuscules sans accents (pour comparer jours, mois, mots-clés)."""
    text = text or ""
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn").lower()


def report(level: str, path: Path, root: Path, message: str) -> None:
    """Message dans le journal + annotation sur le fichier dans GitHub."""
    print(f"::{level} file={path.relative_to(root).as_posix()}::{message}")
    if level == "error":
        problems["errors"] += 1


# --- Dates, niveau, département ---------------------------------------------------------------

def week_from_name(name: str):
    """(début, fin) d'après le nom du fichier, ou None."""
    m = NUMERIC_DATES.search(name)
    if m:
        d1, m1, d2, m2, y = map(int, m.groups())
        try:
            start = dt.date(y, m1, d1)
            end = dt.date(y + 1 if m2 < m1 else y, m2, d2)
            if dt.timedelta(0) <= end - start <= dt.timedelta(days=7):
                return start, end
        except ValueError:
            pass
    for m in FRENCH_DATES.finditer(plain(name)):
        d1, m1_text, d2, m2_text, y_text = m.groups()
        end_month = MONTHS.get(m2_text)
        if end_month is None:
            continue
        if m1_text:
            start_month = MONTHS.get(m1_text)
            if start_month is None:
                continue
        else:
            start_month = end_month if int(d1) <= int(d2) else (end_month + 10) % 12 + 1
        end_year = int(y_text) + (2000 if len(y_text) == 2 else 0)
        start_year = end_year - 1 if start_month > end_month else end_year
        try:
            start, end = dt.date(start_year, start_month, int(d1)), dt.date(end_year, end_month, int(d2))
        except ValueError:
            continue
        if dt.timedelta(0) <= end - start <= dt.timedelta(days=7):
            return start, end
    return None


def week_from_header(text: str):
    """(début, fin) d'après "Semaine du 02 Mars au 08 Mars 2026" ; tolère une faute sur le 2e mois."""
    m = HEADER_WEEK.search(plain(text).upper())
    if not m:
        return None
    d1, m1_text, d2, m2_text, year = m.groups()
    end_month = MONTHS.get(m2_text.lower())
    start_month = MONTHS.get(m1_text.lower()) if m1_text else end_month
    if end_month is None or start_month is None:
        return None
    year = int(year)
    try:
        start = dt.date(year - 1 if start_month > end_month and start_month == 12 else year, start_month, int(d1))
        end = dt.date(year, end_month, int(d2))
    except ValueError:
        return None
    if not dt.timedelta(0) <= end - start <= dt.timedelta(days=7):
        # ex. "du 02 Mars au 08 Février" : on garde le début et l'écart entre les deux jours.
        gap = int(d2) - int(d1)
        if not 0 <= gap <= 7:
            return None
        end = start + dt.timedelta(days=gap)
    return start, end


def department_code(word: str):
    word = word.upper()
    word = ALIASES.get(word, word)
    return word if word in DEPARTMENTS else None


def level_number(token: str):
    token = token.upper()
    if token.isdigit():
        return int(token) if 1 <= int(token) <= 5 else None
    return ROMAN.get(token) or ORDINALS.get(token)


def class_from_header(text: str):
    """(département, niveau) d'après l'en-tête, chacun pouvant être None."""
    lines = [plain(l).upper() for l in text.splitlines()]
    for line in lines:
        if "ACADEMIQUE" in line and "NIVEAU" not in line:
            continue
        patterns = [
            r"NIVEAU\s*:?\s*([1-5]|IV|V|I{1,3})\s*(?:E|EME|ERE)?\s+([A-Z]{2,5})\b",
            r"NIVEAU\s*:?\s*([A-Z]{2,5})\s*[- ]?\s*([1-5]|IV|V|I{1,3})\b",
            r"\b(PREMIERE|DEUXIEME|TROISIEME|QUATRIEME|CINQUIEME)\s+ANNEE\b[^(]*\(([A-Z]{2,5})\)",
            r"\b([1-5])\s*(?:E|EME|ERE)?\s+ANNEE\s+([A-Z]{2,5})\b",
        ]
        for i, pattern in enumerate(patterns):
            m = re.search(pattern, line)
            if not m:
                continue
            a, b = m.groups()
            level, dept = (level_number(b), department_code(a)) if i == 1 else (level_number(a), department_code(b))
            if level or dept:
                return dept, level
    return None, None


def class_from_name(name: str):
    """(département, niveau) d'après le nom du fichier : "3GNM", "SGMP 1", "STMO 2"."""
    upper = plain(name).upper()
    for m in re.finditer(r"(?<![A-Z0-9])([1-5])\s*(?:E|EME)?\s*([A-Z]{2,5})(?![A-Z])", upper):
        dept = department_code(m.group(2))
        if dept:
            return dept, int(m.group(1))
    for m in re.finditer(r"(?<![A-Z])([A-Z]{2,5})\s*[-_ ]?\s*([1-5]|IV|V|I{1,3})(?![0-9A-Z])", upper):
        dept = department_code(m.group(1))
        if dept:
            return dept, level_number(m.group(2))
    return None, None


# --- Lecture des tableaux ---------------------------------------------------------------------

def day_index(text: str):
    t = plain(text)
    for i, day in enumerate(DAYS):
        if day in t:
            return i
    return None


def docx_timetables(path: Path):
    """Un seul emploi du temps par .docx : (texte de l'en-tête, lignes [[heure, {jour: texte}]])."""
    import docx  # python-docx

    document = docx.Document(str(path))
    text = "\n".join(p.text for p in document.paragraphs)
    for section in document.sections:
        text += "\n" + "\n".join(p.text for p in section.header.paragraphs)
    for table in document.tables:
        rows = [[cell.text for cell in row.cells] for row in table.rows]
        header = next((r for r in rows if sum(day_index(c) is not None for c in r) >= 3), None)
        if not header:
            continue
        columns = {i: day_index(c) for i, c in enumerate(header) if day_index(c) is not None}
        slots = []
        for row in rows:
            times = TIME.findall(" ".join(row[i] for i in range(len(row)) if i not in columns))
            if len(times) < 2:
                continue
            cells = {}
            for i, day in columns.items():
                if i < len(row) and row[i].strip() and day not in cells:
                    cells[day] = row[i]
            slots.append((times[0], times[1], cells))
        yield 1, text, slots, True
        return
    yield 1, text, None, True


def pdf_timetables(path: Path):
    """Un emploi du temps par page : (n° de page, texte, créneaux, texte_lisible)."""
    import pdfplumber

    with pdfplumber.open(str(path)) as pdf:
        for number, page in enumerate(pdf.pages, start=1):
            if not page.chars:
                yield number, "", None, False  # page scannée (image)
                continue
            text = page.extract_text(x_tolerance=1) or ""
            yield number, text, pdf_slots(page), True


def pdf_slots(page):
    """
    Créneaux d'une page PDF. Les colonnes des jours sont repérées par la POSITION des mots
    "Lundi", "Mardi"... et non par l'index des cellules : certains tableaux contiennent des
    colonnes invisibles qui décalent les index.
    """
    tables = page.find_tables({"text_x_tolerance": 1})
    words = page.extract_words(x_tolerance=1)
    for table in tables:
        x0, top, x1, bottom = table.bbox
        header_words = {}
        for w in words:
            if x0 <= w["x0"] <= x1 and top - 2 <= w["top"] <= bottom:
                d = day_index(w["text"])
                if d is not None and plain(w["text"]).strip(" :") == DAYS[d] and d not in header_words:
                    header_words[d] = w
        if len(header_words) < 3:
            continue
        header_bottom = max(w["bottom"] for w in header_words.values())
        centers = sorted((((w["x0"] + w["x1"]) / 2), d) for d, w in header_words.items())
        bounds = []
        for i, (c, d) in enumerate(centers):
            left = (centers[i - 1][0] + c) / 2 if i else c - (centers[1][0] - c) / 2
            right = (c + centers[i + 1][0]) / 2 if i + 1 < len(centers) else c + (c - centers[i - 1][0]) / 2
            bounds.append((left, right, d, c))
        first_left = bounds[0][0]

        slots = []
        for row in table.rows:
            cells = [(bbox, page.crop(bbox).extract_text(x_tolerance=1) or "") for bbox in row.cells if bbox]
            if not cells or min(b[1] for b, _ in cells) < header_bottom - 1:
                continue  # ligne d'en-tête
            time_text = " ".join(t for b, t in cells if (b[0] + b[2]) / 2 < first_left)
            times = TIME.findall(time_text) or TIME.findall(" ".join(t for _, t in cells))
            if len(times) < 2:
                continue
            by_day = {}
            for (cx0, _t, cx1, _b), content in cells:
                if not content.strip() or (cx0 + cx1) / 2 < first_left:
                    continue
                covered = [d for left, right, d, c in bounds if cx0 - 1 <= c <= cx1 + 1]
                if not covered:
                    center = (cx0 + cx1) / 2
                    covered = [d for left, right, d, c in bounds if left <= center < right]
                for d in covered:
                    by_day.setdefault(d, content)
            slots.append((times[0], times[1], by_day))
        return slots
    return None


# --- Construction du .ics ---------------------------------------------------------------------

def default_room(text: str) -> str:
    """Salle de l'en-tête ("SALLE : Amphi 350")."""
    m = re.search(r"^\s*SALLE\s*:\s*([^\n]+)", text or "", re.I | re.M)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else ""


def parse_cell(text: str):
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.replace("\r", "").split("\n")]
    lines = [l for l in lines if l]
    code = lines.pop(0) if lines and CODE.match(lines[0]) else ""
    room = ""
    for i in range(len(lines) - 1, -1, -1):
        m = ROOM.match(lines[i])
        if m:
            room = m.group(1).strip()
            del lines[i]
            break
    teachers, hours, name = [], [], []
    last = None
    for line in lines:
        # Les lignes coupées continuent la précédente : "CM 24h TD 15h TPE" + "6h",
        # "Dr NGWA/ M.EDIE/ M." + "ATANGANA".
        continues_hours = last == "hours" and re.match(r"^(\d+\s*h\b|TPE|TP|TD|CM)", line, re.I)
        continues_teachers = last == "teachers" and (
            teachers[-1].rstrip().endswith(("/", "M.", "Dr", "Dr.", "Pr", "Pr.", "Mme"))
            or (any(c.isalpha() for c in line) and line == line.upper())
        )
        if HOURS.search(line) or continues_hours:
            hours.append(line)
            last = "hours"
        elif TEACHER.match(line) or continues_teachers:
            teachers.append(line)
            last = "teachers"
        else:
            name.append(line)
            last = "name"
    return {
        "code": code.replace(" ", "-"),
        "name": " ".join(name) or code or "Cours",
        "teachers": " ".join(teachers).strip(),
        "hours": " ".join(hours),
        "room": room,
    }


def escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold(line: str) -> str:
    """Coupe les lignes longues (RFC 5545 : 75 octets maximum)."""
    out, current = [], b""
    for ch in line:
        b = ch.encode("utf-8")
        if len(current) + len(b) > (75 if not out else 74):
            out.append(current.decode("utf-8"))
            current = b""
        current += b
    out.append(current.decode("utf-8"))
    return "\r\n ".join(out)


def build_ics(dept: str, level: str, source: str, slots, text: str, monday: dt.date) -> str:
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    room_default = default_room(text)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ENSTMO NASMOST Planning//timetable_to_ics//FR",
        GENERATED_MARK,
        f"X-NASMOST-SOURCE:{source}",
    ]
    for (h1, m1), (h2, m2), by_day in slots:
        for day, cell in sorted(by_day.items()):
            content = plain(cell).upper().strip()
            if not content or content == "PAUSE":
                continue
            date = monday + dt.timedelta(days=day)
            start = dt.datetime.combine(date, dt.time(int(h1), int(m1)))
            end = dt.datetime.combine(date, dt.time(int(h2), int(m2)))
            uid = f"{dept}-{level}-{start:%Y%m%dT%H%M}@nasmost-planning".lower()
            lines += [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{stamp}",
                f"DTSTART;TZID={TIMEZONE}:{start:%Y%m%dT%H%M%S}",
                f"DTEND;TZID={TIMEZONE}:{end:%Y%m%dT%H%M%S}",
                f"CATEGORIES:{dept}-{level}",
            ]
            if any(content.startswith(word) for word in FREE) and len(content) < 25:
                label = "FERIE" if content.startswith("FERIE") else "ETUDES"
                lines += [f"SUMMARY:{label}", "DESCRIPTION:Heures creuses", "END:VEVENT"]
                continue

            info = parse_cell(cell)
            description = f"Cours de {info['name']}" + (f" ({info['code']})" if info["code"] else "")
            if info["teachers"]:
                description += f"\navec {info['teachers']}"
            if info["hours"]:
                description += f"\n{info['hours']}"
            room = info["room"] or room_default
            lines += [
                f"SUMMARY:{escape(info['name'])}",
                f"DESCRIPTION:{escape(description)}",
                f"LOCATION:{escape(DEFAULT_LOCATION + (', ' + room if room else ''))}",
            ]
            for minutes in ([30, 15] if start.hour < 12 else [15]):
                lines += [
                    "BEGIN:VALARM",
                    f"TRIGGER:-PT{minutes}M",
                    "ACTION:DISPLAY",
                    f"DESCRIPTION:{escape(info['name'])} dans {minutes} min",
                    "END:VALARM",
                ]
            lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) for l in lines) + "\r\n"


def strip_stamps(ics: str) -> str:
    """Contenu sans les DTSTAMP, pour ne réécrire un fichier que si les cours ont changé."""
    return re.sub(r"DTSTAMP:\d{8}T\d{6}Z", "", ics).replace("\r\n", "\n")


# --- Parcours du dépôt ------------------------------------------------------------------------

def main(root: Path) -> int:
    candidates = {}  # (dept, niveau, début, fin) -> meilleure source
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and p.name.lower() not in IGNORED_DIRS):
        for path in sorted(folder.iterdir()):
            ext = path.suffix.lower()
            if ext not in (".docx", ".pdf") or path.name.startswith("~$") or ":" in path.name:
                continue
            try:
                pages = list(docx_timetables(path) if ext == ".docx" else pdf_timetables(path))
            except Exception as error:
                report("error", path, root, f"fichier illisible : {error}")
                continue

            if pages and not any(readable for _, _, _, readable in pages):
                report("error", path, root, "PDF scanné (images) : le texte ne peut pas être lu. Déposer le .docx, "
                                            "ou un PDF enregistré directement depuis Word (Fichier > Enregistrer sous > PDF).")
                continue
            bundle = len(pages) > 1
            for number, text, slots, readable in pages:
                where = f"page {number} : " if bundle else ""
                if not readable:
                    report("error", path, root, f"{where}page scannée (image), ignorée")
                    continue
                dept, level = class_from_header(text)
                name_dept, name_level = class_from_name(path.name)
                folder_dept = department_code(folder.name)
                dept = dept or name_dept or folder_dept
                level = level or name_level
                week = week_from_header(text)
                name_week = week_from_name(path.name)
                if week and name_week and week != name_week and not bundle:
                    report("warning", path, root, f"les dates du nom ({name_week[0]:%d/%m} au {name_week[1]:%d/%m/%Y}) "
                                                  f"diffèrent de l'en-tête ({week[0]:%d/%m} au {week[1]:%d/%m/%Y}) : "
                                                  "l'en-tête est utilisé")
                week = week or name_week
                if not dept:
                    report("error", path, root, f"{where}département introuvable (ni dans l'en-tête, ni dans le dossier)")
                    continue
                if not level:
                    report("error", path, root, f"{where}niveau introuvable (ex. « NIVEAU : SGMP 1 » dans l'en-tête)")
                    continue
                if not week:
                    report("error", path, root, f"{where}semaine introuvable (ex. « Semaine du 02 Mars au 08 Mars 2026 »)")
                    continue
                if not slots:
                    report("error", path, root, f"{where}tableau de l'emploi du temps introuvable")
                    continue
                if not any(plain(c).strip() not in ("", "pause") for _, _, cells in slots for c in cells.values()):
                    report("warning", path, root, f"{where}emploi du temps de {dept} N{level} vide : ignoré")
                    continue
                if folder_dept and dept != folder_dept:
                    report("warning", path, root, f"{where}emploi du temps de {dept} N{level} : "
                                                  f"le fichier .ics est rangé dans {dept}/")
                priority = 3 if ext == ".docx" else (1 if bundle else 2)
                key = (dept, f"N{level}", week[0], week[1])
                source = {"path": path.relative_to(root).as_posix(), "page": number, "priority": priority,
                          "text": text, "slots": slots}
                best = candidates.get(key)
                if best is None or (priority, source["path"]) > (best["priority"], best["path"]):
                    if best is not None:
                        report("warning", path, root, f"{dept} N{level} du {week[0]:%d/%m/%Y} existe aussi dans "
                                                      f"{best['path']} : ce fichier-ci est utilisé")
                    candidates[key] = source

    written, wanted, manifest = 0, set(), []
    for (dept, level, start, end), source in sorted(candidates.items()):
        target = root / dept / f"{dept}_{level}_{start:%d_%m}_{end:%d_%m_%Y}.ics"
        target.parent.mkdir(exist_ok=True)
        wanted.add(target.resolve())
        monday = start - dt.timedelta(days=start.weekday())
        label = source["path"] + (f" (page {source['page']})" if source["priority"] == 1 else "")
        ics = build_ics(dept, level, label, source["slots"], source["text"], monday)
        previous = open(target, encoding="utf-8", newline="").read() if target.exists() else ""
        if strip_stamps(previous) != strip_stamps(ics):
            target.write_text(ics, encoding="utf-8", newline="")
            written += 1
            print(f"  écrit : {target.relative_to(root).as_posix()}  (source : {label})")
        manifest.append({"ics": target.relative_to(root).as_posix(), "source": source["path"],
                         "page": source["page"], "department": dept, "level": level,
                         "start": start.isoformat(), "end": end.isoformat()})

    # Supprime les .ics générés qui ne correspondent plus à aucun emploi du temps.
    for old in root.glob("*/*.ics"):
        if old.resolve() not in wanted and GENERATED_MARK in old.read_text(encoding="utf-8", errors="ignore"):
            old.unlink()
            print(f"  supprimé : {old.relative_to(root).as_posix()}")

    (root / MANIFEST).write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(candidates)} emploi(s) du temps, {written} fichier(s) .ics mis à jour, {problems['errors']} erreur(s).")
    return 1 if problems["errors"] else 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()))
