const express = require('express');
const {requireAuth} = require('../middleware/require-auth');
const userInfoService = require('./user-info-services');

const userInfoRouter = express.Router();

userInfoRouter
    .route('/:user_id')
    .all(requireAuth)
    .get((req, res, next) => {
        //Returns the current users information, 'username', 'money', 'description'
        const user_id = req.params.user_id;
                userInfoService.getUserInfo(user_id, req.app.get('db'))
                .then(userInfo => 
                    res.status(200).json({
                        userInfo
                    })
                )
                .catch(error => {
                    next(error);
                })
    })

module.exports = userInfoRouter;