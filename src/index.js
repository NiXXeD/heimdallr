#!/usr/bin/env node

const chalk = require('chalk')
const heimdallr = require('./heimdallr')
const timer = require('./timer')

const main = async () => {
    try {
        await heimdallr(restartTimer)
        return main()
    } catch (ex) {
        console.log(chalk.red('Something went wrong!'), ex)
        process.exit(1)
    }
}
const restartTimer = timer(main)
return main()
