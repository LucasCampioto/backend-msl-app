const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const visitController = require('../controllers/visit')

const list = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    const { queryStringParameters } = event
    const filters = {
      status: queryStringParameters?.status,
      kolId: queryStringParameters?.kolId,
      dateStart: queryStringParameters?.dateStart,
      dateEnd: queryStringParameters?.dateEnd,
      format: queryStringParameters?.format,
      hasReport: queryStringParameters?.hasReport,
      limit: queryStringParameters?.limit,
      offset: queryStringParameters?.offset
    }

    info(`Usuário listou visitas`, { filters })

    const result = await visitController.findAll(filters)

    return success({
      data: result.data.map(visit => ({
        id: visit._id.toString(),
        kolId: visit.kolId.toString(),
        kolName: visit.kolName,
        kolSpecialty: visit.kolSpecialty,
        date: visit.date.toISOString().split('T')[0],
        time: visit.time,
        format: visit.format,
        remoteLink: visit.remoteLink,
        agenda: visit.agenda,
        status: visit.status,
        notes: visit.notes,
        audioTranscript: visit.audioTranscript,
        tags: visit.tags,
        levelChange: visit.levelChange || null
      })),
      meta: result.meta
    })
  } catch (err) {
    error('Visit.list', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const findById = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário buscou visita ${id}`)

    const visit = await visitController.findById(id)

    return success({
      data: {
        id: visit._id.toString(),
        kolId: visit.kolId.toString(),
        kolName: visit.kolName,
        kolSpecialty: visit.kolSpecialty,
        date: visit.date.toISOString().split('T')[0],
        time: visit.time,
        format: visit.format,
        remoteLink: visit.remoteLink,
        agenda: visit.agenda,
        status: visit.status,
        notes: visit.notes,
        audioTranscript: visit.audioTranscript,
        tags: visit.tags,
        levelChange: visit.levelChange || null
      }
    })
  } catch (err) {
    error('Visit.findById', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const create = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    // Validações
    if (!body.kolId) {
      return failure({ message: 'kolId é obrigatório' }, 400)
    }
    if (!body.date) {
      return failure({ message: 'Data é obrigatória' }, 400)
    }
    if (!body.time) {
      return failure({ message: 'Horário é obrigatório' }, 400)
    }
    if (!body.format) {
      return failure({ message: 'Formato é obrigatório' }, 400)
    }
    if (!body.agenda) {
      return failure({ message: 'Pauta é obrigatória' }, 400)
    }

    info(`Usuário criou visita`, { kolId: body.kolId, date: body.date })

    const visit = await visitController.create(body)

    return success({
      data: {
        id: visit._id.toString(),
        kolId: visit.kolId.toString(),
        kolName: visit.kolName,
        kolSpecialty: visit.kolSpecialty,
        date: visit.date.toISOString().split('T')[0],
        time: visit.time,
        format: visit.format,
        remoteLink: visit.remoteLink,
        agenda: visit.agenda,
        status: visit.status,
        notes: visit.notes,
        audioTranscript: visit.audioTranscript,
        tags: visit.tags,
        levelChange: visit.levelChange || null
      }
    }, 201)
  } catch (err) {
    error('Visit.create', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const update = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    info(`Usuário atualizou visita ${id}`)

    const visit = await visitController.update(id, body)

    // Se levelChange foi aplicado, retornar info do KOL atualizado
    let kolUpdated = null
    if (body.levelChange && body.levelChange.to !== undefined) {
      const kolController = require('../controllers/kol')
      const kol = await kolController.findById(visit.kolId.toString())
      kolUpdated = {
        id: kol._id.toString(),
        level: kol.level,
        lastVisit: kol.lastVisit ? kol.lastVisit.toISOString().split('T')[0] : null
      }
    }

    const response = {
      data: {
        id: visit._id.toString(),
        kolId: visit.kolId.toString(),
        kolName: visit.kolName,
        kolSpecialty: visit.kolSpecialty,
        date: visit.date.toISOString().split('T')[0],
        time: visit.time,
        format: visit.format,
        remoteLink: visit.remoteLink,
        agenda: visit.agenda,
        status: visit.status,
        notes: visit.notes,
        audioTranscript: visit.audioTranscript,
        tags: visit.tags,
        levelChange: visit.levelChange || null
      }
    }

    if (kolUpdated) {
      response.kolUpdated = kolUpdated
    }

    return success(response)
  } catch (err) {
    error('Visit.update', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const remove = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário deletou visita ${id}`)

    await visitController.delete(id)

    return success({
      message: 'Visita deletada com sucesso'
    })
  } catch (err) {
    error('Visit.remove', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove
}
