const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const Comment = require('../models/comment')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .populate('user', { username: 1, name: 1, id: 1 })
    .populate('comments', { text: 1, id: 1 })

  return response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.find(request.params.id)
  if (blog) {
    return response.json(blog)
  } else {
    return response.status(404).end()
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const blog = await Blog.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true , runValidators: true, context: 'query' }
  )
  const updatedBlog = await Blog.findById(request.params.id)
    .populate('user', { username: 1, name: 1, id: 1 })
    .populate('comments', { text: 1, id: 1 })

  return response.json(updatedBlog)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const user = request.user
  
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id
  })

  const savedBlog = await blog.save()
  const newBlog = await Blog.findById(savedBlog._id)
    .populate('user', { username: 1, name: 1, id: 1 })
    .populate('comments', { text: 1, id: 1 })
  
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  return response.status(201).json(newBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)

  if (user._id.toString() !== blog.user.toString()) {
    return response.status(401).json({ error: 'blogs can only be deleted by the creator' })
  }

  await Blog.findByIdAndDelete(request.params.id)
  return response.status(204).end()
})

blogsRouter.post('/:id/comments', async (request, response) => {
  const blog = await Blog.findById(request.params.id)

  const comment = new Comment({
    text: request.body.comment,
    blog: blog._id
  })

  savedComment = await comment.save()

  blog.comments = blog.comments.concat(savedComment._id)
  await blog.save()
  
  const updatedBlog = await Blog.findById(request.params.id)
    .populate('user', { username: 1, name: 1, id: 1 })
    .populate('comments', { text: 1, id: 1 })

  return response.json(updatedBlog)
})

module.exports = blogsRouter