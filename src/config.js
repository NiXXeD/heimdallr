import fs from 'fs'
import os from 'os'

const filename = os.homedir() + '/.heimdallrconfig.json'

let config = {
    sources: [],
    refreshIntervalMinutes: 15,
    pageSize: 25
}
try {
    if (fs.existsSync(filename)) {
        config = JSON.parse(fs.readFileSync(filename, 'utf8'))
    }
} catch (ex) {
    console.log('Error loading config', ex)
    process.exit(-1)
}

export default config
