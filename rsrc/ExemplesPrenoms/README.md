# Listes de prénoms (données d'exemple)

Deux listes servant au **générateur de prénoms** de la genèse (tirage aléatoire déterministe via la seed) :

- `prenoms_feminins.csv` — 1 000 prénoms
- `prenoms_masculins.csv` — 1 000 prénoms

Format : CSV à une colonne, en-tête `prenom`, un prénom par ligne, UTF-8 (sans BOM), fins de ligne LF.

## Source

**INSEE — Fichier des prénoms** (`nat2022.csv`, prénoms attribués en France de 1900 à 2022),
**données ouvertes / domaine public**. Téléchargé depuis insee.fr puis traité ainsi :

1. agrégation des effectifs (`nombre`) par prénom et par sexe sur toutes les années ;
2. exclusion de l'agrégat `_PRENOMS_RARES` ;
3. conservation des **1 000 prénoms les plus fréquents** par sexe (`1` = masculin, `2` = féminin) ;
4. mise en casse propre (accents et prénoms composés préservés, ex. « Jean-Pierre », « Marie-Thérèse »).

> Note : ces listes reflètent les fréquences historiques ; quelques prénoms peuvent apparaître dans les
> deux genres (usage en prénom composé, ex. « Marie »). C'est conforme aux données source.

Un **générateur de prénoms plus poussé** (composition, époque, espèce…) est prévu pour une version future.
