const config = require('./config')
const logger = require('./logger')

const mongoose = require('mongoose')

const url = config.MONGODB_URI

mongoose.set('strictQuery', false)

const connect = () => mongoose.connect(url)
  .then(() => { logger.info('connected to MongoDB')})  
  .catch((e) => { logger.error('error connecting to MongoDB:', e.message) })

module.exports = {
  connect
}