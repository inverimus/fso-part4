const express = require('express')
require('express-async-errors')
const cors = require('cors')
const Blog = require('./models/blog')
const User = require('./models/user')
const morganMiddleware = require('./utils/morganConfig')
const errorHandler = require('./utils/errorHandler')

const app = express()
app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(morganMiddleware)

const database = require('./utils/database')
database.connect()

const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
app.use('/api/users', usersRouter)
app.use('/api/blogs', blogsRouter)
app.use(errorHandler)

module.exports = app