const bcrypt = require('bcryptjs')

const SignUpService = {
    getUserWithUserName(db, username) {
        return db('users')
          .where({ username })
          .first()
    },
    insertUser(db, userData) {
        return db
            .insert(userData)
            .into('users')
            .returning('id')  
            .then(([id]) => id) 
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12)
    }
}

module.exports = SignUpService