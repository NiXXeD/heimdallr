const chalk = require('chalk')
const fetch = require('node-fetch')
const {baseUrl, token} = require('./config')

if (!baseUrl || !token) {
    console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the baseUrl and token variables in your config.'))
    process.exit(-1)
}

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
