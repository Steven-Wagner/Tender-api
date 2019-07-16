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

    module.exports = yourProductsRouter;