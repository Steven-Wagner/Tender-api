require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {NODE_ENV} = require('./config');

const app = express();

const morganSetting = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganSetting));
app.use(cors());
app.use(helmet());

app.get('/api/*', (req, res) => {
    res.json({ok: true})
})

app.use(function errorHandler(error, req, res, next) {
    if (NODE_ENV === 'production') {
        repsonse = {error: {message: 'server error'}}
    }
    else {
        response = {error}
    }
    res.status(500).json(reponse)
})

module.exports = app;