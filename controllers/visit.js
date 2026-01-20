const VisitDB = require('../models/visit')
const KOLDB = require('../models/kol')
const { error } = require('../lib/debug')

module.exports.findAll = async (filters = {}, options = {}) => {
  try {
    const {
      status,
      kolId,
      dateStart,
      dateEnd,
      format,
      hasReport,
      limit,
      offset = 0
    } = filters

    const query = {}

    // Filtros
    if (status) query.status = status
    if (kolId) query.kolId = kolId
    if (format) query.format = format

    // Filtro de data
    if (dateStart || dateEnd) {
      query.date = {}
      if (dateStart) query.date.$gte = new Date(dateStart)
      if (dateEnd) {
        const endDate = new Date(dateEnd)
        endDate.setHours(23, 59, 59, 999)
        query.date.$lte = endDate
      }
    }

    // Filtro hasReport
    if (hasReport !== undefined) {
      if (hasReport === 'true' || hasReport === true) {
        query.notes = { $exists: true, $ne: null, $ne: '' }
      } else {
        query.$or = [
          { notes: { $exists: false } },
          { notes: null },
          { notes: '' }
        ]
      }
    }

    // Paginação
    const limitNum = limit ? parseInt(limit) : null
    const offsetNum = parseInt(offset)

    let queryBuilder = VisitDB.find(query).sort({ date: -1, time: -1 })

    if (limitNum) {
      queryBuilder = queryBuilder.skip(offsetNum).limit(limitNum)
    } else if (offsetNum > 0) {
      queryBuilder = queryBuilder.skip(offsetNum)
    }

    const data = await queryBuilder.exec()
    const total = await VisitDB.countDocuments(query)

    return {
      data,
      meta: {
        total,
        limit: limitNum,
        offset: offsetNum
      }
    }
  } catch (ex) {
    error('Visit.findAll', ex)
    throw ex
  }
}

module.exports.findById = async id => {
  try {
    const visit = await VisitDB.findById(id)
    if (!visit) {
      const err = new Error('Visita não encontrada')
      err.code = 404
      throw err
    }
    return visit
  } catch (ex) {
    error('Visit.findById', ex)
    if (ex.code === 404) throw ex
    const err = new Error('Erro ao buscar visita')
    err.code = 400
    throw err
  }
}

module.exports.create = async data => {
  try {
    // Validar que KOL existe
    const kol = await KOLDB.findById(data.kolId)
    if (!kol) {
      const err = new Error('KOL não encontrado')
      err.code = 404
      throw err
    }

    // Validar que data não é no passado
    const visitDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (visitDate < today) {
      const err = new Error('Não é possível agendar visita com data no passado')
      err.code = 422
      throw err
    }

    // Verificar conflito de agendamento (mesma data e hora)
    const conflictingVisit = await VisitDB.findOne({
      kolId: data.kolId,
      date: visitDate,
      time: data.time,
      status: 'scheduled'
    })

    if (conflictingVisit) {
      const err = new Error('Já existe uma visita agendada para esta data e horário')
      err.code = 409
      err.details = { conflictingVisitId: conflictingVisit._id.toString() }
      throw err
    }

    const visit = new VisitDB({
      ...data,
      kolName: kol.name,
      kolSpecialty: kol.specialty,
      date: visitDate,
      created: new Date()
    })
    await visit.save()

    // Atualizar nextVisit do KOL
    await require('./kol').updateLastNextVisit(data.kolId)

    return visit
  } catch (ex) {
    error('Visit.create', ex)
    if (ex.code === 404 || ex.code === 409 || ex.code === 422) throw ex
    throw ex
  }
}

module.exports.update = async (id, data) => {
  try {
    const visit = await VisitDB.findById(id)
    if (!visit) {
      const err = new Error('Visita não encontrada')
      err.code = 404
      throw err
    }

    const wasCompleted = visit.status === 'completed'
    const willBeCompleted = data.status === 'completed'

    Object.assign(visit, data)
    visit.updated = new Date()
    await visit.save()

    // Se mudou para completed, atualizar lastVisit do KOL
    if (!wasCompleted && willBeCompleted) {
      await require('./kol').updateLastNextVisit(visit.kolId)
    }

    // Se levelChange fornecido, atualizar level do KOL
    if (data.levelChange && data.levelChange.to !== undefined) {
      const kol = await KOLDB.findById(visit.kolId)
      if (kol) {
        kol.level = data.levelChange.to
        await kol.save()
      }
    }

    // Atualizar nextVisit do KOL
    await require('./kol').updateLastNextVisit(visit.kolId)

    return visit
  } catch (ex) {
    error('Visit.update', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.delete = async id => {
  try {
    const visit = await VisitDB.findById(id)
    if (!visit) {
      const err = new Error('Visita não encontrada')
      err.code = 404
      throw err
    }

    const kolId = visit.kolId

    await VisitDB.deleteOne({ _id: id })

    // Atualizar nextVisit do KOL
    await require('./kol').updateLastNextVisit(kolId)

    return true
  } catch (ex) {
    error('Visit.delete', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.syncStatus = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await VisitDB.updateMany(
      {
        status: 'scheduled',
        date: { $lt: today }
      },
      {
        $set: {
          status: 'completed',
          updated: new Date()
        }
      }
    )

    return { updated: result.modifiedCount }
  } catch (ex) {
    error('Visit.syncStatus', ex)
    throw ex
  }
}
