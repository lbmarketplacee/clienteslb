import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './metricas.js';

const T = Date.parse('2026-10-20T15:00:00Z');
const at = (para, d) => ({ tipo: 'etapa', para, quando: Date.parse(d + 'T15:00:00Z') });
const leads = [
  { id: 'a', createdDate: '2026-10-20', stage: 'novo' },
  { id: 'b', createdDate: '2026-10-20', stage: 'contato', tentativas: 2 },
  { id: 'c', createdDate: '2026-10-21', stage: 'agendado', agendadoEm: '2026-10-21', atividades: [at('agendado', '2026-10-21')] },
  { id: 'd', createdDate: '2026-10-21', stage: 'negociacao', compareceuEm: '2026-10-23', atividades: [at('agendado', '2026-10-21'), at('compareceu', '2026-10-23'), at('negociacao', '2026-10-23')] },
  { id: 'e', createdDate: '2026-10-22', stage: 'fechado', fechadoEm: '2026-10-25', atividades: [at('compareceu', '2026-10-24'), at('fechado', '2026-10-25')] },
  { id: 'f', createdDate: '2026-10-22', stage: 'perdido', qualificado: false, motivoPerda: 'Não qualificado', atividades: [at('compareceu', '2026-10-24'), at('perdido', '2026-10-24')] },
  { id: 'g', createdDate: '2026-10-22', stage: 'contato', faltouReuniaoEm: Date.parse('2026-10-24T15:00:00Z'), atividades: [at('agendado', '2026-10-22'), at('contato', '2026-10-24')] },
  { id: 'z', createdDate: '2026-09-01', stage: 'fechado', fechadoEm: '2026-10-21' },
];

test('funil por safra conta até onde cada lead chegou (etapa máxima, não a atual)', () => {
  const f = M.funil(leads, { de: '2026-10-20', ate: '2026-10-31' });
  assert.equal(f.leads, 7);
  assert.equal(f.contatados, 6);
  assert.equal(f.agendados, 5); // c d e f g (e/f pularam direto pra compareceu = agendaram)
  assert.equal(f.compareceram, 3);
  assert.equal(f.qualificados, 2); // d e (f marcado não qualificado)
  assert.equal(f.fechados, 1);
  assert.equal(f.faltaram, 1);
  assert.equal(f.taxas.comparecimento, 60);
  assert.equal(f.taxas.noShow, 25);
});

test('passos apontam o gargalo e o diagnóstico fala o que fazer', () => {
  const f = M.funil(leads, { de: '2026-10-20', ate: '2026-10-31' });
  const ps = M.passos(f);
  assert.equal(ps.filter((p) => p.gargalo).length, 1);
  const d = M.diagnostico(f, ps, { medianaMin: 90 });
  assert.ok(d.some((x) => /1º contato leva 1h30/.test(x.texto)));
  assert.ok(d[0].gargalo);
});

test('movimento conta pela data do evento (fechamento de lead antigo entra)', () => {
  const m = M.movimento(leads, { de: '2026-10-20', ate: '2026-10-31' });
  assert.equal(m.fechamentos, 2);
  assert.equal(m.faltas, 1);
  assert.equal(m.reunioes, 1);
});

test('motivos de perda e origem', () => {
  assert.deepEqual(M.motivosPerda(leads, { de: '2026-10-01', ate: '2026-10-31' }), [{ motivo: 'Não qualificado', n: 1 }]);
  const o = M.porOrigem([{ createdDate: '2026-10-20', anuncio: { campanha: '99' }, stage: 'fechado' }, { createdDate: '2026-10-20', origem: 'Indicação' }], { de: '2026-10-01', ate: '2026-10-31' }, { 99: 'Feirinha' });
  assert.equal(o.find((x) => x.origem === 'Feirinha').fechados, 1);
});

test('tempo de resposta, conversas e cadência', () => {
  const c = Date.parse('2026-10-20T12:00:00Z');
  const r = M.tempoResposta([{ criadoEm: c, primeiraRespostaEm: c + 3 * 60000 }, { criadoEm: c, primeiraRespostaEm: c + 20 * 60000 }], { de: '2026-10-01', ate: '2026-10-31' });
  assert.equal(r.ateLimite, 50);
  const conv = { mensagens: [{ de: 'lead', em: '2026-10-20T12:00:00Z' }, { de: 'equipe', por: 'Isa', em: '2026-10-20T12:10:00Z' }, { de: 'lead', em: '2026-10-20T13:00:00Z' }] };
  const s = M.conversasStats([conv], { de: '2026-10-20', ate: '2026-10-20' });
  assert.equal(s.respostaMedianaMin, 10);
  assert.equal(s.esperando, 1);
  assert.equal(s.porPessoa.Isa, 1);
  assert.equal(M.proximaCadencia([{ tipo: 'nao_atendeu', quando: T }]).data, '2026-10-21');
  assert.equal(M.fmtMin(1500), '1 d');
});
