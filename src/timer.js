const config = require('./config')
const refreshIntervalMS = (config.refreshIntervalMinutes || 15) * 60 * 1000

let timerId
module.exports = main => prompt => {
    clearInterval(timerId)
    timerId = setTimeout(() => {
        prompt.ui.close()
        return main()
    }, refreshIntervalMS)
}
