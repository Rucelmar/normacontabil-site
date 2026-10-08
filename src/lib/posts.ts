import type { CollectionEntry } from 'astro:content';

// Ordem da lista do blog: `order` crescente; no empate, o mais recente primeiro.
// Posts publicados pelo painel entram com order 0, então aparecem no topo.
export const sortPosts = (posts: CollectionEntry<'blog'>[]) =>
  [...posts].sort((a, b) => a.data.order - b.data.order || b.data.date.getTime() - a.data.date.getTime());
