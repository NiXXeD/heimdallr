#!/usr/bin/env node

import chalk from 'chalk'
import heimdallr from './heimdallr.js'
import timer from './timer.js'

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
main()
