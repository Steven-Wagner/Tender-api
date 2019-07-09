const yourProductsService = {
    getProducts(db, user_id) {
        return db
            .from('products')
            .where('creator_id', user_id)
            .select(
                'id',
                'img',
                'title',
                'description',
                'price',
                'sold',
                'profit',
                'ad'
            )
    }
}

module.exports = yourProductsService;