const config = require('./config')
const refreshIntervalMS = (config.refreshIntervalMinutes || 15) * 60 * 1000

module.exports = {
    timerId: null,
    prompt: null,
    func: null,

    setFunc(value) {
        this.func = value
    },

    setPrompt(value) {
        this.prompt = value
    },

    restart() {
        clearInterval(this.timerId)
        this.timerId = setTimeout(() => {
            this.prompt.ui.close()
            return this.func()
        }, refreshIntervalMS)
    }
}
