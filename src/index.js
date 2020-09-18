#!/usr/bin/env node

const chalk = require('chalk')
const heimdallr = require('./heimdallr')

const {
    HEIMDALLR_PROJECT: project,
    HEIMDALLR_URL: baseUrl,
    HEIMDALLR_TOKEN: token,
    HEIMDALLR_EMAIL: email
} = process.env

if (!project) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_PROJECT environment variable.'))
if (!baseUrl) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_URL environment variable.'))
if (!token) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_TOKEN environment variable.'))
if (!email) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_EMAIL environment variable.'))

let prompt
let timerId
const restartTimer = () => {
    clearInterval(timerId)
    timerId = setTimeout(() => {
        prompt.ui.close()
        return main()
    }, 5 * 60 * 60 * 1000)
}

const main = async () => {
    try {
        restartTimer()
        await heimdallr({project, baseUrl, token, email})
        return main()
    } catch (ex) {
        console.log(chalk.red('Something went wrong!'), ex)
        process.exit(1)
    }
}
return main()
