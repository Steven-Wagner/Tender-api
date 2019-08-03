const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const adService = require('../ads/adService');

const adCostsRouter = express.Router();

adCostsRouter
    .route('')
    .get((req, res, next) => {
        adService.getSimpleAdCosts(req.app.get('db'))
        .then(adCosts => {
            res.status(200).json(
                adCosts
            )
        })
        .catch(error => {
            next(error)
        })
    })

module.exports = adCostsRouter;