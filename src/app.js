require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {NODE_ENV} = require('./config');
const authRouter = require('./auth-router/auth-router');
const signupRouter = require('./signup/signup-router');
const yourProductsRouter =  require('./your-products/your-products-router');
const shopProductsRouter = require('./shop-product/shop-product');
const userInfoRouter = require('./user-info/user-info');
const adsRouter = require('./ads/ads');
const adCostsRouter = require('./ad-costs/adCosts');
const {CLIENT_ORIGIN} = require('./config');

const app = express();

const morganSetting = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganSetting));

app.use(cors({
    origin: CLIENT_ORIGIN
}));

app.use(helmet());

app.use('/api/auth/', authRouter);

app.use('/api/signup/', signupRouter);

app.use('/api/yourproducts/', yourProductsRouter);

app.use('/api/shopProducts/', shopProductsRouter);

app.use('/api/userInfo/', userInfoRouter);

app.use('/api/ads/', adsRouter);

app.use('/api/adCosts/', adCostsRouter);

app.use(function errorHandler(error, req, res, next) {
    if (NODE_ENV === 'production') {
        response = {error: {message: 'server error'}}
    }
    else {
        response = {error}
    }
    res.status(500).json(reponse)
})

module.exports = app;