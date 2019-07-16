require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {NODE_ENV} = require('./config');
const authRouter = require('./auth-router/auth-router');
const signupRouter = require('./signup/signup-router');
const yourProductsRouter =  require('./your-products/your-products-router');
const buyProductRouter = require('./buy-product/buy-product');

const app = express();

const morganSetting = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganSetting));
app.use(cors());
app.use(helmet());

app.use('/api/auth/', authRouter);

app.use('/api/signup/', signupRouter);

app.use('/api/yourproducts/', yourProductsRouter);

app.use('/api/buyproduct/', buyProductRouter);

app.use(function errorHandler(error, req, res, next) {
    if (NODE_ENV === 'production') {
        repsonse = {error: {message: 'server error'}}
    }
    else {
        console.log(error);
        response = {error}
    }
    res.status(500).json(reponse)
})

module.exports = app;