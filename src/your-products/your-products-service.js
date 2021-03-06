const adService =  require('../ads/adService');

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
            .orderBy('date_created', 'desc')
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

    getUsersPurchasedProducts(db,  user_id) {
        return db
            .from('purchased_products')
            .where('buyer_id', user_id)
            .innerJoin('products', 'products.id', 'purchased_products.product_id')
            .select('product_id', 'bonus', 'img', 'title', 'description', 'price', 'sold', 'purchased_products.date_created')
            .orderBy('purchased_products.date_created', 'desc')
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
        .then(async function(oldProduct) {
            return adService.getSimpleAdCosts(db)
            .then(async function(adCosts) {
                const requiredFieldsNotValidated = yourProductsService.validateRequiredFields(product, res);
                if (requiredFieldsNotValidated) {
                    return requiredFieldsNotValidated;
                };

                const descriptionNotValidated = yourProductsService.validateDescription(product, res);
                if (descriptionNotValidated) {
                    return descriptionNotValidated
                }

                const idNotValidated = yourProductsService.validateId(user_id, oldProduct, res)
                if (idNotValidated) {
                    return idNotValidated;
                }

                const over24HourUpdatesNotValidated = yourProductsService.validateUpdatesOver24Hrs(oldProduct, product, res);
                if (over24HourUpdatesNotValidated) {
                    return over24HourUpdatesNotValidated;
                }

                const titleNotValidated = await yourProductsService.validateTitle(db, product, res, oldProduct)
                if (titleNotValidated) {
                    return titleNotValidated;
                }
                
                const adsNotValidated = yourProductsService.validateAds(product, res)
                if (adsNotValidated) {
                    return adsNotValidated;
                }

                const priceNotValidated = yourProductsService.validatePrice(product, res)
                if (priceNotValidated) {
                    return priceNotValidated;
                }

                if (adCosts[oldProduct.ad] < adCosts[product.ad]) {
                    const cantAffordAd = yourProductsService.validateAdSpending(db, product, res, adCosts)
                    if (cantAffordAd) {
                        return cantAffordAd;
                    }
                }
            })
        })
    },
    validateUpdatesOver24Hrs(oldProduct, product, res) {

        const productDateOver24Hours = this.productOver24HoursOld(oldProduct.date_created);

        if (productDateOver24Hours) {
            //title, img, description can only be edited 25 hours after product is created
            if (product.title !== oldProduct.title || product.img !== oldProduct.img || product.description !== oldProduct.description) {
                return res.status(400).json({
                    message: `title, img, and description can only be edited in the first 24 hours after posting the product.`
                })
            }
            else {
                return false;
            }
        }
    },
    validateId(user_id, oldProduct, res) {
        if (!oldProduct) {
            return res.status(400).json({
                message: `Invalid id`
            })
        }
        else if (parseInt(oldProduct.creator_id) !== parseInt(user_id)) {
            return res.status(401).json({
                message: 'Unauthorized request'
            })
        }
        else {
            return false;
        }
    },
    async validateTitle(db, product, res, oldProduct={}) {
        if (product.title !== oldProduct.title) {
            return await yourProductsService.getProductByTitle(db, product.title)
            .then(productByTitleArray => {
                if (productByTitleArray.length > 0) {
                    return res.status(400).json({
                        message: `${product.title} is already taken`
                    })
                }
                else {
                    return false;
                }
            })
        }
        return false;
    },
    validatePrice(product, res) {
        if (isNaN(product.price) || parseFloat(product.price) < 1) {
                return res.status(400).json({
                    message: `Price must be a number above 1`
                })
            }
        else{
            return false;
        }
    },
    validateAds(product, res) {
        const adChoices = ['None', 'Homepage ads', 'Popup ads', 'Annoying ads'];
        if (!adChoices.includes(product.ad)) {
            return res.status(400).json({
                message: `Ads can only be 'None', 'Homepage ads', 'Popup ads', 'Annoying ads'`
            })
        }
        else{
            return false;
        }
    },

    updateProduct(db, product) {
        return this.getProductById(db, product.id)
        .then(oldProduct => {
            return adService.getSimpleAdCosts(db)
            .then(adCosts => {
                if (adCosts[oldProduct.ad] < adCosts[product.ad]) {
                    yourProductsService.payForAd(db, product, adCosts);
                }
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
            })        
        })
    },

    async postNewProduct(db, newProduct) {
        const productId = await db
            .into('products')
            .insert({
                creator_id: newProduct.creator_id,
                title: newProduct.title,
                img: newProduct.img,
                description: newProduct.description,
                price: newProduct.price,
                ad: newProduct.ad
            })
            .returning('id')
        if (newProduct.ad !== 'None') {
            await adService.getSimpleAdCosts(db)
            .then(async function(adCosts) {
                newProduct.id = productId[0];
                await yourProductsService.payForAd(db, newProduct, adCosts);
            })
        }
        return productId;
    },
    async payForAd(db, newProduct, adCosts) {
        return await db
            .from('users')
            .where('id', newProduct.creator_id)
            .decrement({
                money: adCosts[newProduct.ad]
            })
            .then(res => {
                return db
                    .from('products')
                    .where('id', newProduct.id)
                    .update({
                        last_ad_payment: 'now()'
                    })
                    .decrement({
                        profit: adCosts[newProduct.ad]
                    })
            })
    },
    async validateNewProduct(newProduct, res, db) {
        return adService.getSimpleAdCosts(db)
        .then(async function(adCosts) {
            const requiredFieldsNotValidated = yourProductsService.validateRequiredFields(newProduct, res);
            if (requiredFieldsNotValidated) {
                return requiredFieldsNotValidated;
            };

            const descriptionNotValidated = yourProductsService.validateDescription(newProduct, res);
            if (descriptionNotValidated) {
                return descriptionNotValidated
            }

            const adchoicesNotValidated = yourProductsService.validateAds(newProduct, res);
            if (adchoicesNotValidated) {
                return adchoicesNotValidated;
            }

            const titleNotValidated = await yourProductsService.validateTitle(db, newProduct, res)
            if (titleNotValidated) {
                return titleNotValidated;
            }
            
            const priceNotValidated = yourProductsService.validatePrice(newProduct, res)
            if (priceNotValidated) {
                return priceNotValidated;
            }
            const cantAffordAd = yourProductsService.validateAdSpending(db, newProduct, res, adCosts)
            if (cantAffordAd) {
                return cantAffordAd;
            }
        })
    },
    validateAdSpending(db, newProduct, res, adCosts) {
        return db
            .from('users')
            .where('id', newProduct.creator_id)
            .select('money')
            .first()
            .then(money => {
                if (parseFloat(money.money) <= parseFloat(adCosts[newProduct.ad])) {
                    return res.status(400).json({
                        message: `You can not afford the ad payment`
                    })
                }
                else {return false}
            })
    },
    validateDescription(newProduct, res) {
        if (newProduct.description.length > 1000) {
            return res.status(400).json({
                message: 'Description can not exceed 1000 charaters'
            })
        }
        else {return false}
    },
    validateRequiredFields(newProduct, res) {
        const requiredKeys = ['title', 'price', 'creator_id'];

        for(let i=0; i<requiredKeys.length; i++) {

            if (!newProduct[requiredKeys[i]]) {
                return res.status(400).json({
                    message: `${requiredKeys[i]} is required`
                })
            }
        }
        return false
    },
    getUsersPopularProducts(db, user_id) {
        return db
            .from('products')
            .where('creator_id', user_id)
            .orderBy('sold', 'desc')
            .select('title', 'creator_id', 'description', 'price', 'profit', 'ad', 'date_created', 'id', 'img', 'sold')
            .limit(3)
    },

    getPastSalesData(productId, db) {

        return db
            .raw(
                `SELECT d.date, count(pp.id) FROM (select to_char(date_trunc('day', (current_date - offs)), 'YYYY-MM-DD') AS date FROM generate_series(0, 6, 1) AS offs) d left outer JOIN purchased_products pp
                ON (d.date=to_char(date_trunc('day', pp.date_created), 'YYYY-MM-DD') and pp.product_id=${productId})  
                GROUP BY d.date;`
            )

        // const dates = db
        //     .select(db.raw('to_char(date_trunc(\'day\', (current_date - offs)), \'YYYY-MM-DD\') as "date"'))
        //     .from(db.raw('generate_series(0, 6, 1) as "offs'));

        // return db
        // .select('d.date')
        // .count('purchased_products.id')
        // .from(dates)
        // .as('d')
        // .leftOuterJoin('purchased_products', function() {
        //     return db
        //     .on('d.date', db.raw('to_char(date_trunc(day, pp.date_created), YYYY-MM-DD)'))
        //     .on('purchased_products', productId)
        // })
        // .groupBy('d.date')
    }

}

module.exports = yourProductsService;