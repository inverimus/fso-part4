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
  const tmp = await User.find({ username: 'root' })
  const root = tmp[0]

  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs.map(b => {
    blog = new Blog(b)
    blog.user = root._id
    return blog
  })
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
}, 100000)

describe('Testing /api/blogs', () => {
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

    test('users are included in returned blogs', async () => {
      const user = await User.find({ username: 'root' })
      const userId = user[0]._id.toString()
      
      const response = await api
        .get('/api/blogs/')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
        const blog = response.body[0]

        console.log(blog.user.id)
        console.log(userId)

        expect(blog.user.id.toString()).toEqual(userId)
    }, 100000)
  })

  describe('/api/blogs POST tests', () => {
    test('new blogs are added correctly', async () => {
      const newBlog = { title: 'test', author: 'test', url: 'test' }

      await api
        .post('/api/blogs')
        .set('Authorization', await helper.bearer('root'))
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length + 1)
      const authors = blogs.map(blog => blog.author)
      expect(authors).toContain('test')
    }, 100000)
    
    test('blogs without a `likes` field default to zero', async () => {
      const newBlog = { title: 'test', author: 'test', url: 'test' }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', await helper.bearer('root'))
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      
      expect(response.body.likes).toBe(0)
    }, 100000)
    
    test('missing title results in 400 Bad Request', async () => {
      const missingTitle = { author: 'test', url: 'test' }
    
      await api
        .post('/api/blogs')
        .set('Authorization', await helper.bearer('root'))
        .send(missingTitle)
        .expect(400)
    }, 100000)

    test('missing url results in 400 Bad Request', async () => {
      const missingUrl = { title: 'test', author: 'test' }
    
      await api
        .post('/api/blogs')
        .set('Authorization', await helper.bearer('root'))
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
    test('deleting blog by poster succeeds', async () => {
      const initial = await helper.blogsInDb()

      await api
        .delete(`/api/blogs/${initial[3].id}`)
        .set('Authorization', await helper.bearer('root'))
        .expect(204)
      
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length - 1)
      const ids = blogs.map(blog => blog.id)
      expect(ids).not.toContain(initial[3].id)
    }, 100000)

    test('deleting blog by another user is rejected', async () => {
      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'bob', passwordHash })
      await user.save()

      const initial = await helper.blogsInDb()
    
      const response = await api
        .delete(`/api/blogs/${initial[3].id}`)
        .set('Authorization', await helper.bearer('bob'))
        .expect(401)

      expect(response.body.error).toContain('blogs can only be deleted by the creator')
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length)
      const ids = blogs.map(blog => blog.id)
      expect(ids).toContain(initial[3].id)
      
    }, 100000)
  })
})

describe('/api/users tests', () => {
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
    const newUser = { username: 'root', password: 'sekret' }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
    expect(response.body.error).toContain('expected `username` to be unique')
  })

  test('usernames that do not meet minimum length requirements are rejected', async () => {
    const newUser = { username: 'a', password: 'sekret' }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
    expect(response.body.error).toContain('is shorter than the minimum allowed length')
  })

  test('new users without passwords are rejected', async () => {
    const newUser = { username: 'testuser', name: 'Mr Test User' }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
    expect(response.body.error).toContain('password required')
  })

  test('passwords that do not meet minimum length requirements are rejected', async () => {
    const newUser = { username: 'testuser', password: 'pw' }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
    expect(response.body.error).toContain('is shorter than the minimum allowed length')
  })

})
afterAll(async () => {
  await mongoose.connection.close()
})