#!/usr/bin/env node

const chalk = require('chalk')
const heimdallr = require('./heimdallr')
const timer = require('./timer')

const main = async () => {
    try {
        await heimdallr(timer)
        return main()
    } catch (ex) {
        if (ex.code === 'ENOTFOUND') return setTimeout(() => main(), 15000)
        console.log(chalk.red('Something went wrong!'), ex)
        process.exit(1)
    }
}
timer.setFunc(main)
return main()
