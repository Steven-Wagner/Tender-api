const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const jwt = require('jsonwebtoken')

describe('Your Products Endpoints', function() {
    let db

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[0];

    const testProducts = helpers.makeProductsArray();

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
        return db
    });

    after('disconnect from db', () => db.destroy());

    before('cleanup', () => helpers.cleanTables(db));

    afterEach('cleanup', () => helpers.cleanTables(db));

    describe('GET /api/yourproducts/:user_id', () => {
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
        });

        context('happy path', () => {
            it('responds 200 and returns all of the current user\'s products correctly', () => {
                const userId = testUser.id;
                
                return request(app)
                .get(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body).to.have.length(3);
                    expect(res.body[0].title).to.eql('The Hair Squeege');
                    expect(res.body[0]).to.contain.keys('title', 'description', 'price', 'img', 'sold', 'profit', 'ad', 'id', 'creator_id', 'date_created');
                })
            })
        })

        context('unauthorized requests', () => {
            it('responds 401 and Unauthorized request when improper user in header', () => {
                const userId = testUser.id;
                const wrongUsername = {username: 'wronguser'};
                const wrongUser = {...testUser, ...wrongUsername, }
                
                return request(app)
                .get(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(wrongUser))
                .expect(401)
                .then(res => {
                    expect(res.body.message).to.eql('Unauthorized request');
                })
            })
            it('responds 401 and Missing bearer token when auth header is missing', () => {
                const userId = testUser.id;
                
                return request(app)
                .get(`/api/yourproducts/${userId}`)
                .expect(401)
                .then(res => {
                    expect(res.body.message).to.eql('Missing bearer token');
                })
            })
        })
        context('No user id in request params', () => {
            it('repsponds 404 when no user in param request', () => {
                return request(app)
                .get(`/api/yourproducts/`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(404)
            })
        })
        context('Edge Cases', () => {
            it('responds 200 and empty list when no products in your products request', () => {
                const userWithNoProducts = testUsers[1];
                const userId = userWithNoProducts.id;
                
                return request(app)
                .get(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(userWithNoProducts))
                .expect(200)
                .then(res => {
                    expect(res.body).to.have.length(0);
                })
            })
        })
    })

    describe('PATCH /api/yourproducts', () => {
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
        });
        describe('update price, ad', () => {
            context('price tests', () => {
                it('Responds 200 when user edits a products price', () => {
                    testProduct = Object.assign({}, testProducts[0]);
                    testProduct.price = '100.0000';

                    const userId = testUser.id;
                            
                    return request(app)
                    .patch(`/api/yourproducts/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(testProduct)
                    .expect(200)
                    .then(res => {
                        return db
                            .from('products')
                            .where('id', testProduct.id)
                            .first()
                        .then(updatedProduct => {
                            expect(updatedProduct.price).to.eql(testProduct.price)
                        })
                    })
                })
                it('responds 400 when price is not a number', () => {
                    testProduct = Object.assign({}, testProducts[0]);
                    testProduct.price = 'a10';

                    const userId = testUser.id;
                            
                    return request(app)
                    .patch(`/api/yourproducts/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(testProduct)
                    .expect(400)
                    .then(res => {
                        return db
                            .from('products')
                            .where('id', testProduct.id)
                            .first()
                        .then(updatedProduct => {
                            expect(updatedProduct.price).to.eql(testProducts[0].price);
                            expect(res.body.message).to.eql(`Price must be a number above 1`);
                        })
                    })
                })
            })
            context('ad test', () => {
                context('all ad choices are succesful', () => {
                    const adChoices = ['Homepage ads', 'None', 'Popup ads', 'Annoying ads']
                    adChoices.forEach(ad => {
                        it(`Responds 200 when user edits a products ad to ${ad}`, () => {
                            testProduct = Object.assign({}, testProducts[0]);
                            testProduct.ad = ad;

                            const userId = testUser.id;
                                    
                            return request(app)
                            .patch(`/api/yourproducts/${userId}`)
                            .set('Authorization', helpers.makeAuthHeader(testUser))
                            .send(testProduct)
                            .expect(200)
                            .then(res => {
                                return db
                                    .from('products')
                                    .where('id', testProduct.id)
                                    .first()
                                .then(updatedProduct => {
                                    expect(updatedProduct.ad).to.eql(testProduct.ad)
                                })
                            })
                        })
                    })
                })
                it('responds 400 when incorrect ad choice is submitted', () => {
                    testProduct = Object.assign({}, testProducts[0]);
                    testProduct.ad = 'wrong choice';

                    const userId = testUser.id;
                            
                    return request(app)
                    .patch(`/api/yourproducts/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(testProduct)
                    .expect(400)
                    .then(res => {
                        return db
                            .from('products')
                            .where('id', testProduct.id)
                            .first()
                        .then(updatedProduct => {
                            expect(updatedProduct.ad).to.eql(testProducts[0].ad);
                            expect(res.body.message).to.eql(`Ads can only be 'None', 'Homepage ads', 'Popup ads', 'Annoying ads'`);
                        })
                    })
                })
            })
        })
        describe('Wrong Id', () => {
            it('Responds 401 when user tries to update product they didn\'t create', () => {
                const testUser = testUsers[1];
                const testProduct = Object.assign({}, testProducts[0]);
                testProduct.price = 100;

                const userId = testUser.id;
                        
                return request(app)
                .patch(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(testProduct)
                .expect(401)
                .then(res => {
                    expect(res.body.message).to.eql('Unauthorized request')
                })
            })
            it('Responds 400 when product.id is not in database', () => {
                const testUser = testUsers[0];
                const testProduct = Object.assign({}, testProducts[0]);
                testProduct.id = testProducts.length+1;

                const userId = testUser.id;
                        
                return request(app)
                .patch(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(testProduct)
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql(`Invalid id`)
                })
            })
            it('Responds 400 when product.id is missing', () => {
                const testUser = testUsers[0];
                const testProduct = Object.assign({}, testProducts[0]);
                testProduct.id = undefined;

                const userId = testUser.id;
                        
                return request(app)
                .patch(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(testProduct)
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql(`Product id is required`)
                })
            })
        })
        describe('Edits of title, img, description', () => {
            it('responds 400 when user tries to change to title that already exists', () => {
                const testUser = testUsers[0];
                const testProduct = Object.assign({}, testProducts[0]);
                testProduct.title = testProducts[1].title;

                const userId = testUser.id;
                        
                return request(app)
                .patch(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(testProduct)
                .expect(400)
                .then(res => {
                    console.log('response', res.body)
                })
            })
            
            context('User tries to edit after 24 hours', () => {
                const editBefore24Hours = ['title', 'img', 'description'];

                editBefore24Hours.forEach(key => {
                    it(`Responds 400 when ${key} is updated after 24 hours`, () => {
                        const testUser = testUsers[0];
                        const testProduct = Object.assign({}, testProducts[2]);
                        testProduct[key] = `updated ${key}`;

                        const userId = testUser.id;
                                
                        return request(app)
                        .patch(`/api/yourproducts/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .send(testProduct)
                        .expect(400)
                        .then(res => {
                            expect(res.body.message).to.eql(`title, img, and description can only be edited in the first 24 hours after posting the product.`)
                        })
                    })
                })
            })
            context('happy path for title, img, and description update', () => {
                const editBefore24Hours = ['title', 'img', 'description'];

                editBefore24Hours.forEach(key => {
                    it(`responds 200 and updates ${key}`, () => {
                        const testUser = testUsers[0];
                        const testProduct = Object.assign({}, testProducts[0]);
                        testProduct[key] = `updated ${key}`;

                        const userId = testUser.id;
                                
                        return request(app)
                        .patch(`/api/yourproducts/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .send(testProduct)
                        .expect(200)
                        .then(res => {
                            return db
                                .from('products')
                                .where('id', res.body)
                                .first()
                            .then(updatedProduct => {
                                expect(updatedProduct[key]).to.eql(testProduct[key])
                            })
                        })
                    })
                })
            })
        })
    })
});