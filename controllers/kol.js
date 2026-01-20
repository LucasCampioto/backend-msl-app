const KOLDB = require('../models/kol')
const VisitDB = require('../models/visit')
const { error } = require('../lib/debug')

module.exports.findAll = async (filters = {}, options = {}) => {
  try {
    const {
      search,
      level,
      profile,
      specialty,
      institution,
      limit,
      offset = 0
    } = filters

    const query = {}

    // Filtro de busca (nome, especialidade ou instituição)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } }
      ]
    }

    // Filtros específicos
    if (level !== undefined) query.level = parseInt(level)
    if (profile) query.profile = profile
    if (specialty) query.specialty = specialty
    if (institution) query.institution = institution

    // Paginação
    const limitNum = limit ? parseInt(limit) : null
    const offsetNum = parseInt(offset)

    let queryBuilder = KOLDB.find(query).sort({ created: -1 })

    if (limitNum) {
      queryBuilder = queryBuilder.skip(offsetNum).limit(limitNum)
    } else if (offsetNum > 0) {
      queryBuilder = queryBuilder.skip(offsetNum)
    }

    const data = await queryBuilder.exec()
    const total = await KOLDB.countDocuments(query)

    return {
      data,
      meta: {
        total,
        limit: limitNum,
        offset: offsetNum
      }
    }
  } catch (ex) {
    error('KOL.findAll', ex)
    throw ex
  }
}

module.exports.findById = async id => {
  try {
    const kol = await KOLDB.findById(id)
    if (!kol) {
      const err = new Error('KOL não encontrado')
      err.code = 404
      throw err
    }
    return kol
  } catch (ex) {
    error('KOL.findById', ex)
    if (ex.code === 404) throw ex
    const err = new Error('Erro ao buscar KOL')
    err.code = 400
    throw err
  }
}

module.exports.create = async data => {
  try {
    const kol = new KOLDB({
      ...data,
      created: new Date()
    })
    await kol.save()
    return kol
  } catch (ex) {
    error('KOL.create', ex)
    if (ex.code === 11000) {
      const err = new Error('Email já existe')
      err.code = 409
      throw err
    }
    throw ex
  }
}

module.exports.update = async (id, data) => {
  try {
    const kol = await KOLDB.findById(id)
    if (!kol) {
      const err = new Error('KOL não encontrado')
      err.code = 404
      throw err
    }

    Object.assign(kol, data)
    kol.updated = new Date()
    await kol.save()

    // Se nome ou especialidade mudaram, atualizar visitas relacionadas
    if (data.name || data.specialty) {
      await VisitDB.updateMany(
        { kolId: id },
        {
          $set: {
            kolName: data.name || kol.name,
            kolSpecialty: data.specialty || kol.specialty
          }
        }
      )
    }

    return kol
  } catch (ex) {
    error('KOL.update', ex)
    if (ex.code === 404) throw ex
    if (ex.code === 11000) {
      const err = new Error('Email já existe')
      err.code = 409
      throw err
    }
    throw ex
  }
}

module.exports.delete = async id => {
  try {
    const kol = await KOLDB.findById(id)
    if (!kol) {
      const err = new Error('KOL não encontrado')
      err.code = 404
      throw err
    }

    // Deletar todas as visitas relacionadas
    const deletedVisits = await VisitDB.deleteMany({ kolId: id })

    // Deletar o KOL
    await KOLDB.deleteOne({ _id: id })

    return { deletedVisits: deletedVisits.deletedCount }
  } catch (ex) {
    error('KOL.delete', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.updateLastNextVisit = async kolId => {
  try {
    const kol = await KOLDB.findById(kolId)
    if (!kol) return

    // Buscar última visita completada com relatório
    const lastVisit = await VisitDB.findOne({
      kolId,
      status: 'completed',
      notes: { $exists: true, $ne: null, $ne: '' }
    })
      .sort({ date: -1 })
      .limit(1)

    // Buscar próxima visita agendada
    const nextVisit = await VisitDB.findOne({
      kolId,
      status: 'scheduled',
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .limit(1)

    kol.lastVisit = lastVisit ? lastVisit.date : null
    kol.nextVisit = nextVisit ? nextVisit.date : null
    await kol.save()

    return kol
  } catch (ex) {
    error('KOL.updateLastNextVisit', ex)
    throw ex
  }
}
