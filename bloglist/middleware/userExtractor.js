const jwt = require('jsonwebtoken')

const userExtractor = async (request, response, next) => {
  if (request.token) {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken) {
      response.status(401).json({ error: 'invalid token'})
    }

    request.user = await User.findById(decodedToken.id)
  }
  
  next()
}

module.exports = userExtractor