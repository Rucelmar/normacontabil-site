import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// /llms.txt — padrão llmstxt.org: Markdown com H1, resumo e listas de links.
// Gerado do conteúdo do site (os posts do blog entram sozinhos).
export const GET: APIRoute = async () => {
  const site = 'https://www.normacontabil.com';
  const posts = (await getCollection('blog')).sort((a, b) => a.data.order - b.data.order);

  const body = `# Norma Contábil

> Escritório de contabilidade consultiva e planejamento financeiro para empresas em crescimento. Organizamos a rotina financeira, criamos previsões estratégicas e traduzimos números em decisões, atuando como parceira estratégica com mentalidade de negócio.

A Norma atende principalmente negócios de serviço, startups, agências, clínicas, SaaS, consultorias e empresas em expansão. As frentes de atuação são: contabilidade consultiva, planejamento e modelagem financeira (FP&A), gestão financeira (BPO financeiro), fiscal e tributário, departamento pessoal e societário e legal.

## Páginas

- [Home](${site}/): visão geral, proposta de valor e soluções.
- [Serviços](${site}/servicos): serviços contábeis completos, do operacional ao estratégico.
- [Sobre](${site}/sobre): história, método e para quem a Norma trabalha.
- [Blog](${site}/blog): conteúdos sobre contabilidade, finanças e gestão.
- [Contato](${site}/contato): fale com a equipe da Norma.

## Blog
${posts.map((p) => `- [${p.data.title}](${site}/post/${p.id}): ${p.data.excerpt.split('. ')[0]}.`).join('\n')}

## Contato

- E-mail: contato@normacontabil.com
- Telefone: +55 (51) 98344-5863
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
