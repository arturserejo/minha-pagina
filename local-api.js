// Dados do Campo Verde no navegador. Este é o "backend" do site estático: imita a API
// (anúncios, cotações, propostas, negócios) guardando tudo no localStorage, então a página
// funciona em qualquer endereço (Vercel, GitHub Pages, arquivo local) sem servidor.
// Somente para demonstração: não há segurança real nem compartilhamento entre pessoas.
// O servidor de verdade (Node + SQLite) está guardado fora do projeto, na pasta campo-verde-servidor.
(function () {
  'use strict';
  const CHAVE = 'campoverde:demo:v1';
  const CATEGORIAS = ['gado', 'graos', 'frutas', 'maquinas', 'insumos'];
  const COMISSAO_PCT = 0;

  const agora = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  const hash = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return String(h); };

  function semente() {
    const SENHA = hash('porteira123');
    const u = (id, nome, email, papel, cidade, uf, telefone) => ({ id, nome, email, senha: SENHA, papel, cidade, uf, telefone });
    const a = (id, usuario_id, categoria, titulo, descricao, preco_centavos, unidade, quantidade, cidade, uf) =>
      ({ id, usuario_id, categoria, titulo, descricao, preco_centavos, unidade, quantidade, cidade, uf, status: 'ativo', criado_em: agora() });
    const c = (id, usuario_id, categoria, titulo, descricao, quantidade, unidade, cidade, uf, prazo) =>
      ({ id, usuario_id, categoria, titulo, descricao, quantidade, unidade, cidade, uf, prazo, status: 'aberta', criado_em: agora() });
    return {
      sessao: null,
      seq: { usuarios: 6, anuncios: 7, cotacoes: 5, propostas: 2, interesses: 1, negocios: 1 },
      usuarios: [
        u(1, 'Fazenda Boa Vista (demo)', 'produtor@exemplo.com', 'produtor', 'Rio Verde', 'GO', '(64) 90000-0001'),
        u(2, 'Frigorífico Central (demo)', 'comprador@exemplo.com', 'comprador', 'Campo Grande', 'MS', '(67) 90000-0002'),
        u(3, 'Fazenda São Bernardo (demo)', 'saobernardo@exemplo.com', 'comprador', 'Bento Gonçalves', 'RS', '(54) 90000-0004'),
        u(4, 'Sítio Vale Doce (demo)', 'valedoce@exemplo.com', 'produtor', 'Flores da Cunha', 'RS', '(54) 90000-0005'),
        u(5, 'Agro Máquinas Sul (demo)', 'maquinas@exemplo.com', 'ambos', 'Passo Fundo', 'RS', '(54) 90000-0003'),
      ],
      anuncios: [
        a(1, 1, 'gado', 'Lote de 80 bois nelore para abate', 'Animais com cerca de 20 arrobas, manejo a pasto com suplementação. Retirada na fazenda.', 29500, 'arroba', 1600, 'Rio Verde', 'GO'),
        a(2, 1, 'graos', 'Soja safra 25/26, 5 mil sacas', 'Soja padrão, umidade dentro do limite, armazenada em silo próprio.', 12800, 'saca 60kg', 5000, 'Rio Verde', 'GO'),
        a(3, 5, 'maquinas', 'Trator 4x4 130 cv, revisado', 'Poucas horas de uso, pneus novos, documentação em dia.', 28500000, 'unidade', 1, 'Passo Fundo', 'RS'),
        a(4, 5, 'insumos', 'Calcário dolomítico a granel', 'Entrega para toda a região, análise disponível.', 18000, 'tonelada', 300, 'Passo Fundo', 'RS'),
        a(5, 1, 'graos', 'Milho segunda safra, 3 mil sacas', 'Grãos limpos e secos, disponível para retirada imediata.', 6200, 'saca 60kg', 3000, 'Rio Verde', 'GO'),
        a(6, 4, 'frutas', 'Uvas Bordô e Isabel, 800 caixas', 'Uva de colheita manual, própria para suco e vinho. Caixas de 20 kg, retirada no sítio.', 7500, 'caixa 20kg', 800, 'Flores da Cunha', 'RS'),
      ],
      interesses: [],
      cotacoes: [
        c(1, 2, 'gado', 'Preciso de 120 bois gordos para abate', 'Mínimo de 18 arrobas, entrega na unidade de Campo Grande.', 2200, 'arroba', 'Campo Grande', 'MS', 'Até 30 dias'),
        c(2, 2, 'graos', 'Compra de 10 mil sacas de milho', 'Padrão de exportação, pagamento em até 10 dias.', 10000, 'saca 60kg', 'Campo Grande', 'MS', 'Até 45 dias'),
        c(3, 5, 'insumos', 'Cotação de ureia para a safra', 'Entrega parcelada em duas remessas.', 80, 'tonelada', 'Passo Fundo', 'RS', 'Até 20 dias'),
        c(4, 3, 'frutas', 'Caixas de uva de produtores locais para vinhos e sucos', 'Compramos uvas de produtores da região para a fabricação de sucos integrais e vinhos. Preferência por Cabernet, Merlot, Chardonnay, Bordô e Isabel, colhidas no ponto.', 5000, 'caixa 20kg', 'Bento Gonçalves', 'RS', 'Colheita da próxima safra'),
      ],
      propostas: [
        { id: 1, cotacao_id: 1, usuario_id: 1, preco_centavos: 29000, mensagem: 'Tenho lote disponível na região de Rio Verde, posso entregar em 15 dias.', status: 'enviada', criado_em: agora() },
      ],
      negocios: [],
    };
  }

  function carrega() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) return JSON.parse(bruto);
    } catch { /* sem armazenamento: segue com dados em memória */ }
    return semente();
  }
  let db = carrega();
  const salva = () => { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* ignora */ } };
  salva();

  function falha(status, mensagem) { const e = new Error(mensagem); e.status = status; throw e; }
  const txt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const num = (v) => { if (v === '' || v == null) return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; };
  const centavos = (v) => { const n = num(v); return n === null ? null : Math.round(n * 100); };
  const uf = (v) => { const s = txt(v, 2).toUpperCase(); return /^[A-Z]{2}$/.test(s) ? s : ''; };
  const eu = () => db.usuarios.find((x) => x.id === db.sessao) || null;
  const publico = (x) => x && ({ id: x.id, nome: x.nome, email: x.email, papel: x.papel, cidade: x.cidade, uf: x.uf, telefone: x.telefone });
  const exige = () => { const x = eu(); if (!x) falha(401, 'Faça login para continuar.'); return x; };
  const nomeDe = (id) => db.usuarios.find((x) => x.id === id)?.nome || '';
  const proximo = (tabela) => db.seq[tabela]++;

  const rotas = [];
  const rota = (metodo, padrao, fn) => rotas.push({ metodo, re: new RegExp(`^${padrao.replace(/:id/g, '(\\d+)')}$`), fn });

  rota('GET', '/api/eu', () => ({ usuario: publico(eu()) }));
  rota('GET', '/api/config', () => ({ comissaoPct: COMISSAO_PCT }));

  function abreSessao(id) { db.sessao = id; salva(); return { usuario: publico(eu()) }; }

  rota('POST', '/api/cadastro', (m, q, b) => {
    const nome = txt(b.nome, 80), email = txt(b.email, 120).toLowerCase();
    const senha = typeof b.senha === 'string' ? b.senha : '';
    const papel = ['produtor', 'comprador', 'ambos'].includes(b.papel) ? b.papel : '';
    if (nome.length < 2) falha(400, 'Informe seu nome.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falha(400, 'E-mail inválido.');
    if (senha.length < 8) falha(400, 'A senha deve ter pelo menos 8 caracteres.');
    if (!papel) falha(400, 'Escolha seu perfil.');
    if (db.usuarios.some((x) => x.email === email)) falha(409, 'Este e-mail já está cadastrado.');
    const id = proximo('usuarios');
    db.usuarios.push({ id, nome, email, senha: hash(senha), papel, cidade: txt(b.cidade, 60), uf: uf(b.uf), telefone: txt(b.telefone, 25) });
    return abreSessao(id);
  });

  rota('POST', '/api/login', (m, q, b) => {
    const x = db.usuarios.find((y) => y.email === txt(b.email, 120).toLowerCase());
    if (!x || x.senha !== hash(typeof b.senha === 'string' ? b.senha : '')) falha(401, 'E-mail ou senha incorretos.');
    return abreSessao(x.id);
  });

  rota('POST', '/api/logout', () => { db.sessao = null; salva(); return { ok: true }; });

  // --- anúncios ---
  rota('GET', '/api/anuncios', (m, q) => {
    const termo = txt(q.get('q') || '', 60).toLowerCase();
    const lista = db.anuncios.filter((x) => x.status === 'ativo'
      && (!CATEGORIAS.includes(q.get('categoria')) || x.categoria === q.get('categoria'))
      && (!uf(q.get('uf')) || x.uf === uf(q.get('uf')))
      && (!termo || x.titulo.toLowerCase().includes(termo) || (x.descricao || '').toLowerCase().includes(termo)))
      .sort((p, r) => r.id - p.id).slice(0, 100)
      .map((x) => ({ id: x.id, categoria: x.categoria, titulo: x.titulo, preco_centavos: x.preco_centavos, unidade: x.unidade,
        quantidade: x.quantidade, cidade: x.cidade, uf: x.uf, criado_em: x.criado_em, anunciante: nomeDe(x.usuario_id) }));
    return { anuncios: lista };
  });

  rota('GET', '/api/anuncios/:id', (m) => {
    const x = db.anuncios.find((y) => y.id === Number(m[1]));
    if (!x) falha(404, 'Anúncio não encontrado.');
    const logado = eu();
    const dono = !!logado && logado.id === x.usuario_id;
    const interessado = !!logado && db.interesses.some((i) => i.anuncio_id === x.id && i.usuario_id === logado.id);
    const dono_ = db.usuarios.find((y) => y.id === x.usuario_id);
    return { anuncio: { ...x, anunciante: dono_.nome }, dono, interessado,
      contato: (dono || interessado) ? { telefone: dono_.telefone, email: dono_.email } : null };
  });

  rota('POST', '/api/anuncios', (m, q, b) => {
    const logado = exige();
    const titulo = txt(b.titulo, 120);
    if (!CATEGORIAS.includes(b.categoria)) falha(400, 'Categoria inválida.');
    if (titulo.length < 4) falha(400, 'Informe um título com pelo menos 4 caracteres.');
    const id = proximo('anuncios');
    db.anuncios.push({ id, usuario_id: logado.id, categoria: b.categoria, titulo, descricao: txt(b.descricao, 2000),
      preco_centavos: centavos(b.preco), unidade: txt(b.unidade, 20), quantidade: num(b.quantidade),
      cidade: txt(b.cidade, 60) || logado.cidade, uf: uf(b.uf) || logado.uf, status: 'ativo', criado_em: agora() });
    salva();
    return { id };
  });

  rota('POST', '/api/anuncios/:id/encerrar', (m) => {
    const logado = exige();
    const x = db.anuncios.find((y) => y.id === Number(m[1]) && y.usuario_id === logado.id);
    if (!x) falha(404, 'Anúncio não encontrado.');
    x.status = 'encerrado'; salva();
    return { ok: true };
  });

  rota('POST', '/api/anuncios/:id/interesse', (m, q, b) => {
    const logado = exige();
    const x = db.anuncios.find((y) => y.id === Number(m[1]) && y.status === 'ativo');
    if (!x) falha(404, 'Anúncio não encontrado.');
    if (x.usuario_id === logado.id) falha(400, 'Este anúncio é seu.');
    if (!db.interesses.some((i) => i.anuncio_id === x.id && i.usuario_id === logado.id)) {
      db.interesses.push({ id: proximo('interesses'), anuncio_id: x.id, usuario_id: logado.id, mensagem: txt(b.mensagem, 500), criado_em: agora() });
      salva();
    }
    return { ok: true };
  });

  // --- cotações ---
  const totalPropostas = (id) => db.propostas.filter((p) => p.cotacao_id === id).length;

  rota('GET', '/api/cotacoes', (m, q) => {
    const lista = db.cotacoes.filter((x) => x.status === 'aberta'
      && (!CATEGORIAS.includes(q.get('categoria')) || x.categoria === q.get('categoria'))
      && (!uf(q.get('uf')) || x.uf === uf(q.get('uf'))))
      .sort((p, r) => r.id - p.id).slice(0, 100)
      .map((x) => ({ id: x.id, categoria: x.categoria, titulo: x.titulo, quantidade: x.quantidade, unidade: x.unidade,
        cidade: x.cidade, uf: x.uf, prazo: x.prazo, criado_em: x.criado_em, comprador: nomeDe(x.usuario_id), total_propostas: totalPropostas(x.id) }));
    return { cotacoes: lista };
  });

  rota('GET', '/api/cotacoes/:id', (m) => {
    const x = db.cotacoes.find((y) => y.id === Number(m[1]));
    if (!x) falha(404, 'Pedido de cotação não encontrado.');
    const logado = eu();
    const dono = !!logado && logado.id === x.usuario_id;
    let propostas = [], minha = null;
    if (dono) {
      propostas = db.propostas.filter((p) => p.cotacao_id === x.id).sort((p, r) => p.preco_centavos - r.preco_centavos).map((p) => {
        const v = db.usuarios.find((y) => y.id === p.usuario_id);
        return { id: p.id, preco_centavos: p.preco_centavos, mensagem: p.mensagem, status: p.status, criado_em: p.criado_em, vendedor: v.nome,
          telefone: p.status === 'aceita' ? v.telefone : null, email: p.status === 'aceita' ? v.email : null };
      });
    } else if (logado) {
      const p = db.propostas.find((y) => y.cotacao_id === x.id && y.usuario_id === logado.id);
      if (p) {
        const comp = db.usuarios.find((y) => y.id === x.usuario_id);
        minha = { id: p.id, preco_centavos: p.preco_centavos, mensagem: p.mensagem, status: p.status,
          telefone: p.status === 'aceita' ? comp.telefone : null, email: p.status === 'aceita' ? comp.email : null };
      }
    }
    return { cotacao: { ...x, comprador: nomeDe(x.usuario_id) }, dono, propostas, minha };
  });

  rota('POST', '/api/cotacoes', (m, q, b) => {
    const logado = exige();
    if (!CATEGORIAS.includes(b.categoria)) falha(400, 'Categoria inválida.');
    const titulo = txt(b.titulo, 120);
    if (titulo.length < 4) falha(400, 'Informe o que você precisa (mínimo 4 caracteres).');
    const id = proximo('cotacoes');
    db.cotacoes.push({ id, usuario_id: logado.id, categoria: b.categoria, titulo, descricao: txt(b.descricao, 2000),
      quantidade: num(b.quantidade), unidade: txt(b.unidade, 20), cidade: txt(b.cidade, 60) || logado.cidade,
      uf: uf(b.uf) || logado.uf, prazo: txt(b.prazo, 40), status: 'aberta', criado_em: agora() });
    salva();
    return { id };
  });

  rota('POST', '/api/cotacoes/:id/propostas', (m, q, b) => {
    const logado = exige();
    const x = db.cotacoes.find((y) => y.id === Number(m[1]) && y.status === 'aberta');
    if (!x) falha(404, 'Pedido não encontrado ou já fechado.');
    if (x.usuario_id === logado.id) falha(400, 'Você não pode responder ao seu próprio pedido.');
    const preco = centavos(b.preco);
    if (!preco) falha(400, 'Informe um preço válido.');
    if (db.propostas.some((p) => p.cotacao_id === x.id && p.usuario_id === logado.id)) falha(409, 'Você já enviou uma proposta para este pedido.');
    db.propostas.push({ id: proximo('propostas'), cotacao_id: x.id, usuario_id: logado.id, preco_centavos: preco,
      mensagem: txt(b.mensagem, 1000), status: 'enviada', criado_em: agora() });
    salva();
    return { ok: true };
  });

  rota('POST', '/api/propostas/:id/aceitar', (m) => {
    const logado = exige();
    const p = db.propostas.find((y) => y.id === Number(m[1]));
    const c = p && db.cotacoes.find((y) => y.id === p.cotacao_id);
    if (!p || c.usuario_id !== logado.id) falha(404, 'Proposta não encontrada.');
    if (c.status !== 'aberta') falha(400, 'Este pedido já foi fechado.');
    const valor = Math.round(p.preco_centavos * (c.quantidade || 1));
    db.propostas.forEach((y) => { if (y.cotacao_id === c.id) y.status = y.id === p.id ? 'aceita' : 'recusada'; });
    c.status = 'fechada';
    db.negocios.push({ id: proximo('negocios'), proposta_id: p.id, vendedor_id: p.usuario_id, comprador_id: c.usuario_id, valor_centavos: valor,
      comissao_pct: COMISSAO_PCT, comissao_centavos: Math.round(valor * COMISSAO_PCT / 100), status: 'aberto', criado_em: agora() });
    salva();
    return { ok: true };
  });

  // --- painel ---
  rota('GET', '/api/meus', () => {
    const logado = exige();
    const meusAnuncios = db.anuncios.filter((x) => x.usuario_id === logado.id).sort((p, r) => r.id - p.id);
    return {
      anuncios: meusAnuncios.map((x) => ({ id: x.id, categoria: x.categoria, titulo: x.titulo, status: x.status, criado_em: x.criado_em,
        total_interesses: db.interesses.filter((i) => i.anuncio_id === x.id).length })),
      cotacoes: db.cotacoes.filter((x) => x.usuario_id === logado.id).sort((p, r) => r.id - p.id)
        .map((x) => ({ id: x.id, categoria: x.categoria, titulo: x.titulo, status: x.status, criado_em: x.criado_em, total_propostas: totalPropostas(x.id) })),
      interessesRecebidos: db.interesses.filter((i) => meusAnuncios.some((x) => x.id === i.anuncio_id)).sort((p, r) => r.id - p.id).slice(0, 50)
        .map((i) => { const a = db.anuncios.find((x) => x.id === i.anuncio_id); const u = db.usuarios.find((x) => x.id === i.usuario_id);
          return { id: i.id, mensagem: i.mensagem, criado_em: i.criado_em, anuncio_id: a.id, titulo: a.titulo, nome: u.nome, telefone: u.telefone, email: u.email }; }),
      minhasPropostas: db.propostas.filter((p) => p.usuario_id === logado.id).sort((p, r) => r.id - p.id)
        .map((p) => ({ id: p.id, preco_centavos: p.preco_centavos, status: p.status, cotacao_id: p.cotacao_id, titulo: db.cotacoes.find((c) => c.id === p.cotacao_id).titulo })),
      negocios: db.negocios.filter((n) => n.vendedor_id === logado.id || n.comprador_id === logado.id).sort((p, r) => r.id - p.id)
        .map((n) => ({ id: n.id, valor_centavos: n.valor_centavos, comissao_pct: n.comissao_pct, comissao_centavos: n.comissao_centavos,
          status: n.status, criado_em: n.criado_em, lado: n.vendedor_id === logado.id ? 'venda' : 'compra' })),
    };
  });

  window.CampoLocal = {
    async chamar(caminho, { metodo = 'GET', corpo } = {}) {
      const url = new URL(caminho, 'http://local');
      for (const r of rotas) {
        if (r.metodo !== metodo) continue;
        const m = url.pathname.match(r.re);
        if (m) return JSON.parse(JSON.stringify(r.fn(m, url.searchParams, corpo || {})));
      }
      falha(404, 'Rota não encontrada.');
    },
    reiniciar() { db = semente(); salva(); },
  };
})();
