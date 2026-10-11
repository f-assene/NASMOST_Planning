# LinkedIn

Offres repérées sur LinkedIn, **récupérées automatiquement** : LinkedIn ne fournit pas de flux
public, l'application lit donc dans `flux.txt` des recherches Google Actualités limitées aux
publications LinkedIn publiques (`site:linkedin.com`) sur les filières de l'ENSTMO. Une offre
précise peut aussi être ajoutée à la main (titre, quelques lignes, lien de la publication).

Une offre = un ou deux fichiers de même nom dans ce dossier :

```
2026-10-20_Titre_de_l_offre.pdf    pièce jointe : image, .pdf, .docx ou .xlsx (facultative)
2026-10-20_Titre_de_l_offre.txt    1re ligne = titre, puis le texte et le lien de l'offre
```

Dans le `.txt`, la ligne `Expire: AAAA-MM-JJ` donne la date limite : passé cette date, l'offre
quitte ce libellé et va dans **Archives**. `Départements: NMSI, GCO` la réserve à certains
départements. Les liens écrits dans le texte sont cliquables.

Réglages du libellé (facultatifs) : `logo.png` (logo affiché dans la liste des libellés) et
`flux.txt` (adresses de flux RSS `https://...`, une par ligne : leurs dernières offres s'ajoutent
automatiquement). Ce fichier README.md n'est pas affiché dans l'application.
