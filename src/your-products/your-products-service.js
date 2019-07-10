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
                'ad',
                'creator_id',
                'date_created'
            )
    },
    getProductById(db, id) {
        return db
            .from('products')
            .where('id', id)
            .first()
    },
    getProductByTitle(db, title) {
        return db
            .from('products')
            .where('title', title)
    },
    productOver24HoursOld(productDate) {
        const now = new Date();
        const oneDay = 60 * 60 * 24 * 1000;
        //convert date string to date format
        const formattedProductDate = new Date(productDate);
        return (now - formattedProductDate) > oneDay;
    },

    async validateUpdate(product, user_id, res, db) {
        if (!product.id) {
            return res.status(400).json({
                message: `Product id is required`
            })
        }
        //Get product from database by id
        return await yourProductsService.getProductById(
            db,
            product.id
        )
        .then(oldProduct => {
            if (!oldProduct) {
                return res.status(400).json({
                    message: `Invalid id`
                })
            }
            if (parseInt(oldProduct.creator_id) !== parseInt(user_id)) {
                return res.status(401).json({
                    message: 'Unauthorized request'
                })
            }

            const productDateOver24Hours = yourProductsService.productOver24HoursOld(oldProduct.date_created);

            if (productDateOver24Hours) {
                //title, img, description can only be edited 25 hours after product is created
                if (product.title !== oldProduct.title || product.img !== oldProduct.img || product.description !== oldProduct.description) {
                    return res.status(400).json({
                        message: `title, img, and description can only be edited in the first 24 hours after posting the product.`
                    })
                }
            }

            if (product.title !== oldProduct.title) {
                return yourProductsService.getProductByTitle(db, product.title)
                .then(productByTitleArray => {
                    if (productByTitleArray.length > 0) {
                        return res.status(400).json({
                            message: `Title is already taken`
                        })
                    }
                })
                .catch(error => {
                    next(error)
                })
            }

            if (isNaN(product.price) || parseFloat(product.price) < 1) {
                return res.status(400).json({
                    message: `Price must be a number above 1`
                })
            }
            
            const adChoices = ['None', 'Homepage ads', 'Popup ads', 'Annoying ads'];
            if (!adChoices.includes(product.ad)) {
                return res.status(400).json({
                    message: `Ads can only be 'None', 'Homepage ads', 'Popup ads', 'Annoying ads'`
                })
            }

            return false;
        })
        .catch(error => {
            next(error)
        })
    },
    updateProduct(db, product) {
        return db
            .from('products')
            .where('id', product.id)
            .update({
                title: product.title,
                img: product.img,
                description: product.description,
                price: product.price,
                ad: product.ad
            })
    }
}

module.exports = yourProductsService;