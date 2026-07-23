# Norma Contábil — site migrado (Wix → HTML/CSS/JS)

Migração fiel da **Home** de [www.normacontabil.com](https://www.normacontabil.com) (originalmente feita no Wix) para HTML/CSS/JS estático, sem dependência do Wix.

## Estrutura

```
normacontabil-site/
├── index.html          # Página Home completa
├── css/styles.css      # Todo o estilo (paleta, tipografia, layout, animações)
├── js/main.js          # Reveal ao rolar, header, menu mobile, marquee, formulário
├── assets/
│   └── img/            # Imagens baixadas do site original (otimizadas)
│       ├── card-gestao.jpg     # Card "Gestão financeira"
│       ├── card-relatorios.jpg # Card "Relatórios acessíveis"
│       ├── card-previsoes.jpg  # Card "Previsões estratégicas"
│       └── logo-vertical.png   # Logo vertical (rodapé)
└── .claude/launch.json # Config para rodar o preview local
```

O logo horizontal do cabeçalho (com o "X" em gradiente teal) e a seta do botão do hero
estão **embutidos como SVG inline** no `index.html` — são os SVGs originais do site.

### A onda animada do hero
No site original a onda é renderizada por um **canvas WebGL** do runtime do Wix
(componente procedural — não existe um arquivo de imagem/vídeo isolado para baixar).
Aqui ela é **reproduzida com um canvas 2D** (`js/main.js` → `heroWave`): barras teal
seguindo uma onda multi-frequência que flui para a direita + ponto brilhante, com o
mesmo esquema de cor. Respeita `prefers-reduced-motion` (renderiza quadro estático).

## Identidade visual reproduzida

| Elemento | Valor |
|----------|-------|
| Fundo escuro | `#111111` |
| Verde-água (acento) | `#29FFC6` (gradiente `#0CEBEB → #29FFC6`) |
| Azul (rodapé) | `#0025E4` |
| Branco | `#FBFBFB` / `#FFFFFF` |
| Fonte títulos/texto | **Inter** (Google Fonts) |
| Fonte rótulos/botões | **Azeret Mono** (Google Fonts) |

### Faixas da página
1. **Hero** — fundo escuro + onda teal
2. **Soluções** — escuro, 3 cards com imagem
3. **Especialistas** — fundo teal, marquee de segmentos
4. **Escalável** — fundo branco, 3 cards de texto
5. **Rodapé / Contato** — fundo azul, formulário

## Como rodar localmente

```bash
cd normacontabil-site
python3 -m http.server 4599
# abra http://localhost:4599
```

## Pendências / próximos passos
- [ ] Páginas internas: `/servicos`, `/sobre`, `/blog`, `/contato`
- [ ] Conectar o formulário a um backend/serviço de e-mail (hoje o envio é simulado no front)
- [ ] (Opcional) hospedar as fontes localmente em vez do Google Fonts, para 100% offline

## Observações
- As fontes vêm do Google Fonts (não são do Wix). Para uma versão totalmente offline, dá para baixá-las para `assets/fonts/`.
- As imagens foram baixadas dos originais e redimensionadas para web.
