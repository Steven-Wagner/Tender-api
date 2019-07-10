const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const yourProductsService = require('./your-products-service');

const yourProductsRouter = express.Router();
const jsonBodyParser = express.json();

yourProductsRouter
    .route('/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        yourProductsService.getProducts(
            req.app.get('db'),
            req.params.user_id
        )
        .then(yourProducts => {
            res.status(200).json(
                yourProducts);
        })
        .catch(error => {
            next(error);
        })
    })

    .patch(jsonBodyParser, (req, res, next) => {
        const {id, price, ad, img, description, title, creator_id, date_created} = req.body;
        const updatedProduct = {id, price, ad, img, description, title, creator_id, date_created};
        yourProductsService.validateUpdate(updatedProduct, req.params.user_id, res, req.app.get('db'))
        .then(failedValidation => {
            if (failedValidation) {
                failedValidation;
            }
            else {
                return yourProductsService.updateProduct(
                    req.app.get('db'),
                    updatedProduct
                )
                .then(updatedProduct => {
                    return res.status(200).json(updatedProduct);
                })
                .catch(error => {
                    next(error)
                })
            }
        })
        .catch(error => {
            next(error)
        })
    })

    module.exports = yourProductsRouter;