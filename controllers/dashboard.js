const KOLDB = require('../models/kol')
const VisitDB = require('../models/visit')
const { error } = require('../lib/debug')

const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return null
  const value = ((current - previous) / previous) * 100
  return Math.round(value * 100) / 100
}

module.exports.getMetrics = async (startDate, endDate, comparisonStartDate, comparisonEndDate) => {
  try {
    // Período atual
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    // Período de comparação (se não fornecido, calcula automaticamente)
    let comparisonStart = comparisonStartDate ? new Date(comparisonStartDate) : null
    let comparisonEnd = comparisonEndDate ? new Date(comparisonEndDate) : null

    if (!comparisonStart || !comparisonEnd) {
      // Calcula período anterior equivalente
      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      comparisonEnd = new Date(start)
      comparisonEnd.setDate(comparisonEnd.getDate() - 1)
      comparisonEnd.setHours(23, 59, 59, 999)
      comparisonStart = new Date(comparisonEnd)
      comparisonStart.setDate(comparisonStart.getDate() - periodDays)
      comparisonStart.setHours(0, 0, 0, 0)
    }

    // Total de KOLs
    const totalKols = await KOLDB.countDocuments({})

    // Visitas agendadas (sem filtro de data)
    const scheduledVisits = await VisitDB.countDocuments({ status: 'scheduled' })

    // Visitas completadas no período (com relatório)
    const completedVisitsMonth = await VisitDB.countDocuments({
      status: 'completed',
      notes: { $exists: true, $ne: null, $ne: '' },
      date: { $gte: start, $lte: end }
    })

    // Nível médio de engajamento
    const kols = await KOLDB.find({}, { level: 1 })
    const avgEngagementLevel = kols.length > 0
      ? kols.reduce((sum, kol) => sum + kol.level, 0) / kols.length
      : 0

    // Distribuição por nível
    const levelDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    kols.forEach(kol => {
      levelDistribution[kol.level] = (levelDistribution[kol.level] || 0) + 1
    })

    // Calcular tendências
    const trends = {}

    // Total KOLs
    const previousTotalKols = await KOLDB.countDocuments({
      created: { $lt: comparisonStart }
    })
    const totalKolsTrend = calculateTrend(totalKols, previousTotalKols)
    if (totalKolsTrend !== null) {
      trends.totalKols = {
        value: totalKolsTrend,
        label: 'vs. período anterior'
      }
    }

    // Visitas agendadas
    const previousScheduledVisits = await VisitDB.countDocuments({
      status: 'scheduled',
      created: { $lt: comparisonStart }
    })
    const scheduledVisitsTrend = calculateTrend(scheduledVisits, previousScheduledVisits)
    if (scheduledVisitsTrend !== null) {
      trends.scheduledVisits = {
        value: scheduledVisitsTrend,
        label: 'vs. período anterior'
      }
    }

    // Visitas completadas
    const previousCompletedVisits = await VisitDB.countDocuments({
      status: 'completed',
      notes: { $exists: true, $ne: null, $ne: '' },
      date: { $gte: comparisonStart, $lte: comparisonEnd }
    })
    const completedVisitsTrend = calculateTrend(completedVisitsMonth, previousCompletedVisits)
    if (completedVisitsTrend !== null) {
      trends.completedVisitsMonth = {
        value: completedVisitsTrend,
        label: 'vs. período anterior'
      }
    }

    // Nível médio
    const previousKols = await KOLDB.find({
      created: { $lt: comparisonStart }
    }, { level: 1 })
    const previousAvgLevel = previousKols.length > 0
      ? previousKols.reduce((sum, kol) => sum + kol.level, 0) / previousKols.length
      : 0
    const avgLevelTrend = calculateTrend(avgEngagementLevel, previousAvgLevel)
    if (avgLevelTrend !== null) {
      trends.avgEngagementLevel = {
        value: avgLevelTrend,
        label: 'vs. período anterior'
      }
    }

    return {
      totalKols,
      scheduledVisits,
      completedVisitsMonth,
      avgEngagementLevel: Math.round(avgEngagementLevel * 100) / 100,
      levelDistribution,
      trends: Object.keys(trends).length > 0 ? trends : undefined,
      targets: {
        completedVisitsMonth: 30 // Meta padrão, pode ser configurável
      }
    }
  } catch (ex) {
    error('Dashboard.getMetrics', ex)
    throw ex
  }
}
