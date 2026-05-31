Modifier le fichier DescriptionProjet.md selon ces instructions.

# 0 seed random
Il est ABSOLUMENT NECESSAIRE que toute l'aléatoire présente dans le programme viennent d'une seul et meme seed 
générée aléatoirement visible dans les paramètres.
Cette seed est dans les données exportées de configurations et est restaurée si on recharge des données de configuration.
Il existe un boutton en dessous de l'affichage de la seed qui permet de regénérer la seed.

# 1 algo mutation forte
voici le principe de génération d'un pouvoir pour une forte mutation.
A part pour ce cas de figure, les types de pouvoirs n'existent plus.

Un nombre aléatoire i entre 0 et 5 est tiré.
Selon la valeur de i, le pouvoir est classé dans l'un des types suivants :
AE (cas les plus fréquents, 0, 1 ou 2) : association d'une Action et d'un Element.
PE (3) : association d'une PartieCorps et d'un Etat.
PA (4) : association d'une PartieCorps et d'un Ajout.
PR (5) : association d'une PartieCorps et d'un Remplacement.
chaque trait est tiré aléatoirement dans la liste des traits

# 2 ADN
Il existe un objet ADN.
Cet objet est la liste des traits actifs et inactifs d'une personne ainsi que la résilience génétique de ces traits.
C'est donc une liste de paires (trait, resilience).
C'est cet objet qui est dans la description d'une personne pour la paragraphe 3.3

# 3 naissances
Chaque especes donne naissance à un nombre N d'enfant maximum dans une portée.
Chaque especes donne naissance à un nombre M d'enfant minimum dans une portée.
Il y à un pourcentage de chance X (par especes) de donner naissance à un autre enfant dans la meme portée.
On refais le tirage jusqu'à ce que la réponse a "y a-t-il un autre enfant nait" soit non.

M, N et X sont des paramètres par especes présents dans la description d'une espece.

# 4 vieillisesment
Oublie tout le concept de générations.

Pour le premier batch de personnes, on en génère un nombre X (déterminé par l'utilisateur) qui ont tous 0 ans.
Par défaut le premier batch né à l'an 0 entre le 1er janvier te 31 décembre
et se voient attribuer une date de naissance aléatoire dans ces dates.
On peut changer l'année de naissance du premier batch en paramètres. (avant leur naissance)
Par défaut, c'est un groupe de personnes sans pouvoirs. 
Les pouvoirs commencerons à apparaitre dans la population dès qu'il y aura une mutation forte.
A l'aide d'un option en paramètres, on peut dire que les personnes du batch originel ont x% (réglable, par défaut 0) de chance d'avoir un pouvoir.
Chaque personne nait à 0 ans.

Le boutton "reproduire tout" disparait et laisse place à un boutton "avancer de X années" ou X est réglable (le minimum étant 1 an),
ça fait aussi défiler la date. 

Chaque personnes (selon leur espece) on une plage d'age pendant laquelle il peuvent se reproduire.
Les gens ne meurent plus naturellement, il n'y a plus d'age de mort. (l'option "immortel" disparait)
Mais l'utilisateur peut toujours les tuer (peux importe leur age) en renségnant obligatoirement une cause de mort.

Pour déterminer la plage d'age pendant laquelle les especes peuvent se reproduire. Il faut donner 4 parametres. 
L'age de début, l'age de fin, l'age auquel il y à le plus de chance qu'ils se reproduisent, et la probabilité à ce pic.
A partir de ces 4 données ont génère une courbe gaussienne (représenté sur la page des paramètres).
Cette gaussienne nous donne le pourcentage de chance qu'une personne se reproduise selon sont age.

Une personne, dans sa description à la liste de ses conjoints. 
Tout les conjoints sauf ceux responsables de la dernière naissance sont marqués comme "ex".
Quand une groupe de personne se reproduit ils deviennent coinjoint les un des autres et ne peuvent se reproduire que dans ce groupe.
Il existe un paramètere par espece de % de chance de divorce qui permet aux individus de redevenir célibataire. 
Et donc se reproduire avec quelqu'un d'autre que leurs conjoint (qui deviennent leurs "ex").

Il existe un paramètre autorisant ou non la consanginité (par défaut non-autorisé).
Si le parametre interdit la consanguinité,
on n'autorise pas deux personne qui ont les meme parents ou grands parents de se reproduire ou marier.

# 5 Algorithmes traits -> pouvoirs
Voici l'algorithme qui créer des pouvoirs à partir d'une liste de trait.
Pour tout cette algorithme, la constante K est la meme constante qui est réglable en paramètre.
Si la personne n'a pas de traits acitf, elle est sans pouvoirs.

## 1 sous-listes de traits.
On prends la liste de tout les traits actifs d'une personne.
Si il y à des trait de type Action alors ce sont les traits principaux, les autres sont alors secondaires.
Si on a des trait de type Partie du corps et pas de traits de types Action, 
les traits de type Partie du corps sont les traits principaux, les autres sont alors secondaires.

On va alors créer autant de sous-listes de traits qu'il y à de traits principaux.
Pour créer une sous-liste, on sépare les traits principaux des traits secondaires.
Puis on créer une liste par trait principal et un a un on assigne les traits secondaires dans ces listes.
Si quelqu'un n'a ni Actions ni Parties du corps, on a qu'une seule sous liste qui contient tout les traits.
Au moment ou on assigne les traits, 
il y à (pourcentage de resilience génétique / constante réglable en paramtre)% de chance qu'un trait se duplique.
Un trait dupliqué ne peux apparaitre plus d'une fois dans une sous liste.
Un trait dupliqué n'apparait pas plusieurs fois dans l'ADN, il n'est dupliqué que pour les sous-listes.

### Exemple 1, pas de duplication: 
une personne qui a en traits actif 2 actions (a1 et a2), 1 état (e1) et 3 remplacement (r1, r2 et r3)

- On sépare les traits : 
	a1, a2 sont principaux e1, r1, r2 et r3 sont secondaires.

- On assignes les traits secondaires un a un dans les sous-listes des traits principaux :
	[ a1 ]					[ e1, r1, r2, r3 ]
	[ a2 ]

	[ a1, e1 ]				[ r1, r2, r3 ]
	[ a2 ]

	[ a1, e1 ]				[ r2, r3 ]
	[ a2, r1 ]

	[ a1, e1, r2 ]			[ r3 ]
	[ a2, r1 ]

	[ a1, e2, r2 ]
	[ a2, r1, r3 ]

### Exemple 2, duplication: 
une personne qui a en traits actif 3 actions (a1, a2 et 3), 4 état (e1, e2, e3 et e4) et 3 remplacement (r1, r2 et r3)

- On sépare les traits : 
	a1, a2 sont principaux e1, r1, r2 et r3 sont secondaires.

- On assignes les traits secondaires un a un dans les sous-listes des traits principaux :
	[ a1 ]						[ e1, e2, e3, e4, r1, r2, r3 ]
	[ a2 ]
	[ a3 ]

	[ a1, e1 ]					[ e2, e3, e4, r1, r2, r3 ]
	[ a2 ]
	[ a3 ]

	[ a1, e1 ]					[ e2, e3, e4, r1, r2, r3 ] e2 se duplique.
	[ a2, e2 ]
	[ a3 ]

	[ a1, e1 ]					[ e3, e4, r1, r2, r3 ]
	[ a2, e2 ]
	[ a3, e2 ]

	[ a1, e1, e3 ]				[ e4, r1, r2, r3 ]
	[ a2, e2 ]
	[ a3, e2 ]

	[ a1, e1, e3 ]				[ r1, r2, r3 ]
	[ a2, e2, e4 ]
	[ a3, e2 ]

	[ a1, e1, e3 ]				[ r1, r2, r3 ] r1 se duplique.
	[ a2, e2, e4 ]
	[ a3, e2, r1 ]

	[ a1, e1, e3, r1 ]			[ r1, r2, r3 ] r1 se duplique. r1 c'est déja dupliqué 2 fois, il y à 3 sous-listes, 
	[ a2, e2, e4 ]							   r1 ne pourras plus se dupliquer
	[ a3, e2, r1 ]

	[ a1, e1, e3, r1 ]			[ r2, r3 ] r1 ne peux pas se dupliquer
	[ a2, e2, e4, r1 ]
	[ a3, e2, r1 ]

	[ a1, e1, e3, r1 ]			[ r3 ]
	[ a2, e2, e4, r1 ]
	[ a3, e2, r1, r2 ]

	[ a1, e1, e3, r1, r3 ]		[ ]
	[ a2, e2, e4, r1 ]
	[ a3, e2, r1, r2 ]

## 2 les sous-listes deviennent des pouvoirs.

Si dans une sous-liste on a plusieurs traits du meme type, 
on les considèreras comme un seul trait en les séparant d'une virgule, un "et" (ou un "ou" dans le cas des états).
ça ne change rien dans l'ADN, c'est purement pour les pouvoirs.

Exemple : 
Plusieurs Remplacement (r1, r2, r3) deviennent "r1, r2 et r3"
Plusieurs Etats (e1, e2, e3, e4) deviennent "e1 ou e2 ou e3 ou e4"

Soit "a" un trait ou groupe de trait de type action.
Soit "e" un trait ou groupe de trait de type élément.
Soit "p" un trait ou groupe de trait de type partie du corps.
Soit "aj" un trait ou groupe de trait de type ajout.
Soit "r" un trait ou groupe de trait de type remplacement.
Soit "et" un trait ou groupe de trait de type état.

Dans l'algo je met 'if a:' ça veux dire, s'il y à au moins une action dans la sous-liste actuelle
Dans l'algo, Ka signifie K pourcent de chance de générer UN SEUL nouveau trait de type action.
Dans l'algo, Ke signifie K pourcent de chance de générer UN SEUL nouveau trait de type élément.
Dans l'algo, Kp signifie K pourcent de chance de générer UN SEUL nouveau trait de type partie du corps.
Dans l'algo, Kaj signifie K pourcent de chance de générer UN SEUL nouveau trait de type ajout.
Dans l'algo, Kr signifie K pourcent de chance de générer UN SEUL nouveau trait de type remplacement.
Dans l'algo, Ket signifie K pourcent de chance de générer UN SEUL nouveau trait de type état.

On essaye de généré un trait avec le pourcentage K autant de fois que ce que K aparait dans le pouvoir.
les traits générés en utilisant K sont inscrits dans l'ADN.
Si un trait généré ainsi existe déjà dans l'ADN, on le met en actif et li donne le boost de résilience génétique.

On applique une fois par sous-liste l'algorithme suivant :

```py
if a :
	if e :
		if p :
			if r :
				if aj :
					if et :
						pouvoir = "{a} {e} avec {aj}, {et} sur {r} à la place de {p}"
					else :
						pouvoir = "{a} {e} avec {aj} sur {r} à la place de {p}"
				else :
					if et :
						pouvoir = "{a} {e} avec {r} {et} à la place de {p}"
					else :
						pouvoir = "{a} {e} avec {r} à la place de {p}"
			else :
				if aj :
					if et :
						pouvoir = "{a} {e} avec {aj} {et} sur {p}"
					else
						pouvoir = "{a} {e} avec {aj} sur {p}"
				else :
					if et :
						pouvoir = "{a} {e} avec {p} {et}"
					else :
						pouvoir = "{a} {e} avec {p}"
        else:
            if r:
                if aj:
                    if et:
                        pouvoir = "{a} {e} avec {aj} sur {r}"
                    else:
                        pouvoir = "{a} {e} avec {aj} sur {r}"
                else:
                    if et:
                        pouvoir = "{a} {e} avec {r}"
                    else:
                        pouvoir = "{a} {e} avec {r}"
            else:
                if aj:
                    if et:
                        pouvoir = "{a} {e} avec {aj}"
                    else:
                        pouvoir = "{a} {e} avec {aj}"
                else:
                    if et:
                        pouvoir = "{a} {e} {et}"
                    else:
                        pouvoir = "{a} {e}"
    else:
        if aj:
            if et:
                if r:
                    if p:
                        pouvoir = "{a} {aj} {et} avec {r} à la place de {p}"
                    else:
                        pouvoir = "{a} {aj} {et} sur {r}"
                else:
                    if p:
                        pouvoir = "{a} {aj} {et} avec {p}"
                    else:
                        pouvoir = "{a} {aj} {et}"
            else:
                if r:
                    if p:
                        pouvoir = "{a} {aj} avec {r} à la place de {p}"
                    else:
                        pouvoir = "{a} {aj} sur {r}"
                else:
                    if p:
                        pouvoir = "{a} {aj} avec {p}"
                    else:
                        pouvoir = "{a} {aj}"
        else:
            if r:
                if et:
                    if p:
                        pouvoir = "{a} {r} {et} avec {p}"
                    else:
                        pouvoir = "{a} {r} {et}"
                else:
                    if p:
                        pouvoir = "{a} {r} avec {p}"
                    else:
                        pouvoir = "{a} {r}"
            else:
                if p:
                    if et:
                        pouvoir = "{a} {p} {et}"
                    else:
                        pouvoir = "{a} {p}"
                else:
                    if et:
                        pouvoir = "{a} {Ke} {et}"
                    else:
                        pouvoir = "{a} {Ke}"
else:
    if p:
        if aj:
            if r:
                if et:
                    if e:
                        pouvoir = "{aj} {et} sur {r} en {e} à la place de {p}"
                    else:
                        pouvoir = "{aj} {et} sur {r} à la place de {p}"
                else:
                    if e:
                        pouvoir = "{aj} en {e} sur {r} à la place de {p}"
                    else:
                        pouvoir = "{aj} sur {r} à la place de {p}"
            else:
                if et:
                    if e:
                        pouvoir = "{aj} {et} en {e} sur {p}"
                    else:
                        pouvoir = "{aj} {et} sur {p}"
                else:
                    if e:
                        pouvoir = "{aj} en {e} sur {p}"
                    else:
                        pouvoir = "{aj} sur {p}"
        else:
            if r:
                if et:
                    if e:
                        pouvoir = "{r} {et} en {e} à la place de {p}"
                    else:
                        pouvoir = "{r} {et} à la place de {p}"
                else:
                    if e:
                        pouvoir = "{r} en {e} à la place de {p}"
                    else:
                        pouvoir = "{r} à la place de {p}"
            else:
                if et:
                    if e:
                        pouvoir = "{p} {et} en {e}"
                    else:
                        pouvoir = "{p} {et}"
                else:
                    if e:
                        pouvoir = "{p} en {e}"
                    else:
                        pouvoir = "{p} {Kaj}"
    else:
        if e:
            if et:
                if aj:
                    if r:
                        pouvoir = "{Ka} {e} avec {aj} {et} sur {r} à la place de {Kp}"
                    else:
                        pouvoir = "{Ka} {e} avec {aj} {et} sur {Kp}"
                else:
                    if r:
                        pouvoir = "{Ka} {e} avec {r} {et} à la place de {Kp}"
                    else:
                        pouvoir = "{Ka} {e} {et}"
            else:
                if aj:
                    if r:
                        pouvoir = "{Ka} {e} avec {aj} sur {r} à la place de {Kp}"
                    else:
                        pouvoir = "{Ka} {e} avec {aj} sur {Kp}"
                else:
                    if r:
                        pouvoir = "{Ka} {e} avec {r} à la place de {Kp}"
                    else:
                        pouvoir = "{Ka} {e}"
        else:
            if aj:
                if et:
                    if r:
                        pouvoir = "{Ka} {aj} {et} avec {r} à la place de {Kp}"
                    else:
                        pouvoir = "{aj} {et} sur {Kp}"
                else:
                    if r:
                        pouvoir = "{aj} sur {r} à la place de {Kp}"
                    else:
                        pouvoir = "{aj} à la place de {Kp}"
            else:
                if r:
                    if et:
                        pouvoir = "{Ka} {r} {et}"
                    else:
                        pouvoir = "{r} à la place de {Kp}"
                else:
                    if et:
                        pouvoir = "{Kp} {et}"
                    else:
                        pouvoir = null
```




# 6 mutation faible.
Les mutation fibles ne concernent que les personnes qui n'ont pas été selectionnés comme dans Sans pouvoirs ou des Fortes mutations du paragraphe 4.4 du document DescriptionProjet.md
à sa naissance, il y a un pourcentage de chance réglable en paramètre qu'une personne gagne un nouveau trait tiré au hazard dans la liste des traits.
Si la personne a déjà ce trait, on le met en actif et on applique le bonus de résilience.
Si la personne n'a pas se trait, on lui ajoute en actif sans appliquer le bonus de résilience.

à sa naissance, il y a UN AUTRE pourcentage de chance réglable en paramètre qu'une personne perde trait tiré au hazard dans la liste des ses traits (qu'il soit actif ou non).

# 7 puissance et maitrise.
Chaque pouvoir est associé à une puissance et une maitrise.

Dans le cas d'une mutation forte, la puissance et la maitrise sont deux nombres aléatoires entre 1 et 10 (inclus les deux)

Pour un naissance, pour le premier pouvoir de l'enfant, 
on fait la moyenne des permiers pouvoirs de tout les parents qui en on un.
on alors 4 possibilités, 
A% de chance de générer une nouvelles puissance
B% de chance d'avoir puissance moyenne parents - 1
C% de chance d'avoir puissance moyenne parents
B% de chance d'avoir puissance moyenne parents + 1

meme chose pour la maitrise avec les memes 3 probabilités.
Les probabilités B et C sont réglables en paramètre, A est affichée à coté et vaut 100-2*B-A.

Pour le N ieme pouvoir de l'enfant on refait le meme processus mais avec le N ieme pouvoir des parents.
Si un parent n'a pas de N ieme pouvoir, on prends son "N modulo le nombre de pouvoir qu'il a" ème pouvoir.

## Exemple 1:
Soit un enfant qui a 3 pouvoirs (pe1, pe2, pe3). 
Il a 2 parents, un avec 2 pouvoir (pa1, pa2) et un avec 3 pouvoirs (pb1, pb2, pb3).

On calcule la moyenne de puissance et maitrise:
- pour pe1 avec pa1 et pb1.
- pour pe2 avec pa2 et pb2.
- pour pe3 avec pa1 et pb3.

## Exemple 2:
Soit un enfant qui a 2 pouvoirs (pe1, pe2). 
Il a 2 parents, un avec 4 pouvoir (pa1, pa2, pa3, pa4) et un avec 3 pouvoirs (pb1, pb2, pb3).

On calcule la moyenne de puissance et maitrise:
- pour pe1 avec pa1 et pb1.
- pour pe2 avec pa2 et pb2.

On utilise pas pa3, pa4 et pb3, ce n'est pas grave.