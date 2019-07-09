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
                    expect(res.body).to.have.length(2);
                    expect(res.body[0].title).to.eql('The Hair Squeege');
                    expect(res.body[0]).to.contain.keys('title', 'description', 'price', 'img', 'sold', 'profit', 'ad', 'id');
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
});