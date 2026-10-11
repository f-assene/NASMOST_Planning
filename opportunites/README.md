# Opportunités

Stages, emplois, formations, bourses, certifications et appels à candidatures affichés dans
l'application, menu ⋮ → **Opportunités**.

L'écran montre d'abord les **libellés** — un par sous-dossier, avec son logo — puis les offres du
libellé choisi :

```
opportunites/
  Local/                     offres des associations, clubs, enseignants, partenaires
  LinkedIn/                  offres repérées sur LinkedIn (avec le lien de la publication)
  Autres_sources/            autres sites ; « _ » s'affiche comme un espace
    logo.png                 logo du libellé (facultatif ; sinon son initiale)
    flux.txt                 flux RSS, une adresse https:// par ligne (facultatif)
    2026-10-20_Bourse.txt    une offre : 1re ligne = titre, puis le texte ; « Expire: 2026-11-15 »
    2026-10-20_Bourse.pdf    pièce jointe de même nom (facultative)
```

- Créer un sous-dossier crée un libellé ; le supprimer le retire.
- **Archives** : une offre dont la date `Expire:` est passée quitte son libellé et reste
  consultable dans le libellé « Archives ». Sans ligne `Expire:`, elle reste affichée.
- **Récupération automatique** : `flux.txt` liste des flux RSS (une adresse `https://` par ligne)
  et trois lignes de tri, pour ne garder que ce qui touche aux filières de l'école :
  `Mots-clés:` (le titre doit en contenir un), `Offres:` (et un de ceux-ci), `Exclure:` (et aucun
  de ceux-là). Casse et accents sont ignorés. Modifier ces listes suffit à affiner le résultat.
- Les offres venues d'un flux n'ont pas de date limite : seules les 6 plus récentes de chaque
  flux sont affichées, et elles ne passent pas par « Archives ».
- Le tri est automatique, donc imparfait : un titre hors sujet peut passer. L'ajouter à
  `Exclure:` le retire.
- Une offre déposée directement dans `opportunites/` apparaît sous le libellé « Général ».
- Ce fichier README.md n'est pas affiché dans l'application.
