// Intermediário seguro LB — recebe cadastros públicos de clientes
// Variável de ambiente necessária na Vercel:
//   FIREBASE_SERVICE_ACCOUNT -> JSON completo da conta de serviço do Firebase (Admin SDK)

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function inicializarFirebase() {
  if (getApps().length) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'lb-gestao-clientes.firebasestorage.app'
  });
}

async function salvarArquivo(base64, caminho, nomeArquivo) {
  const [meta, dados] = base64.split(',');
  const tipo = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const buffer = Buffer.from(dados, 'base64');
  const bucket = getStorage().bucket();
  const file = bucket.file(caminho);
  await file.save(buffer, { metadata: { contentType: tipo } });
  // Gera um link assinado e temporário (10 anos) em vez de tornar o arquivo público pra sempre.
  // responseDisposition força o navegador a BAIXAR o arquivo (em vez de só exibir), com nome amigável.
  const [urlAssinada] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    responseDisposition: `attachment; filename="${nomeArquivo}"`
  });
  return urlAssinada;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    inicializarFirebase();
    const db = getFirestore();

    const {
      nomeLoja, email, telefone, documento, cep, numero,
      rua, bairro, cidade, estado,
      nicho, qtdProdutos, plataformas, docFrente, docVerso, selfie
    } = req.body || {};

    if (!nomeLoja || !email || !documento) {
      return res.status(400).json({ erro: 'Preencha os campos obrigatórios.' });
    }

    // Cria o registro primeiro (sem os arquivos) pra pegar um ID
    const docRef = await db.collection('cadastros').add({
      nomeLoja, email, telefone, documento, cep, numero,
      rua: rua || '', bairro: bairro || '', cidade: cidade || '', estado: estado || '',
      nicho, qtdProdutos: Number(qtdProdutos) || 0,
      plataformas: plataformas || [],
      status: 'pendente',
      criadoEm: FieldValue.serverTimestamp()
    });

    // Sobe os 3 arquivos pro Storage, organizados numa pasta com o ID do cadastro
    const pasta = `cadastros/${docRef.id}`;
    const nomeBase = (nomeLoja || 'cliente').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const [urlFrente, urlVerso, urlSelfie] = await Promise.all([
      salvarArquivo(docFrente, `${pasta}/documento-frente.jpg`, `${nomeBase}-doc-frente.jpg`),
      salvarArquivo(docVerso, `${pasta}/documento-verso.jpg`, `${nomeBase}-doc-verso.jpg`),
      salvarArquivo(selfie, `${pasta}/selfie.jpg`, `${nomeBase}-selfie.jpg`)
    ]);

    await docRef.update({ urlDocFrente: urlFrente, urlDocVerso: urlVerso, urlSelfie: urlSelfie });

    return res.status(200).json({ ok: true, id: docRef.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao processar o cadastro: ' + (e.message || 'desconhecido') });
  }
}
