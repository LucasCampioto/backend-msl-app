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

  // Campos do domínio
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['articles', 'studies', 'behavioral', 'knowledge-base'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'link'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tags: [{
    type: String
  }]
})

// Middleware para atualizar campo updated
schema.pre('save', function (next) {
  this.updated = new Date()
  next()
})

// Índices para busca
schema.index({ title: 'text', description: 'text' })
schema.index({ category: 1, date: -1 })
schema.index({ tags: 1 })

// Exportar modelo
module.exports =
  mongoose.models.msl_documents || mongoose.model('msl_documents', schema)
