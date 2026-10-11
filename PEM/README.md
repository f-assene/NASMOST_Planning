# PEM — Pêche et Mariculture

Emplois du temps du département **PEM**, niveaux N3, N4, N5. Ils s'affichent dans
l'onglet **PEM** de l'application NASMOST Planning.

## Déposer un emploi du temps

1. Déposer ici **l'original** : le PDF enregistré depuis Word, ou le `.docx`.
2. Après signature, déposer **la version scannée** sous le même nom précédé de `scan_`.

```
PEM/EDT_PEM_3_05_10_10_10_2026.pdf        original : sert à construire l'emploi du temps
PEM/scan_EDT_PEM_3_05_10_10_10_2026.pdf   version signée : proposée par le bouton « PDF »
PEM/PEM_N3_05_10_10_10_2026.ics           généré automatiquement, ne pas modifier
```

- **Nom conseillé** : `EDT_<CLASSE>_<NIVEAU>_<JJ>_<MM>_<JJ>_<MM>_<AAAA>.pdf` — jour et mois du
  lundi, jour et mois du dernier jour, année. Sans espaces ni accents.
- La classe et la semaine sont lues d'abord dans **l'en-tête du document**
  (`NIVEAU : PEM 3`, `Semaine du 05 Octobre au 10 Octobre 2026`), sinon dans le nom du fichier.
- Un **PDF scanné** (photo, CamScanner) ne peut pas servir d'original : son texte n'est pas
  lisible. Il doit rester la version `scan_...` à côté de l'original.
- **Avancement des EC** : la ligne sous le tableau, `Nombre d'EC prévus: 10  Nombre d'EC achevés: 06
  Nombre d'EC programmés: 02  Nombre d'EC restants: 02`, devient une barre de progression.
- Après le dépôt, l'action GitHub « Publication » crée le `.ics` en 1 à 2 minutes ; les problèmes
  éventuels sont listés dans [`RAPPORT_CONVERSION.md`](../RAPPORT_CONVERSION.md).

## Ailleurs dans le dépôt

| Quoi | Où |
|---|---|
| Logo du département | [`logos/PEM.png`](../logos) (ou `.jpg`, `.jpeg`, `.webp`) |
| Supports de cours | [`supports/PEM/<cours>/`](../supports/PEM) |
| Annonces réservées au département | [`announcements/`](../announcements), avec la ligne `Départements: PEM` |

Ce fichier README.md n'est pas affiché dans l'application. Mode d'emploi complet : [README principal](../README.md).
