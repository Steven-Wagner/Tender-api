const knex = require('knex')
const app = require('../../src/app')
const helpers = require('../test-helpers')

describe('Your Products Endpoints', function() {
    let db

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[0];

    const testProducts = helpers.makeProductsArray();

    const purchasedProducts = helpers.makePurchasedProductsArray();

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

    describe('GET /api/yourproducts/popular/:user_id', () => {
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
        beforeEach('insert purchased products', async function () {
            return await helpers.seedPurchasedProducts(
                db,
                purchasedProducts
            );
        });

        context('happy path', () => {
            it('responds 200 and returns users most popular products', () => {
                const userId = testUser.id;
                
                return request(app)
                .get(`/api/yourproducts/popular/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body[0].sold).to.eql(testProducts[1].sold);
                    expect(res.body[0].title).to.eql(testProducts[1].title);
                    expect(res.body.length).to.eql(3);
                })
            })
        })
    })
})