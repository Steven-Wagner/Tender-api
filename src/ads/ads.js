const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const adService = require('./adService');

const adsRouter = express.Router();

adsRouter
    .route('/:adType/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        //Returns one ad from the AdType catagory
        //AdType can be 'Homepage ads', 'Popup ads', 'Annoying ads'
        const user_id = req.params.user_id;
        const adType = req.params.adType

        if (adService.validateAdType(adType)) {
            return res.status(400).json({
                message: `Ad type, ${adType} does not exist`
            })
        }
        else {
            adService.getAds(user_id, adType, req.app.get('db'))
            .then(newAd => {
                newAd = newAd[0] ? newAd[0] : {};
                res.status(200).json(
                    newAd
                )
            })
            .catch(error => {
                next(error)
            })
        }
    })

module.exports = adsRouter;