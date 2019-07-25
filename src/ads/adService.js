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
    }
}

module.exports = adService;