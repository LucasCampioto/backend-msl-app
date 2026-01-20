const DocumentDB = require('../models/document')
const { error } = require('../lib/debug')

module.exports.findAll = async (filters = {}, options = {}) => {
  try {
    const {
      category,
      search,
      tags,
      limit,
      offset = 0
    } = filters

    const query = {}

    // Filtros
    if (category) query.category = category

    // Busca por título ou descrição
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Filtro por tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',')
      query.tags = { $in: tagArray }
    }

    // Paginação
    const limitNum = limit ? parseInt(limit) : null
    const offsetNum = parseInt(offset)

    let queryBuilder = DocumentDB.find(query).sort({ date: -1 })

    if (limitNum) {
      queryBuilder = queryBuilder.skip(offsetNum).limit(limitNum)
    } else if (offsetNum > 0) {
      queryBuilder = queryBuilder.skip(offsetNum)
    }

    const data = await queryBuilder.exec()
    const total = await DocumentDB.countDocuments(query)

    return {
      data,
      meta: {
        total,
        limit: limitNum,
        offset: offsetNum
      }
    }
  } catch (ex) {
    error('Document.findAll', ex)
    throw ex
  }
}

module.exports.findById = async id => {
  try {
    const document = await DocumentDB.findById(id)
    if (!document) {
      const err = new Error('Documento não encontrado')
      err.code = 404
      throw err
    }
    return document
  } catch (ex) {
    error('Document.findById', ex)
    if (ex.code === 404) throw ex
    const err = new Error('Erro ao buscar documento')
    err.code = 400
    throw err
  }
}

module.exports.create = async data => {
  try {
    const document = new DocumentDB({
      ...data,
      created: new Date(),
      date: data.date ? new Date(data.date) : new Date()
    })
    await document.save()
    return document
  } catch (ex) {
    error('Document.create', ex)
    throw ex
  }
}

module.exports.update = async (id, data) => {
  try {
    const document = await DocumentDB.findById(id)
    if (!document) {
      const err = new Error('Documento não encontrado')
      err.code = 404
      throw err
    }

    if (data.date) {
      data.date = new Date(data.date)
    }

    Object.assign(document, data)
    document.updated = new Date()
    await document.save()

    return document
  } catch (ex) {
    error('Document.update', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.delete = async id => {
  try {
    const document = await DocumentDB.findById(id)
    if (!document) {
      const err = new Error('Documento não encontrado')
      err.code = 404
      throw err
    }

    await DocumentDB.deleteOne({ _id: id })
    return true
  } catch (ex) {
    error('Document.delete', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}
