const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const buyProductService = require('./buy-product-service');

const buyProductRouter = express.Router();
const jsonBodyParser = express.json();

buyProductRouter
    .route('/:user_id')
    .all(requireAuth)
    .post(jsonBodyParser, (req, res, next) => {
        const {product_id} = req.body;
        const newPurchase = {product_id};
        newPurchase.buyer_id = req.params.user_id

        buyProductService.validatePurchase(newPurchase, res, req.app.get('db'))
        .then(notValidated => {
            if (notValidated) {
                notValidated;
            }
            else {
                buyProductService.addPurchasedProduct(newPurchase, req.app.get('db'))
                .then(purchaseId => {
                    res.status(200).json({
                        id: purchaseId[0]
                    })
                })
                .catch(error => {
                    next(error);
                })
            }
        })
        .catch(error => {
            next(error);
        })
    })
    module.exports = buyProductRouter;