const AuthService = require('../auth-router/auth-service')

function requireAuth(req, res, next) {
    const authToken = req.get('Authorization') || ''

    let bearerToken

    if (!authToken.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({ message: 'Missing bearer token' })
    }
    else {
        bearerToken = authToken.slice(7, authToken.length)
    }

    try {
        const payload = AuthService.verifyJwt(bearerToken)
        
        AuthService.getUserWithUserName(
            req.app.get('db'),
            payload.sub
        )
        .then(user => {
            if (!user) 
                return res.status(401).json({ message: 'Unauthorized request' })
            
            req.user = user

            if (user.id != req.params.user_id) {
                return res.status(401).json({ message: 'Unauthorized request' })
            }
            next()
        })
    } catch(error) {
        res.status(401).json({ message: 'Unauthorized request' })
    }
}

module.exports = {
    requireAuth
}