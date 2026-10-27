import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Coleção do blog: cada artigo é um arquivo .md em src/content/blog.
// Os posts são criados e editados SÓ pelo painel adm (adm.normacontabil.com,
// tela Blog), que grava este frontmatter e commita aqui. Não criar nem editar
// .md à mão: a próxima publicação pelo painel sobrescreveria a mudança.
// Os campos opcionais abaixo só aparecem na página quando preenchidos.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Linha fina abaixo do título e trecho do título destacado em cor.
    subtitle: z.string().optional(),
    titleAccent: z.string().optional(),
    date: z.coerce.date(),
    readingTime: z.string(),
    cover: z.string(),
    // "banner": o título aparece sobre a foto da capa.
    coverStyle: z.enum(['banner']).optional(),
    excerpt: z.string(),
    // Ordem manual na lista do blog (menor primeiro). Empate: mais recente primeiro.
    order: z.number().default(0),
    author: z.string().optional(),
    authorRole: z.string().optional(),
    authorPhoto: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    summary: z.string().optional(),
    // Sumário "Neste artigo" e seções numeradas (01, 02...).
    toc: z.boolean().default(false),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    related: z.array(z.string()).default([]),
    noindex: z.boolean().default(false),
  }),
});

export const collections = { blog };
