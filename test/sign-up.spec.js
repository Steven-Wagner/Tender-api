const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', function() {
    let db

    const testUsers = helpers.makeUsersArray();
    const testUser = helpers.makeNewUser();

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
        return db
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', async function() {await helpers.cleanTables(db)})

    afterEach('cleanup', async function() {await helpers.cleanTables(db)})

    describe(`POST /api/signup/`, () => {
        beforeEach('insert users', () => 
            helpers.seedUsers(
                db,
                testUsers
            )
        )

        const requiredFields = ['username', 'password']

        requiredFields.forEach(field => {
            const newUser = {
            username: testUser.username,
            password: testUser.password,
            description: testUser.description
            }

            it(`responds with 400 when '${field}' is missing`, () => {
                delete newUser[field]

                return request(app)
                .post('/api/signup/')
                .send(newUser)
                .expect(400, {
                    message: `${field} is required`,
                })
            })
        })

        it(`responds with 400 when username in different case is taken`, () => {
            const newUser = Object.assign({}, testUser);
            newUser.username = testUsers[0].username.toUpperCase();

            return request(app)
                .post('/api/signup/')
                .send(newUser)
                .expect(400, { message: `username already exists` })
        })
        
        it(`responds with 400 when username is already taken`, () => {
            const newUser = Object.assign({}, testUser);
            newUser.username = testUsers[0].username;

            return request(app)
                .post('/api/signup/')
                .send(newUser)
                .expect(400, { message: `username already exists` })
        })
        context('happy path', () => {
            it('Responds 201 and new id', () => {
                return request(app)
                    .post('/api/signup/')
                    .send(testUser)
                    .expect(201)
                    .then(res => {
                        expect(res.body.user_id).to.eql(testUsers.length+1);
                    })
            })
            it('Responds 201 and data is added correctly', () => {
                return request(app)
                    .post('/api/signup/')
                    .send(testUser)
                    .expect(201)
                    .then(res => {
                        return db
                            .from('users')
                            .where('id', res.body.user_id)
                            .select('username', 'description', 'password')
                            .first()
                            .then(userInfo => {
                                expect(userInfo.username).to.eql(testUser.username);
                                expect(userInfo.description).to.eql(testUser.description);
                                return bcrypt.compare(testUser.password, userInfo.password)
                                .then(samePassword => {
                                    expect(samePassword).to.be.true;
                                })
                            })
                    })
            })
        })
    })
})