// Registro de eventos: um stub. Guarda em window.cwEventos e avisa por um CustomEvent 'cw:evento'.
// Não envia para serviço nenhum enquanto CONFIG.destinoDosEventos for null.
import { CONFIG } from './config.js';

export function registrar(nome, dados = {}) {
  const evento = { nome, dados, em: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    (window.cwEventos ||= []).push(evento);
    document.dispatchEvent(new CustomEvent('cw:evento', { detail: evento }));
  }
  if (typeof CONFIG.destinoDosEventos === 'function') {
    try { CONFIG.destinoDosEventos(evento); } catch { /* medição nunca quebra a página */ }
  }
  return evento;
}
