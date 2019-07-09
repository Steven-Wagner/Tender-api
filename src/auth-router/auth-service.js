const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')

const AuthService = {
  getUserWithUserName(db, username) {
    console.log('uername', username)
    return db('users')
      .where( {username} )
      .first()
  },
  createJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      algorithm: 'HS256'
    })
  },
  verifyJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256']
    })
  },
  comparePasswords(password, hash) {
    return bcrypt.compare(password, hash)
  },
}

module.exports = AuthService