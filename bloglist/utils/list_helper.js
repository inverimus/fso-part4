const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => blogs.reduce((total, blog) => total + blog.likes, 0)

const favoriteBlog = (blogs) => {
  if (blogs.length != 0) {
    const favorite = blogs.reduce((best, current) => 
      current.likes > best.likes ? current : best, { likes: -1 }
    )
    const {id: _, ...result} = favorite
    return result
  } else {
    return undefined
  }
}

const mostBlogs = (blogs) => {
  if (blogs.length != 0) {
    const authorCount = _.countBy(blogs, "author")
    const mostFrequent = _.maxBy(_.keys(authorCount), (author) => authorCount[author])
    return { author: mostFrequent, blogs: authorCount[mostFrequent] }
  } else {
    return undefined
  }
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs
}