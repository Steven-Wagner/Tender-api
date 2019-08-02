const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const adService = require('../src/ads/adService');

describe('ad payments', function() {
    let db;
    let adCosts;

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

    before('get adCosts', async function () {await adService.getSimpleAdCosts(db).then(adCatagories => adCosts=adCatagories)});

    after('disconnect from db', () => db.destroy());

    before('cleanup', async function () {return await helpers.cleanTables(db)});

    afterEach('cleanup', async function () {return await helpers.cleanTables(db)});

    describe('happy path', () => {
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
        it('Payment for ads over 24 hours since last payment are made', () => {
            testProduct = testProducts[2];
            testUserMoney = testUser.money;
            const moneySpent = testProducts.reduce(function(total, product) {
                if (product.creator_id === testUser.id && product.last_ad_payment) {
                    return parseFloat(total) + parseFloat(adCosts[product.ad]);
                }
                else {
                    return parseFloat(total);
                }
            }, 0);

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('users')
                .where('id', testUser.id)
                .select('money')
                .first()
                .then(userMoney => {
                    expect(parseFloat(userMoney.money)).to.eql(parseFloat(testUserMoney)-parseFloat(moneySpent))
                })
            })
        })
        it('Payment for ad is made and last_ad_payment is updated', () => {
            const testProduct = testProducts[2];
            const oldLast_ad_payment = testProduct.last_ad_payment;

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('products')
                .where('id', testProduct.id)
                .select('last_ad_payment')
                .first()
                .then(paymentDate => {
                    expect(paymentDate.last_ad_payment).to.not.eql(oldLast_ad_payment)
                })
            })
        })
        it('When user can not afford ad payment porducts ad is set to None', () => {
            const testProduct = testProducts[4];

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('products')
                .where('id', testProduct.id)
                .select('ad')
                .first()
                .then(adType => {
                    expect(adType.ad).to.eql('None')
                })
            })
        })
        it('User can afford one ad payment but not the next', () => {
            const affordAdPayment = testProducts[5];
            const cantAffordAdPayment = testProducts[6];

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('products')
                .where('id', affordAdPayment.id)
                .select('ad')
                .first()
                .then(adType => {
                    expect(adType.ad).to.eql(affordAdPayment.ad)
                    
                    return db
                    .from('products')
                    .where('id', cantAffordAdPayment.id)
                    .select('ad')
                    .first()
                    .then(adType => {
                        expect(adType.ad).to.eql('None')
                    })
                })
            })
        })
        it('Ad payment is subtracted from products profit', () => {
            testProduct = testProducts[2];
            testProductProfit = testProduct.profit - adCosts[testProduct.ad];

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('products')
                .where('id', testProduct.id)
                .select('profit')
                .first()
                .then(profit => {
                    expect(parseFloat(profit.profit)).to.eql(parseFloat(testProductProfit))
                })
            })
        })
        it('Ad payment is subtracted from products profit even when profit will be negative', () => {
            testProduct = testProducts[8];
            testProductProfit = testProduct.profit - adCosts[testProduct.ad];

            return adService.checkAdPayments(db)
            .then(() => {
                return db
                .from('products')
                .where('id', testProduct.id)
                .select('*')
                .first()
                .then(profit => {
                    expect(parseFloat(profit.profit)).to.eql(parseFloat(testProductProfit))
                })
            })
        })
    })
})