import fs from 'fs'
import moment from 'moment'

const filename = new URL('../heimdallrcache.json', import.meta.url)

export const cache = {}
try {
    if (fs.existsSync(filename)) {
        const cacheData = JSON.parse(fs.readFileSync(filename, 'utf8'))
        Object.keys(cacheData).forEach(key => cache[key] = cacheData[key])
    }
} catch (ex) {
    console.log('Error loading cache', ex)
}

export const updateCache = key => {
    cache[key] = moment().valueOf()
    fs.writeFileSync(filename, JSON.stringify(cache, null, 2))
}

export const cleanCache = validKeys => {
    const cacheKeys = Object.keys(cache)
    cacheKeys.forEach(key => {
        if (!validKeys.includes(key)) {
            delete cache[key]
        }
    })
    fs.writeFileSync(filename, JSON.stringify(cache, null, 2))
}
