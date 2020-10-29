const config = require('./config')
const refreshIntervalMS = (config.refreshIntervalMinutes || 15) * 60 * 1000

let timerId
module.exports = {
    timerId: null,
    prompt: null,

    setPrompt(value) {
        this.prompt = value
    },

    restart() {
        clearInterval(this.timerId)
        this.timerId = setTimeout(() => {
            this.prompt.ui.close()
            return main()
        }, refreshIntervalMS)
    }
}
