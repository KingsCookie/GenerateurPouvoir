Je veux faire un projet de générateur de pouvoir aléatoire.

Les pouvoirs sont composés de différents traits.
Il y à 6 types de traits :
- les Remplacements :
Tu as un exemple dans rsrc/ExempleTraits/Remplacements.txt
- les Parties Du Corps :
Tu as un exemple dans rsrc/ExempleTraits/PartieCorps.txt
- les Etats :
Tu as un exemple dans rsrc/ExempleTraits/Etat.txt
- les Elements :
Tu as un exemple dans rsrc/ExempleTraits/Element.txt
- les Ajouts :
Tu as un exemple dans rsrc/ExempleTraits/Ajout.txt
- les Actions :
Tu as un exemple dans rsrc/ExempleTraits/Action.txt

Il y à plusieurs type de pouvoirs. 
- Action sur Elements,
- Ajout sur Partie du corps. 
- Remplacement à la place de Partie du corps. 
- Partie du corps en Etat. 
- Action sur Elements grace à Partie du corps.
Par exemple un pouvoir Action sur Element serait :
Controlle feu avec le trait Action : "Controlle" et le trait Element : "feu"

Ces pouvoirs sont les pouvoirs de personnes. Mon générateur de pouvoir devra etre capable de reproduire les personnes et d'avoir une héréditée. 
L'idée derrière l'hérédité c'est que chaque trait à un certain pourcentage de chance d'etre transmis à l'enfant.
Si le trait est transmis, l'enfant a ce trait actif et son pourcentage de chance d'etre hérité augmente chez l'enfant.
Si le trait n'est pas transmis, l'enfant a ce trait inactif et son pourcentage de chance d'etre hérité diminue chez l'enfant.
Si un trait a moins de 2 pourcent de chance d'etre hérité, il disparait du génome.
Lors d'un accouplement il y a un certain pourcentage de chance de mutation qui fait que l'enfant a tout les trait de ses prents en innactif et avec un pourcentage de chance d'etre hérité réduite mais il obtient un nouveau pouvoir aléatoire.
Il y à aussi un certain pourcentage de chance qu'un enfant naisse sans pouvoirs et que ait tout les traits de ses parents en innactif et avec un pourcentage réduit.

Tout les trait, leur pourcentage de chance originnels, le facteur de réduction, le facteur d'augmentation, le pourcentage de chance de mutation et le pourcentage de chance de naitre sans pouvoirs doivent etre paramettrables.