// Contas da Central Comercial (29/10/2026). Funções puras — testes em comercial/metricas.test.mjs (node --test).
// Processo LB: chegou → contato → agendou → compareceu → qualificado (na reunião) → fechado | perdido.

export const ORDEM = ['novo', 'contato', 'agendado', 'compareceu', 'negociacao', 'fechado'];
export const ETAPAS = [
  { key: 'novo', label: 'Novo lead', cor: '#c9a24a' },
  { key: 'contato', label: 'Em contato', cor: '#7c93e6' },
  { key: 'agendado', label: 'Agendado', cor: '#2f8fe0' },
  { key: 'compareceu', label: 'Compareceu', cor: '#16a8a0' },
  { key: 'negociacao', label: 'Qualificado / negociação', cor: '#e08a2e' },
  { key: 'fechado', label: 'Fechado', cor: '#16a34a' },
  { key: 'perdido', label: 'Perdido', cor: '#dc2626' },
];
export const ATIVAS = ['novo', 'contato', 'agendado', 'compareceu', 'negociacao'];
// metas de referência (dá pra mudar em configuracoes/comercial.metas)
export const METAS_PADRAO = { contato: 90, agendamento: 30, comparecimento: 70, qualificacao: 60, fechamento: 35, respostaMin: 5 };

export const ms = (v) => {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v.seconds != null) return v.seconds * 1000;
  if (v._seconds != null) return v._seconds * 1000;
  const t = Date.parse(v); return isNaN(t) ? 0 : t;
};
// data em Brasília (AAAA-MM-DD)
export const diaBR = (t) => new Date(ms(t) - 3 * 3600000).toISOString().slice(0, 10);
export const criadoMs = (l) => ms(l?.criadoEm) || (l?.createdDate ? Date.parse(l.createdDate + 'T12:00:00-03:00') : 0);
export const criadoDia = (l) => l?.createdDate || (criadoMs(l) ? diaBR(criadoMs(l)) : '');

export function etapaMax(l) {
  let m = Math.max(ORDEM.indexOf(l?.stage || 'novo'), Number.isInteger(l?.etapaMax) ? l.etapaMax : -1);
  for (const a of l?.atividades || []) if (a.tipo === 'etapa') m = Math.max(m, ORDEM.indexOf(a.para));
  return m;
}
const chegou = (l, k) => etapaMax(l) >= ORDEM.indexOf(k);
export const foiContatado = (l) => chegou(l, 'contato') || (l?.tentativas || 0) > 0 || !!l?.primeiraRespostaEm || (l?.stage === 'perdido' && (l?.atividades || []).some((a) => a.tipo !== 'criado' && a.tipo !== 'importado'));
export const agendou = (l) => chegou(l, 'agendado') || !!l?.agendadoEm || !!l?.reuniaoMarcada;
export const compareceu = (l) => chegou(l, 'compareceu') || !!l?.compareceuEm;
export const qualificado = (l) => l?.qualificado === true || (l?.qualificado !== false && chegou(l, 'negociacao'));
export const naoQualificado = (l) => l?.qualificado === false;
export const fechou = (l) => (l?.stage || '') === 'fechado';
export const perdeu = (l) => (l?.stage || '') === 'perdido';
export const faltou = (l) => !!l?.faltouReuniaoEm;

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
export const dentro = (dia, de, ate) => !!dia && (!de || dia >= de) && (!ate || dia <= ate);

// funil por safra: leads que ENTRARAM no período e até onde chegaram
export function funil(leads, { de, ate, agora = Date.now() } = {}) {
  const base = (leads || []).filter((l) => dentro(criadoDia(l), de, ate));
  const n = {
    leads: base.length,
    contatados: base.filter(foiContatado).length,
    agendados: base.filter(agendou).length,
    compareceram: base.filter(compareceu).length,
    qualificados: base.filter(qualificado).length,
    fechados: base.filter(fechou).length,
    perdidos: base.filter(perdeu).length,
    faltaram: base.filter((l) => faltou(l) && !compareceu(l)).length,
    aguardando: base.filter((l) => aguardandoReuniao(l, agora)).length,
    abertos: base.filter((l) => ATIVAS.includes(l.stage || 'novo')).length,
  };
  const taxas = {
    contato: pct(n.contatados, n.leads),
    agendamento: pct(n.agendados, n.contatados),
    comparecimento: pct(n.compareceram, n.agendados - n.aguardando), // só conta reunião que já devia ter acontecido
    qualificacao: pct(n.qualificados, n.compareceram),
    fechamento: pct(n.fechados, n.qualificados),
    total: pct(n.fechados, n.leads),
    noShow: pct(n.faltaram, n.faltaram + n.compareceram),
  };
  return { ...n, taxas, base };
}

// agendado com reunião ainda por vir (não entra na taxa de comparecimento)
export function aguardandoReuniao(l, agora = Date.now()) {
  if ((l?.stage || 'novo') !== 'agendado') return false;
  const ini = ms(l?.reuniaoMarcada?.inicio);
  if (ini) return ini > agora - 2 * 3600000;
  return !!l?.agendadoEm && l.agendadoEm >= diaBR(agora - 3 * 86400000); // marcou pelo link da agenda nos últimos 3 dias
}
// passos do funil com a queda de cada um (o maior buraco = gargalo)
export function passos(f, metas = METAS_PADRAO) {
  const lista = [
    { k: 'contato', rot: 'Chegou → contato', de: f.leads, para: f.contatados, taxa: f.taxas.contato, meta: metas.contato, quem: 'SDR' },
    { k: 'agendamento', rot: 'Contato → agendou', de: f.contatados, para: f.agendados, taxa: f.taxas.agendamento, meta: metas.agendamento, quem: 'SDR' },
    { k: 'comparecimento', rot: 'Agendou → compareceu', de: f.agendados - (f.aguardando || 0), para: f.compareceram, taxa: f.taxas.comparecimento, meta: metas.comparecimento, quem: 'SDR (confirmação)' },
    { k: 'qualificacao', rot: 'Compareceu → qualificado', de: f.compareceram, para: f.qualificados, taxa: f.taxas.qualificacao, meta: metas.qualificacao, quem: 'Marketing / SDR (perfil do lead)' },
    { k: 'fechamento', rot: 'Qualificado → fechou', de: f.qualificados, para: f.fechados, taxa: f.taxas.fechamento, meta: metas.fechamento, quem: 'Vendedor' },
  ];
  for (const p of lista) { p.perdidos = Math.max(0, p.de - p.para); p.abaixo = p.taxa != null && p.taxa < p.meta; p.gap = p.taxa == null ? 0 : Math.max(0, p.meta - p.taxa); }
  const comBase = lista.filter((p) => p.de >= 3);
  const pior = comBase.sort((a, b) => b.gap / (b.meta || 1) - a.gap / (a.meta || 1))[0];
  if (pior && pior.gap > 0) pior.gargalo = true;
  return lista;
}

// o que ACONTECEU no período (por data do evento, não pela entrada do lead)
export function movimento(leads, { de, ate } = {}) {
  const ev = { leads: 0, contatos: 0, agendamentos: 0, reunioes: 0, faltas: 0, fechamentos: 0, perdas: 0 };
  for (const l of leads || []) {
    if (dentro(criadoDia(l), de, ate)) ev.leads++;
    for (const a of l.atividades || []) {
      const d = a.quando ? diaBR(a.quando) : '';
      if (!dentro(d, de, ate)) continue;
      if (['nao_atendeu', 'whatsapp', 'respondeu', 'depois'].includes(a.tipo)) ev.contatos++;
      if (a.tipo === 'etapa' && a.para === 'perdido') ev.perdas++;
    }
    if (dentro(l.agendadoEm, de, ate) || (l.reuniaoMarcada?.em && dentro(diaBR(l.reuniaoMarcada.em), de, ate) && !l.agendadoEm)) ev.agendamentos++;
    if (dentro(l.compareceuEm, de, ate)) ev.reunioes++;
    if (l.faltouReuniaoEm && dentro(diaBR(l.faltouReuniaoEm), de, ate)) ev.faltas++;
    if (dentro(l.fechadoEm, de, ate)) ev.fechamentos++;
  }
  return ev;
}

// tempo até o 1º contato (minutos) — mediana e % em até N min
export function tempoResposta(leads, { de, ate, limiteMin = 5 } = {}) {
  const t = [];
  for (const l of leads || []) {
    if (!dentro(criadoDia(l), de, ate)) continue;
    const c = criadoMs(l), r = ms(l.primeiraRespostaEm);
    if (c && r && r >= c) t.push((r - c) / 60000);
  }
  t.sort((a, b) => a - b);
  const med = t.length ? t[Math.floor(t.length / 2)] : null;
  return { amostra: t.length, medianaMin: med == null ? null : Math.round(med), ateLimite: pct(t.filter((x) => x <= limiteMin).length, t.length) };
}
export function fmtMin(m) {
  if (m == null) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 1440) return `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
  return `${Math.round(m / 1440)} d`;
}

// por pessoa: dono do lead (vendedor/SDR) e quem marcou a reunião
export function porPessoa(leads, pessoas, { de, ate } = {}) {
  return (pessoas || []).map((p) => {
    const em = p.email.toLowerCase(), nome = (p.nome || '').toLowerCase();
    const meus = (leads || []).filter((l) => String(l.donoEmail || '').toLowerCase() === em);
    const f = funil(meus, { de, ate });
    const marcou = (leads || []).filter((l) => (dentro(l.agendadoEm, de, ate) && String(l.agendadoPor || '').toLowerCase().startsWith(nome)) || (l.reuniaoMarcada?.em && dentro(diaBR(l.reuniaoMarcada.em), de, ate) && String(l.reuniaoMarcada.por || '').toLowerCase().startsWith(nome)));
    const reunioesCom = (leads || []).filter((l) => String(l.reuniaoMarcada?.com || '').toLowerCase() === em);
    let contatos = 0;
    for (const l of leads || []) for (const a of l.atividades || []) if (['nao_atendeu', 'whatsapp', 'respondeu', 'depois'].includes(a.tipo) && dentro(diaBR(a.quando), de, ate) && String(a.por || '').toLowerCase().startsWith(nome)) contatos++;
    const fechadosPeriodo = (leads || []).filter((l) => fechou(l) && dentro(l.fechadoEm, de, ate) && (String(l.donoEmail || '').toLowerCase() === em || String(l.fechadoPor || '').toLowerCase().startsWith(nome))).length;
    const abertos = meus.filter((l) => ATIVAS.includes(l.stage || 'novo')).length;
    const parados = meus.filter((l) => ATIVAS.includes(l.stage || 'novo') && Date.now() - ultimoMovimento(l) > 7 * 86400000).length;
    const atrasados = meus.filter((l) => ATIVAS.includes(l.stage || 'novo') && l.proximoContato && l.proximoContato < diaBR(Date.now())).length;
    const comp = reunioesCom.filter(compareceu).length, ag = reunioesCom.filter((l) => ms(l.reuniaoMarcada?.inicio) < Date.now()).length;
    return { ...p, leads: f.leads, contatados: f.contatados, agendados: f.agendados, fechados: fechadosPeriodo, contatos, marcou: marcou.length, abertos, parados, atrasados, reunioes: ag, showRate: pct(comp, ag), resposta: tempoResposta(meus, { de, ate }) };
  });
}
export function ultimoMovimento(l) {
  const at = (l?.atividades || []).map((a) => ms(a.quando)).filter(Boolean);
  return Math.max(criadoMs(l), ...at, 0);
}

// por origem (campanha do anúncio, Typebot, indicação…)
export function porOrigem(leads, { de, ate } = {}, nomeCampanha = {}) {
  const g = new Map();
  for (const l of leads || []) {
    if (!dentro(criadoDia(l), de, ate)) continue;
    const camp = l.anuncio?.campanha ? (nomeCampanha[l.anuncio.campanha] || `Campanha ${l.anuncio.campanha}`) : null;
    const chave = camp || l.origem || 'Sem origem';
    const x = g.get(chave) || { origem: chave, anuncio: !!camp, leads: 0, agendados: 0, compareceram: 0, qualificados: 0, fechados: 0 };
    x.leads++; if (agendou(l)) x.agendados++; if (compareceu(l)) x.compareceram++; if (qualificado(l)) x.qualificados++; if (fechou(l)) x.fechados++;
    g.set(chave, x);
  }
  return [...g.values()].map((x) => ({ ...x, taxaAgendamento: pct(x.agendados, x.leads), taxaFechamento: pct(x.fechados, x.leads) })).sort((a, b) => b.leads - a.leads);
}

export function motivosPerda(leads, { de, ate } = {}) {
  const g = new Map();
  for (const l of leads || []) {
    if (!perdeu(l)) continue;
    const ult = [...(l.atividades || [])].reverse().find((a) => a.tipo === 'etapa' && a.para === 'perdido');
    const d = ult ? diaBR(ult.quando) : criadoDia(l);
    if (!dentro(d, de, ate)) continue;
    const m = String(l.motivoPerda || 'Sem motivo').trim() || 'Sem motivo';
    g.set(m, (g.get(m) || 0) + 1);
  }
  return [...g.entries()].map(([motivo, n]) => ({ motivo, n })).sort((a, b) => b.n - a.n);
}

// leads que chegaram por dia da semana × hora (Brasília)
export function mapaCalor(leads, { de, ate } = {}) {
  const m = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const l of leads || []) {
    const t = criadoMs(l); if (!t || !dentro(criadoDia(l), de, ate) || !l.criadoEm) continue;
    const d = new Date(t - 3 * 3600000); m[d.getUTCDay()][d.getUTCHours()]++;
  }
  return m;
}

export function serieDiaria(leads, { de, ate } = {}) {
  const dias = [];
  for (let t = Date.parse(de + 'T12:00:00Z'); t <= Date.parse(ate + 'T12:00:00Z'); t += 86400000) dias.push(new Date(t).toISOString().slice(0, 10));
  const idx = Object.fromEntries(dias.map((d, i) => [d, i]));
  const s = { dias, leads: dias.map(() => 0), agendamentos: dias.map(() => 0), fechamentos: dias.map(() => 0) };
  for (const l of leads || []) {
    const c = criadoDia(l); if (c in idx) s.leads[idx[c]]++;
    const a = l.agendadoEm; if (a in idx) s.agendamentos[idx[a]]++;
    const f = l.fechadoEm; if (fechou(l) && f in idx) s.fechamentos[idx[f]]++;
  }
  return s;
}

// WhatsApp: status de cada conversa e números do período
export function statusConversa(c) {
  const msgs = c?.mensagens || [];
  const ultLead = [...msgs].reverse().find((m) => m.de === 'lead');
  const ult = msgs[msgs.length - 1];
  if (c?.resolvidaEm && (!ultLead || ms(c.resolvidaEm) >= ms(ultLead.em))) return { status: 'resolvida', desde: ms(c.resolvidaEm) };
  if (ult && ult.de === 'lead') return { status: 'responder', desde: ms(ultLead.em) };
  return { status: 'aguardando', desde: ms(ult?.em) };
}
export function conversasStats(conversas, { de, ate } = {}) {
  let msgsRecebidas = 0, msgsEnviadas = 0, novas = 0; const tempos = [];
  const porPessoa = {};
  for (const c of conversas || []) {
    const msgs = c.mensagens || [];
    if (msgs[0] && dentro(diaBR(msgs[0].em), de, ate)) novas++;
    let esperando = null;
    for (const m of msgs) {
      const d = diaBR(m.em); const no = dentro(d, de, ate);
      if (m.de === 'lead') { if (no) msgsRecebidas++; if (esperando == null) esperando = ms(m.em); }
      else {
        if (no) { msgsEnviadas++; if (m.de === 'equipe' && m.por) porPessoa[m.por] = (porPessoa[m.por] || 0) + 1; }
        if (esperando != null && m.de === 'equipe' && no) tempos.push((ms(m.em) - esperando) / 60000);
        esperando = null;
      }
    }
  }
  tempos.sort((a, b) => a - b);
  const st = (conversas || []).map(statusConversa);
  return { novas, msgsRecebidas, msgsEnviadas, esperando: st.filter((s) => s.status === 'responder').length, abertas: st.filter((s) => s.status !== 'resolvida').length, respostaMedianaMin: tempos.length ? Math.round(tempos[Math.floor(tempos.length / 2)]) : null, porPessoa };
}

// leitura dos números em português: o que está fora da meta e o que fazer
export function diagnostico(f, ps, resp, metas = METAS_PADRAO) {
  const out = [];
  if (f.leads < 5) return [{ nivel: 'info', texto: 'Poucos leads no período pra tirar conclusão — aumente o período.' }];
  for (const p of ps) {
    if (!p.abaixo || p.de < 3) continue;
    const dica = {
      contato: `${p.perdidos} lead(s) nunca foram chamados. Lead frio esfria em minutos: a SDR precisa zerar a fila de "novo" todo dia.`,
      agendamento: `De cada 10 chamados, só ${Math.round((p.taxa || 0) / 10)} marcam. Revisar a abordagem da SDR (script, oferta da sessão, link da agenda) e a qualidade do lead que o anúncio traz.`,
      comparecimento: `${p.perdidos} agendado(s) não vieram. Confirmar no dia anterior e 1h antes pelo WhatsApp e reduzir o prazo entre marcar e a reunião.`,
      qualificacao: `Muita reunião com quem não tem perfil. O problema está antes: segmentação do anúncio e perguntas da SDR antes de marcar.`,
      fechamento: `Lead qualificado não está virando contrato. Revisar a apresentação, objeções (ver as reuniões gravadas) e o follow-up de quem ficou em negociação.`,
    }[p.k];
    out.push({ nivel: p.gargalo ? 'alto' : 'medio', texto: `${p.rot}: ${String(p.taxa).replace('.', ',')}% (meta ${p.meta}%). ${dica}`, gargalo: !!p.gargalo, quem: p.quem });
  }
  if (resp?.medianaMin != null && resp.medianaMin > metas.respostaMin) out.push({ nivel: resp.medianaMin > 60 ? 'alto' : 'medio', texto: `1º contato leva ${fmtMin(resp.medianaMin)} (mediana). Meta: até ${metas.respostaMin} min — quem responde primeiro leva o lead.`, quem: 'SDR' });
  if (!out.length) out.push({ nivel: 'ok', texto: 'Todas as etapas dentro da meta no período. 👏' });
  return out.sort((a, b) => (b.gargalo ? 1 : 0) - (a.gargalo ? 1 : 0));
}

// próximo contato da cadência (D+1, D+3, D+7 e repescagem em 30 dias) — igual ao CRM do sistema
const CADENCIA = [1, 3, 7], REPESCAGEM = 30;
export function somaDias(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function proximaCadencia(atividades) {
  const lista = atividades || []; let ini = 0;
  lista.forEach((a, i) => { if (a.tipo === 'respondeu' || a.tipo === 'depois') ini = i + 1; });
  const tent = lista.slice(ini).filter((a) => a.tipo === 'nao_atendeu' || a.tipo === 'whatsapp');
  const n = tent.length; if (!n) return { data: null, etapa: null };
  const prim = diaBR(tent[0].quando), ult = diaBR(tent[n - 1].quando);
  if (n <= CADENCIA.length) return { data: somaDias(prim, CADENCIA[n - 1]), etapa: `D+${CADENCIA[n - 1]}` };
  if (n === CADENCIA.length + 1) return { data: somaDias(ult, REPESCAGEM), etapa: 'repescagem' };
  return { data: '', etapa: 'fim' };
}
