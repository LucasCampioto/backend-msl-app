const AudioDB = require('../models/audio')
const VisitDB = require('../models/visit')
const transcriptionService = require('../api/transcription')
const { error } = require('../lib/debug')
const path = require('path')
const fs = require('fs')

module.exports.upload = async (visitId, file) => {
  try {
    // Validar que visita existe
    const visit = await VisitDB.findById(visitId)
    if (!visit) {
      const err = new Error('Visita não encontrada')
      err.code = 404
      throw err
    }

    // Criar registro de áudio
    const audio = new AudioDB({
      visitId,
      audioUrl: `/uploads/audio/${path.basename(file.path)}`,
      status: 'processing',
      created: new Date()
    })
    await audio.save()

    // Iniciar transcrição (assíncrona)
    transcriptionService.transcribe(file.path, audio._id.toString())
      .then(async (transcript) => {
        // Atualizar áudio com transcrição
        const audioRecord = await AudioDB.findById(audio._id)
        audioRecord.status = 'completed'
        audioRecord.transcript = transcript
        audioRecord.processedAt = new Date()
        await audioRecord.save()

        // Atualizar visita com transcrição
        visit.audioTranscript = transcript
        await visit.save()
      })
      .catch(async (err) => {
        error('Audio.transcribe', err)
        const audioRecord = await AudioDB.findById(audio._id)
        audioRecord.status = 'failed'
        audioRecord.error = err.message
        audioRecord.failedAt = new Date()
        await audioRecord.save()
      })

    // Retornar resposta assíncrona (202 Accepted)
    return {
      id: audio._id.toString(),
      visitId: visitId.toString(),
      status: 'processing',
      audioUrl: audio.audioUrl,
      duration: null,
      createdAt: audio.created.toISOString(),
      estimatedProcessingTime: 60
    }
  } catch (ex) {
    error('Audio.upload', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.getStatus = async (visitId, audioId) => {
  try {
    const audio = await AudioDB.findOne({
      _id: audioId,
      visitId
    })

    if (!audio) {
      const err = new Error('Áudio não encontrado')
      err.code = 404
      throw err
    }

    return {
      id: audio._id.toString(),
      visitId: audio.visitId.toString(),
      status: audio.status,
      progress: audio.progress,
      estimatedTimeRemaining: audio.status === 'processing' ? audio.estimatedProcessingTime : null,
      createdAt: audio.created.toISOString(),
      transcript: audio.transcript || undefined,
      audioUrl: audio.audioUrl,
      duration: audio.duration || undefined,
      processedAt: audio.processedAt ? audio.processedAt.toISOString() : undefined,
      error: audio.error || undefined,
      failedAt: audio.failedAt ? audio.failedAt.toISOString() : undefined
    }
  } catch (ex) {
    error('Audio.getStatus', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.updateTranscript = async (visitId, audioId, transcript) => {
  try {
    const audio = await AudioDB.findOne({
      _id: audioId,
      visitId
    })

    if (!audio) {
      const err = new Error('Áudio não encontrado')
      err.code = 404
      throw err
    }

    audio.transcript = transcript
    audio.manuallyEdited = true
    audio.updated = new Date()
    await audio.save()

    // Atualizar visita
    const visit = await VisitDB.findById(visitId)
    if (visit) {
      visit.audioTranscript = transcript
      await visit.save()
    }

    return {
      id: audio._id.toString(),
      visitId: audio.visitId.toString(),
      status: audio.status,
      transcript: audio.transcript,
      audioUrl: audio.audioUrl,
      duration: audio.duration || undefined,
      createdAt: audio.created.toISOString(),
      processedAt: audio.processedAt ? audio.processedAt.toISOString() : undefined,
      updatedAt: audio.updated.toISOString(),
      manuallyEdited: audio.manuallyEdited
    }
  } catch (ex) {
    error('Audio.updateTranscript', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}

module.exports.delete = async (visitId, audioId) => {
  try {
    const audio = await AudioDB.findOne({
      _id: audioId,
      visitId
    })

    if (!audio) {
      const err = new Error('Áudio não encontrado')
      err.code = 404
      throw err
    }

    // Deletar arquivo físico
    const filePath = path.join(__dirname, '..', audio.audioUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Deletar registro
    await AudioDB.deleteOne({ _id: audioId })

    // Limpar transcrição da visita
    const visit = await VisitDB.findById(visitId)
    if (visit) {
      visit.audioTranscript = null
      await visit.save()
    }

    return true
  } catch (ex) {
    error('Audio.delete', ex)
    if (ex.code === 404) throw ex
    throw ex
  }
}
