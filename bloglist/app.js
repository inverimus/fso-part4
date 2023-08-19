const express = require('express')
require('express-async-errors')
const cors = require('cors')
const morganMiddleware = require('./middleware/morganConfig')
const errorHandler = require('./middleware/errorHandler')
const tokenExtractor = require('./middleware/tokenExtractor')
const userExtractor = require('./middleware/userExtractor')

const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

const database = require('./utils/database')

const app = express()
app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(morganMiddleware)

database.connect()

app.use('/api/login', loginRouter)
app.use('/api/users', usersRouter)
app.use('/api/blogs', tokenExtractor, userExtractor, blogsRouter)

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

app.use(errorHandler)

module.exports = app