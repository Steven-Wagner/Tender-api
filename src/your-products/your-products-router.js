const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const yourProductsService = require('./your-products-service');

const yourProductsRouter = express.Router();
const jsonBodyParser = express.json();

yourProductsRouter
    .route('/popular/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        yourProductsService.getUsersPopularProducts(
            req.app.get('db'),
            req.params.user_id
        )
        .then(usersPopularProducts => {
            res.status(200).json(
                usersPopularProducts);
        })
        .catch(error => {
            next(error);
        })
    })

yourProductsRouter
    .route('/purchased/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        yourProductsService.getUsersPurchasedProducts(
            req.app.get('db'),
            req.params.user_id
        )
        .then(usersPurchasedProducts => {
            res.status(200).json(
                usersPurchasedProducts);
        })
        .catch(error => {
            next(error);
        })
    })

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
        const {id, price, ad, img, description, title, creator_id} = req.body;
        const updatedProduct = {id, price, ad, img, description, title, creator_id};
        yourProductsService.validateUpdate(updatedProduct, req.params.user_id, res, req.app.get('db'))
        .then(notValidated => {
            if (notValidated) {
                notValidated;
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
    .post(jsonBodyParser, (req, res, next) => {
        const {price, ad, img, description, title} = req.body;
        const newProduct = {price, ad, img, description, title, creator_id: req.params.user_id};

        yourProductsService.validateNewProduct(newProduct, res, req.app.get('db'))
        .then(notValidated => {
            if (notValidated) {
                notValidated;
            }
            else {
                yourProductsService.postNewProduct(req.app.get('db'), newProduct)
                .then(newId => {
                    res.status(200).json({id: newId[0]})
                })
                .catch(error => {
                    next(error);
                })
            }
        })
    })

yourProductsRouter
    .route('/:user_id/:product_id')
    .all(requireAuth)
    .get((req, res, next) => {
        const productId = req.params.product_id;
        const db = req.app.get('db');

        yourProductsService.getPastSalesData(productId, db)
        .then(data => {
            res.status(200).json(
                data.rows
            )
        })
        .catch(error => {
            next(error);
        })
    })

    module.exports = yourProductsRouter;