const fs = require('fs')
const moment = require('moment')

const filename = __dirname + '/../.heimdallrcache.json'

let cache
try {
    if (fs.existsSync(filename)) {
        cache = JSON.parse(fs.readFileSync(filename, 'utf8'))
    } else {
        cache = {}
    }
} catch (ex) {
    cache = {}
}

const updateCache = key => {
    cache[key] = moment().valueOf()
    fs.writeFileSync(filename, JSON.stringify(cache, null, 2))
}

const cleanCache = validKeys => {
    const cacheKeys = Object.keys(cache)
    cacheKeys.forEach(key => {
        if (!validKeys.includes(key)) {
            delete cache[key]
        }
    })
    fs.writeFileSync(filename, JSON.stringify(cache, null, 2))
}

module.exports = {cache, updateCache, cleanCache}
