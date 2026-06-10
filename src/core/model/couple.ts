// Couple = groupe de conjoints actuels (taille = `groupSize` de l'espèce), formé au tick annuel
// (Feature 3, §6.6). Les membres se référencent mutuellement comme conjoints `actuel` (Personne).
export interface Couple {
  id: string; // id séquentiel déterministe (ex. « c-000001 »)
  memberIds: string[]; // ids des membres (conjoints actuels)
  reproPct: number | null; // % de reproduction éditable ; null ⇒ dérivé de la gaussienne (âge moyen)
}
