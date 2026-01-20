const DocumentDB = require('../models/document')
const KOLDB = require('../models/kol')
const VisitDB = require('../models/visit')
const { error } = require('../lib/debug')

module.exports.sendMessage = async (message, context = {}) => {
  try {
    const { kolId, visitId, agenda, freeMode } = context

    let responseContent = ''
    const sources = []

    // Se não for freeMode, buscar contexto do KOL/Visita
    if (!freeMode && kolId) {
      const kol = await KOLDB.findById(kolId)
      if (kol) {
        responseContent += `Contexto do KOL ${kol.name} (${kol.specialty}): `
      }

      if (visitId) {
        const visit = await VisitDB.findById(visitId)
        if (visit) {
          responseContent += `Visita agendada para ${new Date(visit.date).toLocaleDateString('pt-BR')} com pauta: ${visit.agenda}. `
        }
      }
    }

    // Buscar documentos relevantes baseado na mensagem
    const searchTerms = message.toLowerCase().split(' ')
    const relevantDocs = await DocumentDB.find({
      $or: [
        { title: { $regex: searchTerms.join('|'), $options: 'i' } },
        { description: { $regex: searchTerms.join('|'), $options: 'i' } },
        { tags: { $in: searchTerms } }
      ]
    })
      .limit(5)

    // Gerar resposta básica (em produção, integrar com IA)
    if (message.toLowerCase().includes('resumir') || message.toLowerCase().includes('resumo')) {
      responseContent += `Com base na sua solicitação, encontrei ${relevantDocs.length} documento(s) relevante(s). `
      if (relevantDocs.length > 0) {
        responseContent += `Principais tópicos: ${relevantDocs.map(doc => doc.title).join(', ')}.`
      }
    } else {
      responseContent += `Sobre "${message}": Encontrei ${relevantDocs.length} documento(s) relacionado(s) na central de conhecimento.`
    }

    // Adicionar fontes
    relevantDocs.forEach(doc => {
      sources.push({
        title: doc.title,
        url: doc.url
      })
    })

    // Se não encontrou documentos, fornecer resposta genérica
    if (relevantDocs.length === 0) {
      responseContent = `Sobre "${message}": Não encontrei documentos específicos na base de conhecimento. Consulte a central de documentos para mais informações.`
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      sources: sources.length > 0 ? sources : undefined
    }
  } catch (ex) {
    error('Chat.sendMessage', ex)
    throw ex
  }
}
