# Campo Verde

Plataforma que conecta produtores rurais e compradores de **gado, grãos, frutas, máquinas e insumos**.
Começa com anúncios e pedidos de cotação e evolui para intermediação de negócios com comissão.

Site 100% estático (HTML, CSS e JavaScript), sem build e sem servidor.

## Como funciona hoje

Os dados (anúncios, cotações, propostas, contas de exemplo) vivem no navegador, no `localStorage`,
por meio do `local-api.js`, que imita a API. Funciona em qualquer endereço, inclusive abrindo o
`index.html` com dois cliques. O link "Restaurar exemplos" no rodapé volta aos dados iniciais.

É uma demonstração: não há segurança real nem compartilhamento de dados entre pessoas.
Contas de exemplo: veja `semente()` no topo do `local-api.js`.

## Publicar na Vercel

1. Envie esta pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório.
3. Framework Preset: **Other**. Deixe Build Command e Output Directory em branco.
4. Deploy. A página inicial é o `index.html` da raiz.

## Estrutura

```
index.html, style.css, app.js   o site
local-api.js                    dados e regras no navegador (substitui o servidor)
img/produtos/                   fotos dos produtos dos parceiros
```

O servidor real (Node + SQLite) está guardado fora deste projeto, na pasta irmã
`campo-verde-servidor`, para o módulo 2.

## Testar localmente

```bash
python3 -m http.server 3000   # http://localhost:3000
```
