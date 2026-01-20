module.exports = {
  info: async (...params) => {
    try {
      console.log(JSON.stringify(params, null, 2))
    } catch (ex) {
      console.error('DEBUG.INFO', params, ex.message)
    }
  },
  error: async (...params) => {
    if (params.length <= 0) return false
    try {
      console.error(JSON.stringify(params, null, 2))
    } catch (ex) {
      console.error('DEBUG.ERROR', params, ex.message)
    }
  }
}
