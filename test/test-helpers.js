const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const oneDay = 61 * 60 * 24 * 1000;

const now = new Date();

function makeUsersArray() {
    return [
        {
        id: 1,
        username: 'Tester',
        description: 'A test description',
        password: 'password',
        money: '150.0000'
        },
        {
        id: 2,
        username: 'Tester 2',
        description: 'A second test description',
        password: 'password1',
        money: '150.0000'
        },
        {
        id: 3,
        username: 'Tester 3',
        description: 'A third test description',
        password: 'password3',
        money: '150.0000'
        },
        {
        id: 4,
        username: 'Tester 4',
        description: 'A fourth test description',
        password: 'password4',
        money: '10.0000'
        },
    ]
}

function makePurchasedProductsArray() {
    return [{
        product_id: 1,
        buyer_id: 2
    }]
}

function makeNewProduct() {
    return {
        title: 'New Product Title',
        description: 'A new product',
        img: 'https://www.google.com/imgres?imgurl=https%3A%2F%2Fimgix.bustle.com%2Fuploads%2Fimage%2F2018%2F7%2F27%2F91ecdcac-446e-45f6-be76-958336ea3069-38-weird-products-reformat020.jpeg&imgrefurl=https%3A%2F%2Fwww.bustle.com%2Fp%2F37-weird-products-on-amazon-that-are-so-cheap-theyre-essentially-free-9911253&docid=Twf8GULvwwIz8M&tbnid=e8Mpea5IE_7uDM%3A&vet=10ahUKEwi7vs6Y6bLjAhVyds0KHVXNCj0QMwjaASgBMAE..i&w=1600&h=1200&bih=568&biw=1242&q=weird%20product&ved=0ahUKEwi7vs6Y6bLjAhVyds0KHVXNCj0QMwjaASgBMAE&iact=mrc&uact=8'
        ,price: '2.0000',
        ad: 'None'
    }
}

function makeProductsArray() {
    return [
        {
            id: 1,
            title: 'The Hair Squeege',
            img: 'https://i.kinja-img.com/gawker-media/image/upload/s--tZIa_IA1--/c_fill,f_auto,fl_progressive,g_center,h_675,pg_1,q_80,w_1200/1810e79awrtl9jpg.jpg',
            description: 'Squeege your hair the way you were always meant to.',
            price: '2.0000',
            sold: 2,
            profit: '4.0000',
            ad: 'Popup ads',
            creator_id: 1,
        },
        {
            id: 2,
            title: 'Slip Resistant Socks',
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'You never have to wear shoes to work ever again!',
            price: '3.0000',
            sold: 4,
            profit: '12.0000',
            ad: 'Homepage ads',
            creator_id: 1,
        },
        {
            id: 3,
            title: 'Old Product',
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'A product from a long time ago',
            price: '3.0000',
            sold: 4,
            profit: '12.0000',
            ad: 'Homepage ads',
            creator_id: 1,
            date_created: new Date(now-oneDay),
            last_ad_payment: new Date(now-oneDay)
        },
        {
            id: 4,
            title: 'Expensive Product',
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'A product that should be too expesive to purchase',
            price: '30000.0000',
            sold: 4,
            profit: '12.0000',
            ad: 'Annoying ads',
            creator_id: 1
        },
        {
            id: 5,
            title: `Can't afford ad payment Product`,
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'A product that should be too expesive to purchase',
            price: '10.0000',
            sold: 4,
            profit: '40.0000',
            ad: 'Annoying ads',
            creator_id: 4,
            date_created: new Date(now-oneDay),
            last_ad_payment: new Date(now-oneDay)
        },
        {
            id: 6,
            title: `Can just barely afford item`,
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'A product that user can just pay ad for',
            price: '10.0000',
            sold: 4,
            profit: '40.0000',
            ad: 'Homepage ads',
            creator_id: 4,
            date_created: new Date(now-oneDay),
            last_ad_payment: new Date(now-oneDay)
        },
        {
            id: 7,
            title: `User can't pay ad payment bc they already payed other ads`,
            img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTFk_cXo-RkuPFKdls7vyFQIPxr-Su2UMjMmkroNEm7wmNmnM0BTqGZCy4ep0XNaKOBFWz_q5Cvmvm9tIQoSzx2HBwPpk6OzRP3U8VAfHhvXAnKhPunFwY3&usqp=CAc',
            description: 'A product that should be too expesive to pay for the ad',
            price: '10.0000',
            sold: 4,
            profit: '40.0000',
            ad: 'Annoying ads',
            creator_id: 4,
            date_created: new Date(now-oneDay),
            last_ad_payment: new Date(now-oneDay)
        },
    ]
}

function cleanTables(db) {
    return db.raw(
    `TRUNCATE
        users,
        products,
        purchased_products
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

function seedPurchasedProducts(db, purchasedProducts) {
    return db
        .into('purchased_products')
        .insert(purchasedProducts)
}

function seedProducts(db, products) {
    preparedProducts = products.map(product => {
        const newProduct = Object.assign({}, product);
        delete newProduct.id;
        return newProduct
    })
    return db
        .into('products')
        .insert(preparedProducts)
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({user_id: user.id}, secret, {
        subject: user.username,
        algorithm: 'HS256'
    })
    return `Bearer ${token}`
}

function randomString(len) {
    var text = "";

    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

module.exports = {
    makeUsersArray,
    makeProductsArray,
    makeNewProduct,
    makePurchasedProductsArray,
    cleanTables,
    seedUsers,
    seedProducts,
    seedPurchasedProducts,
    makeAuthHeader,
    randomString
}