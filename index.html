// Diretor Criativo LB — gera o funil de fotos comerciais (até 8 imagens) + título + descrição.
// Usa a Responses API da OpenAI (manda a FOTO REAL junto com a instrução de cada cena), pra manter
// fidelidade de verdade ao produto — diferente de gerar do zero só com texto.
// Gera as fotos UMA DE CADA VEZ (sequencial), não em paralelo, pra respeitar o limite de rate da conta.
// Variável de ambiente necessária na Vercel: OPENAI_API_KEY

const NOMES_MK = { shopee: 'Shopee', ml: 'Mercado Livre', tiktok: 'TikTok Shop' };
const TAMANHO_IMAGEM = '1024x1536'; // único tamanho retrato válido na API
const QUALIDADE_IMAGEM = 'medium';

// Mesma regra exata usada no "Gerar Anúncio com IA" — mantém os 2 lugares sempre consistentes
const REGRAS_TITULO = {
  shopee: `REGRAS DO TÍTULO (Shopee) - siga TODAS com rigor:
1. CAPITALIZAÇÃO: use Iniciais Maiúsculas em Cada Palavra Importante (substantivos, adjetivos). Ex: "Vestido Feminino Longo Estampado Manga Bufante". Nunca escreva o título todo em minúsculas.
2. ESTRATÉGIA DE SEO (o mais importante): NÃO copie a descrição do vendedor. Você é um especialista - PENSE em como o cliente busca na Shopee e ENRIQUEÇA o título com palavras-chave de busca reais que o vendedor não escreveu. Adicione sinônimos e termos que ampliam o alcance (ex: "Roupa Feminina", "Moda", "Elegante", "Casual", conforme o produto).
3. Aproveite ao máximo os 100 caracteres - busque usar entre 70 e 100 caracteres.
4. Comece pelo tipo de produto + característica principal, depois vá agregando palavras-chave estratégicas.
5. PROIBIDO: cores (amarelo, rosa, lilás, azul...) e tamanhos (P, M, G, GG). NUNCA inclua cor nem tamanho.
6. Sem emojis, sem CAIXA ALTA total, sem símbolos.`,
  ml: `REGRAS DO TÍTULO (Mercado Livre) - siga TODAS com rigor:
1. CAPITALIZAÇÃO: use Iniciais Maiúsculas nas Palavras Importantes. Nunca tudo minúsculo.
2. ESTRATÉGIA: não copie a descrição do vendedor. Use as palavras-chave mais fortes e diretas que o cliente busca.
3. Máximo 60 caracteres.
4. Comece pelo termo principal que o cliente busca, seguido das características mais relevantes.
5. Sem emojis, sem CAIXA ALTA total, sem símbolos.`,
  tiktok: `REGRAS DO TÍTULO (TikTok Shop) - siga TODAS com rigor:
1. TAMANHO OBRIGATÓRIO: entre 120 e 140 caracteres.
2. CAPITALIZAÇÃO: use Iniciais Maiúsculas em Cada Palavra Importante.
3. ESTRATÉGIA DE SEO: rico em informação — tipo de produto, material, uso, público-alvo, características técnicas, numa frase corrida.
4. Pode incluir cor e tamanho quando fizer sentido (diferente da Shopee).
5. Sem emojis, sem CAIXA ALTA total, sem símbolos.`
};

const SEQUENCIA_PADRAO = [
  { ordem: 1, tipo: 'Capa / Hero', foco: 'O produto real inteiro, fundo de estúdio limpo, iluminação comercial, sem alterar nenhum detalhe do produto.' },
  { ordem: 2, tipo: 'Benefício principal', foco: 'Mesmo produto real, novo cenário/composição que destaca o maior diferencial dele.' },
  { ordem: 3, tipo: 'Detalhes técnicos ou funcionais', foco: 'Close-up real no produto mostrando uma característica técnica/funcional importante, sem alterar forma, material ou cor.' },
  { ordem: 4, tipo: 'Qualidade / acabamento', foco: 'Close-up real no material/acabamento/superfície do produto, preservando exatamente a textura e cor originais.' },
  { ordem: 5, tipo: 'Uso real / lifestyle', foco: 'O mesmo produto real em um contexto de uso, sem alterar o produto em si, só o cenário ao redor.' },
  { ordem: 6, tipo: 'Variações / versatilidade', foco: 'Outro ângulo útil do mesmo produto real, sem inventar variação que não existe nas fotos originais.' },
  { ordem: 7, tipo: 'Detalhes / textura', foco: 'Outro close-up real em detalhe não coberto ainda, preservando fidelidade total ao produto.' },
  { ordem: 8, tipo: 'Guia de Tamanhos / Medidas', obrigatoria: true, foco: 'GUIA DE TAMANHOS no formato de infográfico comercial de e-commerce: o produto real com linhas/setas indicando os pontos de medida (largura, altura, comprimento — conforme o tipo de produto), fundo limpo, layout organizado e claro, no estilo de tabela de medidas usada em anúncios de marketplace. NÃO invente números de medida — deixe os pontos de medição indicados visualmente, sem valores numéricos inventados.' }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const chave = process.env.OPENAI_API_KEY;
  if (!chave) return res.status(500).json({ erro: 'Chave da OpenAI não configurada.' });

  try {
    const { produto, marketplace, imagens, quantidadeFotos } = req.body || {};
    const qualidadeFinal = 'low'; // só existe essa opção agora, mais barato
    const listaImagensEnviadas = Array.isArray(imagens) ? imagens.slice(0, 5) : [];
    if (!listaImagensEnviadas.length) return res.status(400).json({ erro: 'Envie pelo menos 1 foto real do produto.' });
    if (!produto || !produto.trim()) return res.status(400).json({ erro: 'Descreva o produto.' });

    const mk = NOMES_MK[marketplace] ? marketplace : 'ml';
    const nomeMk = NOMES_MK[mk];
    const qtdFotos = Math.min(Math.max(Number(quantidadeFotos) || 8, 1), 8);
    const regraTitulo = REGRAS_TITULO[mk];

    const analisePrompt = `Você é um Diretor Criativo de e-commerce especializado em ${nomeMk}. Sua prioridade MÁXIMA é: fidelidade ao produto real > estética. Isso vale pra QUALQUER tipo de produto (roupa, eletrônico, acessório, utensílio, brinquedo, o que for) — não é específico de roupa. As fotos enviadas são a REFERÊNCIA REAL do produto — cada cena gerada depois vai usar essas fotos como base, preservando forma, cor, proporção, material, textura, acabamento e todos os detalhes visuais exatos. NUNCA planeje uma cena que exija inventar característica não visível nas fotos.

${listaImagensEnviadas.length > 1 ? `Foram enviadas ${listaImagensEnviadas.length} fotos — a PRIMEIRA é a cor/versão principal do produto (será usada na maioria das cenas, pra manter consistência visual). As demais fotos são variações de cor/versão do MESMO produto, que só aparecem juntas na cena "Variações / versatilidade".` : 'Foi enviada 1 foto do produto — a referência principal de todas as cenas.'}

Descrição do produto: "${produto}"

Monte uma estratégia com até ${qtdFotos} cenas, baseada NESTA ORDEM EXATA (não reordene). A cena 1 (Capa/Hero) e a cena 8 (Guia de Tamanhos) são OBRIGATÓRIAS e sempre precisam estar presentes, não importa quantas cenas no total forem pedidas. Se for usar menos que ${SEQUENCIA_PADRAO.length}, corte cenas do MEIO (2 a 7), nunca a 1 nem a 8:
${SEQUENCIA_PADRAO.map(s => `${s.ordem}. ${s.tipo}: ${s.foco}`).join('\n')}

MUITO IMPORTANTE: o array "cenas" da sua resposta precisa vir NA MESMA ORDEM numérica acima (1, 2, 3...) — nunca reorganize por importância ou qualquer outro critério.

Pra cada cena, escreva uma instrução curta e clara (em português) descrevendo o cenário/composição/enquadramento — SEM repetir a descrição do produto (isso já vem da foto real), só o que muda ao redor ou o enquadramento.

${regraTitulo}

REGRAS DA DESCRIÇÃO:
- Texto persuasivo e organizado em pelo menos 3 a 4 parágrafos completos, cobrindo: benefício principal, características/materiais, usos/aplicações, e diferenciais.
- Mínimo de 400 caracteres — não entregue uma descrição curta ou resumida.
- Sem inventar composição, medidas ou características não confirmadas.

Responda SOMENTE com um JSON válido no formato:
{"titulo":"...","descricao":"...","cenas":[{"tipo":"...","instrucao":"..."}]}`;

    const rAnalise = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um Diretor Criativo de e-commerce. Responda somente com JSON válido.' },
          { role: 'user', content: [
            { type: 'text', text: analisePrompt },
            ...listaImagensEnviadas.map(img => ({ type: 'image_url', image_url: { url: img } }))
          ]}
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' }
      })
    });

    if (!rAnalise.ok) {
      const err = await rAnalise.text();
      return res.status(500).json({ erro: 'Erro na análise da IA: ' + err.slice(0, 200) });
    }

    const dataAnalise = await rAnalise.json();
    const conteudo = dataAnalise.choices?.[0]?.message?.content || '{}';
    let estrategia;
    try { estrategia = JSON.parse(conteudo); } catch { return res.status(500).json({ erro: 'Resposta inválida da IA na análise.' }); }

    // A IA nem sempre acerta o tamanho do título só por instrução — confere de verdade em código,
    // e se estiver fora da faixa, pede pra ela corrigir (mesma lógica do "Gerar Anúncio com IA").
    const FAIXA_TITULO = { shopee: [70, 100], ml: [1, 60], tiktok: [120, 140] };
    const [minTitulo, maxTitulo] = FAIXA_TITULO[mk] || [1, 999];
    let titulo = estrategia.titulo || '';

    for (let tentativa = 0; tentativa < 3 && (titulo.length < minTitulo || titulo.length > maxTitulo); tentativa++) {
      const faltam = minTitulo - titulo.length;
      const pedidoCorrecao = titulo.length < minTitulo
        ? `O título abaixo tem exatamente ${titulo.length} caracteres, mas PRECISA ter no mínimo ${minTitulo} e no máximo ${maxTitulo} caracteres — faltam pelo menos ${faltam} caracteres. Reescreva-o mais longo, adicionando MAIS palavras-chave relevantes de busca, mantendo a mesma capitalização e estilo. Título atual: "${titulo}". Responda SOMENTE com um JSON no formato {"titulo":"..."}`
        : `O título abaixo tem ${titulo.length} caracteres, mas PRECISA ter no máximo ${maxTitulo} caracteres. Reescreva-o mais curto, removendo o que for menos relevante. Título atual: "${titulo}". Responda SOMENTE com um JSON no formato {"titulo":"..."}`;
      try {
        const r2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `Você é um especialista em títulos de anúncios para ${nomeMk}. Responda somente com JSON válido.` },
              { role: 'user', content: pedidoCorrecao }
            ],
            temperature: 0.6,
            response_format: { type: 'json_object' }
          })
        });
        if (r2.ok) {
          const data2 = await r2.json();
          const conteudo2 = data2.choices?.[0]?.message?.content || '{}';
          const parsed2 = JSON.parse(conteudo2);
          if (parsed2.titulo) titulo = parsed2.titulo;
        } else { break; }
      } catch (e) { break; }
    }
    estrategia.titulo = titulo;

    let listaCenas = (estrategia.cenas || []).slice(0, qtdFotos);
    // Garantia extra: se a IA não incluiu o Guia de Tamanhos (obrigatório), força ele como última cena
    const cenaGuiaTamanhos = SEQUENCIA_PADRAO.find(s => s.obrigatoria);
    const jaTemGuia = listaCenas.some(c => /guia de tamanho|medidas/i.test(c.tipo || ''));
    if (cenaGuiaTamanhos && !jaTemGuia) {
      if (listaCenas.length >= qtdFotos && listaCenas.length > 1) listaCenas = listaCenas.slice(0, -1); // abre espaço, sem passar do limite pedido
      listaCenas.push({ tipo: cenaGuiaTamanhos.tipo, instrucao: cenaGuiaTamanhos.foco });
    }
    if (!listaCenas.length) return res.status(500).json({ erro: 'A IA não conseguiu montar a estratégia de cenas.' });

    const fotoprincipal = listaImagensEnviadas[0];
    const TAMANHO_GRUPO = 3; // gera em grupos de 3 ao mesmo tempo — bom equilíbrio entre velocidade e o limite de rate da conta
    const geracoes = [];
    for (let i = 0; i < listaCenas.length; i += TAMANHO_GRUPO) {
      const grupo = listaCenas.slice(i, i + TAMANHO_GRUPO);
      const resultadosGrupo = await Promise.all(grupo.map(async (cena) => {
        // Só a cena de "Variações/versatilidade" usa TODAS as fotos (pra mostrar as cores diferentes).
        // As demais cenas usam só a foto principal, pra manter a mesma cor/produto consistente em todo o funil.
        const ehCenaDeVariacao = /variaç|versatil/i.test(cena.tipo || '');
        const imagensDessaGeracao = (ehCenaDeVariacao && listaImagensEnviadas.length > 1) ? listaImagensEnviadas : [fotoprincipal];
        const instrucaoExtra = (ehCenaDeVariacao && listaImagensEnviadas.length > 1)
          ? ` Mostre as ${listaImagensEnviadas.length} variações de cor/versão do produto (uma foto de referência pra cada), lado a lado ou organizadas de forma comercial.`
          : '';
        try {
          const rImg = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
            body: JSON.stringify({
              model: 'gpt-5.6-luna',
              input: [{
                role: 'user',
                content: [
                  { type: 'input_text', text: `Usando a(s) foto(s) real(is) do produto anexada(s) como referência de fidelidade total (não altere forma, cor, textura, material, proporções ou nenhum detalhe visual do produto — vale pra qualquer tipo de produto, não só roupa), gere uma nova composição comercial: ${cena.instrucao}${instrucaoExtra}` },
                  ...imagensDessaGeracao.map(img => ({ type: 'input_image', image_url: img }))
                ]
              }],
              tools: [{ type: 'image_generation', size: TAMANHO_IMAGEM, quality: qualidadeFinal }]
            })
          });

          if (!rImg.ok) {
            const errTxt = await rImg.text();
            return { tipo: cena.tipo, erro: errTxt.slice(0, 200) };
          }

          const dataImg = await rImg.json();
          const chamadasImagem = (dataImg.output || []).filter(o => o.type === 'image_generation_call');
          const chamadaOk = chamadasImagem.find(o => o.status === 'completed' && o.result);
          const b64 = chamadaOk?.result;
          if (b64) {
            return { tipo: cena.tipo, imagem: `data:image/png;base64,${b64}`, erro: null };
          }
          // Nenhuma chamada de imagem deu certo — monta um erro útil, sem o "ruído" do reasoning
          const falhas = chamadasImagem.map(o => `status: ${o.status}${o.error ? ', erro: ' + JSON.stringify(o.error) : ''}`).join(' | ');
          const mensagemFinal = (dataImg.output || []).find(o => o.type === 'message');
          const textoMensagem = mensagemFinal?.content?.map(c => c.text).filter(Boolean).join(' ') || '';
          return { tipo: cena.tipo, imagem: null, erro: `A geração de imagem falhou do lado da OpenAI. ${falhas || 'Nenhuma chamada de imagem encontrada.'} ${textoMensagem ? 'Mensagem: ' + textoMensagem : ''}` };
        } catch (e) {
          return { tipo: cena.tipo, erro: e.message };
        }
      }));
      geracoes.push(...resultadosGrupo);
    }

    return res.status(200).json({
      ok: true,
      titulo: estrategia.titulo || '',
      descricao: estrategia.descricao || '',
      marketplace: mk,
      fotos: geracoes
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno: ' + (e.message || 'desconhecido') });
  }
}
