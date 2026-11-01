// CoachWise, landing page (v6, COA-M025). Configuração: o único lugar para trocar título, planos, teste, funções da loja e destinos.
// Espelha o bloco "Parâmetros" do 18-texto-final-v6.md. Nada aqui envia dado para lugar nenhum: os botões são links normais.

const padrao = {
  // Header (S1). A versão padrão vai no HTML; as outras entram por parâmetro (?titulo=v1 ... ?titulo=v6; ?h=v1 também vale).
  header: {
    versaoPadrao: 'v6',          // v1 | v2 | v3 | v4 | v5 | v6. V6 = "A melhor forma de [organizar / atender / acompanhar / automatizar / escalar] Consultoria Online" (decisão do Sants, 31/10/2026, COA-M026; "escalar" em 01/11/2026, COA-M029)
    cadenciaS: 2.6,              // segundos por palavra (estimado, do 17)
    deslizeS: 0.3,
    pararAposCiclos: 0,          // 0 = loop infinito (pedido do Sants, 01/11/2026, COA-M029; era 2, do 17). Pausa no ponteiro, no foco e com a aba oculta
  },

  // Planos (S12b). PROVISÓRIO 19: inventado por pedido do Sants, 31/10/2026. Sem origem de mercado nem de custo.
  planos: {
    seloProvisorio: 'Valores de exemplo, a definir.', // apagar só quando o Sants fechar os valores
    mostrarValores: true,        // false = cartões sem preço, com a linha "Valores em definição." (?valores=0)
    descontoAnual: 0.20,         // anual por mês = preço mensal × (1 − desconto), arredondado para baixo
    chavePadrao: 'mensal',       // mensal | anual (?plano=anual)
    destaque: 'time',
    etiquetaDestaque: 'Para quem tem equipe',
    lista: [
      { id: 'solo', nome: 'Solo', paraQuem: 'Para o coach que atende sozinho.', precoMensal: 79, alunos: 50, coaches: 1, perguntasCopiloto: 200 },
      { id: 'time', nome: 'Time', paraQuem: 'Para a consultoria com coaches na equipe.', precoMensal: 169, alunos: 150, coaches: 3, perguntasCopiloto: 1000 },
      { id: 'escala', nome: 'Escala', paraQuem: 'Para a consultoria grande, com vários coaches.', precoMensal: 349, alunos: 400, coaches: 10, perguntasCopiloto: 3000 },
    ],
  },

  // Teste (decisão do gerente: o Sants declarou que o teste de 7 dias está na página). PROVISÓRIO 1: Lincoln confirma.
  teste: {
    dias: 7,
    confirmado: true,            // true = "Testar 7 dias grátis"; false = textos neutros, "Criar conta" (?teste=0)
    mostrarPlanoBase: false,     // true só quando o Lincoln e o Sants confirmarem que o teste traz o plano Time (?planoBase=1)
  },

  // Funções vistas no código de 31/10 que dependem da versão da loja (PROVISÓRIOS 2 a 4).
  // As três andam juntas nesta página: ?emBreve=1 (ou qualquer uma em 'em_breve') liga a versão "em breve" pronta no 18.
  loja: {
    comunidadeDoTime: 'existe',  // existe | em_breve
    desafiosDoTime: 'existe',
    visaoDoDono: 'existe',
  },

  // Destinos. Links normais: a landing não cria conta nem envia nada.
  links: {
    entrar: 'https://app.coachwise.com.br/login',
    testar: 'https://app.coachwise.com.br/register',
    usarOrigem: false,           // true só se o Lincoln confirmar que /register aceita ?origem= (PROVISÓRIO 22)
  },

  // PROVISÓRIO (Lincoln): link de compra na página da consultoria. Desligado: não há botão "Contratar plano" na página.
  linkDeCompra: false,

  // Destino dos eventos de clique. null = só guarda em window.cwEventos (nada sai da página).
  destinoDosEventos: null,
};

const VERSOES = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];

// Revisão local, só nesta aba: ?titulo=v1..v6 (ou ?h=), ?teste=0, ?valores=0, ?plano=anual, ?planoBase=1, ?emBreve=1, ?origem=1.
function comUrl(base) {
  const c = structuredClone(base);
  if (typeof location === 'undefined') return c;
  const q = new URLSearchParams(location.search);
  const v = (q.get('titulo') || q.get('h') || '').toLowerCase();
  if (VERSOES.includes(v)) c.header.versaoPadrao = v;
  if (q.has('teste')) c.teste.confirmado = q.get('teste') !== '0';
  if (q.has('valores')) c.planos.mostrarValores = q.get('valores') !== '0';
  if (['mensal', 'anual'].includes(q.get('plano'))) c.planos.chavePadrao = q.get('plano');
  if (q.has('planoBase')) c.teste.mostrarPlanoBase = q.get('planoBase') === '1';
  if (q.get('emBreve') === '1') c.loja = { comunidadeDoTime: 'em_breve', desafiosDoTime: 'em_breve', visaoDoDono: 'em_breve' };
  if (q.has('origem')) c.links.usarOrigem = q.get('origem') === '1';
  if (q.has('linkDeCompra')) c.linkDeCompra = q.get('linkDeCompra') === '1';
  return c;
}

export const PADRAO = Object.freeze(structuredClone(padrao));
export const CONFIG = comUrl(padrao);
export const EM_BREVE = Object.values(CONFIG.loja).some((x) => x === 'em_breve');

// Preços (S12b): anual por mês = mensal × (1 − desconto), para baixo; por ano = o valor sem arredondar × 12, arredondado.
export function precos(plano, desconto = CONFIG.planos.descontoAnual) {
  const anualMesExato = plano.precoMensal * (1 - desconto);
  return { mensal: plano.precoMensal, anualMes: Math.floor(anualMesExato + 1e-9), anualAno: Math.round(anualMesExato * 12) };
}
export const reais = (n) => 'R$ ' + n.toLocaleString('pt-BR');
