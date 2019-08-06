const express = require('express');
const SignUpService = require('./signup-service');
const AuthService = require('../auth-router/auth-service');

const signupRouter = express.Router();
const jsonBodyParser = express.json();

signupRouter
    .post('', jsonBodyParser, (req, res, next) => {
        const {username, password, description} = req.body
        const newUser = {username, password}

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return  res.status(400).json({
                    message: `${key} is required`
                })
            }
        }

        Object.assign(newUser, {description, date_created: 'now()', money: 150})
        
        return SignUpService.getUserWithUserName(
            req.app.get('db'), 
            username
        )
        .then(isUsernameInvalid => {
            if (isUsernameInvalid) {
                return res.status(400).json({
                    message: `username already exists`
                })
            }

            //add new user to database
            return SignUpService.hashPassword(password)
            .then(hashedPassword => {

                newUser.password = hashedPassword;

                return SignUpService.insertUser(
                    req.app.get('db'),
                    newUser
                )
                .then(newId => {
                    const sub = newUser.username
                    const payload = {user_id: newId}
                    return res.status(201).send({
                    authToken: AuthService.createJwt(sub, payload),
                    user_id: newId
                    })
                })
            })
        })
        .catch(error => {
            next(error)
        })
    })

module.exports = signupRouter