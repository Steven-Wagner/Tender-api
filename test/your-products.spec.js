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

    describe('GET /api/:user_id', () => {
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
            it('responds 200 and returns all of the current user\'s products', () => {
                const userId = testUser.id;
                
                return request(app)
                .get(`/api/yourproducts/${userId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(200)
                .then(res => {
                    expect(res.body).to.have.length(2);
                    expect(res.body[0].title).to.eql('The Hair Squeege');
                })
            })
        })
    })
});