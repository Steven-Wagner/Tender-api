const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const jwt = require('jsonwebtoken')

describe('Buy Product Endpoint', function() {
    let db

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[2];

    const testProducts = helpers.makeProductsArray();

    const testPurchasedProducts = helpers.makePurchasedProductsArray();

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
        return db
    });

    after('disconnect from db', () => db.destroy());

    before('cleanup', async function () { await helpers.cleanTables(db)});

    afterEach('cleanup', async function () {return await helpers.cleanTables(db)});

    describe('GET /api/shopProducts/purchase/:user_id', () => {
        beforeEach('insert users', async function () {
            return await helpers.seedUsers(
                db,
                testUsers
            );
        });
        beforeEach('insert products', async function () {
            return await helpers.seedProducts(
                db,
                testProducts
            );
        })
        beforeEach('insert purchasedProducts', async function () {
            return await helpers.seedPurchasedProducts(
                db,
                testPurchasedProducts
            );
        })
        it('Responds 200 and recives shopping list', () => {
            const userId = testUser.id;
            
            return request(app)
            .get(`/api/shopProducts/${userId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(200)
            .then(res => {
                expect(res.body.shoppingProducts).to.have.length(testProducts.length);
            })
        })
        it('Responds 200 and shopping list does not contain products created by the requesting user', () => {
            const userId = testUsers[0].id;
            
            return request(app)
            .get(`/api/shopProducts/${userId}`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
            .expect(200)
            .then(res => {
                expect(res.body.shoppingProducts).to.have.length(0);
            })
        })
        it('Responds 200 and shopping list does not contain products already purchased', () => {
            const userId = testUsers[1].id;
            
            return request(app)
            .get(`/api/shopProducts/${userId}`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
            .expect(200)
            .then(res => {
                expect(res.body.shoppingProducts).to.have.length(testProducts.length-1);
            })
        })
    })

    describe('POST /api/shopProducts/purchase/:user_id', () => {
        beforeEach('insert users', async function () {
            return await helpers.seedUsers(
                db,
                testUsers
            );
        });
        beforeEach('insert products', async function () {
            return await helpers.seedProducts(
                db,
                testProducts
            );
        })
        beforeEach('insert purchasedProducts', async function () {
            return await helpers.seedPurchasedProducts(
                db,
                testPurchasedProducts
            );
        })
        describe('Validate request', () => {
            it('responds 400 when product_id does not exist', () => {
                const userId = testUser.id;
                const productId = testProducts.length+1;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send({product_id: productId})
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql('product_id invalid');
                })
            })
            it('responds 400 when user can not afford item', () => {
                const userId = testUser.id;
                const productId = testProducts[3].id;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send({product_id: productId})
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql(`You can't afford this item`);
                })
            })
            it('responds 400 when user attempts to purchase an item they already own', () => {
                const userId = testPurchasedProducts[0].buyer_id;
                const productId = testPurchasedProducts[0].product_id;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[userId-1]))
                .send({product_id: productId})
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql(`You have already purchased this product`);
                })
            })
        })
        describe('happy path', () => {
            it('responds 200 and returns new id', () => {
                const userId = testUser.id;
                const productId = testProducts[0].id;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send({product_id: productId})
                .expect(200)
                .then(res => {
                    expect(res.body.id).to.eql(testPurchasedProducts.length+1);
                })
            })
            it('responds 200 and price is subtracted from buyers total', () => {
                const userId = testUser.id;
                const productId = testProducts[0].id;
                const userMoney = testUser.money;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send({product_id: productId})
                .expect(200)
                .then(res => {
                    return db
                        .from('users')
                        .where('id', userId)
                        .select('money')
                        .then(money => {
                            expect(parseFloat(money[0].money)).to.eql((parseFloat(userMoney))-parseFloat(testProducts[0].price))
                        })
                })
            })
            it('responds 200 and price is added to creator money', () => {
                const userId = testUser.id;
                const productId = testProducts[0].id;
                const creator_id = testProducts[0].creator_id;
                const creatorMoney = testUsers[creator_id-1].money;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send({product_id: productId})
                .expect(200)
                .then(res => {
                    return db
                        .from('users')
                        .where('id', creator_id)
                        .select('money')
                        .then(money => {
                            expect(parseFloat(money[0].money)).to.eql((parseFloat(creatorMoney))+parseFloat(testProducts[0].price))
                        })
                })
            })
            it('responds 200 and bonus is added bonus', () => {
                const userBuysProductId = testUsers[2].id;
                const userId = testPurchasedProducts[0].buyer_id;
                const productId = testProducts[0].id;
                const expectedBonus = testProducts[0].price*.01;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userBuysProductId}`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[2]))
                .send({product_id: productId})
                .then(res => {
                    return db
                        .from('purchased_products')
                        .where('buyer_id', userId)
                        .select('bonus')
                        .then(bonus => {
                            expect(parseFloat(bonus[0].bonus)).to.eql((parseFloat(expectedBonus)))
                        })
                })
            })
            it('responds 200 and bonus is added to money', () => {
                const userBuysProductId = testUsers[2].id;
                const userId = testPurchasedProducts[0].buyer_id;
                const productId = testProducts[0].id;
                
                return request(app)
                .post(`/api/shopProducts/purchase/${userBuysProductId}`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[2]))
                .send({product_id: productId})
                .then(res => {
                    return db
                        .from('users')
                        .where('id', userId)
                        .select('money')
                        .then(money => {
                            expect(parseFloat(money[0].money)).to.eql((parseFloat(testUsers[userId-1].money))+parseFloat(testProducts[0].price*.01))
                        })
                })
            })
        })
    })
})