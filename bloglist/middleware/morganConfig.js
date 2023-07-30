const morgan = require('morgan')

morgan.token('body', (req) => { 
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
  return ''
})

const morganMiddleware = morgan((tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    tokens['body'](req)
  ].join(' ')
})

module.exports = morganMiddleware