const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const audioController = require('../controllers/audio')
const { handleUpload } = require('../lib/upload')

const upload = async (event, context) => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { visitId } = event.pathParameters

    // Para multipart/form-data, o arquivo vem no req.file (via multer)
    // Como estamos usando serverless-http, precisamos processar o body manualmente
    // Por enquanto, vamos assumir que o arquivo já foi processado pelo middleware
    
    // Em produção, você precisaria processar o multipart manualmente ou usar um middleware
    // Por enquanto, vamos retornar um erro informando que precisa ser implementado
    
    info(`Usuário fez upload de áudio para visita ${visitId}`)

    // TODO: Processar arquivo multipart/form-data
    // Por enquanto, retornar erro informativo
    return failure({ 
      message: 'Upload de áudio requer processamento de multipart/form-data. Implemente middleware de upload.' 
    }, 400)

    // Código quando implementado:
    // const file = req.file
    // if (!file) {
    //   return failure({ message: 'Arquivo de áudio é obrigatório' }, 400)
    // }
    // const result = await audioController.upload(visitId, file)
    // return success({ data: result }, 202)
  } catch (err) {
    error('Audio.upload', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const getStatus = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { visitId, audioId } = event.pathParameters

    info(`Usuário buscou status de áudio ${audioId} da visita ${visitId}`)

    const status = await audioController.getStatus(visitId, audioId)

    return success({
      data: status
    })
  } catch (err) {
    error('Audio.getStatus', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const updateTranscript = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { visitId, audioId } = event.pathParameters
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    if (!body.transcript) {
      return failure({ message: 'Transcrição é obrigatória' }, 400)
    }

    info(`Usuário atualizou transcrição do áudio ${audioId}`)

    const result = await audioController.updateTranscript(visitId, audioId, body.transcript)

    return success({
      data: result,
      visitUpdated: {
        id: visitId,
        audioTranscript: body.transcript
      }
    })
  } catch (err) {
    error('Audio.updateTranscript', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

const remove = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { visitId, audioId } = event.pathParameters

    info(`Usuário deletou áudio ${audioId} da visita ${visitId}`)

    await audioController.delete(visitId, audioId)

    return success({
      message: 'Áudio e transcrição removidos com sucesso',
      visitUpdated: {
        id: visitId,
        audioTranscript: null
      }
    })
  } catch (err) {
    error('Audio.remove', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  upload,
  getStatus,
  updateTranscript,
  remove
}
