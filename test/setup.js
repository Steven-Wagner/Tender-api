process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'

require('dotenv').config();
const {expect} = require('chai');
const request = require('supertest');

global.expect = expect;
global.request = request;
// global.adCosts =  {'Homepage ads': 200, 'Popup ads': 15, 'Annoying ads': 20};