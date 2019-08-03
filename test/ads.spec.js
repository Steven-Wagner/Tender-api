const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('ads Endpoints', function() {
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

    describe('GET /api/ads/:adType/:user_id', () => {
        context('All tables have data', () => {
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
            const adTypes = ['Homepage ads', 'Popup ads', 'Annoying ads']
            adTypes.forEach(adType => {
                it(`Responds 200 and recives a ${adType} ad`, () => {
                    const userId = testUser.id;

                    return request(app)
                    .get(`/api/ads/${adType}/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200)
                    .then(res => {
                        expect(res.body.newAd.ad).to.eql(`${adType}`);
                    })
                })
            })
            it('responds 200 and already purchased products are not included', () => {
                const testUser = testUsers[1];
                const userId = testUser.id;
                const adType = 'Popup ads';

                return request(app)
                .get(`/api/ads/${adType}/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body.newAd).to.eql(undefined);
                })
            })
            it('responds 200 and products created by user are not included', () => {
                const testUser = testUsers[0];
                const userId = testUser.id;
                const adType = 'Popup ads';

                return request(app)
                .get(`/api/ads/${adType}/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body.newAd).to.eql(undefined);
                })
            })
            describe('validate parrams', () => {
                const adType = 'Homepage ads';
                
                it('invalid id', () => {
                    const userId = testUser.id+1;

                    return request(app)
                        .get(`/api/ads/${adType}/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(401)
                        .then(res => {
                            expect(res.body.message).to.eql('Unauthorized request');
                        })
                })
                it('invalid ad parram', () => {
                    const adType = 'Fake ad';
                    const userId = testUser.id;

                    return request(app)
                        .get(`/api/ads/${adType}/${userId}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(400)
                        .then(res => {
                            expect(res.body.message).to.eql(`Ad type, ${adType} does not exist`);
                        })
                })
            })
        })
        context('No products to show', () => {
            beforeEach('insert users', async function () {
                return await helpers.seedUsers(
                    db,
                    testUsers
                );
            });

            const adTypes = ['Homepage ads', 'Popup ads', 'Annoying ads']
            adTypes.forEach(adType => {
                it(`Responds 200 and recives an undefined newAd`, () => {
                    const userId = testUser.id;

                    return request(app)
                    .get(`/api/ads/${adType}/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200)
                    .then(res => {
                        expect(res.body.newAd).to.eql(undefined);
                    })
                })
            })
        })
    })
})
describe('adCosts endpointd', () => {
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

    describe('GET /api/adCosts/', () => {
        it('Responds 200 with adCost object', () => {
            return request(app)
            .get(`/api/adCosts/`)
            .expect(200)
            .then(res => {
                expect(res.body).to.contain.keys('Homepage ads', 'Popup ads', 'Annoying ads');
                expect(parseFloat(res.body['Homepage ads'])).to.be.a('number')
            })
        })
    })
})