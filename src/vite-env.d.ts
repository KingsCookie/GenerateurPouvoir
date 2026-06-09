/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Import de fichiers texte bruts (catalogues, listes de prénoms) embarqués au bundle.
declare module '*?raw' {
  const content: string;
  export default content;
}
