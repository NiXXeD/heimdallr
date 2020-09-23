#!/usr/bin/env node

const chalk = require('chalk')
const heimdallr = require('./heimdallr')
const config = require('./config')

const refreshIntervalMS = (config.refreshIntervalMinutes || 15) * 60 * 1000

let prompt
let timerId
const restartTimer = () => {
    clearInterval(timerId)
    timerId = setTimeout(() => {
        prompt.ui.close()
        return main()
    }, refreshIntervalMS)
}

const main = async () => {
    try {
        restartTimer()
        await heimdallr()
        return main()
    } catch (ex) {
        console.log(chalk.red('Something went wrong!'), ex)
        process.exit(1)
    }
}
return main()
