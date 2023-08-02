const config = require('./config')
const logger = require('./logger')

const mongoose = require('mongoose')

const url = config.MONGODB_URI

mongoose.set('strictQuery', false)

const connect = () => {
  async function getConnected() {
    await mongoose.connect(url)
  }
  try {
    getConnected()
    logger.info('connected to MongoDB')
  } catch (exception) {
    logger.error('error connecting to MongoDB:', exception.message)
  }
}

module.exports = {
  connect
}