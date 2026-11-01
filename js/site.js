// CoachWise, landing page (v6, COA-M025): página de produto à venda, com o texto do 18. Base: a v5 (COA-M022), telas refeitas a partir do código do produto (só leitura).
// Sem biblioteca; só transform, opacity e clip-path. Tudo respeita prefers-reduced-motion; sem JS, cada demo mostra o estado final.
// Os botões "Entrar" e "Testar 7 dias grátis" são links normais: a página não cria conta nem envia dado.
import { CONFIG, EM_BREVE, precos, reais } from './config.js?v=20261101-110121';
import { registrar } from './eventos.js?v=20261101-110121';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const raiz = document.documentElement;
const mqReduz = matchMedia('(prefers-reduced-motion: reduce)');
const reduz = () => mqReduz.matches;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function ajustarMovimento() { raiz.classList.toggle('anima', !reduz()); }
ajustarMovimento();
mqReduz.addEventListener('change', ajustarMovimento);
if (CONFIG.linkDeCompra) raiz.classList.add('compra');
raiz.classList.toggle('em-breve', EM_BREVE); // o <head> já fez o mesmo pela URL; aqui vale também a configuração
raiz.classList.toggle('sem-teste', !CONFIG.teste.confirmado);
raiz.classList.toggle('sem-valores', !CONFIG.planos.mostrarValores);
raiz.classList.toggle('plano-base', CONFIG.teste.mostrarPlanoBase);

/* ---------- destinos e textos que dependem do teste (18, "Textos que mudam com teste.confirmado") ---------- */
function aplicarConfig() {
  $$('[data-entrar]').forEach((a) => { a.href = CONFIG.links.entrar; });
  $$('[data-testar]').forEach((a) => {
    a.href = CONFIG.links.usarOrigem && a.dataset.origem ? `${CONFIG.links.testar}?origem=${encodeURIComponent(a.dataset.origem)}` : CONFIG.links.testar;
    if (!CONFIG.teste.confirmado) {
      const no = [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (no) no.textContent = 'Criar conta';
    }
  });
  if (!CONFIG.teste.confirmado) {
    $('[data-fecha-texto]').textContent = 'Conecte o seu WhatsApp, vincule os seus alunos e veja a timeline do dia.';
    const d = $('meta[name="description"]');
    d.content = d.content.replace('Teste por 7 dias.', 'Crie a sua conta.');
  }
  $('[data-plano-base]').hidden = !CONFIG.teste.mostrarPlanoBase;
  $$('[data-selo-planos]').forEach((s) => { s.lastChild.textContent = CONFIG.planos.seloProvisorio; });
}

// Eventos: todo elemento com data-evento registra o clique (sem enviar para lugar nenhum).
document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-evento]');
  if (alvo) registrar(alvo.dataset.evento, alvo.dataset.lugar ? { lugar: alvo.dataset.lugar } : {});
});

// Palavras em spans, para escrever um texto palavra por palavra.
function emPalavras(el, classe) {
  if (el.dataset.quebrado) return $$('.' + classe, el);
  const palavras = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  palavras.forEach((p, i) => {
    const s = document.createElement('span');
    s.className = classe; s.textContent = p;
    el.append(s, i < palavras.length - 1 ? ' ' : '');
  });
  el.dataset.quebrado = '1';
  return $$('.' + classe, el);
}

// Campos que se preenchem letra por letra (o texto final já está no HTML: sem JS ou sem movimento, aparece inteiro).
function digitador() {
  let geracao = 0;
  return {
    cancelar() { geracao += 1; },
    async digitar(campos, { ms = 45, pausa = 220 } = {}) {
      const g = ++geracao;
      const textos = campos.map((c) => { c.dataset.texto ??= c.textContent; return c.dataset.texto; });
      if (reduz()) { campos.forEach((c, i) => { c.textContent = textos[i]; }); return true; }
      campos.forEach((c) => { c.textContent = ''; });
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        c.classList.add('digitando');
        for (const letra of textos[i]) {
          if (g !== geracao) { c.classList.remove('digitando'); return false; }
          c.textContent += letra;
          await espera(ms);
        }
        c.classList.remove('digitando');
        await espera(pausa);
      }
      return g === geracao;
    },
    completar(campos) { geracao += 1; campos.forEach((c) => { c.textContent = c.dataset.texto ?? c.textContent; c.classList.remove('digitando'); }); },
  };
}

/* ---------- barra: fundo ao rolar, seção atual, menu do celular ---------- */
function iniciarBarra() {
  const barra = $('[data-barra]');
  const nav = $('[data-nav]', barra);
  const indicador = $('[data-indicador]', barra);
  const links = $$('a', nav);
  const menu = $('[data-menu]', barra);
  const painel = $('[data-menu-painel]', barra);

  // cada seção acende a âncora do seu grupo
  const grupo = { 'como-funciona': 'como-funciona', demo: 'demo', permanencia: 'demo', whatsapp: 'demo', foto: 'demo', copiloto: 'demo', 'dia-a-dia': 'demo', app: 'app', comunidade: 'app', vitrine: 'app', equipe: 'app', planos: 'planos', duvidas: 'duvidas' };
  let atual = null;
  function acender(id) {
    if (id === atual) return;
    atual = id;
    const link = links.find((a) => a.getAttribute('href') === '#' + id);
    links.forEach((a) => (a === link ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (!link) { indicador.classList.remove('ativo'); return; }
    indicador.style.setProperty('--x', link.offsetLeft + 'px');
    indicador.style.setProperty('--w', link.offsetWidth + 'px');
    indicador.classList.add('ativo');
  }
  const obs = new IntersectionObserver((itens) => {
    const visivel = itens.filter((i) => i.isIntersecting).map((i) => i.target.id);
    if (visivel.length) acender(grupo[visivel[0]] ?? null);
  }, { rootMargin: '-45% 0px -54% 0px' });
  $$('main > section').forEach((s) => obs.observe(s));
  addEventListener('resize', () => { const a = atual; atual = null; acender(a); });

  function fechar(focar) {
    painel.hidden = true; menu.setAttribute('aria-expanded', 'false');
    if (focar) menu.focus();
  }
  menu.addEventListener('click', () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir; menu.setAttribute('aria-expanded', String(abrir));
    if (abrir) $('a', painel).focus();
  });
  painel.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) fechar(true); });
  matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) fechar(false); });
}

/* ---------- S1. o título com a palavra que gira (18, S1; mecânica do 17 §1.6) ---------- */
// Duas camadas: a linha de cima menor, a de baixo grande; uma palavra troca (2,6 s por palavra, deslize de 0,3 s) e para depois de dois ciclos.
// O h1 traz a frase inteira com a primeira palavra (é o que o leitor de tela e a busca leem); as outras palavras ficam aria-hidden.
// Sem movimento, a palavra fica na primeira. A V6 (COA-M026, decisão do Sants em 31/10) está no HTML; V1 a V5 entram por ?titulo=v1 ... ?titulo=v5.
const TITULOS = {
  v1: { l1: ['Um só lugar para'], l2: ['seus alunos.'], gira: 'l1', palavras: ['atender', 'acompanhar', 'orientar', 'engajar'] },
  v2: { l1: ['Sua consultoria online'], l2: ['aluno por aluno.'], gira: 'l1', palavras: ['organizada,', 'conectada,', 'atenta,'] },
  v3: { l1: ['Saiba como está cada aluno'], l2: ['', ''], gira: 'l2', palavras: ['no treino.', 'no WhatsApp.', 'nos check-ins.', 'na evolução.'],
        paragrafo: 'Uma IA junta o que o aluno falou no grupo, treinou no app, respondeu nos formulários e registrou nas medidas, e escreve o dia dele na ficha. A plataforma aponta quem se afastou, quem estagnou e quem está perto de vencer.' },
  v4: { l1: ['Você atende no WhatsApp.'], l2: ['A gestão', 'vem junto.'], gira: 'l2', palavras: ['do treino', 'dos check-ins', 'da evolução', 'das renovações'],
        fecho: 'Cada aluno com a conversa e a gestão na mesma ficha.' },
  v5: { l1: ['A plataforma para'], l2: ['sua consultoria online.'], gira: 'l1', palavras: ['organizar', 'acompanhar', 'automatizar'] },
  v6: { l1: ['A melhor forma de'], l2: ['Consultoria Online'], gira: 'l1', palavras: ['organizar', 'atender', 'acompanhar', 'automatizar'] },
};
function iniciarTitulo() {
  const v = CONFIG.header.versaoPadrao;
  const t = TITULOS[v] ?? TITULOS.v6;
  const h = $('h1[data-titulo]');
  h.dataset.versao = v;
  raiz.dataset.titulo = v;
  if (v !== 'v6') {
    const gira = '<span class="gira" data-gira></span>';
    const l1 = t.gira === 'l1' ? `${t.l1[0]} ${gira}` : t.l1[0];
    const l2 = t.gira === 'l2' ? [t.l2[0], gira, t.l2[1]].filter(Boolean).join(' ') : t.l2[0];
    h.innerHTML = `<span class="h1-l1">${l1}</span> <span class="h1-l2">${l2}</span>`;
    $('[data-gira]', h).textContent = t.palavras[0];
    if (t.paragrafo) $('[data-titulo-paragrafo]').textContent = t.paragrafo;
    if (t.fecho) $('[data-fecho-rotina]').textContent = t.fecho;
  }
  const lista = t.palavras.map((p) => p.replace(/[.,]$/, ''));
  $('[data-gira-lista]').textContent = `Palavras que se alternam no título: ${lista.join(', ')}.`;

  // as palavras empilhadas no mesmo lugar: a caixa fica com a largura da mais longa e a linha de baixo não pula
  const caixa = $('[data-gira]', h);
  const primeira = document.createElement('span');
  primeira.className = 'gira-p on'; primeira.textContent = t.palavras[0];
  caixa.textContent = '';
  caixa.append(primeira);
  // as outras palavras entram como conteúdo de CSS (::before), fora do texto do h1: o título lido é sempre a frase com a primeira palavra
  t.palavras.slice(1).forEach((p) => {
    const s = document.createElement('span');
    s.className = 'gira-p gira-extra'; s.dataset.p = p; s.setAttribute('aria-hidden', 'true');
    caixa.append(s);
  });
  const itens = [...caixa.children];
  raiz.style.setProperty('--deslize', CONFIG.header.deslizeS * 1000 + 'ms');
  let i = 0, trocas = 0, relogio = null;
  const total = CONFIG.header.pararAposCiclos > 0 ? itens.length * CONFIG.header.pararAposCiclos : Infinity;
  // V4: a palavra gira no meio da linha; a caixa acompanha a largura da palavra (sem buraco antes de "vem junto.")
  const meio = t.gira === 'l2' && Boolean(t.l2[1]);
  if (meio) { caixa.classList.add('gira-meio'); caixa.style.width = itens[0].getBoundingClientRect().width + 'px'; }
  function trocar() {
    const atual = itens[i]; i = (i + 1) % itens.length; const prox = itens[i];
    if (meio) caixa.style.width = prox.getBoundingClientRect().width + 'px';
    atual.classList.remove('on'); atual.classList.add('sai');
    prox.classList.remove('sai'); prox.classList.add('on');
    setTimeout(() => atual.classList.remove('sai'), CONFIG.header.deslizeS * 1000 + 60);
    trocas += 1;
    if (trocas >= total) parar();
  }
  function parar() { clearInterval(relogio); relogio = null; }
  function comecar() {
    if (reduz() || relogio || trocas >= total) return;
    relogio = setInterval(trocar, CONFIG.header.cadenciaS * 1000);
  }
  // espera o título entrar (a animação de entrada do h1 leva ~1 s) e só gira com a primeira tela à vista
  const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) comecar(); else parar(); }, { threshold: 0.2 });
  setTimeout(() => obs.observe(h), 900);
  mqReduz.addEventListener('change', () => {
    if (!reduz()) return;
    parar(); itens.forEach((x, n) => { x.classList.toggle('on', n === 0); x.classList.remove('sai'); }); i = 0;
    if (meio) caixa.style.width = itens[0].getBoundingClientRect().width + 'px';
  });
}

/* ---------- barra no pé do celular: aparece depois da primeira tela e some quando o fecho entra ---------- */
function iniciarPeFixo() {
  const pe = $('[data-pe-fixo]');
  const link = $('a', pe);
  const vis = new Map();
  const atualizar = () => {
    const mostra = vis.get('topo') === false && vis.get('fecho') === false;
    pe.classList.toggle('visivel', mostra);
    pe.setAttribute('aria-hidden', String(!mostra));
    link.tabIndex = mostra ? 0 : -1;
  };
  const obs = new IntersectionObserver((itens) => { itens.forEach((i) => vis.set(i.target.id, i.isIntersecting)); atualizar(); }, { rootMargin: '0px 0px -12% 0px' });
  obs.observe($('#topo')); obs.observe($('#fecho'));
}

/* ---------- faixa de verbos: o trilho se repete para correr sem emenda ---------- */
function iniciarVerbos() {
  const trilho = $('[data-verbos]');
  [...trilho.children].forEach((v) => trilho.append(v.cloneNode(true)));
}

/* ---------- S3b. Como funciona: o passo ativo troca a tela ao lado (passar o mouse, focar ou tocar no cartão) ---------- */
// Sem script: a tela do passo 1. No celular, a tela desce para dentro do cartão aberto, para ficar embaixo dele (18, S3b).
const LEGENDAS_COMO = ['',
  'Tela de exemplo do passo 1: conectar o WhatsApp por QR code e a lista de conversas com as etiquetas.',
  'Tela de exemplo do passo 2: a automação no passo Agenda e o cartão Renovação de plano, com 7, 3 e 1 dia antes.',
  'Tela de exemplo do passo 3: o aviso do questionário no WhatsApp e a pergunta no app, com o logo da consultoria.',
  'Tela de exemplo do passo 4: a timeline de terça, com as quatro fontes e o botão Editar.',
  'Tela de exemplo do passo 5: as etiquetas na lista de conversas, os templates rápidos e o Copiloto com Criar tarefa.'];
function iniciarComo() {
  const raizComo = $('[data-como]');
  const palco = $('[data-como-palco]', raizComo);
  const legenda = $('[data-como-legenda]', palco);
  const bts = $$('[data-como-passo]', raizComo);
  const lugarOriginal = palco.parentElement;
  const mqCel = matchMedia('(max-width: 760px)');
  let relogio = null, mexeu = false, atual = 1;

  function ir(n, doVisitante) {
    atual = n;
    palco.dataset.passo = String(n);
    bts.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.comoPasso) === n)));
    legenda.textContent = LEGENDAS_COMO[n];
    posicionar();
    if (doVisitante) registrar('como_funciona_passo', { passo: n });
  }
  function posicionar() {
    const li = bts[atual - 1].parentElement;
    if (mqCel.matches) { if (palco.parentElement !== li) li.append(palco); }
    else if (palco.parentElement !== lugarOriginal) lugarOriginal.append(palco);
  }
  function pararAuto() { mexeu = true; clearInterval(relogio); relogio = null; }
  bts.forEach((b) => {
    const n = Number(b.dataset.comoPasso);
    b.addEventListener('click', () => { pararAuto(); ir(n, true); });
    b.addEventListener('focus', () => { if (!mqCel.matches) { pararAuto(); ir(n, false); } });
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { pararAuto(); ir(n, false); } });
  });
  mqCel.addEventListener('change', posicionar);
  ir(1, false);
  // passa sozinho pelos cinco passos, uma vez, quando a seção aparece; para no primeiro gesto do visitante
  palco.__iniciar = () => {
    if (mexeu || reduz() || mqCel.matches) return;
    relogio = setInterval(() => {
      if (atual >= 5) { clearInterval(relogio); relogio = null; return; }
      ir(atual + 1, false);
    }, 4200);
  };
}

/* ---------- S12b. Planos: a chave Mensal/Anual troca o preço grande e a linha de baixo ---------- */
function iniciarPlanos() {
  const sec = $('[data-planos]');
  const bts = $$('[data-periodo-bt]', sec);
  const porId = Object.fromEntries(CONFIG.planos.lista.map((p) => [p.id, p]));
  function mostrar(periodo, animar) {
    sec.dataset.periodo = periodo;
    bts.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.periodoBt === periodo)));
    $$('[data-plano]', sec).forEach((card) => {
      const plano = porId[card.dataset.plano];
      if (!plano) return;
      const v = precos(plano);
      const valor = $('[data-valor]', card), alt = $('[data-alt]', card);
      valor.textContent = reais(periodo === 'anual' ? v.anualMes : v.mensal);
      alt.textContent = periodo === 'anual'
        ? `${reais(v.anualAno)} por ano · ${reais(v.mensal)} por mês no mensal`
        : `No anual: ${reais(v.anualMes)} por mês, ${reais(v.anualAno)} por ano`;
      if (animar && !reduz()) { valor.classList.remove('troca-preco'); void valor.offsetWidth; valor.classList.add('troca-preco'); }
    });
  }
  bts.forEach((b) => b.addEventListener('click', () => { mostrar(b.dataset.periodoBt, true); registrar('planos_periodo', { periodo: b.dataset.periodoBt }); }));
  mostrar(CONFIG.planos.chavePadrao, false);
  const det = $('[data-comparar]', sec);
  det.addEventListener('toggle', () => { if (det.open) registrar('planos_comparar'); });
}

/* ---------- S11: os números do bloco laranja sobem de 0 ao entrar na tela (o valor final já está no HTML) ---------- */
function iniciarContadores() {
  const caixa = $('#contexto .destaque');
  const nums = $$('#contexto [data-conta]');
  caixa.__iniciar = () => {
    if (reduz()) return;
    const t0 = performance.now(), dur = 1400;
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      nums.forEach((n) => { n.textContent = Math.round(Number(n.dataset.conta) * e); });
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
}

/* ---------- S1. a pilha se encaixa na tela do produto ---------- */
function iniciarHero() {
  const palco = $('[data-palco]');
  const pilha = $('.pilha', palco);
  const hoje = $('#hoje');
  const notifs = $$('.notificacoes li', palco);
  const btVirada = $('[data-virada]', palco);
  const btVoltar = $('[data-voltar]', palco);
  $$('.pj', palco).forEach((j, i) => j.style.setProperty('--i', i));
  notifs.forEach((n, i) => n.style.setProperty('--i', i));
  let relogios = [];
  let mexeu = false;

  function estado(e, focar) {
    palco.dataset.estado = e;
    const naHoje = e === 'hoje';
    hoje.inert = !naHoje;
    if (naHoje) pilha.setAttribute('aria-hidden', 'true'); else pilha.removeAttribute('aria-hidden');
    const tinhaFoco = document.activeElement === btVirada || document.activeElement === btVoltar;
    btVirada.hidden = naHoje; btVoltar.hidden = !naHoje;
    if (focar || tinhaFoco) (naHoje ? btVoltar : btVirada).focus({ preventScroll: true });
  }
  function pipocar() {
    relogios.forEach(clearTimeout); relogios = [];
    notifs.forEach((n) => n.classList.remove('visto'));
    notifs.forEach((n, i) => relogios.push(setTimeout(() => n.classList.add('visto'), 350 + i * 380)));
    relogios.push(setTimeout(() => { if (!mexeu) estado('hoje', false); }, 350 + notifs.length * 380 + 900));
  }
  btVirada.addEventListener('click', () => {
    mexeu = true; relogios.forEach(clearTimeout);
    notifs.forEach((n) => n.classList.add('visto'));
    estado('hoje', true);
  });
  btVoltar.addEventListener('click', () => {
    mexeu = true; relogios.forEach(clearTimeout);
    estado('pilha', true);
    registrar('voltar_a_pilha');
    if (reduz()) notifs.forEach((n) => n.classList.add('visto'));
    else { notifs.forEach((n) => n.classList.remove('visto')); notifs.forEach((n, i) => relogios.push(setTimeout(() => n.classList.add('visto'), 250 + i * 300))); }
  });
  if (reduz()) { notifs.forEach((n) => n.classList.add('visto')); estado('hoje', false); return; }
  estado('pilha', false);
  pipocar();
}

/* ---------- S4. a carteira, a ficha com a timeline (4 fontes) e o template na lateral da conversa ---------- */
function iniciarDemo() {
  const demo = $('[data-demo]');
  const fichaArea = $('[data-ficha]', demo);
  const outro = $('[data-outro]', demo);
  const ficha = $('[data-rafa]', demo);
  const balao = $('[data-balao]', demo);
  const abreTemplates = $('[data-abre-templates]', demo);
  const templates = $('[data-templates]', demo);
  const template = $('[data-template]', demo);
  const frases = $$('.tl-texto [data-s]', ficha);
  const fontes = $$('.fontes [data-f]', ficha);
  let relogios = [];

  balao.hidden = true; // sem JS a página mostra o balão enviado

  function compor() {
    relogios.forEach(clearTimeout); relogios = [];
    frases.forEach((f) => f.classList.remove('on')); fontes.forEach((f) => f.classList.remove('acesa'));
    if (reduz()) { ficha.classList.add('composta'); fontes.forEach((f) => f.classList.add('acesa')); return; }
    ficha.classList.remove('composta');
    frases.forEach((f, i) => relogios.push(setTimeout(() => {
      f.classList.add('on');
      fontes[Number(f.dataset.s)]?.classList.add('acesa');
      if (i === frases.length - 1) ficha.classList.add('composta');
    }, 350 + i * 620)));
  }
  let tocou = false;
  function escolher(bt, auto) {
    $$('[data-aluno]', demo).forEach((b) => b.setAttribute('aria-current', String(b === bt)));
    if (!auto) registrar('demo_aluno', { aluno: bt.dataset.aluno });
    if (bt.dataset.aluno === 'rafa') {
      outro.hidden = true;
      if (ficha.hidden) { ficha.hidden = false; compor(); }
    } else {
      ficha.hidden = true; outro.hidden = false;
      $('.ficha-nome-outro', outro).textContent = `${$('.nome', bt).textContent} · ${$('.pv-chip', bt).textContent}`;
    }
    if (!auto && matchMedia('(max-width: 760px)').matches) fichaArea.scrollIntoView({ behavior: reduz() ? 'auto' : 'smooth', block: 'start' });
  }
  $$('[data-aluno]', demo).forEach((bt) => bt.addEventListener('click', () => { tocou = true; escolher(bt, false); }));
  escolher($('[data-aluno="rafa"]', demo), true);
  ficha.classList.add('composta'); frases.forEach((f) => f.classList.add('on')); fontes.forEach((f) => f.classList.add('acesa'));
  demo.__iniciar = () => { if (!tocou) compor(); };

  function mostrarTemplates(abrir) {
    templates.hidden = !abrir;
    abreTemplates.setAttribute('aria-expanded', String(abrir));
    if (abrir) template.focus({ preventScroll: true });
  }
  abreTemplates.addEventListener('click', () => { mostrarTemplates(templates.hidden); registrar('demo_templates_rapidos'); });
  template.addEventListener('click', () => {
    mostrarTemplates(false);
    demo.classList.add('templates-usados');
    ficha.classList.add('composta'); frases.forEach((f) => f.classList.add('on')); fontes.forEach((f) => f.classList.add('acesa'));
    balao.hidden = false;
    registrar('demo_template_enviado');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !templates.hidden) { mostrarTemplates(false); abreTemplates.focus(); } });
}

/* ---------- S5. a linha do plano, os avisos e "Renovação de plano" ---------- */
function iniciarRenovacao() {
  const r = $('[data-renova]');
  const trilho = $('[data-trilho]', r);
  const marcos = $$('.rl-marcos li', r);
  const notif = $('[data-notif]', r);
  const notifTexto = $('[data-notif-texto]', r);
  const cont = $('[data-sino-cont]', r);
  const avisos = $$('[data-aviso]');
  let relogio;

  function mostrar(v) {
    marcos.forEach((m) => {
      const i = Number(m.dataset.m);
      m.classList.toggle('futuro', i > v); m.classList.toggle('atual', i === v);
    });
    avisos.forEach((a) => {
      const fora = Number(a.dataset.aviso) > v;
      if (!fora && a.classList.contains('fora')) { a.classList.remove('chega'); void a.offsetWidth; a.classList.add('chega'); }
      a.classList.toggle('fora', fora);
    });
    // "Renovação gerada" avisa da cobrança gerada no financeiro (PlatformSettingsTab.tsx); no exemplo, ela cai no marco de 7 dias
    const n = v >= 6 ? 1 : 0;
    cont.hidden = n === 0; cont.textContent = n;
    if (v >= 6) {
      const surge = notif.classList.contains('vazia');
      notif.classList.remove('vazia');
      notifTexto.textContent = 'Renovação gerada · cobrança criada';
      if (surge) { notif.classList.remove('surge'); void notif.offsetWidth; notif.classList.add('surge'); }
    } else { notif.classList.add('vazia'); notifTexto.textContent = ' '; }
  }
  trilho.addEventListener('input', () => { clearInterval(relogio); mostrar(Number(trilho.value)); });
  trilho.addEventListener('change', () => registrar('demo_linha_do_plano', { posicao: Number(trilho.value) }), { once: true });
  mostrar(8);
  r.__iniciar = () => {
    if (reduz()) return;
    trilho.value = 5; mostrar(5);
    relogio = setInterval(() => {
      const v = Number(trilho.value) + 1;
      trilho.value = v; mostrar(v);
      if (v >= 8) clearInterval(relogio);
    }, 750);
  };

  // o cartão "Renovação de plano": dias de 1 a 90, como etiquetas, com o botão "Adicionar"
  const form = $('[data-dias-form]');
  const campo = $('[data-dias-campo]', form);
  const lista = $('[data-dias-lista]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Math.round(Number(campo.value));
    if (!Number.isFinite(d) || d < 1 || d > 90) { campo.focus(); return; }
    const rotulo = d === 1 ? '1 dia antes' : `${d} dias antes`;
    const existentes = $$('.pv-dia', lista);
    if (existentes.some((li) => li.textContent === rotulo)) { campo.value = ''; return; }
    const li = document.createElement('li');
    li.className = 'pv-dia nova'; li.textContent = rotulo;
    const depois = existentes.find((x) => parseInt(x.textContent, 10) < d);
    lista.insertBefore(li, depois ?? null);
    campo.value = '';
  });
}

/* ---------- S6. WhatsApp: filtros e transcrição ---------- */
function iniciarWhatsApp() {
  const z = $('[data-zap]');
  const conversas = $$('.pv-convs li', z);
  $$('.onda i', z).forEach((i, n) => i.style.setProperty('--n', n));
  $$('[data-filtro]', z).forEach((bt) => bt.addEventListener('click', () => {
    $$('[data-filtro]', z).forEach((b) => b.setAttribute('aria-pressed', String(b === bt)));
    const f = bt.dataset.filtro;
    conversas.forEach((c) => {
      const mostra = f === 'todos' || (f === 'naolidas' && c.hasAttribute('data-naolida')) || (f === 'inativo' && c.hasAttribute('data-inativo')) || c.dataset.tipo === f;
      c.classList.toggle('some', !mostra);
    });
    registrar('demo_whatsapp_filtro', { filtro: f });
  }));
  const audio = $('.audio', z);
  const play = $('[data-audio]', z);
  const palavras = emPalavras($('[data-transcricao]', z), 'p');
  let relogios = [];
  function transcrever() {
    relogios.forEach(clearTimeout); relogios = [];
    if (reduz()) { audio.classList.add('transcrita'); return; }
    audio.classList.remove('transcrita'); audio.classList.add('tocando');
    palavras.forEach((p) => p.style.opacity = '0');
    palavras.forEach((p, i) => relogios.push(setTimeout(() => {
      p.style.opacity = '';
      if (i === palavras.length - 1) { audio.classList.add('transcrita'); audio.classList.remove('tocando'); palavras.forEach((q) => q.style.opacity = ''); }
    }, 300 + i * 55)));
  }
  play.addEventListener('click', () => { registrar('demo_whatsapp_audio'); transcrever(); });
  z.__iniciar = transcrever;
}

/* ---------- S6b. a foto do WhatsApp vai para a evolução: o coach toca na foto, em "Vincular à evolução",
   escolhe um registro (ou cria um em "Novo registro") e toca em "Vincular". Nada é automático no produto. ---------- */
// ImageViewer.tsx e LinkEvolutionModal.tsx (coach-wise 8e431e7). Sem movimento (ou sem JS): três quadros parados (CSS: .parado).
function iniciarFoto() {
  const palco = $('[data-foto-palco]');
  const nome = $('[data-foto-nome]', palco);
  const botoes = $$('[data-passo]', palco);
  const legenda = $('[data-foto-legenda]', palco);
  const img = $('[data-abre-camada]', palco);
  const vincular = $('[data-vincular]', palco);
  const regs = $$('[data-registro]', palco);
  const reg24 = $('[data-registro="24"]', palco);
  const novo = $('[data-novo-registro]', palco);
  const criar = $('[data-criar-registro]', palco);
  const confirma = $('[data-vincular-confirma]', palco);
  const dica = $('[data-modal-dica]', palco);
  const campos = $$('[data-novo-reg] [data-digita]', palco);
  const caminhos = $$('[data-caminho-bt]', palco);
  const dig = digitador();
  const NOMES = ['', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'Alunos', 'Alunos', 'Comparativos'];
  let relogios = [], auto = false;
  const limpar = () => { relogios.forEach(clearTimeout); relogios = []; dig.cancelar(); };
  const depois = (ms, fn) => relogios.push(setTimeout(fn, ms));
  const parado = () => palco.classList.contains('parado');

  function ir(n) {
    palco.dataset.passoAtual = String(n);
    nome.textContent = parado() ? 'CoachWise' : NOMES[n];
    if (n !== 3) { palco.classList.remove('criando'); novo.setAttribute('aria-expanded', 'false'); }
    if (n >= 4) palco.classList.add('vinculado');
    if (n !== 2) camada(false);
    botoes.forEach((b) => {
      const p = Number(b.dataset.passo);
      if (p === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('feito', p < n);
    });
    legenda.textContent = botoes[n - 1].textContent;
  }
  function camada(abrir) {
    palco.classList.toggle('camada', abrir);
    img.setAttribute('aria-expanded', String(abrir));
    vincular.tabIndex = abrir ? 0 : -1;
  }
  function selecionar(r) {
    regs.forEach((x) => x.setAttribute('aria-checked', String(x === r)));
    confirma.disabled = !r;
    const fotos = r && r.dataset.registro === '29' ? 1 : 0;
    dica.textContent = fotos ? 'Adicionar à 1 foto existente' : ' ';
  }
  function marcarCaminho(c) {
    palco.dataset.caminho = c;
    caminhos.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.caminhoBt === c)));
  }
  async function preencherNovo() {
    palco.classList.add('criando');
    novo.setAttribute('aria-expanded', 'true');
    reg24.hidden = true; selecionar(null);
    const ok = await dig.digitar(campos, { ms: 55, pausa: 200 });
    if (ok && auto) depois(700, criarRegistro);
  }
  function criarRegistro() {
    dig.completar(campos);
    palco.classList.remove('criando');
    novo.setAttribute('aria-expanded', 'false');
    reg24.hidden = false;
    reg24.classList.remove('nasce'); void reg24.offsetWidth; reg24.classList.add('nasce');
    selecionar(reg24);
    registrar('demo_foto_registro_criado');
    if (auto) depois(1700, () => vincularFoto(false));
  }
  function abrirJanela(doVisitante) {
    limpar();
    palco.classList.remove('vinculado');
    ir(3);
    selecionar(null);
    reg24.hidden = false;
    if (palco.dataset.caminho === 'criar') { preencherNovo(); }
    else {
      depois(doVisitante ? 700 : 900, () => selecionar(reg24));
      if (auto) depois(doVisitante ? 4200 : 2600, () => vincularFoto(false));
    }
    if (doVisitante) depois(60, () => (palco.dataset.caminho === 'criar' ? criar : confirma).focus({ preventScroll: true }));
  }
  function vincularFoto(doVisitante) {
    limpar();
    if (!regs.some((r) => r.getAttribute('aria-checked') === 'true')) selecionar(reg24);
    palco.classList.add('vinculado');
    if (doVisitante) registrar('demo_foto_vinculada');
    depois(1700, () => { ir(4); depois(2100, () => { ir(5); depois(2300, () => ir(6)); }); });
  }
  function tocar() {
    limpar(); auto = true;
    palco.classList.remove('vinculado', 'criando');
    selecionar(reg24);
    ir(1);
    depois(1000, () => { ir(2); depois(1300, () => camada(true)); depois(4300, () => abrirJanela(false)); });
  }
  function estadoFinal() { limpar(); reg24.hidden = false; selecionar(reg24); palco.classList.add('vinculado'); ir(6); }

  if (reduz()) palco.classList.add('parado');
  estadoFinal();
  if (!parado()) { palco.classList.remove('vinculado'); ir(2); }

  img.addEventListener('click', () => {
    if (parado() || Number(palco.dataset.passoAtual) !== 2) return;
    limpar(); auto = true;
    camada(!palco.classList.contains('camada'));
    if (palco.classList.contains('camada')) vincular.focus({ preventScroll: true });
  });
  vincular.addEventListener('click', () => { registrar('demo_foto_vincular_a_evolucao'); if (!parado()) { auto = true; abrirJanela(true); } });
  regs.forEach((r) => r.addEventListener('click', () => { if (parado()) return; limpar(); selecionar(r); confirma.focus({ preventScroll: true }); }));
  novo.addEventListener('click', () => { if (parado()) return; marcarCaminho('criar'); auto = true; abrirJanela(true); });
  criar.addEventListener('click', () => { if (parado()) return; auto = true; limpar(); criarRegistro(); confirma.focus({ preventScroll: true }); });
  confirma.addEventListener('click', () => { if (parado() || confirma.disabled) return; vincularFoto(true); });
  caminhos.forEach((b) => b.addEventListener('click', () => {
    marcarCaminho(b.dataset.caminhoBt);
    registrar('demo_foto_caminho', { caminho: b.dataset.caminhoBt });
    if (parado()) return;
    auto = true; abrirJanela(true);
  }));
  botoes.forEach((b) => b.addEventListener('click', () => {
    limpar(); auto = false;
    const n = Number(b.dataset.passo);
    palco.classList.toggle('vinculado', n >= 4);
    reg24.hidden = false; selecionar(reg24);
    ir(n);
    if (n === 2) camada(true);
    registrar('demo_foto_passo', { passo: n });
  }));
  $('[data-foto-rever]', palco).addEventListener('click', tocar);
  palco.__iniciar = () => { if (!parado()) tocar(); };
  mqReduz.addEventListener('change', () => { if (reduz()) { palco.classList.add('parado'); estadoFinal(); } });
}

/* ---------- S7. Copiloto: sugestões prontas, a resposta com as fontes, a tarefa e o envio com confirmação ---------- */
function iniciarCopiloto() {
  const c = $('[data-copiloto]');
  const quadro = $('[data-tarefas]');
  const chips = $$('[data-chip]', c);
  const resps = $$('[data-resp]', c);
  resps.forEach((r) => { r.hidden = true; emPalavras($('.pv-ia-texto', r), 'palavra'); });
  let relogios = [];
  chips.forEach((ch) => ch.addEventListener('click', (e) => {
    relogios.forEach(clearTimeout); relogios = [];
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b === ch)));
    const r = resps[Number(ch.dataset.chip)];
    resps.forEach((x) => { x.hidden = x !== r; });
    if (e.isTrusted) registrar('demo_copiloto_pergunta', { pergunta: Number(ch.dataset.chip) });
    const ps = $$('.palavra', r);
    if (reduz()) { r.classList.add('escrita'); return; }
    r.classList.remove('escrita'); ps.forEach((p) => p.classList.remove('on'));
    ps.forEach((p, i) => relogios.push(setTimeout(() => { p.classList.add('on'); if (i === ps.length - 1) r.classList.add('escrita'); }, 500 + i * 30)));
  }));
  c.__iniciar = () => chips[0].click();
  $$('[data-tarefa]', c).forEach((bt) => {
    bt.setAttribute('aria-pressed', 'false');
    bt.addEventListener('click', () => {
      if (bt.getAttribute('aria-pressed') === 'true') return;
      bt.setAttribute('aria-pressed', 'true');
      const texto = bt.textContent.trim().replace(/^Criar tarefa:\s*/, '');
      const card = document.createElement('div');
      card.className = 'kb-card nova';
      card.innerHTML = '<span class="pv-tag">Copiloto IA</span><b></b>';
      $('b', card).textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
      $('.kb-col', quadro).after(card);
      registrar('demo_copiloto_tarefa');
    });
  });
  // envio de questionário pelo WhatsApp: o Copiloto pede confirmação antes (AIChatTab.tsx)
  const envio = $('[data-enviar-quest]', c);
  const resp = envio.closest('[data-resp]');
  envio.addEventListener('click', () => {
    if (resp.classList.contains('enviado')) return;
    const abrir = !resp.classList.contains('confirmando');
    resp.classList.toggle('confirmando', abrir);
    envio.setAttribute('aria-expanded', String(abrir));
    if (abrir) $('[data-confirma-envio]', resp).focus({ preventScroll: true });
  });
  $('[data-confirma-envio]', resp).addEventListener('click', () => {
    resp.classList.remove('confirmando'); resp.classList.add('enviado');
    envio.setAttribute('aria-pressed', 'true');
    registrar('demo_copiloto_questionario_enviado');
  });
  $('[data-cancela-envio]', resp).addEventListener('click', () => {
    resp.classList.remove('confirmando'); envio.setAttribute('aria-expanded', 'false'); envio.focus({ preventScroll: true });
  });
}

/* ---------- S8. o celular do aluno: iniciar, marcar as séries (com o aviso de descanso), concluir ---------- */
function iniciarTreino() {
  const cel = $('[data-celular]');
  const lista = $('.t-lista', cel), exec = $('.t-exec', cel), fim = $('.t-fim', cel);
  const series = $$('[data-serie]', cel);
  const descanso = $('[data-descanso]', cel);
  let segundos = 0, relogio, relogioDescanso;
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const total = () => series.filter((b) => b.getAttribute('aria-pressed') === 'true');
  function atualizar() {
    const feitas = total();
    $('[data-volume]', cel).textContent = feitas.reduce((s, b) => s + Number(b.dataset.serie), 0).toLocaleString('pt-BR');
    $('[data-series]', cel).textContent = feitas.length;
    $('[data-prog]', cel).style.transform = `scaleX(${feitas.length / series.length})`;
  }
  $('[data-iniciar]', cel).addEventListener('click', () => {
    lista.hidden = true; exec.hidden = false; segundos = 0;
    $('[data-duracao]', cel).textContent = mmss(0);
    relogio = setInterval(() => { segundos += 1; $('[data-duracao]', cel).textContent = mmss(segundos); }, 1000);
    registrar('demo_treino_iniciar');
    $('[data-serie]', cel).focus({ preventScroll: true });
  });
  series.forEach((b) => b.addEventListener('click', () => {
    const marcou = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(marcou));
    atualizar();
    // o aviso "Descanso terminado · Hora da próxima série" (no app, depois do tempo de descanso; aqui, encurtado)
    clearTimeout(relogioDescanso); descanso.classList.remove('on');
    if (marcou && total().length < series.length) relogioDescanso = setTimeout(() => { descanso.classList.add('on'); relogioDescanso = setTimeout(() => descanso.classList.remove('on'), 2600); }, 900);
  }));
  $('[data-concluir]', cel).addEventListener('click', () => {
    clearInterval(relogio); clearTimeout(relogioDescanso); descanso.classList.remove('on');
    $('[data-duracao-fim]', cel).textContent = mmss(segundos);
    $('[data-volume-fim]', cel).textContent = $('[data-volume]', cel).textContent;
    $('[data-series-fim]', cel).textContent = total().length;
    $('.pv-recorde', cel).hidden = !series[0].matches('[aria-pressed="true"]'); // o recorde é o da série 1 (50 × 9 contra 50 × 8)
    exec.hidden = true; fim.hidden = false;
    registrar('demo_treino_concluir', { series: total().length });
    $('[data-publicar]', cel).focus({ preventScroll: true });
  });
  $('[data-publicar]', cel).addEventListener('click', (e) => e.currentTarget.setAttribute('aria-pressed', 'true'));
}

/* ---------- S8. comparativo ---------- */
function iniciarComparativo() {
  const c = $('[data-comparativo]');
  const fotos = $$('[data-foto]', c);
  const folha = $('.pdf-folha', c);
  const alvo = $('[data-pdf-fotos]', c);
  function desenhar() {
    const escolhidas = fotos.filter((f) => f.getAttribute('aria-pressed') === 'true');
    alvo.style.setProperty('--n', escolhidas.length === 4 ? 2 : Math.max(1, escolhidas.length));
    alvo.innerHTML = escolhidas.map((f) => `<figure><svg viewBox="0 0 60 120" aria-hidden="true"><use href="#i-pessoa-corpo"/></svg><figcaption>${f.dataset.foto}</figcaption></figure>`).join('');
  }
  fotos.forEach((f) => f.addEventListener('click', () => {
    const ligada = f.getAttribute('aria-pressed') === 'true';
    const n = fotos.filter((x) => x.getAttribute('aria-pressed') === 'true').length;
    if (ligada && n === 1) return;
    if (!ligada && n === 4) return; // de 2 a 4 fotos (PhotoComparisonDialog.tsx)
    f.setAttribute('aria-pressed', String(!ligada));
  }));
  $('[data-criar]', c).addEventListener('click', async () => {
    if (!reduz()) { folha.classList.add('refazendo'); await espera(260); }
    desenhar(); folha.classList.remove('refazendo');
  });
  desenhar();
}

/* ---------- S9b. comunidade do time: o coach cria o desafio no painel, destaca no app, o ranking sobe, o 1º ganha a insígnia ---------- */
function iniciarTime() {
  const palco = $('[data-time-palco]');
  const destacar = $('[data-destacar]', palco);
  const campos = $$('[data-dialogo-desafio] [data-digita]', palco);
  const dig = digitador();
  let relogios = [], mexeu = false;
  const limpar = () => { relogios.forEach(clearTimeout); relogios = []; dig.cancelar(); };
  const depois = (ms, fn) => relogios.push(setTimeout(fn, ms));
  const fase = (n) => { palco.dataset.fase = String(n); };

  function final() { limpar(); dig.completar(campos); destacar.setAttribute('aria-pressed', 'true'); fase(4); }
  async function tocar() {
    limpar();
    destacar.setAttribute('aria-pressed', 'false');
    fase(0);
    depois(700, async () => {
      fase(1);
      const ok = await dig.digitar(campos, { ms: 42, pausa: 160 });
      if (!ok) return;
      depois(600, () => {
        fase(2);
        depois(1500, () => { destacar.setAttribute('aria-pressed', 'true'); fase(3); depois(1600, () => fase(4)); });
      });
    });
  }
  destacar.addEventListener('click', () => {
    mexeu = true; limpar(); dig.completar(campos);
    const ligar = destacar.getAttribute('aria-pressed') !== 'true';
    destacar.setAttribute('aria-pressed', String(ligar));
    registrar('demo_desafio_destacar', { ligado: ligar });
    if (ligar) { fase(3); if (!reduz()) depois(1200, () => fase(4)); else fase(4); } else fase(2);
  });
  $('[data-time-rever]', palco).addEventListener('click', () => { mexeu = true; if (reduz()) final(); else tocar(); });
  final();
  palco.__iniciar = () => { if (!mexeu && !reduz()) tocar(); };
}

/* ---------- S10. a vitrine ---------- */
function iniciarVitrine() {
  const pagina = $('#quadro-pagina');
  pagina.tabIndex = -1;
  $('[data-abre-pagina]').addEventListener('click', (e) => {
    e.preventDefault();
    registrar('demo_busca_consultoria');
    const caixa = pagina.getBoundingClientRect();
    const visivel = caixa.top >= 0 && caixa.bottom <= innerHeight;
    if (!visivel) pagina.scrollIntoView({ behavior: reduz() ? 'auto' : 'smooth', block: 'center' });
    pagina.focus({ preventScroll: true });
    pagina.classList.add('destacado');
    setTimeout(() => pagina.classList.remove('destacado'), 1800);
  });
  const chave = $('[data-mostrar-selo]');
  chave.addEventListener('change', () => { $('[data-selo-time]').classList.toggle('oculto', !chave.checked); registrar('demo_selo_do_time', { ligado: chave.checked }); });
}

/* ---------- S10b. o dono: "Geral" com o Comparativo da equipe, a lista de coaches e o "Ver como" (sem o WhatsApp do coach) ---------- */
function iniciarEquipe() {
  const dono = $('[data-ver-como-palco]');
  const bts = $$('[data-vista-bt]');
  const sub = $('[data-dash-sub]', dono);
  const seletor = $('[data-seletor]', dono);
  let relogios = [], mexeu = false;
  const limpar = () => { relogios.forEach(clearTimeout); relogios = []; };
  function vista(v) {
    dono.dataset.vista = v;
    const vendo = v === 'ana';
    dono.classList.toggle('vendo', vendo);
    sub.textContent = vendo ? 'Ana R.' : (v === 'coaches' ? 'Marca e equipe' : 'Geral');
    seletor.firstChild.textContent = vendo ? 'Ana R.' : 'Geral';
    bts.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vistaBt === (v === 'geral' ? 'geral' : 'coaches'))));
  }
  bts.forEach((b) => b.addEventListener('click', () => { mexeu = true; limpar(); vista(b.dataset.vistaBt); registrar('demo_equipe_vista', { vista: b.dataset.vistaBt }); }));
  $('[data-ver-como]', dono).addEventListener('click', () => { mexeu = true; limpar(); vista('ana'); registrar('demo_equipe_ver_como'); $('[data-voltar-conta]', dono).focus({ preventScroll: true }); });
  $('[data-voltar-conta]', dono).addEventListener('click', () => { mexeu = true; limpar(); vista('coaches'); $('[data-ver-como]', dono).focus({ preventScroll: true }); });
  vista('geral');
  dono.__iniciar = () => {
    if (mexeu || reduz()) return;
    relogios.push(setTimeout(() => { if (!mexeu) vista('coaches'); }, 3200));
    relogios.push(setTimeout(() => { if (!mexeu) vista('ana'); }, 5600));
  };
}

/* ---------- S14. a pilha volta e se fecha ---------- */
function iniciarFechamento() {
  const f = $('[data-fecha]');
  f.__iniciar = () => setTimeout(() => f.classList.add('fechou'), 900);
}

/* ---------- entrada das partes de cada seção e iniciação adiada ---------- */
const iniciadores = [
  ['[data-demo]', iniciarDemo], ['[data-renova]', iniciarRenovacao], ['[data-zap]', iniciarWhatsApp],
  ['[data-foto-palco]', iniciarFoto], ['[data-copiloto]', iniciarCopiloto], ['[data-celular]', iniciarTreino], ['[data-comparativo]', iniciarComparativo],
  ['[data-time-palco]', iniciarTime], ['#quadro-pagina', iniciarVitrine], ['[data-ver-como-palco]', iniciarEquipe],
  ['[data-fecha]', iniciarFechamento], ['#contexto .destaque', iniciarContadores], ['[data-como-palco]', iniciarComo], ['[data-planos]', iniciarPlanos],
];

aplicarConfig();
iniciarTitulo();
iniciarBarra();
iniciarPeFixo();
iniciarVerbos();
iniciarHero();

const obsInicio = new IntersectionObserver((itens) => itens.forEach((it) => {
  if (!it.isIntersecting) return;
  obsInicio.unobserve(it.target);
  it.target.__iniciar?.();
}), { threshold: 0.35 });

for (const [sel, fn] of iniciadores) {
  const el = $(sel); if (!el) continue;
  fn(); // controles prontos desde já; o que toca sozinho (el.__iniciar) espera aparecer na tela
  if (el.__iniciar && getComputedStyle(el).display !== 'none' && !el.closest('[data-so-ja-existe]')?.matches(':is(html.em-breve *)')) obsInicio.observe(el);
}

// cada parte entra na sua vez: rótulo, título, texto, depois a tela do produto
const grupos = [
  ...$$('main > section:not(.topo) .cab').map((c) => [...c.querySelectorAll(':scope > *, :scope > div > *')].filter((e) => !e.matches('div'))),
  ...$$('.bloco-texto, .para-quem-cab, .destaque').map((c) => [...c.children]),
  ...$$('.checks, .acordeao, .compara, .estado-cartoes, .estados-linha, .numeros, .cartoes-par, .reune-linha, .cartoes-cel, .faixa-linha, .pv-time, .pv-vista-bts, .como-passos, .planos-lista, .fecha-texto').map((c) => [...c.children]),
  ...$$('main > section:not(.topo) .bloco-imagem, main > section:not(.topo) .palco-produto, .como-palco, .plano-grade > *, .acao-centro, .acao-esquerda, .fecho, .duvidas-titulo, .ainda-nao, .como-acao, .planos-pe, .comparar, .fecha-pilha, .cc-pe, .pv-abas-legenda, .fatos-linha, .pv-tres-frase').map((e) => [e]),
];
const jaRevela = new Set();
for (const partes of grupos) partes.forEach((p, i) => { if (jaRevela.has(p)) return; jaRevela.add(p); p.classList.add('revela'); p.style.setProperty('--d', Math.min(i, 8) * 80 + 'ms'); });
$$('.revela .revela').forEach((p) => p.classList.remove('revela'));
const marcaVista = $$('.ck-app, .ck-envios, .tr-construtor, .grafico, .composicao-treino, .pv-dono');
$$('.grafico i').forEach((b, n) => b.style.setProperty('--n', n));
const obsEntrada = new IntersectionObserver((itens) => itens.forEach((it) => {
  if (!it.isIntersecting) return;
  it.target.classList.add('visto'); obsEntrada.unobserve(it.target);
}), { threshold: 0, rootMargin: '0px 0px 6% 0px' });
[...$$('.revela'), ...marcaVista].forEach((b) => obsEntrada.observe(b));

// Um salto de rolagem (âncora, tecla End) pode passar por cima de uma seção sem que ela cruze a tela:
// tudo o que já ficou acima do pé da tela entra também, para nunca sobrar conteúdo escondido.
let pendentes = [...$$('.revela'), ...marcaVista];
let agendado = false;
function revelarPassados() {
  agendado = false;
  const limite = innerHeight * 0.92;
  pendentes = pendentes.filter((el) => {
    if (el.classList.contains('visto')) return false;
    if (el.getBoundingClientRect().top < limite) { el.classList.add('visto'); obsEntrada.unobserve(el); return false; }
    return true;
  });
  if (!pendentes.length) removeEventListener('scroll', aoRolar);
}
function aoRolar() { if (!agendado) { agendado = true; requestAnimationFrame(revelarPassados); } }
addEventListener('scroll', aoRolar, { passive: true });
