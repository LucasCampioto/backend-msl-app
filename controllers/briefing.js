const KOLDB = require('../models/kol')
const VisitDB = require('../models/visit')
const { error } = require('../lib/debug')

module.exports.generate = async (kolId, visitId = null) => {
  try {
    const kol = await KOLDB.findById(kolId)
    if (!kol) {
      const err = new Error('KOL não encontrado')
      err.code = 404
      throw err
    }

    // Buscar próxima visita agendada (ou visita específica se fornecida)
    let nextVisit = null
    if (visitId) {
      nextVisit = await VisitDB.findOne({
        _id: visitId,
        kolId,
        status: 'scheduled'
      })
    } else {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      sevenDaysFromNow.setHours(23, 59, 59, 999)

      nextVisit = await VisitDB.findOne({
        kolId,
        status: 'scheduled',
        date: { $lte: sevenDaysFromNow, $gte: new Date() }
      })
        .sort({ date: 1 })
        .limit(1)
    }

    if (!nextVisit) {
      const err = new Error('Não há visita agendada para os próximos 7 dias')
      err.code = 404
      throw err
    }

    // Buscar última visita completada
    const lastVisit = await VisitDB.findOne({
      kolId,
      status: 'completed',
      notes: { $exists: true, $ne: null, $ne: '' }
    })
      .sort({ date: -1 })
      .limit(1)

    // Buscar histórico de visitas
    const visitHistory = await VisitDB.find({
      kolId,
      status: 'completed'
    })
      .sort({ date: -1 })
      .limit(5)

    // Gerar continuityReminder
    let continuityReminder = ''
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit.date).toLocaleDateString('pt-BR')
      continuityReminder = `Na última visita (${lastVisitDate}), ${kol.name.split(' ')[0]} demonstrou interesse em ${lastVisit.tags.join(', ')}. `
      if (lastVisit.notes) {
        const notesPreview = lastVisit.notes.substring(0, 200)
        continuityReminder += `${notesPreview}... Retome este ponto.`
      }
    } else {
      continuityReminder = `Primeira visita com este KOL. Apresente-se e estabeleça uma relação inicial focada em ${nextVisit.tags.join(', ')}.`
    }

    // Gerar contentSuggestion baseado nas tags da próxima visita
    const contentSuggestion = `Para o tema "${nextVisit.tags.join(', ')}" definido, utilize documentos relevantes disponíveis na central de conhecimento.`
    if (nextVisit.agenda) {
      contentSuggestion += ` Foque na pauta: ${nextVisit.agenda}`
    }

    // Gerar levelAlert se necessário
    let levelAlert = null
    if (kol.level < 3) {
      levelAlert = `Este KOL está no Nível ${kol.level}. A meta sugerida é aumentar o engajamento através de informações relevantes.`
    } else if (kol.level >= 3 && kol.level < 5) {
      levelAlert = `Este KOL está no Nível ${kol.level}. Considere estratégias para fortalecer o relacionamento e buscar compromissos práticos.`
    } else if (kol.level >= 5) {
      levelAlert = `Este KOL está no Nível ${kol.level}. Mantenha o relacionamento estratégico e explore oportunidades de parceria.`
    }

    return {
      kolId: kol._id.toString(),
      continuityReminder,
      contentSuggestion,
      levelAlert,
      generatedAt: new Date().toISOString()
    }
  } catch (ex) {
    error('Briefing.generate', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}
