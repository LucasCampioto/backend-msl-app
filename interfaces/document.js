const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const documentController = require('../controllers/document')

const list = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    const { queryStringParameters } = event
    const filters = {
      category: queryStringParameters?.category,
      search: queryStringParameters?.search,
      tags: queryStringParameters?.tags,
      limit: queryStringParameters?.limit,
      offset: queryStringParameters?.offset
    }

    info(`Usuário listou documentos`, { filters })

    const result = await documentController.findAll(filters)

    return success({
      data: result.data.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        description: doc.description,
        url: doc.url,
        type: doc.type,
        date: doc.date.toISOString().split('T')[0],
        tags: doc.tags
      })),
      meta: result.meta
    })
  } catch (err) {
    error('Document.list', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const findById = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário buscou documento ${id}`)

    const doc = await documentController.findById(id)

    return success({
      data: {
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        description: doc.description,
        url: doc.url,
        type: doc.type,
        date: doc.date.toISOString().split('T')[0],
        tags: doc.tags
      }
    })
  } catch (err) {
    error('Document.findById', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const create = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    // Validações
    if (!body.title) {
      return failure({ message: 'Título é obrigatório' }, 400)
    }
    if (!body.category) {
      return failure({ message: 'Categoria é obrigatória' }, 400)
    }
    if (!body.description) {
      return failure({ message: 'Descrição é obrigatória' }, 400)
    }
    if (!body.url) {
      return failure({ message: 'URL é obrigatória' }, 400)
    }
    if (!body.type) {
      return failure({ message: 'Tipo é obrigatório' }, 400)
    }

    info(`Usuário criou documento`, { title: body.title })

    const doc = await documentController.create(body)

    return success({
      data: {
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        description: doc.description,
        url: doc.url,
        type: doc.type,
        date: doc.date.toISOString().split('T')[0],
        tags: doc.tags
      }
    }, 201)
  } catch (err) {
    error('Document.create', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const update = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    info(`Usuário atualizou documento ${id}`)

    const doc = await documentController.update(id, body)

    return success({
      data: {
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        description: doc.description,
        url: doc.url,
        type: doc.type,
        date: doc.date.toISOString().split('T')[0],
        tags: doc.tags
      }
    })
  } catch (err) {
    error('Document.update', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const remove = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    info(`Usuário deletou documento ${id}`)

    await documentController.delete(id)

    return success({
      message: 'Documento deletado com sucesso'
    })
  } catch (err) {
    error('Document.remove', err)
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
