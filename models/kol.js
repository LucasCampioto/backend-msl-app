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
  name: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  specialty: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  institution: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  crm: {
    type: String,
    default: null
  },
  profile: {
    type: String,
    enum: ['prescriber', 'hospital_manager', 'payer', 'pharmacist', 'researcher'],
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    default: 0,
    index: true
  },
  lastVisit: {
    type: Date,
    default: null
  },
  nextVisit: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    enum: ['efficacy', 'safety', 'access', 'cost-effectiveness', 'protocol', 'clinical-data', 'competition']
  }]
})

// Middleware para atualizar campo updated
schema.pre('save', function (next) {
  this.updated = new Date()
  next()
})

// Índices compostos
schema.index({ specialty: 1, level: 1 })
schema.index({ institution: 1, level: 1 })

// Exportar modelo (pattern para evitar recompilação)
module.exports =
  mongoose.models.msl_kols || mongoose.model('msl_kols', schema)
