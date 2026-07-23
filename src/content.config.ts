import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Coleção do blog: cada artigo é um arquivo .md em src/content/blog.
// Publicar um novo post = criar um .md com este frontmatter.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    readingTime: z.string(),
    cover: z.string(),
    excerpt: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { blog };
