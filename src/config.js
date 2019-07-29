const costOfAds = {'Homepage ads': 10, 'Popup ads': 15, 'Annoying ads': 20};

//Do not change these values. They are for test puroses only
const costOfAdsTestValues = {'Homepage ads': 10, 'Popup ads': 15, 'Annoying ads': 20};

module.exports = {
    PORT: process.env.PORT || 8000,
    DB_URL: process.env.DATABASE_URL || "postgresql://dev:wabaxrmz42@localhost/tender-test",
    TEST_DB_URL: process.env.DATABASE_URL || "postgresql://dev:wabaxrmz42@localhost/tender-test",
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
    adCosts: process.env.NODE_ENV === 'test' ? costOfAdsTestValues : costOfAds
}