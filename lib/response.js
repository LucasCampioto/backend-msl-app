module.exports = {
  success: (body, statusCode = 200, text = false) => {
    const bodyData = text ? body : JSON.stringify(body)
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode,
      body: bodyData
    }
  },
  failure: (body, statusCode = 400) => {
    const errorBody = typeof body === 'string' 
      ? { error: { code: 'ERROR', message: body } }
      : body.error 
        ? body 
        : { error: { code: 'ERROR', message: body.message || 'Erro desconhecido', details: body } }
    
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode,
      body: JSON.stringify(errorBody)
    }
  }
}
