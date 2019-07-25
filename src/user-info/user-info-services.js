const userInfoService = {
    getUserInfo(user_id, db) {
        return db
            .from('users')
            .where('id', user_id)
            .select('username', 'money', 'description')
            .first()
    }   
}

module.exports = userInfoService;