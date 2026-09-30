# NASMOST_Planning

NASMOST, University of Ebolowa online repo for the Planning Application.

L'application Android **NASMOST Planning** lit ce dépôt public : il suffit d'y déposer des
fichiers pour mettre à jour les emplois du temps, les logos et les annonces des étudiants.

## Organisation

```
NMSI/                      un dossier par département (code en majuscules : NMSI, GCO, PEM, ...)
  Projet d'Emp. du Temps 3GNM_15_21_Juin. 26-6.docx    emploi du temps officiel (.docx et/ou .pdf)
  Projet d'Emp. du Temps 3GNM_15_21_Juin. 26-6.pdf
  NMSI_N3_15_06_21_06_2026.ics                          généré automatiquement, ne pas modifier
logos/
  NMSI.png                 logo de chaque département, nommé d'après son code (.png, .jpg, .webp)
announcements/
  2026-09-30_Rentree.docx  annonce texte (Word)
  2026-10-02_Affiche.jpg   annonce image (.png, .jpg, .webp)
tools/                     conversion automatique des emplois du temps en .ics
index.json                 liste des fichiers lue par l'application (générée, ne pas modifier)
```

À chaque dépôt, l'action GitHub **« Publication »** génère les `.ics` puis met à jour
`index.json` : l'application ne voit un nouveau fichier qu'après cette action (1 à 2 minutes,
puis jusqu'à 5 minutes de cache de GitHub).

## Emplois du temps

- Déposer le **.docx** (de préférence) et/ou le **.pdf** dans le dossier du département.
- La classe et la semaine sont lues dans **l'en-tête du document** :
  `NIVEAU : SGMP 1`, `NIVEAU: STMO I`, `TROISIEME ANNEE ... (GMM)`, `3e ANNÉE GNM` et
  `Semaine du 02 Mars au 08 Mars 2026`. À défaut, dans le nom du fichier
  (`..._15_21_Juin. 26...`, `EDT_3GNM_22_06_28_06_2026.pdf`, `EDT SGMP 1 - 02-08 MARS 2026.pdf`).
- Un PDF qui regroupe **plusieurs classes (une par page)** est accepté : chaque classe est rangée
  dans le dossier de son département.
- ⚠️ Les **PDF scannés** (photos, CamScanner) ne peuvent pas être lus : déposer le .docx, ou un
  PDF enregistré directement depuis Word (*Fichier > Enregistrer sous > PDF*).
- Copier les fichiers depuis Windows vers WSL crée des fichiers `...:Zone.Identifier` : ils sont
  ignorés (fichier `.gitignore`), inutile de les supprimer à la main.
- À chaque dépôt, l'action GitHub **« Publication »** crée le fichier `.ics` de la
  semaine (cours, enseignants, salle, rappels 30 et 15 min avant) : c'est lui qui alimente
  l'affichage des cours et les alarmes de l'application. Le PDF reste consultable depuis l'app.
- Pour relancer la conversion à la main : onglet *Actions* → *Publication* → *Run workflow*.

## Logos

`logos/<CODE>.png` (ex. `logos/NMSI.png`) s'affiche en haut de l'onglet du département. Sans logo,
l'application affiche le nom du département. Remplacer le fichier suffit à mettre le logo à jour.

## Annonces

Une annonce = un ou deux fichiers **de même nom** dans `announcements/` :

```
announcements/
  2026-09-20_Marche_JISU.jpeg     pièce jointe : image (.png .jpg .webp), .pdf, .docx ou .xlsx
  2026-09-20_Marche_JISU.txt      description (facultative)
  2026-10-01_Reunion.txt          un .txt seul = annonce texte
```

Contenu du `.txt` (créable directement sur github.com : *Add file → Create new file*) :

```
Marche sportive – Journée Internationale du Sport Universitaire
Toute la communauté universitaire est invitée dimanche 20 septembre à 6h,
au Service du Gouverneur, en tenue de sport.

Départements: TOUS
Expire: 2026-09-21
```

- **1re ligne** : le titre ; **les lignes suivantes** : le texte de l'annonce.
- `Départements:` *(facultatif)* : `TOUS` ou des codes séparés par des virgules (`NMSI, GCO`).
  Seuls les étudiants ayant choisi ces départements dans l'application la voient.
- `Expire:` *(facultatif)* : date `AAAA-MM-JJ` après laquelle l'annonce disparaît.
- Sans `.txt`, le nom du fichier sert de titre (et, pour un .docx, son texte est affiché).
- Les .pdf, .docx et .xlsx s'ouvrent depuis l'annonce avec le bouton « Ouvrir ».
- Commencer le nom par la date `AAAA-MM-JJ_` pour l'ordre d'affichage (les plus récentes en haut).
- Les étudiants connectés reçoivent **une** notification sonore par nouvelle annonce ; corriger
  la description ensuite ne les notifie pas à nouveau. Supprimer les fichiers retire l'annonce.
- L'action **« Vérification des annonces »** contrôle chaque dépôt : une croix rouge sur GitHub
  indique le fichier à corriger (titre manquant, date illisible, département inconnu).
