const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
    return [
        {
        id: 1,
        username: 'Tester',
        description: 'A test description',
        password: 'password',
        money: 150
        },
        {
        id: 2,
        username: 'Tester 2',
        description: 'A second test description',
        password: 'password1',
        money: 150
        },
        {
        id: 3,
        username: 'Tester 3',
        description: 'A third test description',
        password: 'password3',
        money: 150
        },
    ]
}

function cleanTables(db) {
    return db.raw(
    `TRUNCATE
        users
        RESTART IDENTITY CASCADE`)
}

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }))
    return db
        .into('users')
        .insert(preppedUsers)
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({user_id: user.id}, secret, {
        subject: user.username,
        algorithm: 'HS256'
    })
    return `Bearer ${token}`
}

module.exports = {
    makeUsersArray,
    cleanTables,
    seedUsers,
    makeAuthHeader
}