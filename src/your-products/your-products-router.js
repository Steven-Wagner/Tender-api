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

    module.exports = yourProductsRouter;