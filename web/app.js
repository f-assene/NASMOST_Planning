/*
 * NASMOST Planning — version web.
 *
 * Clone de l'application mobile : mêmes données (dépôt public f-assene/NASMOST_Planning, lu sur
 * raw.githubusercontent.com via index.json), mêmes écrans. Sans compte ni serveur : les réglages
 * et « Mon parcours » restent dans le navigateur (localStorage). Les actualités et les offres des
 * flux sont préparées par l'action GitHub qui publie ce site (feeds/*.json).
 */
"use strict";

const REPO = "f-assene/NASMOST_Planning";
const BRANCH = "main";
const VERSION = "1.3";
const APK_URL = `https://github.com/${REPO}/releases/latest/download/NASMOSTPlanning.apk`;
// Statistiques de fréquentation (GoatCounter : sans cookies ni données personnelles), comptées
// uniquement sur le site publié. Le tableau de bord est la page #/admin.
const GOATCOUNTER_CODE = "nasmost-planning";
const raw = (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/` + path.split("/").map(encodeURIComponent).join("/");

// ------------------------------------------------------------------ départements
const LEVELS_COMMON = ["N1", "N2"];
const LEVELS_PRO = ["N3", "N4", "N5"];
const DEPARTMENTS = [
  { code: "STMO", fr: "Sciences et Technologies Maritimes et Océaniques", en: "Maritime and Ocean Science and Technology", levels: LEVELS_COMMON },
  { code: "SGMP", fr: "Science et Gestion Maritime et Portuaire", en: "Maritime and Port Science and Management", levels: LEVELS_COMMON },
  { code: "GCO", fr: "Génie Côtier", en: "Coastal Engineering", levels: LEVELS_PRO },
  { code: "PEM", fr: "Pêche et Mariculture", en: "Fisheries and Mariculture", levels: LEVELS_PRO },
  { code: "GEM", fr: "Génie Énergétique de Marine", en: "Marine Energy Engineering", levels: LEVELS_PRO },
  { code: "GMM", fr: "Génie Mécanique de Marine", en: "Marine Mechanical Engineering", levels: LEVELS_PRO },
  { code: "GMP", fr: "Gestion Maritime et Portuaire", en: "Maritime and Port Management", levels: LEVELS_PRO, tracks: [
    { code: "GSE", fr: "Gestion Environnementale et Sécurité", en: "Environmental Management and Safety" },
    { code: "GOP", fr: "Gestion des Opérations Portuaires", en: "Port Operations Management" },
    { code: "GLP", fr: "Gestion de la Logistique Portuaire et Ingénierie de la Supply Chain", en: "Port Logistics Management and Supply Chain Engineering" },
  ] },
  { code: "NMSI", fr: "Navigation Maritime et Systèmes d'Information", en: "Maritime Navigation and Information Systems", levels: LEVELS_PRO },
  { code: "GOHM", fr: "Océanographie, Hydrographie, Météorologie", en: "Oceanography, Hydrography and Meteorology Engineering", levels: LEVELS_PRO },
  { code: "ANCR", fr: "Architecture Navale, Construction et Réparation", en: "Naval Architecture, Shipbuilding and Repair", levels: LEVELS_PRO },
  { code: "SSIP", fr: "Sûreté des Installations Portuaires et Plateformes", en: "Security of Port Facilities and Offshore Platforms", levels: LEVELS_PRO },
];
const byCode = (code) => DEPARTMENTS.find((d) => d.code.toLowerCase() === String(code).toLowerCase());
const classKey = (track, level) => (track ? `${track}-${level}` : level);
// Un emploi du temps publié sans filière ("N3") vaut pour toutes les filières du département.
const matchesClass = (eventLevel, track, level) =>
  eventLevel.toUpperCase() === classKey(track, level).toUpperCase() || (!!track && eventLevel.toUpperCase() === level.toUpperCase());

// ------------------------------------------------------------------ textes (français / anglais)
const TEXTS = {
  fr: {
    back: "Retour", announcements: "Annonces", news: "Actualités", menu: "Menu", refresh: "Actualiser",
    weekPrev: "Semaine précédente", weekNext: "Semaine suivante", pdf: "PDF", pdfChoose: "Emploi du temps officiel (PDF)",
    pdfMissing: "Pas de PDF publié pour cette semaine", signed: "(version signée)",
    noSession: "Aucune séance de cours prévue pour ce niveau", pdfOnly: "L'emploi du temps de cette semaine n'existe qu'en PDF : appuie sur « PDF » pour l'ouvrir",
    jump: (d) => `Voir la semaine du ${d}`, today: "Aujourd'hui", tomorrow: "Demain", yesterday: "Hier",
    sessions: (n) => n === 0 ? "Pas de séance de cours" : `${n} séance${n > 1 ? "s" : ""} de cours`,
    ongoing: "EN COURS", study: "Études libres · heures creuses", holiday: "Jour férié", pause: (d) => `Pause · ${d}`,
    done: (n) => `${n} achevé${n > 1 ? "s" : ""}`, planned: (n) => `${n} programmé${n > 1 ? "s" : ""}`, remaining: (n) => `${n} restant${n > 1 ? "s" : ""}`,
    total: (n, extra) => `Total : ${n} EC${extra ? " + " + extra : ""}`,
    materials: (n) => `${n} support${n > 1 ? "s" : ""} de cours`, materialsNone: "Aucun support déposé pour ce cours", close: "Fermer",
    agenda: "📅 Ajouter cette semaine à mon agenda (rappels compris)",
    syncing: "Synchronisation en cours…", synced: "Programme mis à jour", syncError: "Impossible de joindre le dépôt : vérifie ta connexion",
    menuParcours: "Mon parcours", menuWelcome: "Accueil des nouveaux étudiants", menuHelp: "Assistance", menuOpportunities: "Opportunités",
    menuCampus: "Campus et communauté", menuLanguage: "Langue (FR / EN)", menuColor: "Couleur de la barre", menuAbout: "Infos", menuApk: "Télécharger l'app Android (avec alarmes)",
    menuInstall: "Ajouter à l'écran d'accueil", installTitle: "Ajouter NASMOST Planning à l'écran d'accueil",
    installBanner: "Ajoutez NASMOST Planning à votre écran d'accueil : il s'ouvrira comme une application, même hors connexion.",
    installNow: "Ajouter", installLater: "Plus tard", ok: "OK",
    installIos: "Sur iPhone ou iPad, dans Safari :\n\n1. Touchez le bouton Partager (le carré avec une flèche vers le haut), en bas de l'écran.\n2. Choisissez « Sur l'écran d'accueil ».\n3. Touchez « Ajouter ».\n\nL'icône NASMOST apparaît sur l'écran d'accueil et s'ouvre en plein écran.",
    installOther: "Dans le menu du navigateur (⋮ ou ⋯), choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».\n\nSur Android, l'application complète, avec les alarmes, se télécharge depuis le menu : « Télécharger l'app Android (avec alarmes) ».",
    installed: "NASMOST Planning ajouté à l'écran d'accueil",
    spaceHelp: "Assistance et renseignements", spaceEmpty: "Rien de publié ici pour le moment.", announcementsEmpty: "Aucune annonce pour le moment.",
    myDepartment: "Mon département", all: "Tous", forDepts: (d) => `Pour : ${d}`, open: { pdf: "Ouvrir le PDF", xlsx: "Ouvrir le fichier Excel", docx: "Ouvrir le document Word", link: "Voir l'offre" },
    general: "Général", archives: "Archives", offers: (n) => n === 0 ? "Aucune offre pour le moment" : `${n} offre${n > 1 ? "s" : ""}`,
    pastOffers: (n) => n === 0 ? "Aucune offre archivée" : `${n} offre${n > 1 ? "s" : ""} passée${n > 1 ? "s" : ""}`,
    headlines: "À la une", gulf: "Golfe de Guinée", africa: "Afrique", world: "Monde", langAll: "FR + EN", newsEmpty: "Aucune actualité disponible.",
    languageTitle: "Langue de l'application", colorTitle: "Couleur de la barre du haut",
    colors: ["Bleu marine (par défaut)", "Noir", "Magenta", "Rose", "Vert océan", "Bordeaux", "Violet"],
    parcoursSetup: "Renseigne ta filière et ton niveau pour personnaliser l'application.", program: "Filière", level: "Niveau", year: "Année académique",
    edit: "Modifier", profileTitle: "Mon profil", nameHint: "Nom (facultatif)", department: "Département", track: "Filière",
    save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", add: "Ajouter",
    calendar: "Calendrier", calendarSub: "Mon emploi du temps de la semaine", myCourses: "Mes cours", myCoursesSub: "Les cours de ma classe et leurs supports",
    lists: { examens: "Mes examens", resultats: "Mes résultats", objectifs: "Mes objectifs", stages: "Mes stages", certifications: "Mes certifications" },
    hints: { examens: "Salle, chapitres à réviser…", resultats: "Note, mention, remarque…", objectifs: "Étapes, échéance, remarque…", stages: "Entreprise, lieu, encadreur…", certifications: "Organisme, numéro, validité…" },
    items: (n) => n === 0 ? "Rien pour le moment" : `${n} élément${n > 1 ? "s" : ""}`, entryTitle: "Intitulé", entryDate: "Date ou période (facultatif)",
    listEmpty: "Rien pour le moment. Appuie sur « Ajouter ».", coursesEmpty: "Aucun cours trouvé pour ta classe dans les emplois du temps publiés.",
    privacy: "Ces informations restent dans ce navigateur : elles ne sont envoyées nulle part.",
    aboutApp: "L'application", aboutPurpose: "NASMOST Planning permet aux étudiants de l'ENSTMO (Université d'Ebolowa) de consulter l'emploi du temps de leur département et de leur niveau, de revoir les semaines précédentes et d'ouvrir le PDF officiel.\n\nCette version web reprend l'application mobile ; les alarmes sonnent dans l'application Android (ou dans votre agenda, en y ajoutant la semaine).",
    history: "Historique des versions", designer: "Conception et développement", links: "Liens", contributors: "Contributeurs",
    contributorRole: "Élève ingénieur en Navigation Maritime – Promo 001", contribute: "Envie de devenir contributeur de NASMOST Planning ? Soumettez vos idées d'amélioration ",
    byEmail: "par e-mail", sources: "Source des données",
    sourceCourses: "• Les programmes de cours de l'ENSTMO affichés dans l'application proviennent des responsables pédagogiques de chaque filière concernée.",
    sourceAnnouncements: "• Les communiqués et annonces sont récupérés et diffusés après avoir été rendus publics par l'Administration de l'ENSTMO.",
    licence: "Licence", licenceText: "Logiciel libre sous licence MIT.\n© 2026 Fernand ASSENE — ENSTMO, Université d'Ebolowa.", licenceLink: "Texte de la licence MIT",
    version: "Version", versionText: `Version web ${VERSION}`, apk: "Télécharger l'app Android (avec alarmes)", admin: "Administration · statistiques",
    roles: ["Contributeur et coordinateur du développement de SEA-FORWARD", "Formateur en Python et en modélisation aux écoles d'été GGOSSS (Gulf of Guinea Ocean Sciences Summer School)", "Formateur du cours 3 du MOOC « Fundamentals of Ocean Forecasting » (FutureLearn)"],
    changelog: [
      "Version web — 20 octobre 2026\n• NASMOST Planning dans le navigateur : emplois du temps, annonces, actualités, opportunités, espaces étudiants et Mon parcours",
      "Version 1.3 — octobre 2026\n• Compatibilité Android 16 : affichage bord à bord\n• Version préparée pour Google Play",
      "Version 1.2 — octobre 2026\n• Alarmes limitées aux séances de cours de sa classe (Mon parcours, facultatif)\n• Pastille rouge dans le menu ⋮ sur les nouveautés non consultées",
      "Version 1.1 — octobre 2026\n• Ligne « PAUSE » ignorée\n• Notifications d'annonces selon le département\n• « Séance de cours », nom du département sous son logo, niveau aux couleurs du thème\n• Mode paysage, historique des versions",
      "Version 1.0 — octobre 2026\n• Emplois du temps de tous les départements, PDF officiel, alarmes\n• Avancement des EC, filières de GMP, supports de cours\n• Annonces, actualités, opportunités, accueil, assistance, campus\n• Mon parcours, français / anglais, couleur de la barre",
    ],
    locale: "fr-FR", justNow: "à l'instant", minAgo: (n) => `il y a ${n} min`, hAgo: (n) => `il y a ${n} h`,
  },
  en: {
    back: "Back", announcements: "Announcements", news: "News", menu: "Menu", refresh: "Refresh",
    weekPrev: "Previous week", weekNext: "Next week", pdf: "PDF", pdfChoose: "Official timetable (PDF)",
    pdfMissing: "No PDF published for this week", signed: "(signed version)",
    noSession: "No class sessions scheduled for this level", pdfOnly: "This week's timetable exists only as a PDF: tap “PDF” to open it",
    jump: (d) => `View the week of ${d}`, today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday",
    sessions: (n) => n === 0 ? "No class sessions" : `${n} class session${n > 1 ? "s" : ""}`,
    ongoing: "IN PROGRESS", study: "Independent study · free period", holiday: "Public holiday", pause: (d) => `Break · ${d}`,
    done: (n) => `${n} completed`, planned: (n) => `${n} scheduled`, remaining: (n) => `${n} remaining`,
    total: (n, extra) => `Total: ${n} course units${extra ? " + " + extra : ""}`,
    materials: (n) => `${n} course document${n > 1 ? "s" : ""}`, materialsNone: "No materials have been uploaded for this course", close: "Close",
    agenda: "📅 Add this week to my calendar (reminders included)",
    syncing: "Synchronising…", synced: "Timetable updated", syncError: "Unable to reach the repository: please check your connection",
    menuParcours: "My academic path", menuWelcome: "New student orientation", menuHelp: "Help", menuOpportunities: "Opportunities",
    menuCampus: "Campus and community", menuLanguage: "Language (FR / EN)", menuColor: "Bar colour", menuAbout: "About", menuApk: "Download the Android app (with alarms)",
    menuInstall: "Add to home screen", installTitle: "Add NASMOST Planning to the home screen",
    installBanner: "Add NASMOST Planning to your home screen: it will open like an app, even offline.",
    installNow: "Add", installLater: "Later", ok: "OK",
    installIos: "On iPhone or iPad, in Safari:\n\n1. Tap the Share button (the square with an upward arrow) at the bottom of the screen.\n2. Choose “Add to Home Screen”.\n3. Tap “Add”.\n\nThe NASMOST icon appears on the home screen and opens full screen.",
    installOther: "In the browser menu (⋮ or ⋯), choose “Install app” or “Add to Home screen”.\n\nOn Android, the full application, with alarms, can be downloaded from the menu: “Download the Android app (with alarms)”.",
    installed: "NASMOST Planning added to the home screen",
    spaceHelp: "Help and information", spaceEmpty: "Nothing has been published here yet.", announcementsEmpty: "There are no announcements at present.",
    myDepartment: "My department", all: "All", forDepts: (d) => `For: ${d}`, open: { pdf: "Open the PDF", xlsx: "Open the Excel file", docx: "Open the Word document", link: "View the opportunity" },
    general: "General", archives: "Archives", offers: (n) => n === 0 ? "No opportunities at present" : `${n} opportunit${n > 1 ? "ies" : "y"}`,
    pastOffers: (n) => n === 0 ? "No archived opportunities" : `${n} past opportunit${n > 1 ? "ies" : "y"}`,
    headlines: "Headlines", gulf: "Gulf of Guinea", africa: "Africa", world: "World", langAll: "FR + EN", newsEmpty: "No news available.",
    languageTitle: "Application language", colorTitle: "Top bar colour",
    colors: ["Navy blue (default)", "Black", "Magenta", "Pink", "Ocean green", "Burgundy", "Purple"],
    parcoursSetup: "Enter your programme and level to personalise the application.", program: "Programme", level: "Level", year: "Academic year",
    edit: "Edit", profileTitle: "My profile", nameHint: "Name (optional)", department: "Department", track: "Programme",
    save: "Save", cancel: "Cancel", delete: "Delete", add: "Add",
    calendar: "Calendar", calendarSub: "My timetable for the week", myCourses: "My courses", myCoursesSub: "My class's courses and their materials",
    lists: { examens: "My examinations", resultats: "My results", objectifs: "My objectives", stages: "My internships", certifications: "My certifications" },
    hints: { examens: "Room, chapters to revise…", resultats: "Mark, grade, remarks…", objectifs: "Steps, deadline, remarks…", stages: "Company, location, supervisor…", certifications: "Awarding body, number, validity…" },
    items: (n) => n === 0 ? "Nothing yet" : `${n} item${n > 1 ? "s" : ""}`, entryTitle: "Title", entryDate: "Date or period (optional)",
    listEmpty: "Nothing yet. Tap “Add”.", coursesEmpty: "No courses were found for your class in the published timetables.",
    privacy: "This information remains in this browser; it is not sent anywhere.",
    aboutApp: "The application", aboutPurpose: "NASMOST Planning enables students of the National Advanced School of Maritime and Ocean Science and Technology (NASMOST, University of Ebolowa) to consult the timetable of their department and level, to review previous weeks and to open the official PDF document.\n\nThis web version mirrors the mobile application; alarms ring in the Android application (or in your calendar, once the week is added to it).",
    history: "Version history", designer: "Design and development", links: "Links", contributors: "Contributors",
    contributorRole: "Engineering student in Marine Navigation – Class 001", contribute: "Would you like to contribute to NASMOST Planning? Please submit your suggestions for improvement ",
    byEmail: "by e-mail", sources: "Data sources",
    sourceCourses: "• The NASMOST course timetables displayed in the application are provided by the academic coordinators of each programme concerned.",
    sourceAnnouncements: "• Notices and announcements are collected and circulated once they have been made public by the NASMOST Administration.",
    licence: "Licence", licenceText: "Free software released under the MIT Licence.\n© 2026 Fernand ASSENE — NASMOST, University of Ebolowa.", licenceLink: "Text of the MIT Licence",
    version: "Version", versionText: `Web version ${VERSION}`, apk: "Download the Android app (with alarms)", admin: "Administration · statistics",
    roles: ["Contributor to and coordinator of the development of SEA-FORWARD", "Instructor in Python and numerical modelling at the GGOSSS summer schools (Gulf of Guinea Ocean Sciences Summer School)", "Instructor for Course 3 of the MOOC “Fundamentals of Ocean Forecasting” (FutureLearn)"],
    changelog: [
      "Web version — 20 October 2026\n• NASMOST Planning in the browser: timetables, announcements, news, opportunities, student spaces and My academic path",
      "Version 1.3 — October 2026\n• Android 16 compatibility: edge-to-edge display\n• Version prepared for Google Play",
      "Version 1.2 — October 2026\n• Alarms limited to one's own class sessions (My academic path, optional)\n• Red dot in the ⋮ menu on updates not yet viewed",
      "Version 1.1 — October 2026\n• “PAUSE” rows ignored\n• Announcement notifications according to the department\n• “Class session”, department name below its logo, level in the theme colour\n• Landscape mode, version history",
      "Version 1.0 — October 2026\n• Timetables for all departments, official PDF, alarms\n• Course unit progress, GMP programmes, course materials\n• Announcements, news, opportunities, orientation, help, campus\n• My academic path, French / English, top bar colour",
    ],
    locale: "en-GB", justNow: "just now", minAgo: (n) => `${n} min ago`, hAgo: (n) => `${n} h ago`,
  },
};
const LINKS = [
  ["E-mail", "mailto:fernandassene@hotmail.com"], ["LinkedIn", "https://www.linkedin.com/in/fernand-assene-572970224"],
  ["ResearchGate", "https://www.researchgate.net/profile/Fernand-Assene"],
  ["OceanPrediction DCC — OPERA", "https://www.unoceanprediction.org/en/news/highlights-project-opera-ocean-prediction-enhancement-regions-africa"],
  ["SEA-FORWARD", "https://sea-forward.readthedocs.io/"], ["GGOSSS", "https://www.ggosss.org/"],
  ["MOOC Fundamentals of Ocean Forecasting", "https://www.futurelearn.com/courses/fundamentals-of-ocean-forecasting"],
];
const CONTRIBUTORS = ["SIMO DJIENOUASSI F.", "TAGNE TCHUMMAMO G. F.", "ESSINDI Pierre B."];
const BAR_COLORS = ["#0B3954", "#000000", "#A8126F", "#D63C7A", "#0B6E4F", "#7B1E3A", "#4A2C82"];
const COURSE_COLORS = ["#146C94", "#E07A1F", "#2E7D32", "#8E44AD", "#C0392B", "#00897B"];

// ------------------------------------------------------------------ préférences (navigateur)
const store = {
  get(key, fallback) { try { const v = localStorage.getItem("nasmost." + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("nasmost." + key, JSON.stringify(value)); } catch { /* navigation privée */ } },
};
let lang = store.get("lang", (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr");
const T = () => TEXTS[lang];
const deptName = (d) => (lang === "en" ? d.en : d.fr);
const plain = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
window.nasmostEscape = esc;
const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  .replace(/([\w.+-]+@[\w-]+\.[\w.-]+\w)/g, '<a href="mailto:$1">$1</a>');

// ------------------------------------------------------------------ dates
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const todayDate = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const fmt = (d, options) => d.toLocaleDateString(T().locale, options);
const fmtTime = (d) => lang === "fr" ? `${pad(d.getHours())}h${pad(d.getMinutes())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const duration = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${pad(m)}`; };

const MONTHS = { jan: 1, janv: 1, janvier: 1, fev: 2, fevr: 2, fevrier: 2, mar: 3, mars: 3, avr: 4, avril: 4, mai: 5, juin: 6, jun: 6,
  jul: 7, juil: 7, juillet: 7, aou: 8, aout: 8, sep: 9, sept: 9, septembre: 9, oct: 10, octobre: 10, nov: 11, novembre: 11, dec: 12, decembre: 12 };
function datesFromName(name) {
  const n = name.match(/(\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{4})/);
  if (n) {
    const [d1, m1, d2, m2, y] = n.slice(1).map(Number);
    const start = new Date(y, m1 - 1, d1), end = new Date(m2 < m1 ? y + 1 : y, m2 - 1, d2);
    if (start.getMonth() === m1 - 1 && end >= start) return [start, end];
  }
  const re = /(?<!\d)(\d{1,2})[\s_-]+(?:([a-z]+)\.?[\s_-]+)?(\d{1,2})[\s_-]+([a-z]+)\.?[\s_-]+(\d{4}|\d{2})(?!\d)/g;
  for (const m of plain(name).matchAll(re)) {
    const endMonth = MONTHS[m[4]]; if (!endMonth) continue;
    const startMonth = m[2] ? MONTHS[m[2]] : (Number(m[1]) > Number(m[3]) ? (endMonth + 10) % 12 + 1 : endMonth);
    if (!startMonth) continue;
    const endYear = Number(m[5]) < 100 ? 2000 + Number(m[5]) : Number(m[5]);
    const start = new Date(startMonth > endMonth ? endYear - 1 : endYear, startMonth - 1, Number(m[1]));
    const end = new Date(endYear, endMonth - 1, Number(m[3]));
    if (end >= start) return [start, end];
  }
  return null;
}

// ------------------------------------------------------------------ calendriers (.ics)
function unescapeIcs(s) { return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\"); }
function icsDate(v) { const m = v.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; }
function parseIcs(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const events = []; let event = null, inAlarm = false, progress = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { event = {}; continue; }
    if (line === "END:VEVENT") { if (event) events.push(event); event = null; continue; }
    if (line === "BEGIN:VALARM") { inAlarm = true; continue; }
    if (line === "END:VALARM") { inAlarm = false; continue; }
    const colon = line.indexOf(":"); if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase(), value = line.slice(colon + 1);
    if (event && !inAlarm) event[name] = value;
    else if (!event && name === "X-NASMOST-EC") progress = parseProgress(value);
  }
  const parsed = events.map((e) => {
    const category = (e.CATEGORIES || "").split(",")[0].trim(), dash = category.indexOf("-");
    return { uid: e.UID, summary: unescapeIcs(e.SUMMARY || "").trim(), description: unescapeIcs(e.DESCRIPTION || ""),
      location: unescapeIcs(e.LOCATION || ""), start: icsDate(e.DTSTART || ""), end: icsDate(e.DTEND || ""),
      dept: (dash > 0 ? category.slice(0, dash) : category).toUpperCase(), level: (dash > 0 ? category.slice(dash + 1) : "").toUpperCase() };
  }).filter((e) => e.uid && e.start && e.end);
  return { events: parsed, progress };
}
function parseProgress(value) {
  const f = Object.fromEntries(value.split(";").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim().toLowerCase(), v.trim()]));
  const total = parseInt(f.prevus, 10), doneRaw = parseInt(f.acheves, 10);
  if (!f.classe || !(total > 0) || isNaN(doneRaw)) return null;
  const done = Math.min(Math.max(doneRaw, 0), total), planned = Math.min(Math.max(parseInt(f.programmes, 10) || 0, 0), total - done);
  const remaining = Math.max(isNaN(parseInt(f.restants, 10)) ? total - done - planned : parseInt(f.restants, 10), 0);
  return { classKey: f.classe.toUpperCase(), total, done, planned, remaining, extra: f.plus || "" };
}
function courseDetails(e) {
  const lines = e.description.split("\n").map((l) => l.trim()).filter(Boolean);
  const codeRe = /\(?\b([A-Z]{2,5}-[0-9X]{2,5})\b\)?/;
  const code = (e.summary.match(codeRe) || [])[1] || lines.map((l) => (l.match(codeRe) || [])[1]).find(Boolean) || null;
  const teacherLine = lines.find((l) => l.toLowerCase().startsWith("avec "));
  const extra = lines.filter((l) => l !== teacherLine && !l.toLowerCase().startsWith("cours") && l.toLowerCase() !== e.summary.toLowerCase()).join("\n");
  const free = ["ETUDES", "FERIE", "PAUSE"].some((k) => plain(e.summary).toUpperCase().includes(k));
  return { code, teachers: teacherLine ? teacherLine.slice(5).trim() : null, extra, free };
}
function javaHash(s) { let h = 0; for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return h; }
const courseColor = (summary) => COURSE_COLORS[((javaHash(summary.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase()) % 6) + 6) % 6];

// ------------------------------------------------------------------ dépôt : index des fichiers
const state = {
  tree: [], weeks: [], weekStart: null, dept: store.get("dept", null), level: {}, track: {}, icsCache: new Map(),
  materials: {}, logos: {}, descriptions: new Map(), feeds: null, news: null,
};
async function fetchText(url) { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }
async function loadIndex() {
  const index = JSON.parse(await fetchText(raw("index.json")));
  state.tree = index.tree.filter((i) => i.type === "blob");
  const files = [];
  for (const item of state.tree) {
    const parts = item.path.split("/");
    if (parts.length !== 2) continue; // emplois du temps : <DÉPARTEMENT>/<fichier>
    const ext = parts[1].split(".").pop().toLowerCase();
    if (ext !== "ics" && ext !== "pdf") continue;
    const dates = item.week ? [parseIso(item.week[0]), parseIso(item.week[1])] : datesFromName(parts[1]);
    if (!dates) continue;
    files.push({ path: item.path, name: parts[1], folder: parts[0], ext, sha: item.sha, dates,
      departments: item.departments || [], signed: !!item.signed || /^scan[_\- ]+/i.test(parts[1]) });
  }
  const groups = new Map();
  for (const f of files) { const key = isoDate(mondayOf(f.dates[0])); (groups.get(key) || groups.set(key, []).get(key)).push(f); }
  state.weeks = [...groups.values()].map((g) => ({
    start: new Date(Math.min(...g.map((f) => f.dates[0]))), end: new Date(Math.max(...g.map((f) => f.dates[1]))),
    ics: g.filter((f) => f.ext === "ics").sort((a, b) => a.name.localeCompare(b.name)),
    pdf: g.filter((f) => f.ext === "pdf").sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.start - b.start);
  // supports de cours : supports/<DÉPARTEMENT>/<cours>/<fichier>
  state.materials = {};
  for (const item of state.tree) {
    const p = item.path.split("/"), file = p[p.length - 1];
    if (p.length < 4 || p[0].toLowerCase() !== "supports" || file.startsWith(".") || file.toLowerCase().endsWith(".md")) continue;
    const key = `${p[1].toUpperCase()}/${courseKey(p[2])}`;
    (state.materials[key] ||= []).push({ name: p.slice(3).join(" / "), url: raw(item.path) });
  }
  // logos : logos/<CODE>.<png|jpg|jpeg|webp>
  state.logos = {};
  for (const item of state.tree) {
    const m = item.path.match(/^logos\/([^/]+)\.(png|jpe?g|webp)$/i);
    if (m) state.logos[m[1].toUpperCase()] = raw(item.path) + "?v=" + item.sha.slice(0, 8);
  }
}
const courseKey = (s) => plain(s).replace(/[^\p{L}\p{N}]/gu, "");
function materialsFor(dept, code, name) {
  const keys = [...new Set([code ? courseKey(code) : "", courseKey(name), (code ? courseKey(code) : "") + courseKey(name)].filter(Boolean))];
  const seen = new Set();
  return keys.flatMap((k) => state.materials[`${dept}/${k}`] || []).filter((m) => !seen.has(m.url) && seen.add(m.url));
}
function pickDefaultWeek(weeks, today) {
  return weeks.find((w) => today >= w.start && today <= w.end)
    || weeks.find((w) => w.start >= today && w.start <= addDays(today, 2))
    || [...weeks].reverse().find((w) => w.start <= today) || weeks[0] || null;
}
async function loadIcs(file) {
  const key = file.path + "@" + file.sha;
  if (!state.icsCache.has(key)) state.icsCache.set(key, fetchText(raw(file.path)).then(parseIcs).catch(() => ({ events: [], progress: null })));
  return state.icsCache.get(key);
}

// ------------------------------------------------------------------ interface : barre, menu, dialogues
const $ = (id) => document.getElementById(id);
const ICONS = {
  megaphone: '<path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>',
  news: '<path d="M22 3l-1.67 1.67L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V3zM11 19H4v-6h7v6zm9 0h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4H4V8h16v3z"/>',
  more: '<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>',
  left: '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>', right: '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>',
  pdf: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
  refresh: '<path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
  place: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>',
  person: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24">${ICONS[name]}</svg>`;
function applyBarColor() {
  const color = BAR_COLORS[store.get("barColor", 0)] || BAR_COLORS[0];
  document.documentElement.style.setProperty("--bar", color);
  document.querySelector('meta[name="theme-color"]').content = color;
}
function toast(text) {
  const el = $("toast"); el.textContent = text; el.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => (el.hidden = true), 3000);
}
function openDialog(html, onReady) {
  const d = $("dialog"); d.innerHTML = html; d.showModal(); if (onReady) onReady(d);
  d.onclick = (ev) => { if (ev.target === d) d.close(); };
}
function choose(title, options, current, onPick) {
  openDialog(`<h3>${esc(title)}</h3>` + options.map((o, i) =>
    `<label class="option"><input type="radio" name="opt" value="${i}" ${i === current ? "checked" : ""}> ${esc(o)}</label>`).join(""),
  (d) => d.querySelectorAll("input").forEach((input) => input.onchange = () => { d.close(); onPick(Number(input.value)); }));
}
function setTopbar({ title, subtitle, back, actions = true, weekbar = false, tabs = false }) {
  $("title").innerHTML = esc(title) + (subtitle ? `<small>${esc(subtitle)}</small>` : "");
  document.title = title === "NASMOST Planning" ? title : `${title} · NASMOST Planning`;
  $("backButton").hidden = !back; $("backButton").onclick = () => (history.length > 1 ? history.back() : go("#/"));
  $("weekbar").hidden = !weekbar; $("tabs").hidden = !tabs;
  $("actions").innerHTML = !actions ? "" :
    `<button class="icon-button" title="${esc(T().announcements)}" onclick="go('#/annonces')">${svg("megaphone")}</button>` +
    `<button class="icon-button" title="${esc(T().news)}" onclick="go('#/actualites')">${svg("news")}</button>` +
    `<button class="icon-button" id="menuButton" title="${esc(T().menu)}">${svg("more")}${anyUnseen() ? '<span class="badge"></span>' : ""}</button>`;
  if (actions) $("menuButton").onclick = toggleMenu;
}
function toggleMenu() {
  const menu = $("menu");
  if (!menu.hidden) { menu.hidden = true; return; }
  const t = T(), dot = (space) => (unseen(space) ? "dot" : "");
  menu.innerHTML = [
    ["#/parcours", t.menuParcours, ""], ["#/accueil", t.menuWelcome, dot("accueil")], ["#/assistance", t.menuHelp, dot("assistance")],
    ["#/opportunites", t.menuOpportunities, dot("opportunites")], ["#/campus", t.menuCampus, dot("campus")],
    ["lang", t.menuLanguage, ""], ["color", t.menuColor, ""], ["#/infos", t.menuAbout, aboutUnseen() ? "dot" : ""], ["apk", t.menuApk, ""],
    ...(isInstalled() ? [] : [["install", t.menuInstall, ""]]),
  ].map(([target, label, cls]) => `<button class="${cls}" data-target="${target}">${esc(label)}</button>`).join("");
  menu.hidden = false;
  menu.querySelectorAll("button").forEach((b) => b.onclick = () => {
    menu.hidden = true; const target = b.dataset.target;
    if (target === "lang") choose(T().languageTitle, ["Français (FR)", "English (EN)"], lang === "fr" ? 0 : 1, (i) => { lang = i ? "en" : "fr"; store.set("lang", lang); document.documentElement.lang = lang; render(); });
    else if (target === "color") choose(T().colorTitle, T().colors, store.get("barColor", 0), (i) => { store.set("barColor", i); applyBarColor(); render(); });
    else if (target === "apk") location.href = APK_URL;
    else if (target === "install") installApp();
    else go(target);
  });
  setTimeout(() => document.addEventListener("click", function close(ev) { if (!menu.contains(ev.target)) { menu.hidden = true; document.removeEventListener("click", close); } }), 0);
}
window.go = (hash) => { location.hash = hash; };

// ------------------------------------------------------------------ installation sur l'écran d'accueil
let installPrompt = null; // proposé par Chrome / Edge sur Android et ordinateur
window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; showInstallBanner(); });
window.addEventListener("appinstalled", () => { installPrompt = null; $("installBanner").hidden = true; toast(T().installed); });
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobile = () => isIos() || /android/i.test(navigator.userAgent);
async function installApp() {
  const t = T();
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    installPrompt = null; $("installBanner").hidden = true;
    return;
  }
  openDialog(`<h3>${esc(t.installTitle)}</h3><div class="text" style="white-space:pre-line">${esc(isIos() ? t.installIos : t.installOther)}</div>` +
    `<div class="buttons"><button onclick="this.closest('dialog').close()">${esc(t.ok)}</button></div>`);
}
/** Une seule invitation, sur téléphone, tant que le site n'est pas installé. */
function showInstallBanner() {
  if (isInstalled() || !isMobile() || store.get("installBannerShown", false) || (!installPrompt && !isIos())) return;
  const t = T(), banner = $("installBanner");
  banner.innerHTML = `<img src="icon-192.png" alt=""><div class="grow">${esc(t.installBanner)}</div>` +
    `<div class="banner-buttons"><button id="bannerLater">${esc(t.installLater)}</button><button id="bannerInstall" class="primary">${esc(t.installNow)}</button></div>`;
  banner.hidden = false;
  store.set("installBannerShown", true);
  $("bannerLater").onclick = () => (banner.hidden = true);
  $("bannerInstall").onclick = () => { banner.hidden = true; installApp(); };
}

// ------------------------------------------------------------------ nouveautés non consultées (pastilles rouges)
const SPACES = { annonces: "announcements", accueil: "accueil", assistance: "assistance", opportunites: "opportunites", campus: "campus" };
function spaceIds(dir) {
  const ids = new Set();
  for (const item of state.tree) {
    const p = item.path.split("/");
    if (p[0].toLowerCase() !== dir || p.length < 2 || p.length > 3 || p[p.length - 1].toLowerCase() === "readme.md") continue;
    if (p.length === 3 && (dir !== "opportunites" || isLabelSetting(p[2]))) continue;
    if (!/\.(txt|png|jpe?g|webp|pdf|docx|xlsx)$/i.test(item.path)) continue;
    ids.add(item.path.replace(/\.[^.]+$/, ""));
  }
  if (dir === "opportunites" && state.feeds) for (const [label, offers] of Object.entries(state.feeds.labels || {})) offers.forEach((o) => ids.add(`opportunites/${label}/rss:${o.link}`));
  return ids;
}
const unseen = (dir) => { const seen = new Set(store.get("seen." + dir, [])); return [...spaceIds(dir)].some((id) => !seen.has(id)); };
const markSeen = (dir) => store.set("seen." + dir, [...new Set([...store.get("seen." + dir, []), ...spaceIds(dir)])]);
const aboutUnseen = () => store.get("aboutSeen", "") !== VERSION + "-web";
const anyUnseen = () => ["accueil", "assistance", "opportunites", "campus"].some(unseen) || aboutUnseen();

// ------------------------------------------------------------------ écran : emploi du temps
function renderWeekbar() {
  const t = T(), weeks = state.weeks, i = weeks.findIndex((w) => +w.start === +state.weekStart), week = weeks[i];
  if (!week) { $("weekbar").hidden = true; return; }
  const day = { day: "numeric", month: "short" };
  $("weekbar").innerHTML =
    `<button class="icon-button" id="prevWeek" title="${esc(t.weekPrev)}" ${i <= 0 ? "disabled" : ""}>${svg("left")}</button>` +
    `<div class="week">${esc(fmt(week.start, day))} – ${esc(fmt(week.end, { ...day, year: "numeric" }))}</div>` +
    `<button class="icon-button" id="nextWeek" title="${esc(t.weekNext)}" ${i >= weeks.length - 1 ? "disabled" : ""}>${svg("right")}</button>` +
    `<button class="text-button ${week.pdf.length ? "" : "dim"}" id="pdfButton">${svg("pdf")} PDF</button>`;
  $("prevWeek").onclick = () => { state.weekStart = weeks[i - 1].start; render(); };
  $("nextWeek").onclick = () => { state.weekStart = weeks[i + 1].start; render(); };
  $("pdfButton").onclick = () => openPdf(week);
}
function openPdf(week) {
  const t = T(), dept = state.dept;
  const relevant = week.pdf.filter((f) => f.folder.toUpperCase() === dept || f.departments.includes(dept));
  const list = relevant.length ? relevant : week.pdf, signed = list.filter((f) => f.signed), pdfs = signed.length ? signed : list;
  if (!pdfs.length) return toast(t.pdfMissing);
  if (pdfs.length === 1) return window.open(raw(pdfs[0].path), "_blank", "noopener");
  openDialog(`<h3>${esc(t.pdfChoose)}</h3><div class="list">` + pdfs.map((f, i) =>
    `<button data-i="${i}">${esc((f.departments.join(", ") || f.folder) + " · " + (f.signed ? f.name.replace(/^scan[_\- ]+/i, "") + " " + t.signed : f.name))}</button>`).join("") +
    `</div><div class="buttons"><button onclick="this.closest('dialog').close()">${esc(t.close)}</button></div>`,
  (d) => d.querySelectorAll(".list button").forEach((b) => b.onclick = () => { d.close(); window.open(raw(pdfs[b.dataset.i].path), "_blank", "noopener"); }));
}
function renderTabs() {
  $("tabs").innerHTML = DEPARTMENTS.map((d) => `<button class="tab ${d.code === state.dept ? "active" : ""}" data-code="${d.code}">${d.code}</button>`).join("");
  $("tabs").querySelectorAll(".tab").forEach((b) => b.onclick = () => { state.dept = b.dataset.code; store.set("dept", state.dept); render(); });
  const active = $("tabs").querySelector(".tab.active"); if (active) active.scrollIntoView({ inline: "center", block: "nearest" });
}
async function renderPlanning() {
  const t = T(), profile = store.get("profile", {});
  if (!state.dept) state.dept = profile.department || "STMO";
  const dept = byCode(state.dept) || DEPARTMENTS[0];
  const level = state.level[dept.code] || (profile.department === dept.code && dept.levels.includes(profile.level) ? profile.level : dept.levels[0]);
  const tracks = dept.tracks || [];
  const track = tracks.length ? (state.track[dept.code] || (profile.department === dept.code && tracks.some((x) => x.code === profile.track) ? profile.track : tracks[0].code)) : null;
  setTopbar({ title: "NASMOST Planning", weekbar: true, tabs: true });
  renderWeekbar(); renderTabs();
  const week = state.weeks.find((w) => +w.start === +state.weekStart);
  const main = $("main");
  const logo = state.logos[dept.code];
  let html = `<div class="dept-header">${logo ? `<img src="${esc(logo)}" alt="${esc(deptName(dept))}">` : ""}<div class="name">${esc(deptName(dept))}</div></div>`;
  if (tracks.length) {
    html += `<div class="chips">` + tracks.map((x) => `<button class="chip ${x.code === track ? "selected" : ""}" data-track="${x.code}">${x.code}</button>`).join("") + `</div>`;
    html += `<div class="track-name">${esc(lang === "en" ? tracks.find((x) => x.code === track).en : tracks.find((x) => x.code === track).fr)}</div>`;
  }
  html += `<div class="chips">` + dept.levels.map((l) => `<button class="chip ${l === level ? "selected" : ""}" data-level="${l}">${l}</button>`).join("") + `</div>`;
  html += `<div id="planningBody"></div>`;
  main.innerHTML = html + `<button class="fab" id="fab" title="${esc(t.refresh)}">${svg("refresh")}</button>`;
  main.querySelectorAll("[data-level]").forEach((b) => b.onclick = () => { state.level[dept.code] = b.dataset.level; render(); });
  main.querySelectorAll("[data-track]").forEach((b) => b.onclick = () => { state.track[dept.code] = b.dataset.track; render(); });
  $("fab").onclick = refresh;

  const body = $("planningBody");
  if (!week) { body.innerHTML = `<div class="empty">${esc(t.noSession)}</div>`; return; }
  const files = week.ics.filter((f) => f.folder.toUpperCase() === dept.code);
  const results = await Promise.all(files.map(loadIcs));
  if (+state.weekStart !== +week.start || state.dept !== dept.code) return; // l'utilisateur a changé d'écran entre-temps
  const progressAll = Object.fromEntries(results.map((r) => r.progress).filter(Boolean).map((p) => [p.classKey, p]));
  const seenUid = new Set();
  const events = results.flatMap((r) => r.events)
    .filter((e) => e.dept === dept.code && matchesClass(e.level, track, level) && e.start >= week.start && e.start < addDays(week.end, 1))
    .filter((e) => !seenUid.has(e.uid) && seenUid.add(e.uid)).sort((a, b) => a.start - b.start);
  let out = "";
  const ec = progressAll[`${dept.code}-${classKey(track, level)}`.toUpperCase()] || progressAll[`${dept.code}-${level}`];
  if (ec) {
    out += `<div class="progress"><div class="bar"><div class="done" style="width:${100 * ec.done / ec.total}%"></div><div class="planned" style="width:${100 * ec.planned / ec.total}%"></div></div>` +
      `<div class="legend"><span style="--c:var(--blue)">${esc(t.done(ec.done))}</span><span style="--c:var(--blue-light)">${esc(t.planned(ec.planned))}</span><span style="--c:var(--remaining)">${esc(t.remaining(ec.remaining))}</span></div>` +
      `<div class="total">${esc(t.total(ec.total, ec.extra))}</div></div>`;
  }
  if (!events.length) {
    out += `<div class="empty">${esc(week.ics.length ? t.noSession : t.pdfOnly)}</div>`;
    const own = state.weeks.filter((w) => w.ics.some((f) => f.folder.toUpperCase() === dept.code && (f.name.includes(`_${classKey(track, level)}_`) || f.name.includes(`_${level}_`))));
    const target = pickDefaultWeek(own, todayDate());
    if (target && +target.start !== +week.start) out += `<div class="center"><button class="outline-button" id="jumpWeek">${esc(t.jump(fmt(target.start, { day: "numeric", month: "long", year: "numeric" })))}</button></div>`;
    body.innerHTML = out;
    if ($("jumpWeek")) $("jumpWeek").onclick = () => { state.weekStart = target.start; render(); };
    return;
  }
  const classFile = files.find((f) => f.name.includes(`_${classKey(track, level)}_`)) || files.find((f) => f.name.includes(`_${level}_`));
  if (classFile) out += `<div class="agenda-link"><a href="${esc(raw(classFile.path))}" download>${esc(t.agenda)}</a></div>`;
  out += scheduleRows(events, dept.code);
  body.innerHTML = out;
  body.querySelectorAll("[data-materials]").forEach((card) => card.onclick = () => showMaterials(card.dataset.title, JSON.parse(card.dataset.materials)));
  // Défile jusqu'à aujourd'hui (ou le prochain jour de cours).
  const todayKey = isoDate(todayDate());
  const target = [...body.querySelectorAll(".day")].find((d) => d.dataset.date >= todayKey);
  if (target && !renderPlanning.scrolled) { renderPlanning.scrolled = true; target.scrollIntoView({ block: "start" }); window.scrollBy(0, -170); }
}
function scheduleRows(events, dept) {
  const t = T(), today = todayDate(), now = new Date(), byDay = new Map();
  for (const e of events) { const k = isoDate(e.start); (byDay.get(k) || byDay.set(k, []).get(k)).push(e); }
  let html = "";
  for (const [key, list] of byDay) {
    const date = parseIso(key), details = list.map(courseDetails), count = details.filter((d) => !d.free).length;
    const relative = +date === +today ? t.today : +date === +addDays(today, 1) ? t.tomorrow : +date === +addDays(today, -1) ? t.yesterday : null;
    const label = fmt(date, { weekday: "long", day: "numeric", month: "long", ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
    const cap = label.charAt(0).toUpperCase() + label.slice(1);
    html += `<div class="day ${+date === +today ? "today" : ""} ${date < today ? "past" : ""}" data-date="${key}"><span class="label">${esc(relative ? relative + " · " + cap : cap)}</span><span class="count">${esc(t.sessions(count))}</span></div>`;
    list.forEach((e, i) => {
      if (i > 0) { const gap = Math.round((e.start - list[i - 1].end) / 60000); if (gap >= 1 && gap <= 120) html += `<div class="break">${esc(t.pause(duration(gap)))}</div>`; }
      const d = details[i], past = e.end <= now;
      if (d.free) {
        const holiday = plain(e.summary).includes("ferie");
        html += `<div class="free ${past ? "past" : ""}"><div class="time">${fmtTime(e.start)}\n${fmtTime(e.end)}</div><div class="what">${esc(holiday ? t.holiday : t.study)}</div></div>`;
        return;
      }
      const color = courseColor(e.summary), materials = materialsFor(dept, d.code, e.summary), ongoing = e.start <= now && now < e.end;
      html += `<div class="course ${past ? "past" : ""} ${materials.length ? "clickable" : ""}" ${materials.length ? `data-title="${esc(e.summary)}" data-materials="${esc(JSON.stringify(materials))}"` : ""}>` +
        `<div class="time"><div class="start">${fmtTime(e.start)}</div><div class="end">${fmtTime(e.end)}</div><div class="duration">${esc(duration(Math.round((e.end - e.start) / 60000)))}</div></div>` +
        `<div class="accent" style="background:${color}"></div><div class="body">` +
        (ongoing ? `<div class="status">${esc(t.ongoing)}</div>` : "") +
        (d.code ? `<div class="code" style="color:${color}">${esc(d.code)}</div>` : "") +
        `<div class="summary">${esc(e.summary)}</div>` +
        (e.location ? `<div class="line where">${svg("place")}${esc(e.location)}</div>` : "") +
        (d.teachers ? `<div class="line">${svg("person")}${esc(d.teachers)}</div>` : "") +
        (d.extra ? `<div class="extra">${esc(d.extra)}</div>` : "") +
        (materials.length ? `<div class="materials">📎 ${esc(t.materials(materials.length))}</div>` : "") +
        `</div></div>`;
    });
  }
  return html;
}
function showMaterials(title, materials) {
  const t = T();
  if (!materials.length) return toast(t.materialsNone);
  openDialog(`<h3>${esc(title)}</h3><div class="list">` + materials.map((m) => `<button data-url="${esc(m.url)}">${esc(m.name)}</button>`).join("") +
    `</div><div class="buttons"><button onclick="this.closest('dialog').close()">${esc(t.close)}</button></div>`,
  (d) => d.querySelectorAll(".list button").forEach((b) => b.onclick = () => window.open(b.dataset.url, "_blank", "noopener")));
}
async function refresh() {
  const fab = $("fab"); if (fab) fab.classList.add("spinning");
  toast(T().syncing);
  try { state.icsCache.clear(); state.descriptions.clear(); await loadIndex(); toast(T().synced); }
  catch { toast(T().syncError); }
  render();
}

// ------------------------------------------------------------------ annonces et espaces
const isLabelSetting = (file) => /^logo\.(png|jpe?g|webp)$/i.test(file) || /^(flux|feed|feeds)\.txt$/i.test(file);
async function description(path) {
  if (!state.descriptions.has(path)) state.descriptions.set(path, fetchText(raw(path)).then(parseDescription).catch(() => null));
  return state.descriptions.get(path);
}
function parseDescription(text) {
  let targets = [], expires = null; const content = [];
  for (const rawLine of text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trimEnd(), p = plain(line.trim());
    const dep = p.match(/^departements?\s*:\s*(.*)$/), exp = p.match(/^expire\s*:\s*(.*)$/);
    if (dep) { const codes = dep[1].split(/[,; ]+/).map((c) => c.trim().toUpperCase()).filter(Boolean); targets = codes.some((c) => ["TOUS", "TOUT", "ALL"].includes(c)) ? [] : codes; }
    else if (exp) { const m = exp[1].trim().match(/^(\d{4})-(\d{2})-(\d{2})$/); expires = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
    else content.push(line);
  }
  while (content.length && !content[0].trim()) content.shift();
  return { title: (content[0] || "").trim(), body: content.slice(1).join("\n").trim(), targets, expires };
}
const titleFromName = (path) => path.split("/").pop().replace(/\.[^.]+$/, "").replace(/^(\d{4})-(\d{2})-(\d{2})[_\s-]*/, "").replace(/^\d{1,3}[_\s.-]+/, "").replace(/_/g, " ").trim();
const dateFromName = (path) => { const m = path.split("/").pop().match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
async function spaceItems(dir) {
  const groups = new Map();
  for (const item of state.tree) {
    const p = item.path.split("/");
    if (p[0].toLowerCase() !== dir || p.length < 2 || p.length > 3) continue;
    if (p.length === 3 && (dir !== "opportunites" || isLabelSetting(p[2]))) continue;
    if (!/\.(txt|png|jpe?g|webp|pdf|docx|xlsx)$/i.test(item.path)) continue;
    const stem = item.path.replace(/\.[^.]+$/, "");
    (groups.get(stem) || groups.set(stem, []).get(stem)).push(item.path);
  }
  const items = await Promise.all([...groups].map(async ([id, paths]) => {
    const txt = paths.find((p) => /\.txt$/i.test(p)), attachment = paths.find((p) => !/\.txt$/i.test(p));
    const desc = txt ? await description(txt) : null, ext = attachment ? attachment.split(".").pop().toLowerCase() : null;
    const p = id.split("/");
    return { id, label: p.length === 3 ? p[1] : "", title: (desc && desc.title) || titleFromName(id), body: desc ? desc.body : "",
      date: dateFromName(id), targets: desc ? desc.targets : [], expires: desc ? desc.expires : null,
      image: ext && ["png", "jpg", "jpeg", "webp"].includes(ext) ? raw(attachment) : null,
      document: ext && ["pdf", "docx", "xlsx"].includes(ext) ? { url: raw(attachment), type: ext } : null };
  }));
  if (dir === "opportunites" && state.feeds) {
    for (const [label, offers] of Object.entries(state.feeds.labels || {})) for (const o of offers) {
      items.push({ id: `opportunites/${label}/rss:${o.link}`, label, title: o.title, body: o.source || "", date: o.published ? new Date(o.published) : null,
        targets: [], expires: null, image: null, document: { url: o.link, type: "link" } });
    }
  }
  const ordered = ["accueil", "assistance"].includes(dir);
  return items.sort((a, b) => ordered ? a.id.localeCompare(b.id) : (b.date || 0) - (a.date || 0) || a.title.localeCompare(b.title));
}
const isExpired = (item) => item.expires && item.expires < todayDate();
const isFor = (item, dept) => !dept || !item.targets.length || item.targets.includes(dept);
function itemCard(item) {
  const t = T();
  const date = item.date ? fmt(item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  return `<div class="card">` + (item.image ? `<img class="attachment" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">` : "") +
    (date ? `<div class="date">${esc(date.charAt(0).toUpperCase() + date.slice(1))}</div>` : "") +
    `<div class="heading">${esc(item.title)}</div>` + (item.body ? `<div class="text">${linkify(item.body)}</div>` : "") +
    (item.targets.length ? `<span class="badge-line">${esc(t.forDepts(item.targets.join(" · ")))}</span>` : "") +
    (item.document ? `<div style="margin-top:10px"><a class="outline-button" href="${esc(item.document.url)}" target="_blank" rel="noopener">${esc(t.open[item.document.type] || t.open.pdf)}</a></div>` : "") +
    `</div>`;
}
function departmentFilter() {
  const t = T(), current = store.get("filterDept", "");
  return `<div class="filters"><label>${esc(t.myDepartment)} : <select id="deptFilter"><option value="">${esc(t.all)}</option>` +
    DEPARTMENTS.map((d) => `<option value="${d.code}" ${d.code === current ? "selected" : ""}>${d.code} — ${esc(deptName(d))}</option>`).join("") + `</select></label></div>`;
}
function bindDepartmentFilter() { const s = $("deptFilter"); if (s) s.onchange = () => { store.set("filterDept", s.value); render(); }; }
async function renderSpace(dir, title, label, archives) {
  const t = T();
  setTopbar({ title, back: true });
  const main = $("main"); main.innerHTML = `<div class="empty">…</div>`;
  const all = await spaceItems(dir), dept = store.get("filterDept", "");
  let list = archives ? all.filter((i) => isExpired(i) && isFor(i, dept)) : all.filter((i) => !isExpired(i) && isFor(i, dept));
  if (label !== undefined && !archives) list = list.filter((i) => i.label === label);
  main.innerHTML = departmentFilter() + (list.length ? list.map(itemCard).join("") : `<div class="empty">${esc(dir === "announcements" ? t.announcementsEmpty : t.spaceEmpty)}</div>`);
  bindDepartmentFilter(); markSeen(dir); setTopbar({ title, back: true });
}
async function renderOpportunities() {
  const t = T();
  setTopbar({ title: t.menuOpportunities, back: true });
  const main = $("main"); main.innerHTML = `<div class="empty">…</div>`;
  const all = await spaceItems("opportunites"), dept = store.get("filterDept", "");
  const mine = all.filter((i) => isFor(i, dept)), open = mine.filter((i) => !isExpired(i)), archived = mine.filter(isExpired);
  const labels = [...new Set(state.tree.map((i) => i.path.split("/")).filter((p) => p[0] === "opportunites" && p.length === 3).map((p) => p[1]))].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  const logoOf = (label) => { const l = state.tree.find((i) => new RegExp(`^opportunites/${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/logo\\.(png|jpe?g|webp)$`, "i").test(i.path)); return l ? raw(l.path) : null; };
  const rows = [];
  if (open.some((i) => !i.label)) rows.push({ title: t.general, sub: t.offers(open.filter((i) => !i.label).length), href: "#/opportunites/" + encodeURIComponent("") });
  for (const label of labels) rows.push({ title: label.replace(/_/g, " "), sub: t.offers(open.filter((i) => i.label === label).length), logo: logoOf(label), href: "#/opportunites/" + encodeURIComponent(label) });
  rows.push({ title: t.archives, sub: t.pastOffers(archived.length), href: "#/opportunites-archives" });
  main.innerHTML = departmentFilter() + rows.map((r) => `<a class="card row-card" href="${r.href}">` +
    (r.logo ? `<img class="logo" src="${esc(r.logo)}" alt="">` : `<div class="initial">${esc(r.title.charAt(0).toUpperCase())}</div>`) +
    `<div class="grow"><div class="heading">${esc(r.title)}</div><div class="sub">${esc(r.sub)}</div></div><div class="chevron">›</div></a>`).join("");
  bindDepartmentFilter(); markSeen("opportunites"); setTopbar({ title: t.menuOpportunities, back: true });
}

// ------------------------------------------------------------------ actualités
async function renderNews(region, language) {
  const t = T();
  setTopbar({ title: t.news, back: true });
  const main = $("main"); main.innerHTML = `<div class="empty">…</div>`;
  if (!state.news) { try { state.news = JSON.parse(await fetchText("feeds/news.json")).items; } catch { state.news = []; } }
  const seen = new Set();
  const order = { GULF_OF_GUINEA: 0, AFRICA: 1, WORLD: 2 }, boost = { GULF_OF_GUINEA: 24, AFRICA: 12, WORLD: 0 };
  const unique = [...state.news].sort((a, b) => order[a.region] - order[b.region])
    .filter((n) => { const k = n.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); return !seen.has(k) && seen.add(k); })
    .filter((n) => !language || n.language === language).sort((a, b) => (b.published || "").localeCompare(a.published || ""));
  let list;
  if (region) list = unique.filter((n) => n.region === region);
  else {
    const world = unique.filter((n) => n.region === "WORLD").slice(0, 6);
    list = [...unique.filter((n) => n.region !== "WORLD"), ...world]
      .sort((a, b) => (new Date(b.published || 0) - 0 + boost[b.region] * 3600e3) - (new Date(a.published || 0) - 0 + boost[a.region] * 3600e3));
  }
  const ago = (iso) => {
    if (!iso) return ""; const mins = Math.round((Date.now() - new Date(iso)) / 60000);
    return mins < 1 ? t.justNow : mins < 60 ? t.minAgo(mins) : mins < 24 * 60 ? t.hAgo(Math.round(mins / 60)) : fmt(new Date(iso), { day: "numeric", month: "short" });
  };
  const favicon = (n) => { try { const host = new URL(n.sourceUrl || n.link).hostname.replace(/^www\./, ""); return n.sourceUrl ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : null; } catch { return null; } };
  const tabs = [["", t.headlines], ["GULF_OF_GUINEA", t.gulf], ["AFRICA", t.africa], ["WORLD", t.world]];
  main.innerHTML = `<div class="chips">` + tabs.map(([r, l]) => `<button class="chip ${r === (region || "") ? "selected" : ""}" data-region="${r}">${esc(l)}</button>`).join("") + `</div>` +
    `<div class="chips">` + [["", t.langAll], ["fr", "FR"], ["en", "EN"]].map(([l, txt]) => `<button class="chip ${l === (language || "") ? "selected" : ""}" data-lang="${l}">${txt}</button>`).join("") + `</div>` +
    (list.length ? list.map((n) => `<a class="card news" href="${esc(n.link)}" target="_blank" rel="noopener">` +
      (favicon(n) ? `<img src="${esc(favicon(n))}" alt="" loading="lazy">` : "") +
      `<div><div class="heading" style="font-size:15px">${esc(n.title)}</div><div class="meta">${esc([n.source, ago(n.published)].filter(Boolean).join(" · "))}</div></div></a>`).join("")
      : `<div class="empty">${esc(t.newsEmpty)}</div>`);
  main.querySelectorAll("[data-region]").forEach((b) => b.onclick = () => go(`#/actualites/${b.dataset.region}/${language || ""}`));
  main.querySelectorAll("[data-lang]").forEach((b) => b.onclick = () => go(`#/actualites/${region || ""}/${b.dataset.lang}`));
}

// ------------------------------------------------------------------ Mon parcours
const LIST_KEYS = ["examens", "resultats", "objectifs", "stages", "certifications"];
function renderParcours() {
  const t = T(), profile = store.get("profile", {}), dept = byCode(profile.department);
  setTopbar({ title: t.menuParcours, back: true });
  let card;
  if (dept && profile.level) {
    const track = (dept.tracks || []).find((x) => x.code === profile.track);
    card = (profile.name ? `<div class="heading">${esc(profile.name)}</div>` : "") +
      `<div>${esc(t.program)} : ${esc(dept.code + " — " + deptName(dept))}${track ? "<br>" + esc(track.code + " — " + (lang === "en" ? track.en : track.fr)) : ""}</div>` +
      `<div>${esc(t.level)} : ${esc(profile.level.replace("N", ""))}</div><div>${esc(t.year)} : ${esc(profile.year || defaultYear())}</div>`;
  } else card = `<div>${esc(t.parcoursSetup)}</div>`;
  const rows = [[t.calendar, t.calendarSub, "calendar"], [t.myCourses, t.myCoursesSub, "#/parcours/cours"],
    ...LIST_KEYS.map((k) => [t.lists[k], t.items(store.get("list." + k, []).length), "#/parcours/" + k])];
  $("main").innerHTML = `<div class="card profile-card">${card}<div style="margin-top:10px"><button class="outline-button" id="editProfile">${esc(t.edit)}</button></div></div>` +
    rows.map(([title, sub, target]) => `<a class="card row-card" href="${target.startsWith("#") ? target : "#/"}" data-target="${target}"><div class="grow"><div class="heading">${esc(title)}</div><div class="sub">${esc(sub)}</div></div><div class="chevron">›</div></a>`).join("") +
    `<p class="small center">${esc(t.privacy)}</p>`;
  $("editProfile").onclick = editProfile;
  $("main").querySelector('[data-target="calendar"]').onclick = (ev) => { if (profile.department) { ev.preventDefault(); state.dept = profile.department; store.set("dept", state.dept); go("#/"); } };
  if (!dept && !renderParcours.asked) { renderParcours.asked = true; editProfile(); }
}
function defaultYear() { const d = new Date(), y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return `${y}–${y + 1}`; }
function editProfile() {
  const t = T(), p = store.get("profile", {});
  openDialog(`<h3>${esc(t.profileTitle)}</h3>
    <label class="field"><span>${esc(t.nameHint)}</span><input id="pName" maxlength="60" value="${esc(p.name || "")}"></label>
    <label class="field"><span>${esc(t.department)}</span><select id="pDept">${DEPARTMENTS.map((d) => `<option value="${d.code}" ${d.code === p.department ? "selected" : ""}>${d.code} — ${esc(deptName(d))}</option>`).join("")}</select></label>
    <label class="field" id="pTrackField"><span>${esc(t.track)}</span><select id="pTrack"></select></label>
    <label class="field"><span>${esc(t.level)}</span><select id="pLevel"></select></label>
    <label class="field"><span>${esc(t.year)}</span><input id="pYear" maxlength="20" value="${esc(p.year || defaultYear())}"></label>
    <div class="buttons"><button id="pCancel">${esc(t.cancel)}</button><button id="pSave">${esc(t.save)}</button></div>`, (d) => {
    const update = (first) => {
      const dept = byCode($("pDept").value), tracks = dept.tracks || [];
      $("pLevel").innerHTML = dept.levels.map((l) => `<option value="${l}" ${first && l === p.level ? "selected" : ""}>${l.replace("N", "")}</option>`).join("");
      $("pTrack").innerHTML = tracks.map((x) => `<option value="${x.code}" ${first && x.code === p.track ? "selected" : ""}>${x.code} — ${esc(lang === "en" ? x.en : x.fr)}</option>`).join("");
      $("pTrackField").hidden = !tracks.length;
    };
    update(true); $("pDept").onchange = () => update(false);
    $("pCancel").onclick = () => d.close();
    $("pSave").onclick = () => {
      const dept = byCode($("pDept").value);
      store.set("profile", { name: $("pName").value.trim(), department: dept.code, level: $("pLevel").value, track: (dept.tracks || []).length ? $("pTrack").value : "", year: $("pYear").value.trim() });
      d.close(); render();
    };
  });
}
async function renderMyCourses() {
  const t = T(), p = store.get("profile", {});
  setTopbar({ title: t.myCourses, subtitle: [p.department, p.track, p.level].filter(Boolean).join(" · "), back: true });
  const main = $("main"); main.innerHTML = `<div class="empty">…</div>`;
  if (!p.department) { main.innerHTML = `<div class="empty">${esc(t.coursesEmpty)}</div>`; return; }
  const files = state.weeks.flatMap((w) => w.ics).filter((f) => f.folder.toUpperCase() === p.department);
  const events = (await Promise.all(files.map(loadIcs))).flatMap((r) => r.events).filter((e) => e.dept === p.department && matchesClass(e.level, p.track, p.level));
  const seen = new Set(), courses = [];
  for (const e of events) { const d = courseDetails(e), k = courseKey(e.summary); if (d.free || seen.has(k)) continue; seen.add(k); courses.push({ e, d }); }
  courses.sort((a, b) => a.e.summary.localeCompare(b.e.summary, "fr", { sensitivity: "base" }));
  main.innerHTML = courses.length ? courses.map(({ e, d }) => {
    const m = materialsFor(p.department, d.code, e.summary);
    return `<div class="card row-card" data-title="${esc(e.summary)}" data-materials="${esc(JSON.stringify(m))}"><div class="grow">` +
      (m.length ? `<div class="date">${esc(t.materials(m.length))}</div>` : "") + `<div class="heading">${esc(e.summary)}</div>` +
      `<div class="sub">${esc([d.code, d.teachers].filter(Boolean).join(" · "))}</div></div></div>`;
  }).join("") : `<div class="empty">${esc(t.coursesEmpty)}</div>`;
  main.querySelectorAll("[data-materials]").forEach((c) => c.onclick = () => showMaterials(c.dataset.title, JSON.parse(c.dataset.materials)));
}
function renderList(key) {
  const t = T(), entries = store.get("list." + key, []);
  setTopbar({ title: t.lists[key], back: true });
  $("main").innerHTML = `<div class="center" style="padding:6px 0 12px"><button class="outline-button" id="addEntry">+ ${esc(t.add)}</button></div>` +
    (entries.length ? entries.map((e, i) => `<div class="card row-card" data-i="${i}"><div class="grow">${e.date ? `<div class="date">${esc(e.date)}</div>` : ""}<div class="heading">${esc(e.title)}</div>${e.detail ? `<div class="sub">${esc(e.detail)}</div>` : ""}</div></div>`).join("")
      : `<div class="empty">${esc(t.listEmpty)}</div>`);
  $("addEntry").onclick = () => editEntry(key, null);
  $("main").querySelectorAll("[data-i]").forEach((c) => c.onclick = () => editEntry(key, Number(c.dataset.i)));
}
function editEntry(key, index) {
  const t = T(), entries = store.get("list." + key, []), e = index === null ? {} : entries[index];
  openDialog(`<h3>${esc(t.lists[key])}</h3>
    <label class="field"><span>${esc(t.entryTitle)}</span><input id="eTitle" maxlength="120" value="${esc(e.title || "")}"></label>
    <label class="field"><span>${esc(t.hints[key])}</span><textarea id="eDetail" rows="3" maxlength="500">${esc(e.detail || "")}</textarea></label>
    <label class="field"><span>${esc(t.entryDate)}</span><input id="eDate" maxlength="60" value="${esc(e.date || "")}"></label>
    <div class="buttons">${index !== null ? `<button class="left" id="eDelete">${esc(t.delete)}</button>` : ""}<button id="eCancel">${esc(t.cancel)}</button><button id="eSave">${esc(t.save)}</button></div>`, (d) => {
    $("eCancel").onclick = () => d.close();
    if ($("eDelete")) $("eDelete").onclick = () => { entries.splice(index, 1); store.set("list." + key, entries); d.close(); render(); };
    $("eSave").onclick = () => {
      const title = $("eTitle").value.trim(); if (!title) return $("eTitle").focus();
      const entry = { title, detail: $("eDetail").value.trim(), date: $("eDate").value.trim() };
      if (index === null) entries.push(entry); else entries[index] = entry;
      store.set("list." + key, entries); d.close(); render();
    };
  });
}

// ------------------------------------------------------------------ Infos
function renderAbout() {
  const t = T();
  setTopbar({ title: t.menuAbout, back: true });
  store.set("aboutSeen", VERSION + "-web");
  const section = (title, html) => `<div class="card"><h2>${esc(title)}</h2>${html}</div>`;
  $("main").innerHTML =
    `<div class="center" style="padding:16px 0"><img src="icon-512.png" alt="" style="width:96px;height:96px"><div class="heading" style="color:var(--blue-dark);font-size:22px;font-weight:700">NASMOST Planning</div><div class="small">${esc(t.versionText)}</div></div>` +
    section(t.aboutApp, `<div class="text">${esc(t.aboutPurpose)}</div>`) +
    section(t.history, t.changelog.map((c) => `<div class="text">${esc(c)}</div>`).join("")) +
    section(t.designer, `<div class="heading">Fernand ASSENE</div>` + t.roles.map((r) => `<div class="text">${esc(r)}</div>`).join("") +
      `<h2 style="margin-top:16px">${esc(t.links)}</h2><div class="links">` + LINKS.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener"><span>${esc(l)}</span><span>↗</span></a>`).join("") + `</div>`) +
    section(t.contributors, CONTRIBUTORS.map((c) => `<div class="heading" style="font-size:15px;margin-top:8px">${esc(c)}</div><div class="small">${esc(t.contributorRole)}</div>`).join("") +
      `<div class="text">${esc(t.contribute)}<a href="mailto:fernandassene@hotmail.com">${esc(t.byEmail)}</a>.</div>`) +
    section(t.sources, `<div class="text">${esc(t.sourceCourses)}</div><div class="text">${esc(t.sourceAnnouncements)}</div>`) +
    section(t.licence, `<div class="text">${esc(t.licenceText)}</div><div class="links"><a href="https://opensource.org/license/mit" target="_blank" rel="noopener"><span>${esc(t.licenceLink)}</span><span>↗</span></a></div>` +
      `<h2 style="margin-top:16px">${esc(t.version)}</h2><div class="text">${esc(t.versionText)}</div><div style="margin-top:10px"><a class="outline-button" href="${APK_URL}">${esc(t.apk)}</a></div>`) +
    `<p class="center small"><a href="#/admin">${esc(t.admin)}</a></p>`;
}

// ------------------------------------------------------------------ navigation
async function renderAdminPage(periodKey) {
  setTopbar({ title: lang === "en" ? "Statistics" : "Statistiques", subtitle: lang === "en" ? "Administration" : "Administration", back: true });
  try {
    await new Promise((resolve, reject) => {
      if (window.renderAdmin) return resolve();
      const s = document.createElement("script"); s.src = "admin.js"; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
    await window.renderAdmin($("main"), lang, periodKey || "last30");
  } catch { $("main").innerHTML = `<div class="empty">${esc(T().syncError)}</div>`; }
}

/** Une visite par écran consulté (sauf l'administration), sur le site publié seulement. */
function countVisit(page) {
  if (page === "admin" || !window.goatcounter || !window.goatcounter.count) return;
  window.goatcounter.count({ path: "/" + page, title: document.title });
}

async function render() {
  $("menu").hidden = true;
  document.documentElement.lang = lang;
  const [, page = "", a, b] = decodeURIComponent(location.hash.replace(/^#/, "")).split("/");
  countVisit(page);
  const t = T();
  if (page === "" ) return renderPlanning();
  if (page === "annonces") return renderSpace("announcements", t.announcements);
  if (page === "accueil") return renderSpace("accueil", t.menuWelcome);
  if (page === "assistance") return renderSpace("assistance", t.spaceHelp);
  if (page === "campus") return renderSpace("campus", t.menuCampus);
  if (page === "opportunites") return a === undefined ? renderOpportunities() : renderSpace("opportunites", a ? a.replace(/_/g, " ") : t.general, a);
  if (page === "opportunites-archives") return renderSpace("opportunites", t.archives, undefined, true);
  if (page === "actualites") return renderNews(a || null, b || null);
  if (page === "parcours") return a === "cours" ? renderMyCourses() : LIST_KEYS.includes(a) ? renderList(a) : renderParcours();
  if (page === "infos") return renderAbout();
  if (page === "admin") return renderAdminPage(a);
  go("#/");
}
window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

async function start() {
  applyBarColor();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => { /* site utilisable sans */ });
  setTimeout(showInstallBanner, 4000); // après l'écran d'accueil
  if (GOATCOUNTER_CODE && location.hostname.endsWith("github.io")) {
    const s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    s.onload = () => countVisit(decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/")[0]);
    document.head.appendChild(s);
  }
  document.documentElement.lang = lang;
  if (!sessionStorage.getItem("welcomed")) {
    sessionStorage.setItem("welcomed", "1");
    const w = $("welcome"); $("welcomeVersion").textContent = "v" + VERSION; w.hidden = false;
    setTimeout(() => { w.classList.add("fade"); setTimeout(() => (w.hidden = true), 400); }, 1500);
  }
  $("main").innerHTML = `<div class="empty">${esc(T().syncing)}</div>`;
  try { await loadIndex(); } catch { $("main").innerHTML = `<div class="empty">${esc(T().syncError)}</div>`; return; }
  try { state.feeds = JSON.parse(await fetchText("feeds/opportunites.json")); } catch { state.feeds = null; }
  const week = pickDefaultWeek(state.weeks, todayDate()); state.weekStart = week ? week.start : null;
  render();
}
start();
