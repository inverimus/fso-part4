const logger = require('./logger')

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }
  else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate')) {
    return response.status(400).send({ error: 'expected `username` to be unique' })
  }

  next(error)
}

module.exports = errorHandler