const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  // Campos de auditoria
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  processedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },

  // Relacionamento com Visit
  visitId: {
    type: mongoose.Types.ObjectId,
    ref: 'msl_visits',
    required: true,
    index: true
  },

  // Campos do domínio
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  error: {
    type: String,
    default: null
  },
  estimatedProcessingTime: {
    type: Number,
    default: null
  },
  manuallyEdited: {
    type: Boolean,
    default: false
  }
})

// Middleware para atualizar campo updated
schema.pre('save', function (next) {
  this.updated = new Date()
  if (this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date()
  }
  if (this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date()
  }
  next()
})

// Índices
schema.index({ visitId: 1, status: 1 })
schema.index({ status: 1, created: -1 })

// Exportar modelo
module.exports =
  mongoose.models.msl_audios || mongoose.model('msl_audios', schema)
