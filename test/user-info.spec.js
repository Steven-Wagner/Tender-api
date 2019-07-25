const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('user-info Endpoints', function() {
    let db

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[0];

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

    before('cleanup', async function () { return await helpers.cleanTables(db)});

    afterEach('cleanup', async function () {return await helpers.cleanTables(db)});

    describe('GET /api/userinfo/:user_id', () => {
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

        it('Responds 401 with incorrect user_id', () => {
            const badUserId = testUser.length+1;
            
            return request(app)
            .get(`/api/userInfo/${badUserId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(401)
            .then(res => {
                expect(res.body.message).to.eql('Unauthorized request');
            })
        })
        context('happy path', () => {
            it('Responds 200 with correct user info', () => {
                const userId = testUser.id;
                
                return request(app)
                .get(`/api/userInfo/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body.userInfo.money).to.eql(testUser.money);
                    expect(res.body.userInfo.description).to.eql(testUser.description);
                    expect(res.body.userInfo.username).to.eql(testUser.username);
                })
            })
        })
    })
})