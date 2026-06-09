# Contrat — Fichier d'état (export / import)

Format **JSON**, encodage UTF-8. Un seul `kind` en Feature 1 : `"full"` (paramètres + seed + population).
Le fichier est **versionné** et porte un **identifiant de type** reconnu à l'import (Principe VI).

## Schéma (Feature 1)

```json
{
  "kind": "full",
  "formatVersion": 1,
  "parameters": {
    "seed": "12345678901234567890",
    "batchSize": 100,
    "birthYear": 0,
    "powerChancePct": 0,
    "initialResilience": 50,
    "traitTypeWeights": {
      "Remplacement": 1, "PartieCorps": 1, "Etat": 1,
      "Element": 1, "Ajout": 1, "Action": 1
    },
    "templateWeights": { "AE": 3, "PE": 1, "PA": 1, "PR": 1 }
  },
  "catalog": {
    "byType": {
      "Remplacement": [ { "id": "Remplacement:pinces-de-crabe", "type": "Remplacement", "label": "Pinces de crabe", "weight": 1 } ],
      "PartieCorps": [],
      "Etat": [],
      "Element": [],
      "Ajout": [],
      "Action": []
    }
  },
  "population": [
    {
      "id": "p-000001",
      "nom": "Exemple",
      "especeId": "humain",
      "genreId": "tout",
      "dateNaissance": "0000-04-12",
      "vivant": true,
      "raisonDeces": null,
      "parents": [],
      "enfants": [],
      "conjoints": [],
      "adn": { "traits": [] },
      "pouvoirs": [],
      "notes": null
    }
  ]
}
```

## Règles d'import

1. Le contenu DOIT être un JSON valide ; sinon → erreur, état courant inchangé.
2. `kind` DOIT valoir `"full"` (sinon → rejet propre avec message ; les autres `kind` seront gérés ultérieurement).
3. `formatVersion` DOIT être reconnu (≤ version courante) ; une version inconnue → message clair.
4. Les références (`traitId`, `especeId`, `genreId`) DEVRAIENT être cohérentes avec le `catalog` fourni ;
   incohérence → message d'avertissement, sans corruption silencieuse.
5. En cas de succès, l'état importé **remplace** l'état courant à l'identique (INV-6).

## Règles d'export

- Sérialisation **déterministe** (ordre de clés stable) afin que deux états égaux produisent un fichier
  identique (support direct de SC-001/INV-1 via comparaison d'export).
- La **seed** est toujours incluse (Principe I/VI).
- Aucune donnée personnelle de l'auteur n'apparaît dans le fichier (Principe X).

## Notes d'évolution

- Features ultérieures : ajouter `kind: "config"` (paramètres + catalogues seuls) et `kind: "data"`
  (population seule), plus la montée de `formatVersion` avec migration à l'import.
