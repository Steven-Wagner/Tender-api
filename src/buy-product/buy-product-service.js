const buyProductsService = {
    async validatePurchase(newPurchase, res, db) {
        return await this.getProductById(newPurchase.product_id, db)
        .then( async function (product) {
            if (!product) {
                return res.status(400).json({
                    message: 'product_id invalid'
                })
            }
            if (product.creator_id == newPurchase.buyer_id) {
                return res.status(400).json({
                    message: `You can not purchase your own product`
                })
            }
            return await buyProductsService.checkAlreadyPurchased(product, newPurchase.buyer_id, db)
            .then(async function (alreadyPurchased) {
                if (alreadyPurchased) {
                    return res.status(400).json({
                        message: 'You have already purchased this product'
                    })
                }
                return await buyProductsService.canAfford(product, newPurchase.buyer_id, db)
                .then(afford => {
                    if (!afford) {
                        return res.status(400).json({
                            message: `You can't afford this item`
                        })
                    }
                })
            })
        })
        .catch(error => {
            next(error)
        })
    },
    async canAfford(product, user_id, db) {
        return await this.getUsersMoney(user_id, db)
        .then(money => {
            const currentMoney = parseFloat(money.money);
            const price = parseFloat(product.price);
            if (currentMoney >= price) {
                return true;
            }
            else {
                return false;
            }
        })
    },
    checkAlreadyPurchased(product, user_id, db) {
        return db
            .from('purchased_products')
            .where('product_id', product.id)
            .andWhere('buyer_id', user_id)
            .first()
            .then(alreadyPurchased => {
                if (alreadyPurchased) {
                    return true;
                }
                else {
                    return false;
                }
            })
    },
    getUsersMoney(user_id, db) {
        return db
            .from('users')
            .where('id', user_id)
            .select('money')
            .first()
    },
    getProductById(productId, db) {
        return db
            .from('products')
            .where('id', productId)
            .first()
        
    },
    addPurchasedProduct(newPurchase, db) {
        return this.getProductById(newPurchase.product_id, db)
        .then(product => {
            return this.payForProduct(newPurchase.buyer_id, product, db)
            .then(money => {
                return this.addMoneyToSeller(product, db)
                .then(money => {
                    return this.addBonuses(product, newPurchase, db)
                    .then(res => {
                        return this.addProductToPurchasedProducts(newPurchase, db)
                    })
                })
            })
        })

        //add bonus to other user who have already bought item

    },
    addBonuses(product, newPurchase, db) {
        const bonusPercentage = .01;
        const newBonus = parseFloat(product.price*bonusPercentage)

        return db
            .from('purchased_products')
            .where('product_id', newPurchase.product_id)
            .increment('bonus', newBonus)
            .then(res => {
                return db
                .from('users')
                .whereIn('id', function() {
                    this
                        .from('purchased_products')
                        .where('product_id', newPurchase.product_id)
                        .select('buyer_id')
                })
                .increment('money', newBonus)
            })
    },

    addMoneyToSeller(product, db) {
        return this.getUsersMoney(product.creator_id, db)
            .then(currentMoney => {
                return this.addMoneyToUser(product.creator_id, currentMoney.money, product.price, db)
            })    
    },
    addMoneyToUser(user_id, currentMoney, price, db) {
        return db
            .from('users')
            .where('id', user_id)
            .update({
                money: (parseFloat(currentMoney)+parseFloat(price))
            })
            .returning('money')
    },
    addProductToPurchasedProducts(newPurchase, db) {
        return db
            .into('purchased_products')
            .insert(newPurchase)
            .returning('id')
    },
    payForProduct(buyer_id, product, db) {
        return this.getUsersMoney(buyer_id, db)
        .then(currentMoney => {
            return db
                .from('users')
                .where('id', buyer_id)
                .update({
                    money: (parseFloat(currentMoney.money)-parseFloat(product.price))
                })
                .returning('money')
        })
    }
}

module.exports = buyProductsService;