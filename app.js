// Interface do Campo Verde: SPA simples com rotas por hash.
// Todo texto vindo do servidor entra no DOM via textContent (nunca innerHTML).
(function () {
  'use strict';

  // Silhuetas minimalistas (SVG próprio, sem dados de usuário), pintadas com currentColor.
  const ICONES = {
    gado: '<path d="M4 29.5C4.3 26.8 6.5 24.6 9 22.8L11.5 20.8C16 20.5 17 20 21 19.6C26 18.6 31 17.9 37 18.2C42 18.3 46 17.6 50 17.7C53 17.8 55.2 19.5 55.6 23L55.6 28C55.7 31.5 56.3 34 56.4 37L48 37C45 38 42 36 40 35.5C36 35.3 32 35.3 28 35.5L21 36.5C19 35 17.5 33.5 15.5 31.5L13 29.8C11 31 8.5 31.5 6.5 32C4.8 32 3.8 31 4 29.5Z"/><path d="M22.5 36H26.6L26.2 43.8L27.2 49.5H21.6L22.6 44Z"/><path d="M28.4 35.5H32.4L32 43.5L33.2 49.5H27.6L28.5 43.7Z"/><path d="M50 36H56.4L55.8 43.5L54.9 49.5H49.6L50.4 44.6L49.8 41Z"/><path d="M43.5 35.8H48.4L48 44.5L49 49.5H43.4L44 44.7Z"/><path d="M53.2 19C57.5 20 58.2 26 56.8 33.5L55.6 33.5C56.6 26.5 55.8 22.5 52.8 21.6Z"/><path d="M6 17.8C5.4 19.6 6.4 22.4 9 23.4L10.3 21.8C8.2 21 6.8 19.5 6 17.8Z"/><path d="M10.6 20.6L12 17.8L14 20.5Z"/><ellipse cx="37.5" cy="37.4" rx="2.6" ry="2"/><rect x="36.4" y="38.5" width="1" height="1.7"/><rect x="38.4" y="38.5" width="1" height="1.7"/><ellipse cx="58.3" cy="35.8" rx="1.9" ry="3.3" transform="rotate(-12 58.3 35.8)"/>',
    graos: '<path d="M31 58V22h2v36z"/><ellipse cx="24" cy="27" rx="4" ry="8" transform="rotate(-28 24 27)"/><ellipse cx="40" cy="27" rx="4" ry="8" transform="rotate(28 40 27)"/><ellipse cx="24" cy="40" rx="4" ry="8" transform="rotate(-28 24 40)"/><ellipse cx="40" cy="40" rx="4" ry="8" transform="rotate(28 40 40)"/><ellipse cx="32" cy="14" rx="4" ry="9"/>',
    frutas: '<circle cx="20" cy="26" r="7"/><circle cx="32" cy="26" r="7"/><circle cx="44" cy="26" r="7"/><circle cx="26" cy="38" r="7"/><circle cx="38" cy="38" r="7"/><circle cx="32" cy="50" r="7"/><path d="M31 18h2V8h-2z"/><path d="M33 10c5-5 12-5 17-2-3 5-11 7-17 2z"/>',
    maquinas: '<path fill-rule="evenodd" d="M6 40a12 12 0 1 0 24 0 12 12 0 1 0-24 0zm8 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0z"/><path fill-rule="evenodd" d="M42 44a8 8 0 1 0 16 0 8 8 0 1 0-16 0zm4.5 0a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0z"/><path d="M12 12h14v18H12z"/><path d="M26 22h30v14H26z"/><path d="M48 12h3v10h-3z"/>',
    insumos: '<path d="M22 10h20l-2 8c6 4 10 10 10 20v10c0 3-2 5-5 5H19c-3 0-5-2-5-5V38c0-10 4-16 10-20z"/>',
  };
  const CATS = {
    gado: { nome: 'Gado' },
    graos: { nome: 'Grãos' },
    frutas: { nome: 'Frutas' },
    maquinas: { nome: 'Máquinas' },
    insumos: { nome: 'Insumos' },
  };
  function icone(cat, tam) {
    const s = document.createElement('span');
    s.className = 'ic';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<svg viewBox="0 0 64 64" width="${tam}" height="${tam}">${ICONES[cat]}</svg>`;
    return s;
  }
  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  const app = document.getElementById('app');
  const navEl = document.getElementById('nav');
  let usuario = null;

  // ---------- utilidades ----------
  function h(tag, attrs, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat()) {
      if (f == null || f === false) continue;
      el.append(f.nodeType ? f : document.createTextNode(String(f)));
    }
    return el;
  }
  const brl = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const data = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR');
  const local = (o) => [o.cidade, o.uf].filter(Boolean).join(' / ');
  const qtd = (o) => (o.quantidade ? `${o.quantidade.toLocaleString('pt-BR')} ${o.unidade || ''}`.trim() : '');

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // Todas as chamadas vão para o modo local (local-api.js), que guarda os dados no navegador.
  const api = (caminho, opcoes) => window.CampoLocal.chamar(caminho, opcoes || {});

  const ir = (rota) => { location.hash = rota; };

  function tag(cat) { return h('span', { class: 'tag' }, icone(cat, 14), CATS[cat].nome); }
  function status(s) { return h('span', { class: `tag ${s}` }, s); }

  function campoUF(valor) {
    return h('select', { name: 'uf' }, h('option', { value: '' }, 'UF'),
      UFS.map((u) => h('option', { value: u, selected: u === valor }, u)));
  }
  function campoCategoria(valor) {
    return h('select', { name: 'categoria', required: true },
      Object.entries(CATS).map(([k, c]) => h('option', { value: k, selected: k === valor }, c.nome)));
  }

  // Monta formulário que envia JSON e trata erro.
  function formulario(campos, rotulo, enviar) {
    const msg = h('p', { class: 'err', role: 'alert', hidden: true });
    const btn = h('button', { class: 'btn', type: 'submit' }, rotulo);
    const f = h('form', { class: 'box', novalidate: false }, campos, msg, btn);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      msg.hidden = true;
      btn.disabled = true;
      try {
        await enviar(Object.fromEntries(new FormData(f)));
      } catch (e) {
        msg.textContent = e.message;
        msg.hidden = false;
      } finally {
        btn.disabled = false;
      }
    });
    return f;
  }
  const campo = (rot, nome, extra = {}, dica) =>
    h('label', {}, rot, dica ? h('span', { class: 'hint' }, ' ' + dica) : null, h('input', { name: nome, ...extra }));

  function exigeLogin() {
    if (usuario) return false;
    sessionStorage.setItem('voltar', location.hash);
    toast('Entre na sua conta para continuar.');
    ir('#/entrar');
    return true;
  }

  // ---------- navegação ----------
  function desenhaNav() {
    const atual = location.hash || '#/';
    const link = (href, txt) => h('a', { href, class: atual.startsWith(href) && href !== '#/' ? 'on' : '' }, txt);
    navEl.replaceChildren(
      link('#/anuncios', 'Anúncios'),
      link('#/cotacoes', 'Cotações'),
      ...(usuario
        ? [link('#/painel', 'Meu painel'),
           h('button', { class: 'link', onclick: sair }, 'Sair'),
           h('a', { href: '#/novo-anuncio', class: 'btn sm' }, 'Anunciar')]
        : [link('#/entrar', 'Entrar'), h('a', { href: '#/cadastro', class: 'btn sm' }, 'Criar conta')])
    );
  }

  async function sair() {
    await api('/api/logout', { metodo: 'POST' });
    usuario = null;
    toast('Você saiu da conta.');
    ir('#/');
    desenhaNav();
  }

  // ---------- telas ----------
  const preco = (a) => a.preco_centavos != null
    ? h('div', { class: 'c-price' }, brl(a.preco_centavos), h('small', {}, a.unidade ? `por ${a.unidade}` : ''))
    : h('div', { class: 'c-price' }, h('small', {}, 'a combinar'));
  const celCat = (cat) => h('div', { class: 'c-cat' }, icone(cat, 20), CATS[cat].nome);

  function tabelaAnuncios(lista) {
    return h('div', { class: 'tbl anuncios' },
      h('div', { class: 'th' }, h('span', {}, 'Categoria'), h('span', {}, 'Anúncio'), h('span', {}, 'Local'), h('span', {}, 'Quantidade'), h('span', { class: 'r' }, 'Preço')),
      lista.map((a) => h('a', { class: 'tr', href: `#/anuncio/${a.id}` },
        celCat(a.categoria),
        h('div', { class: 'c-main' }, h('b', {}, a.titulo), h('span', {}, a.anunciante)),
        h('div', { class: 'c-loc' }, local(a) || '—'),
        h('div', { class: 'c-qtd' }, qtd(a) || '—'),
        preco(a))));
  }

  function tabelaCotacoes(lista) {
    return h('div', { class: 'tbl cotacoes' },
      h('div', { class: 'th' }, h('span', {}, 'Categoria'), h('span', {}, 'Pedido'), h('span', {}, 'Entrega'), h('span', {}, 'Quantidade'), h('span', {}, 'Prazo'), h('span', { class: 'r' }, 'Propostas')),
      lista.map((c) => h('a', { class: 'tr', href: `#/cotacao/${c.id}` },
        celCat(c.categoria),
        h('div', { class: 'c-main' }, h('b', {}, c.titulo), h('span', {}, c.comprador)),
        h('div', { class: 'c-loc' }, local(c) || '—'),
        h('div', { class: 'c-qtd' }, qtd(c) || '—'),
        h('div', { class: 'c-prazo' }, c.prazo || '—'),
        h('div', { class: 'c-n r' }, String(c.total_propostas)))));
  }
  const vazio = (txt) => h('div', { class: 'vazio' }, txt);

  // Faixa de preços no topo: últimos anúncios com preço, direto do banco.
  async function atualizaTicker() {
    const el = document.getElementById('ticker');
    try {
      const { anuncios } = await api('/api/anuncios');
      const itens = anuncios.filter((a) => a.preco_centavos != null).slice(0, 6);
      el.replaceChildren(h('div', { class: 'wrap' },
        h('span', { class: 'lbl' }, 'Mercado'),
        ...itens.map((a) => h('a', { href: `#/anuncio/${a.id}` },
          h('span', { class: 't' }, a.titulo),
          h('span', { class: 'p' }, brl(a.preco_centavos) + (a.unidade ? ' / ' + a.unidade : ''))))));
      el.hidden = !itens.length;
    } catch { el.hidden = true; }
  }

  // ---------- parceiros ----------
  const PRODUTOS_SB = [
    ['tinto-cabernet.jpg', 'Cabernet Sauvignon', 'Vinho tinto · 750 ml'],
    ['tinto-reserva.png', 'Tinto Reserva', 'Vinho tinto · 750 ml'],
  ];

  // Foto do produto em img/produtos (informe o nome do arquivo com a extensão).
  const fotoProduto = (arquivo, alt) => h('img', { src: `img/produtos/${arquivo}`, alt });

  function secaoParceiros() {
    const track = h('div', { class: 'car-track', tabindex: '0', role: 'region', 'aria-label': 'Produtos da Fazenda São Bernardo' },
      PRODUTOS_SB.map(([arq, nome, tipo]) => h('figure', { class: 'prod' },
        h('div', { class: 'foto' }, fotoProduto(arq, `${nome}, ${tipo}`)),
        h('figcaption', {}, h('b', {}, nome), h('span', {}, tipo)))));
    const rola = (dir) => track.scrollBy({ left: dir * Math.max(240, track.clientWidth * 0.8), behavior: 'smooth' });
    return h('section', { class: 'sec' },
      h('div', { class: 'sec-head' }, h('h2', {}, 'Parceiros'), h('span', { class: 'small muted' }, 'Compradores que movimentam o mercado local')),
      h('div', { class: 'parceiro' },
        h('div', { class: 'p-info' },
          h('div', { class: 'mono' }, 'SB'),
          h('div', {},
            h('h3', {}, 'Fazenda São Bernardo'),
            h('p', { class: 'small muted' }, 'Parceiro comprador · Bento Gonçalves / RS'),
            h('p', { class: 'p-txt' }, 'Compra caixas de uva de produtores locais para a fabricação de sucos integrais e vinhos. Se você produz uva, venda direto para quem transforma a fruta.'))
          ,
          h('a', { class: 'btn sm', href: '#/cotacoes?categoria=frutas' }, 'Ver pedidos de uva')),
        h('div', { class: 'car-head' },
          h('h3', {}, 'Produtos da Fazenda São Bernardo'),
          h('div', { class: 'car-btns' },
            h('button', { type: 'button', class: 'car-btn', 'aria-label': 'Anterior', onclick: () => rola(-1) }, '←'),
            h('button', { type: 'button', class: 'car-btn', 'aria-label': 'Próximo', onclick: () => rola(1) }, '→'))),
        track,
        h('p', { class: 'small muted', style: 'margin-top:10px' }, 'Marca e produtos fictícios; imagens ilustrativas.')));
  }

  async function home() {
    const [{ anuncios }, { cotacoes }] = await Promise.all([api('/api/anuncios'), api('/api/cotacoes')]);
    const propostas = cotacoes.reduce((s, c) => s + c.total_propostas, 0);
    app.replaceChildren(
      h('section', { class: 'hero' },
        h('div', {},
          h('span', { class: 'eyebrow' }, 'Mercado agropecuário'),
          h('h1', {}, 'Conectando quem produz a quem compra.'),
          h('p', { class: 'lead' }, 'Gado, grãos, frutas, máquinas e insumos em um só lugar. Publique anúncios, peça cotações e compare propostas de forma direta e transparente.'),
          h('div', { class: 'cta' },
            h('a', { class: 'btn', href: '#/novo-anuncio' }, 'Anunciar'),
            h('a', { class: 'btn ghost', href: '#/nova-cotacao' }, 'Pedir cotação'))),
        h('div', { class: 'mesa' },
          h('div', { class: 'cab' }, h('span', {}, 'Mesa de negócios'), h('span', {}, 'Agora')),
          h('div', { class: 'lin' }, h('span', {}, 'Anúncios ativos'), h('b', {}, String(anuncios.length))),
          h('div', { class: 'lin' }, h('span', {}, 'Cotações abertas'), h('b', {}, String(cotacoes.length))),
          h('div', { class: 'lin' }, h('span', {}, 'Propostas em análise'), h('b', {}, String(propostas))))),
      h('div', { class: 'cats' }, Object.entries(CATS).map(([k, c]) =>
        h('a', { class: 'cat', href: `#/anuncios?categoria=${k}` }, h('span', { class: 'ico' }, icone(k, 30)), h('span', {}, c.nome)))),
      secaoParceiros(),
      h('section', { class: 'sec' },
        h('div', { class: 'sec-head' }, h('h2', {}, 'Anúncios recentes'), h('a', { class: 'more', href: '#/anuncios' }, 'Ver todos →')),
        anuncios.length ? tabelaAnuncios(anuncios.slice(0, 6)) : vazio('Nenhum anúncio ainda. Seja o primeiro a anunciar.')),
      h('section', { class: 'sec' },
        h('div', { class: 'sec-head' }, h('h2', {}, 'Cotações abertas'), h('a', { class: 'more', href: '#/cotacoes' }, 'Ver todas →')),
        cotacoes.length ? tabelaCotacoes(cotacoes.slice(0, 6)) : vazio('Nenhum pedido aberto no momento.')),
      h('section', { class: 'sec' },
        h('div', { class: 'sec-head' }, h('h2', {}, 'Como funciona')),
        h('div', { class: 'passos' },
          h('div', { class: 'passo' }, h('span', { class: 'n' }, '01'), h('h3', {}, 'Anuncie ou peça cotação'), h('p', {}, 'Produtores publicam o que têm; compradores descrevem o que precisam.')),
          h('div', { class: 'passo' }, h('span', { class: 'n' }, '02'), h('h3', {}, 'Compare propostas'), h('p', {}, 'Receba ofertas dos fornecedores e escolha pelo melhor preço e prazo.')),
          h('div', { class: 'passo' }, h('span', { class: 'n' }, '03'), h('h3', {}, 'Feche o negócio'), h('p', {}, 'Ao aceitar uma proposta, o negócio é registrado e o contato é liberado.'))))
    );
  }

  function filtros(base, params, aplicar, comBusca) {
    const sel = h('select', { name: 'categoria' }, h('option', { value: '' }, 'Todas'),
      Object.entries(CATS).map(([k, c]) => h('option', { value: k, selected: params.get('categoria') === k }, c.nome)));
    const ufSel = campoUF(params.get('uf'));
    const busca = comBusca ? h('input', { name: 'q', type: 'search', placeholder: 'Ex.: soja, trator, nelore', value: params.get('q') || '' }) : null;
    const f = h('form', { class: 'filtros' },
      h('label', {}, 'Categoria', sel), h('label', {}, 'Estado', ufSel),
      comBusca ? h('label', {}, 'Buscar', busca) : null,
      h('button', { class: 'btn sm', type: 'submit' }, 'Filtrar'));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = new URLSearchParams();
      for (const [k, v] of new FormData(f)) if (v) p.set(k, v);
      ir(`${base}${p.toString() ? '?' + p : ''}`);
    });
    return f;
  }

  async function listaAnuncios(params) {
    const { anuncios } = await api('/api/anuncios?' + params);
    app.replaceChildren(
      h('div', { class: 'sec-head' }, h('h1', {}, 'Anúncios'), h('a', { class: 'btn sm', href: '#/novo-anuncio' }, 'Novo anúncio')),
      filtros('#/anuncios', params, null, true),
      anuncios.length ? tabelaAnuncios(anuncios) : vazio('Nenhum anúncio encontrado com esses filtros.'));
  }

  async function listaCotacoes(params) {
    const { cotacoes } = await api('/api/cotacoes?' + params);
    app.replaceChildren(
      h('div', { class: 'sec-head' }, h('h1', {}, 'Pedidos de cotação'), h('a', { class: 'btn sm', href: '#/nova-cotacao' }, 'Pedir cotação')),
      h('p', { class: 'muted' }, 'Tem o que o comprador procura? Envie sua proposta.'),
      filtros('#/cotacoes', params, null, false),
      cotacoes.length ? tabelaCotacoes(cotacoes) : vazio('Nenhum pedido aberto com esses filtros.'));
  }

  async function detalheAnuncio(id) {
    const { anuncio: a, dono, interessado, contato } = await api(`/api/anuncios/${id}`);
    let acao;
    if (dono) {
      acao = h('div', {},
        h('p', { class: 'muted small' }, 'Este é o seu anúncio.'),
        a.status === 'ativo' ? h('button', { class: 'btn ghost sm', onclick: async () => {
          await api(`/api/anuncios/${id}/encerrar`, { metodo: 'POST' });
          toast('Anúncio encerrado.');
          rota();
        } }, 'Encerrar anúncio') : null);
    } else if (a.status !== 'ativo') {
      acao = h('p', { class: 'muted' }, 'Este anúncio foi encerrado.');
    } else if (interessado) {
      acao = h('div', { class: 'aviso' }, 'Interesse enviado. Os dados de contato do anunciante estão abaixo.');
    } else {
      acao = formulario([
        h('label', {}, 'Mensagem para o anunciante ', h('span', { class: 'hint' }, '(opcional)'),
          h('textarea', { name: 'mensagem', maxlength: 500, placeholder: 'Ex.: Tenho interesse em fechar o lote inteiro.' }))],
        'Tenho interesse', async (v) => {
          if (!usuario) { exigeLogin(); return; }
          await api(`/api/anuncios/${id}/interesse`, { metodo: 'POST', corpo: v });
          toast('Interesse enviado!');
          rota();
        });
    }
    app.replaceChildren(
      h('p', { class: 'small' }, h('a', { href: '#/anuncios' }, '← Voltar aos anúncios')),
      h('div', { class: 'detalhe' },
        h('div', { class: 'card' },
          h('div', { class: 'meta' }, tag(a.categoria), status(a.status)),
          h('h1', { style: 'margin-top:10px;font-size:1.8rem' }, a.titulo),
          a.preco_centavos != null ? h('div', { class: 'price', style: 'margin-top:8px' }, brl(a.preco_centavos), h('small', {}, a.unidade ? ` / ${a.unidade}` : '')) : null,
          h('dl', {},
            a.quantidade ? [h('dt', {}, 'Quantidade'), h('dd', {}, qtd(a))] : null,
            h('dt', {}, 'Local'), h('dd', {}, local(a) || 'Não informado'),
            h('dt', {}, 'Anunciante'), h('dd', {}, a.anunciante),
            h('dt', {}, 'Publicado em'), h('dd', {}, data(a.criado_em))),
          a.descricao ? h('p', { class: 'desc' }, a.descricao) : null),
        h('aside', { class: 'card' },
          h('h3', { style: 'margin-bottom:12px' }, 'Fale com o anunciante'),
          acao,
          contato ? h('div', { class: 'contato' }, h('strong', {}, 'Contato: '), [contato.telefone, contato.email].filter(Boolean).join(' · ')) : null,
          h('p', { class: 'aviso small' }, 'Confira o produto e as condições antes de pagar. A negociação é direta entre as partes.'))));
  }

  async function detalheCotacao(id) {
    const { cotacao: c, dono, propostas, minha } = await api(`/api/cotacoes/${id}`);
    let lateral;
    if (dono) {
      lateral = h('div', {},
        h('h3', { style: 'margin-bottom:12px' }, `Propostas recebidas (${propostas.length})`),
        propostas.length
          ? h('div', { class: 'lista' }, propostas.map((p) => h('div', { class: 'card' },
              h('div', { class: 'proposta' },
                h('div', {},
                  h('div', { class: 'price' }, brl(p.preco_centavos), h('small', {}, c.unidade ? ` / ${c.unidade}` : '')),
                  h('div', { class: 'meta' }, h('span', {}, p.vendedor), status(p.status))),
                c.status === 'aberta' ? h('button', { class: 'btn sm', onclick: async () => {
                  if (!confirm('Aceitar esta proposta? As demais serão recusadas e o pedido será fechado.')) return;
                  await api(`/api/propostas/${p.id}/aceitar`, { metodo: 'POST' });
                  toast('Proposta aceita! Veja o contato do vendedor.');
                  rota();
                } }, 'Aceitar') : null),
              p.mensagem ? h('p', { class: 'small', style: 'margin-top:8px' }, p.mensagem) : null,
              p.telefone || p.email ? h('div', { class: 'contato' }, h('strong', {}, 'Contato: '), [p.telefone, p.email].filter(Boolean).join(' · ')) : null)))
          : vazio('Ainda sem propostas. Os vendedores da região serão avisados.'));
    } else if (minha) {
      lateral = h('div', {},
        h('h3', { style: 'margin-bottom:10px' }, 'Sua proposta'),
        h('div', { class: 'price' }, brl(minha.preco_centavos), h('small', {}, c.unidade ? ` / ${c.unidade}` : '')),
        h('p', { style: 'margin-top:8px' }, status(minha.status)),
        minha.telefone || minha.email ? h('div', { class: 'contato' }, h('strong', {}, 'Contato do comprador: '), [minha.telefone, minha.email].filter(Boolean).join(' · ')) : null);
    } else if (c.status !== 'aberta') {
      lateral = h('p', { class: 'muted' }, 'Este pedido já foi fechado.');
    } else {
      lateral = h('div', {},
        h('h3', { style: 'margin-bottom:12px' }, 'Envie sua proposta'),
        formulario([
          campo('Preço por unidade (R$)', 'preco', { type: 'number', min: '0.01', step: '0.01', required: true }),
          h('label', {}, 'Mensagem ', h('span', { class: 'hint' }, '(prazo de entrega, condições)'),
            h('textarea', { name: 'mensagem', maxlength: 1000 }))],
          'Enviar proposta', async (v) => {
            if (!usuario) { exigeLogin(); return; }
            await api(`/api/cotacoes/${id}/propostas`, { metodo: 'POST', corpo: v });
            toast('Proposta enviada!');
            rota();
          }));
    }
    app.replaceChildren(
      h('p', { class: 'small' }, h('a', { href: '#/cotacoes' }, '← Voltar às cotações')),
      h('div', { class: 'detalhe' },
        h('div', { class: 'card' },
          h('div', { class: 'meta' }, tag(c.categoria), status(c.status)),
          h('h1', { style: 'margin-top:10px;font-size:1.8rem' }, c.titulo),
          h('dl', {},
            c.quantidade ? [h('dt', {}, 'Quantidade'), h('dd', {}, qtd(c))] : null,
            c.prazo ? [h('dt', {}, 'Prazo'), h('dd', {}, c.prazo)] : null,
            h('dt', {}, 'Entrega em'), h('dd', {}, local(c) || 'A combinar'),
            h('dt', {}, 'Comprador'), h('dd', {}, c.comprador),
            h('dt', {}, 'Publicado em'), h('dd', {}, data(c.criado_em))),
          c.descricao ? h('p', { class: 'desc' }, c.descricao) : null),
        h('aside', { class: 'card' }, lateral)));
  }

  function telaCadastro() {
    app.replaceChildren(h('h1', { style: 'margin-bottom:18px' }, 'Criar conta'),
      formulario([
        campo('Nome ou razão social', 'nome', { required: true, maxlength: 80, autocomplete: 'name' }),
        campo('E-mail', 'email', { type: 'email', required: true, autocomplete: 'email' }),
        campo('Senha', 'senha', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' }, '(mínimo 8 caracteres)'),
        h('label', {}, 'Eu quero', h('select', { name: 'papel', required: true },
          h('option', { value: 'produtor' }, 'Vender (sou produtor)'),
          h('option', { value: 'comprador' }, 'Comprar'),
          h('option', { value: 'ambos' }, 'Comprar e vender'))),
        h('div', { class: 'row3' }, campo('Cidade', 'cidade', { maxlength: 60 }), h('label', {}, 'UF', campoUF('')), campo('Telefone', 'telefone', { type: 'tel', maxlength: 25 }))],
        'Criar conta', async (v) => {
          const r = await api('/api/cadastro', { metodo: 'POST', corpo: v });
          usuario = r.usuario;
          depoisDoLogin();
        }),
      h('p', { class: 'small muted', style: 'margin-top:14px' }, 'Já tem conta? ', h('a', { href: '#/entrar' }, 'Entrar')));
  }

  function telaLogin() {
    app.replaceChildren(h('h1', { style: 'margin-bottom:18px' }, 'Entrar'),
      formulario([
        campo('E-mail', 'email', { type: 'email', required: true, autocomplete: 'email' }),
        campo('Senha', 'senha', { type: 'password', required: true, autocomplete: 'current-password' })],
        'Entrar', async (v) => {
          const r = await api('/api/login', { metodo: 'POST', corpo: v });
          usuario = r.usuario;
          depoisDoLogin();
        }),
      h('p', { class: 'small muted', style: 'margin-top:14px' }, 'Novo por aqui? ', h('a', { href: '#/cadastro' }, 'Criar conta')));
  }

  function depoisDoLogin() {
    desenhaNav();
    const volta = sessionStorage.getItem('voltar');
    sessionStorage.removeItem('voltar');
    toast(`Olá, ${usuario.nome.split(' ')[0]}!`);
    ir(volta || '#/painel');
  }

  function telaNovoAnuncio() {
    if (exigeLogin()) return;
    app.replaceChildren(h('h1', { style: 'margin-bottom:6px' }, 'Novo anúncio'),
      h('p', { class: 'muted', style: 'margin-bottom:18px' }, 'Descreva o que você tem para vender.'),
      formulario([
        h('label', {}, 'Categoria', campoCategoria('')),
        campo('Título', 'titulo', { required: true, minlength: 4, maxlength: 120, placeholder: 'Ex.: 5 mil sacas de soja safra 25/26' }),
        h('div', { class: 'row3' }, campo('Preço (R$)', 'preco', { type: 'number', min: '0', step: '0.01' }, '(opcional)'),
          campo('Unidade', 'unidade', { maxlength: 20, placeholder: 'saca, arroba...' }),
          campo('Quantidade', 'quantidade', { type: 'number', min: '0', step: 'any' })),
        h('div', { class: 'row3' }, campo('Cidade', 'cidade', { value: usuario.cidade || '', maxlength: 60 }), h('label', {}, 'UF', campoUF(usuario.uf)), h('span')),
        h('label', {}, 'Descrição', h('textarea', { name: 'descricao', maxlength: 2000, placeholder: 'Qualidade, condições de retirada, documentação...' }))],
        'Publicar anúncio', async (v) => {
          const r = await api('/api/anuncios', { metodo: 'POST', corpo: v });
          toast('Anúncio publicado!');
          ir(`#/anuncio/${r.id}`);
        }));
  }

  function telaNovaCotacao() {
    if (exigeLogin()) return;
    app.replaceChildren(h('h1', { style: 'margin-bottom:6px' }, 'Pedir cotação'),
      h('p', { class: 'muted', style: 'margin-bottom:18px' }, 'Diga o que você precisa e receba propostas dos fornecedores.'),
      formulario([
        h('label', {}, 'Categoria', campoCategoria('')),
        campo('O que você precisa?', 'titulo', { required: true, minlength: 4, maxlength: 120, placeholder: 'Ex.: 10 mil sacas de milho' }),
        h('div', { class: 'row3' }, campo('Quantidade', 'quantidade', { type: 'number', min: '0', step: 'any' }),
          campo('Unidade', 'unidade', { maxlength: 20, placeholder: 'saca, arroba...' }),
          campo('Prazo', 'prazo', { maxlength: 40, placeholder: 'Até 30 dias' })),
        h('div', { class: 'row3' }, campo('Entrega em (cidade)', 'cidade', { value: usuario.cidade || '', maxlength: 60 }), h('label', {}, 'UF', campoUF(usuario.uf)), h('span')),
        h('label', {}, 'Detalhes', h('textarea', { name: 'descricao', maxlength: 2000, placeholder: 'Padrão de qualidade, forma de pagamento, frete...' }))],
        'Publicar pedido', async (v) => {
          const r = await api('/api/cotacoes', { metodo: 'POST', corpo: v });
          toast('Pedido publicado!');
          ir(`#/cotacao/${r.id}`);
        }));
  }

  async function painel(params) {
    if (exigeLogin()) return;
    const aba = params.get('aba') || 'anuncios';
    const d = await api('/api/meus');
    const abas = [['anuncios', 'Meus anúncios'], ['cotacoes', 'Minhas cotações'], ['propostas', 'Minhas propostas'], ['negocios', 'Negócios']];
    let corpo;
    if (aba === 'anuncios') {
      corpo = [
        d.interessesRecebidos.length ? h('div', { class: 'card', style: 'margin-bottom:18px' },
          h('h3', { style: 'margin-bottom:10px' }, 'Interessados nos seus anúncios'),
          h('div', { class: 'lista' }, d.interessesRecebidos.map((i) => h('div', {},
            h('strong', {}, i.nome), ' em ', h('a', { href: `#/anuncio/${i.anuncio_id}` }, i.titulo),
            i.mensagem ? h('p', { class: 'small' }, `“${i.mensagem}”`) : null,
            h('p', { class: 'small muted' }, [i.telefone, i.email].filter(Boolean).join(' · ') + ' · ' + data(i.criado_em)))))) : null,
        d.anuncios.length ? h('div', { class: 'lista' }, d.anuncios.map((a) => h('a', { class: 'card item', href: `#/anuncio/${a.id}` },
          h('div', { class: 'meta' }, tag(a.categoria), status(a.status)), h('h3', {}, a.titulo),
          h('div', { class: 'meta' }, `${a.total_interesses} interessado(s) · ${data(a.criado_em)}`))))
          : vazio('Você ainda não publicou anúncios.')];
    } else if (aba === 'cotacoes') {
      corpo = d.cotacoes.length ? h('div', { class: 'lista' }, d.cotacoes.map((c) => h('a', { class: 'card item', href: `#/cotacao/${c.id}` },
        h('div', { class: 'meta' }, tag(c.categoria), status(c.status)), h('h3', {}, c.titulo),
        h('div', { class: 'meta' }, `${c.total_propostas} proposta(s) · ${data(c.criado_em)}`)))) : vazio('Você ainda não pediu cotações.');
    } else if (aba === 'propostas') {
      corpo = d.minhasPropostas.length ? h('div', { class: 'lista' }, d.minhasPropostas.map((p) => h('a', { class: 'card item', href: `#/cotacao/${p.cotacao_id}` },
        h('h3', {}, p.titulo), h('div', { class: 'meta' }, status(p.status), h('span', {}, brl(p.preco_centavos) + ' / unidade'))))) : vazio('Você ainda não enviou propostas.');
    } else {
      corpo = d.negocios.length ? h('div', { class: 'lista' }, d.negocios.map((n) => h('div', { class: 'card' },
        h('div', { class: 'meta' }, status(n.status), h('span', {}, n.lado === 'venda' ? 'Você vendeu' : 'Você comprou'), h('span', {}, data(n.criado_em))),
        h('div', { class: 'price' }, brl(n.valor_centavos)),
        n.comissao_pct > 0 ? h('p', { class: 'small muted' }, `Comissão da plataforma: ${n.comissao_pct}% (${brl(n.comissao_centavos)})`) : h('p', { class: 'small muted' }, 'Sem comissão neste período de lançamento.')))) : vazio('Os negócios fechados por aceite de proposta aparecem aqui.');
    }
    app.replaceChildren(h('h1', { style: 'margin-bottom:6px' }, 'Meu painel'),
      h('p', { class: 'muted', style: 'margin-bottom:18px' }, `${usuario.nome} · ${usuario.email}`),
      h('div', { class: 'tabs' }, abas.map(([k, n]) => h('a', { href: `#/painel?aba=${k}`, class: k === aba ? 'on' : '' }, n))),
      h('div', {}, corpo));
  }

  // ---------- roteador ----------
  async function rota() {
    const [caminho, qs] = (location.hash || '#/').slice(1).split('?');
    const params = new URLSearchParams(qs || '');
    const partes = caminho.split('/').filter(Boolean);
    desenhaNav();
    atualizaTicker();
    try {
      if (!partes.length) await home();
      else if (partes[0] === 'anuncios') await listaAnuncios(params);
      else if (partes[0] === 'anuncio' && partes[1]) await detalheAnuncio(Number(partes[1]));
      else if (partes[0] === 'cotacoes') await listaCotacoes(params);
      else if (partes[0] === 'cotacao' && partes[1]) await detalheCotacao(Number(partes[1]));
      else if (partes[0] === 'entrar') telaLogin();
      else if (partes[0] === 'cadastro') telaCadastro();
      else if (partes[0] === 'novo-anuncio') telaNovoAnuncio();
      else if (partes[0] === 'nova-cotacao') telaNovaCotacao();
      else if (partes[0] === 'painel') await painel(params);
      else app.replaceChildren(vazio('Página não encontrada.'), h('p', { style: 'text-align:center;margin-top:14px' }, h('a', { href: '#/' }, 'Voltar ao início')));
    } catch (e) {
      if (e.status === 401) { usuario = null; desenhaNav(); exigeLogin(); return; }
      app.replaceChildren(vazio(e.message));
    }
    window.scrollTo(0, 0);
  }

  {
    const nota = h('p', {}, 'Modo demonstração: os dados ficam salvos só neste navegador. ',
      h('a', { href: '#/', onclick: (e) => { e.preventDefault(); if (confirm('Apagar os dados salvos e voltar aos exemplos?')) { window.CampoLocal.reiniciar(); usuario = null; location.hash = '#/'; location.reload(); } } }, 'Restaurar exemplos'));
    document.querySelector('.foot .wrap')?.append(nota);
  }

  window.addEventListener('hashchange', rota);
  api('/api/eu').then((r) => { usuario = r.usuario; }).catch(() => {}).finally(rota);
})();
