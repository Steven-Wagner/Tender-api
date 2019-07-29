const adService = {
    getAds(user_id, adType, db) {
        return db
            // get products already purchased
            .from('purchased_products')
            .where('buyer_id', user_id)
            .pluck('product_id')
            .then(productsAlreadyPurchased => {
                //remove purchased products and products created by the current user
                return db('products')
                .where('ad', adType)
                .whereNotIn('id', productsAlreadyPurchased)
                .andWhereNot('creator_id', user_id)
                .orderByRaw('RANDOM() LIMIT 1')
            })
    },
    validateAdType(adType) {
        const adTypes = ['Homepage ads', 'Popup ads', 'Annoying ads'];
        if (!adTypes.includes(adType)) {
            return true;
        }
        else {
            return false;
        }
    },
    async checkAdPayments(db) {
        debugger
        const currentDate = new Date();
        const oneDay = 60 * 60 * 24 * 1000;
        const aDayAgo = new Date (currentDate - oneDay);

        const adCosts = [{catagory:'Homepage ads', cost: 10}, {catagory: 'Popup ads', cost: 15}, {catagory: 'Annoying ads', cost: 20}]

        for (let i=0; i<adCosts.length; i++) {
            await this.payAds(adCosts[i], aDayAgo, db)
        }
        return;
    },
    async payAds(adType, aDayAgo, db) {
        const adsToBeCharged = await this.getAdsToBeCharged(adType, aDayAgo, db);
        for (let i=0; i<adsToBeCharged.length; i++) {
            await this.payForAd(adsToBeCharged[i], adType, db)
        }
        return;


    },
    async payForAd(product, adType, db) {
        const creator_id = product.creator_id
        return await db
            .from('users')
            .where('id', creator_id)
            .select('money')
            .first()
            .then(userMoney => {
                if (parseFloat(userMoney.money) >= parseFloat(adType.cost)) {
                    return db
                        .into('users')
                        .where('id', creator_id)
                        .update({
                            money: (userMoney.money-adType.cost)
                        })
                        .then(res => {
                            return db
                                .from('products')
                                .where('id', product.id)
                                .update({
                                    last_ad_payment: 'now()'
                                })
                        })
                }
                else {
                    return db
                        .from('products')
                        .where('id', product.id)
                        .update({
                            ad: 'None'
                        })
                }
            })
    },
    getAdsToBeCharged(adType, aDayAgo, db) {
        return db
        .from('products')
        .where('ad', adType.catagory)
        .andWhere('last_ad_payment', '<=', aDayAgo)
        .select('*')
    }
}

module.exports = adService;