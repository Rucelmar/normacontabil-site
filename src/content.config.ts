import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Coleção do blog: cada artigo é um arquivo .md em src/content/blog.
// Publicar um novo post = criar um .md com este frontmatter. O painel adm
// (adm.normacontabil.com) grava os mesmos campos; os opcionais abaixo só
// aparecem na página quando preenchidos.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    readingTime: z.string(),
    cover: z.string(),
    excerpt: z.string(),
    // Ordem manual na lista do blog (menor primeiro). Empate: mais recente primeiro.
    order: z.number().default(0),
    author: z.string().optional(),
    authorRole: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    summary: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    related: z.array(z.string()).default([]),
    noindex: z.boolean().default(false),
  }),
});

export const collections = { blog };
