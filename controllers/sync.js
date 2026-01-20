const visitController = require('./visit')
const kolController = require('./kol')
const KOLDB = require('../models/kol')
const { error } = require('../lib/debug')

module.exports.sync = async () => {
  try {
    // 1. Atualizar status de visitas agendadas que passaram da data
    const visitSyncResult = await visitController.syncStatus()

    // 2. Atualizar lastVisit/nextVisit de todos os KOLs
    const kols = await KOLDB.find({}, { _id: 1 })
    let kolsUpdated = 0
    for (const kol of kols) {
      await kolController.updateLastNextVisit(kol._id)
      kolsUpdated++
    }

    return {
      updated: {
        visits: visitSyncResult.updated,
        kols: kolsUpdated,
        briefings: 0 // Briefings são gerados sob demanda
      }
    }
  } catch (ex) {
    error('Sync.sync', ex)
    throw ex
  }
}
