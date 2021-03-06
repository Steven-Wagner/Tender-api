const knex = require('knex')
const app = require('../../src/app')
const helpers = require('../test-helpers')
// const {adCosts} =  require('../../src/config');
const adService = require('../../src/ads/adService');

describe('New Product Endpoint', function() {
    let db
    let adCosts

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[0];
    const newProduct = helpers.makeNewProduct();

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

    before('get adCosts', async function () {await adService.getSimpleAdCosts(db).then(adCatagories => adCosts=adCatagories)});

    before('cleanup', async function () { await helpers.cleanTables(db)});

    afterEach('cleanup', async function () {return await helpers.cleanTables(db)});

    describe('POST /api/yourproducts/:user_id', () => {
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
        describe('Validate POST', () => {
            context('Required fields', () => {
                const requiredFeilds = ['title', 'price'];
                requiredFeilds.forEach(key => {
                    it(`responds 400 when ${key} is missing`, () => {
                        const userId = testUser.id;
                        const product = Object.assign({}, newProduct);
                        product[key] = '';
                        
                        return request(app)
                        .post(`/api/yourproducts/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .send(product)
                        .expect(400)
                        .then(res => {
                            expect(res.body.message).to.eql(`${key} is required`);
                        })
                    })
                })

                it('responds 400 when description is over 1000 characters', () => {
                    const userId = testUser.id;
                    const product = Object.assign({}, newProduct);
                    product.description = helpers.randomString(1001);
                    return request(app)
                    .post(`/api/yourproducts/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(product)
                    .expect(400)
                    .then(res => {
                        expect(res.body.message).to.eql('Description can not exceed 1000 charaters');
                    })
                })
                it('responds 400 when title is already taken', () => {
                    const userId = testUser.id;
                    const product = Object.assign({}, newProduct);
                    product.title = testProducts[0].title;
                    return request(app)
                    .post(`/api/yourproducts/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(product)
                    .expect(400)
                    .then(res => {
                        expect(res.body.message).to.eql(`${testProducts[0].title} is already taken`);
                    })
                })
            })
            context('all ad choices are succesful', () => {
                const adChoices = ['Homepage ads', 'None', 'Popup ads', 'Annoying ads']
                adChoices.forEach(ad => {
                    it(`Responds 200 when user chooses ${ad}`, () => {
                        product = Object.assign({}, newProduct);
                        product.ad = ad;

                        const userId = testUser.id;
                                
                        return request(app)
                        .post(`/api/yourproducts/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .send(product)
                        .expect(200)
                        .then(res => {
                            return db
                                .from('products')
                                .where('title', product.title)
                                .first()
                            .then(theNewProduct => {
                                expect(theNewProduct.ad).to.eql(product.ad)
                            })
                        })
                    })
                })
            })
            it('responds 400 when incorrect ad choice is submitted', () => {
                product = Object.assign({}, newProduct);
                product.ad = 'wrong choice';

                const userId = testUser.id;
                        
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(400)
                .then(res => {
                    return db
                        .from('products')
                        .where('title', product.title)
                        .first()
                    .then(returnedProduct => {
                        expect(returnedProduct).to.be.undefined;
                        expect(res.body.message).to.eql(`Ads can only be 'None', 'Homepage ads', 'Popup ads', 'Annoying ads'`);
                    })
                })
            })
            it('responds 400 when user can not afford ad', () => {
                const testUser = testUsers[3];
                const userId = testUser.id;
                const product = Object.assign({}, newProduct);
                product.ad = 'Annoying ads'
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(400)
                .then(res => {
                    expect(res.body.message).to.eql('You can not afford the ad payment');
                })
            })
        })
        describe('happy path', () => {
            it('responds 200 and new product id', () => {
                const userId = testUser.id;
                const product = Object.assign({}, newProduct);
                
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(200)
                .then(res => {
                    expect(res.body.id).to.eql(testProducts.length+1);
                })
            })
            it('responds 200 and ad is payed for', () => {
                const userId = testUser.id;
                const product = Object.assign({}, newProduct);
                product.ad = 'Homepage ads';
                
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(200)
                .then(res => {
                    return db
                        .from('users')
                        .where('id', userId)
                        .select('money')
                        .first()
                        .then(money => {
                            expect(parseFloat(money.money)).to.eql(parseFloat(testUser.money)-parseFloat(adCosts[product.ad]))
                        })
                })
            })
            it('responds 200 and profit is subtracted from product for ad payment', () => {
                const userId = testUser.id;
                const product = Object.assign({}, newProduct);
                product.profit = 0;
                product.ad = 'Annoying ads';
                        
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(200)
                .then(res => {
                    return db
                        .from('products')
                        .where('id', res.body.id)
                        .select('profit')
                        .first()
                        .then(profit => {
                            expect(parseFloat(profit.profit)).to.eql(parseFloat(product.profit - parseFloat(adCosts[product.ad])))
                        })
                })
            })
            it('responds 200 and profit is not subtracted from product for ad: None', () => {
                const userId = testUser.id;
                const product = Object.assign({}, newProduct);
                product.profit = 0;
                product.ad = 'None';
                        
                return request(app)
                .post(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(product)
                .expect(200)
                .then(res => {
                    return db
                        .from('products')
                        .where('id', res.body.id)
                        .select('profit')
                        .first()
                        .then(profit => {
                            expect(parseFloat(profit.profit)).to.eql(parseFloat(product.profit))
                        })
                })
            })
        })
    })
})