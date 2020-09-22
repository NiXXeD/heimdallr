const chalk = require('chalk')
const moment = require('moment')
const inquirer = require('inquirer')
const open = require('open')
const {updateCache, cleanCache} = require('./cache')
const config = require('./config')
const adapters = require('./adapters')

module.exports = async () => {
    const PRs = (await Promise.all(config.sources.map(source => adapters[source.type](source)))).flat()
    const openPrIds = []
    const choices = PRs
        .map(pr => {
            openPrIds.push(pr.href)
            let message = ''
            // PR#123    feat(something): Should do a thing
            const prNumber = chalk.gray(`PR#${`${pr.number}`.padEnd(5)}`)
            const prTitle = chalk.white(pr.title)
            message += `${prNumber} ${prTitle}\n`

            // projectName/repoName    an.email@whatever.com    25 nanoseconds ago
            const repoName = chalk.gray(pr.repoName)
            const author = chalk.gray(pr.author)
            const updated = chalk.gray(moment(pr.updatedDate).fromNow())
            const activityCountText = pr.newActivityCount > 0 ? chalk.red(`+${pr.newActivityCount}`.padEnd(7)) : '       '
            message += `   ${activityCountText} ${repoName}\t ${author}\t${updated}\n`

            // +123   an.approver@whatever.com, someone.else@whatever.com
            const reviewers = pr.reviewers.map(reviewer => {
                const color = {
                    UNAPPROVED: chalk.yellow,
                    APPROVED: chalk.green,
                    NEEDS_WORK: chalk.red
                }[reviewer.status]
                return color(reviewer.name)
            }).join(chalk.white(', ')) || 'No reviewers yet...'

            const totalActivity = chalk.yellow(`${pr.totalActivityCount}`.padEnd(6))
            message += `    ${totalActivity} ${reviewers}\n`

            return {name: message, value: pr.href}
        })

    // Clean out PRs that are no longer open from the cache
    cleanCache(openPrIds)

    console.clear()
    prompt = inquirer.prompt([
        {
            type: 'list',
            loop: false,
            pageSize: config.pageSize,
            name: 'choice',
            message: `-Heimdallr-  ${choices.length} open PRs`,
            choices: [
                new inquirer.Separator(),
                {
                    name: chalk.green('Refresh data ') + chalk.bold(`(last refreshed at ${moment().format('h:mm:ss a')})`),
                    value: 'refresh'
                },
                new inquirer.Separator(),
                ...choices
            ]
        }
    ])
    const {choice} = await prompt

    if (choice && choice !== 'refresh') {
        // Update cache with new value
        updateCache(choice)

        // Open selected PR in browser
        open(choice)
    }
}
