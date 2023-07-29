const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })

  await user.save()
}, 100000)

beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs.map(b => blog = new Blog(b))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
}, 100000)

describe('/api/blogs tests', () => {
  describe('/api/blogs GET tests', () => {
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    }, 100000)
    
    test('correct amount of blogs are returned', async () => {
      const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    }, 100000)
  })

  describe('/api/blogs POST tests', () => {
    test('new blog posts are added correctly', async () => {
      const user = await User.find({ username: 'root' })
      const userId = user[0]._id.toString()
      const newBlog = { title: 'test', author: 'test', url: 'test', userId: userId }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length + 1)
      const authors = blogs.map(blog => blog.author)
      expect(authors).toContain('test')
    }, 100000)
    
    test('new blog posts without a likes field default to zero', async () => {
      const user = await User.find({ username: 'root' })
      const userId = user[0]._id.toString()
      const newBlog = { title: 'test', author: 'test', url: 'test', userId: userId }

      const response = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      
      expect(response.body.likes).toBe(0)
    }, 100000)
    
    test('missing title responds with 400 Bad Request', async () => {
      const user = await User.find({ username: 'root' })
      const userId = user[0]._id.toString()
      const missingTitle = { author: 'test', url: 'test', userId: userId}
    
      await api
        .post('/api/blogs')
        .send(missingTitle)
        .expect(400)
    }, 100000)

    test('missing url responds with 400 Bad Request', async () => {
      const user = await User.find({ username: 'root' })
      const userId = user[0]._id.toString()
      const missingUrl = { title: 'test', author: 'test', userId: userId }
    
      await api
        .post('/api/blogs')
        .send(missingUrl)
        .expect(400)
    }, 100000)  
  })

  describe('/api/blogs PUT tests', () => {
    test('updating blog succeeds', async () => {
      const initial = await helper.blogsInDb()
      const {id: id, ...updatedBlog} = initial[0]
      updatedBlog.likes = 50
    
      await api
        .put(`/api/blogs/${id}`)
        .send(updatedBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
      
      const blogs = await helper.blogsInDb()
      const blog = blogs.find(blog => blog.id === initial[0].id)
      expect(blog.likes).toBe(50)
    }, 100000)
  })

  describe('/api/blogs DELETE tests', () => {
    test('deleting blog succeeds', async () => {
      const initial = await helper.blogsInDb()
    
      await api
        .delete(`/api/blogs/${initial[3].id}`)
        .expect(204)
      
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length - 1)
      const ids = blogs.map(blog => blog.id)
      expect(ids).not.toContain(initial[3].id)
    }, 100000)
  })
})

describe('/api/users tests', () => {
  describe('when there is initially one user in db', () => {
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })

    test('non-unique usernames are rejected', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = { username: 'root', password: 'sekret' }
      const response = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
      expect(response.body.error).toContain('expected `username` to be unique')
    })
  })
})
afterAll(async () => {
  await mongoose.connection.close()
})