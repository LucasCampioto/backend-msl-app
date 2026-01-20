const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configurar storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/audio')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const visitId = req.params.visitId || 'unknown'
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `visit-${visitId}-${timestamp}${ext}`)
  }
})

// Filtro de tipos de arquivo aceitos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/webm',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/ogg',
    'audio/mpeg'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Formato de áudio não suportado'), false)
  }
}

// Configurar multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Middleware para processar upload
const handleUpload = (fieldName = 'audio') => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName)
    
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Arquivo de áudio excede o tamanho máximo permitido',
              details: {
                maxSize: 50 * 1024 * 1024,
                unit: 'bytes'
              }
            }
          })
        }
        if (err.message === 'Formato de áudio não suportado') {
          return res.status(415).json({
            error: {
              code: 'UNSUPPORTED_AUDIO_FORMAT',
              message: 'Formato de áudio não suportado',
              details: {
                providedFormat: req.file?.mimetype,
                supportedFormats: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
              }
            }
          })
        }
        return res.status(400).json({
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message
          }
        })
      }
      next()
    })
  }
}

module.exports = { handleUpload, upload }
