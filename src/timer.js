import config from './config.js'

const refreshIntervalMS = (config.refreshIntervalMinutes || 15) * 60 * 1000

export default {
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
