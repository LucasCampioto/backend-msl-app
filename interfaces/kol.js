const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const kolController = require('../controllers/kol')

const list = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    const { queryStringParameters } = event
    const filters = {
      search: queryStringParameters?.search,
      level: queryStringParameters?.level,
      profile: queryStringParameters?.profile,
      specialty: queryStringParameters?.specialty,
      institution: queryStringParameters?.institution,
      limit: queryStringParameters?.limit,
      offset: queryStringParameters?.offset
    }

    info(`Usuário listou KOLs`, { filters })

    const result = await kolController.findAll(filters)

    return success({
      data: result.data.map(kol => ({
        id: kol._id.toString(),
        name: kol.name,
        photo: kol.photo,
        specialty: kol.specialty,
        institution: kol.institution,
        email: kol.email,
        crm: kol.crm,
        profile: kol.profile,
        level: kol.level,
        lastVisit: kol.lastVisit ? kol.lastVisit.toISOString().split('T')[0] : null,
        nextVisit: kol.nextVisit ? kol.nextVisit.toISOString().split('T')[0] : null,
        tags: kol.tags
      })),
      meta: result.meta
    })
  } catch (err) {
    error('KOL.list', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const findById = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário buscou KOL ${id}`)

    const kol = await kolController.findById(id)

    return success({
      data: {
        id: kol._id.toString(),
        name: kol.name,
        photo: kol.photo,
        specialty: kol.specialty,
        institution: kol.institution,
        email: kol.email,
        crm: kol.crm,
        profile: kol.profile,
        level: kol.level,
        lastVisit: kol.lastVisit ? kol.lastVisit.toISOString().split('T')[0] : null,
        nextVisit: kol.nextVisit ? kol.nextVisit.toISOString().split('T')[0] : null,
        tags: kol.tags
      }
    })
  } catch (err) {
    error('KOL.findById', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const create = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    // Validações
    if (!body.name) {
      return failure({ message: 'Nome é obrigatório' }, 400)
    }
    if (!body.specialty) {
      return failure({ message: 'Especialidade é obrigatória' }, 400)
    }
    if (!body.institution) {
      return failure({ message: 'Instituição é obrigatória' }, 400)
    }
    if (!body.email) {
      return failure({ message: 'Email é obrigatório' }, 400)
    }
    if (!body.profile) {
      return failure({ message: 'Perfil é obrigatório' }, 400)
    }
    if (body.level === undefined) {
      return failure({ message: 'Nível é obrigatório' }, 400)
    }

    info(`Usuário criou KOL`, { name: body.name })

    const kol = await kolController.create(body)

    return success({
      data: {
        id: kol._id.toString(),
        name: kol.name,
        photo: kol.photo,
        specialty: kol.specialty,
        institution: kol.institution,
        email: kol.email,
        crm: kol.crm,
        profile: kol.profile,
        level: kol.level,
        lastVisit: kol.lastVisit ? kol.lastVisit.toISOString().split('T')[0] : null,
        nextVisit: kol.nextVisit ? kol.nextVisit.toISOString().split('T')[0] : null,
        tags: kol.tags
      }
    }, 201)
  } catch (err) {
    error('KOL.create', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const update = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    info(`Usuário atualizou KOL ${id}`)

    const kol = await kolController.update(id, body)

    return success({
      data: {
        id: kol._id.toString(),
        name: kol.name,
        photo: kol.photo,
        specialty: kol.specialty,
        institution: kol.institution,
        email: kol.email,
        crm: kol.crm,
        profile: kol.profile,
        level: kol.level,
        lastVisit: kol.lastVisit ? kol.lastVisit.toISOString().split('T')[0] : null,
        nextVisit: kol.nextVisit ? kol.nextVisit.toISOString().split('T')[0] : null,
        tags: kol.tags
      }
    })
  } catch (err) {
    error('KOL.update', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const remove = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário deletou KOL ${id}`)

    const result = await kolController.delete(id)

    return success({
      message: 'KOL deletado com sucesso',
      deletedVisits: result.deletedVisits
    })
  } catch (err) {
    error('KOL.remove', err)
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
