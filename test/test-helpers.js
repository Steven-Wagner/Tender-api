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

function makeProductsArray() {
    return [
        {
            id: 1,
            title: 'The Hair Squeege',
            img: 'https://i.kinja-img.com/gawker-media/image/upload/s--tZIa_IA1--/c_fill,f_auto,fl_progressive,g_center,h_675,pg_1,q_80,w_1200/1810e79awrtl9jpg.jpg',
            description: 'Squeege your hair the way you were always meant to.',
            price: '2',
            sold: 2,
            profit: 4,
            ad: 'None',
            creator_id: 1
        },
        {
            id: 2,
            title: 'Slip Resistant Socks',
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'You never have to wear shoes to work ever again!',
            price: '3',
            sold: 4,
            profit: 12,
            ad: 'Homepage ads',
            creator_id: 1
        }
    ]
}

function cleanTables(db) {
    return db.raw(
    `TRUNCATE
        users,
        products
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

function seedProducts(db, products) {
    return db
        .into('products')
        .insert(products)
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
    makeProductsArray,
    cleanTables,
    seedUsers,
    seedProducts,
    makeAuthHeader
}