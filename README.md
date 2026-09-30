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
```

## Emplois du temps

- Déposer le **.docx** (de préférence) et/ou le **.pdf** dans le dossier du département.
- Le nom du fichier doit contenir **la classe** (ex. `3GNM` → niveau N3) et **les dates de la
  semaine**, dans l'un de ces formats :
  - `..._15_21_Juin. 26...`, `... - 08-13_Juin. 26...`, `..._29_Juin_05_Jul. 26...`
  - `EDT_3GNM_22_06_28_06_2026.pdf` (JJ_MM_JJ_MM_AAAA)
- À chaque dépôt, l'action GitHub **« Emplois du temps -> .ics »** crée le fichier `.ics` de la
  semaine (cours, enseignants, salle, rappels 30 et 15 min avant) : c'est lui qui alimente
  l'affichage des cours et les alarmes de l'application. Le PDF reste consultable depuis l'app.
- Pour relancer la conversion à la main : onglet *Actions* → *Emplois du temps -> .ics* → *Run workflow*.

## Logos

`logos/<CODE>.png` (ex. `logos/NMSI.png`) s'affiche en haut de l'onglet du département. Sans logo,
l'application affiche le nom du département. Remplacer le fichier suffit à mettre le logo à jour.

## Annonces

Déposer un fichier dans `announcements/` : un **.docx** (texte) ou une **image**. Les étudiants
connectés reçoivent une notification sonore et l'annonce apparaît dans la section *Annonces*.

- Commencer le nom par la date `AAAA-MM-JJ_` pour l'ordre d'affichage (les plus récentes en haut).
- Pour un .docx, le premier paragraphe sert de titre.
- Supprimer le fichier retire l'annonce de l'application.
