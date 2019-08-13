const app = require('./app')
const {PORT, DB_URL} = require('./config')
const knex = require('knex')
const adService = require('./ads/adService');

const db = knex({
    client: 'pg',
    connection: DB_URL
})

app.set('db', db)

//Periodic check to charge for ads every 24 hours
const payAdsInterval = setInterval(function () {
    adService.checkAdPayments(db)
}, 3600000)

app.listen(PORT, () => {
    console.log(`Server listening at ${PORT}`)
})