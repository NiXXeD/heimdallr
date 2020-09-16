const fetch = require('node-fetch')

const {
    HEIMDALLR_URL: baseUrl,
    HEIMDALLR_TOKEN: token
} = process.env

module.exports = {
    get: async url => {
        const result = await fetch(`${baseUrl}/${url}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return await result.json()
    }
}
