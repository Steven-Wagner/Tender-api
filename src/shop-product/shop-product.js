const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const shopProductsService = require('./shop-product-service');

const shopProductsRouter = express.Router();
const jsonBodyParser = express.json();

shopProductsRouter
    .route('/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        shopProductsService.getShoppingProducts(req.params.user_id, req.app.get('db'))
        .then(shoppingItems => {
            res.status(200).json(
                shoppingItems
            )
        })
        .catch(error => {
            next(error)
        })
    })

shopProductsRouter
    .route('/purchase/:user_id')
    .all(requireAuth)
    .post(jsonBodyParser, (req, res, next) => {
        const {product_id} = req.body;
        const newPurchase = {product_id};
        newPurchase.buyer_id = req.params.user_id

        shopProductsService.validatePurchase(newPurchase, res, req.app.get('db'))
        .then(notValidated => {
            if (notValidated) {
                notValidated;
            }
            else {
                shopProductsService.addPurchasedProduct(newPurchase, req.app.get('db'))
                .then(purchaseId => {
                    res.status(200).json({
                        id: purchaseId[0]
                    })
                })
            }
        })
        .catch(error => {
            next(error);
        })
    })

shopProductsRouter
    .route('/popular/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        shopProductsService.getPopularProducts(
            req.app.get('db'),
            req.params.user_id
        )
        .then(popularProducts => {
            res.status(200).json(
                popularProducts);
        })
        .catch(error => {
            next(error);
        })
    })
    module.exports = shopProductsRouter;