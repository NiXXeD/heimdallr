import adapters from './adapters/index.js'
import {cache, cleanCache, updateCache} from './cache.js'
import inquirer from 'inquirer'
import moment from 'moment'
import chalk from 'chalk'
import open from 'open'
import config from './config.js'

export default async timer => {
    const refreshData = async () => {
        // Fetch all data and restart timer
        const PRs = (await Promise.all(config.sources.map(source => adapters[source.type](source)))).flat()
        PRs.refreshDate = moment()
        timer.restart()
        return PRs
    }
    let PRs = await refreshData()

    let choice = ''
    do {
        if (choice === 'refresh') PRs = await refreshData()

        const openPrIds = []
        const choices = PRs
            .map(pr => {
                openPrIds.push(pr.href)
                let message = ''
                const prStatus = pr.reviewers
                    .map(review => review.status)
                    .reduce((acc, val) => {
                        if (acc === 'NEEDS_WORK') return acc
                        else if (acc === 'APPROVED') return acc
                        else return val
                    }, 'UNAPPROVED')

                // PR#123    feat(something): Should do a thing
                const prNumberColor = statusColors[prStatus] || chalk.gray
                const prNumber = prNumberColor(`PR#${`${pr.number}`.padEnd(5)}`)
                const prTitle = chalk.white(pr.title)
                message += `${prNumber} ${prTitle}\n`

                // projectName/repoName    an.email@whatever.com    25 nanoseconds ago
                const repoName = chalk.gray(pr.repoName)
                const author = pr.authorSelf ? chalk.cyan(pr.author) : chalk.gray(pr.author)
                const updated = chalk.gray(moment(pr.updatedDate).fromNow())
                const newActivities = pr.activities.filter(i => !cache[pr.href] || i.date > cache[pr.href])
                const selfActivity = newActivities.findIndex(i => i.self)
                const newActivityCount = selfActivity >= 0
                    ? Math.min(selfActivity, newActivities.length)
                    : newActivities.length
                const activityCountText = newActivityCount > 0 ? chalk.red(`+${newActivityCount}`.padEnd(7)) : '       '
                message += `   ${activityCountText} ${repoName}\t ${author}\t${updated}\n`

                // +123   an.approver@whatever.com, someone.else@whatever.com
                const reviewers = pr.reviewers.map(reviewer => {
                    const color = reviewer.self && reviewer.status === 'UNAPPROVED'
                        ? chalk.yellow
                        : statusColors[reviewer.status]
                    return color(reviewer.name)
                }).join(chalk.white(', ')) || chalk.white('No reviewers yet...')

                const totalActivity = chalk.yellow(`${pr.activities.length}`.padEnd(6))
                message += `    ${totalActivity} ${reviewers}\n`

                return {name: message, value: pr.href}
            })

        // Clean out PRs that are no longer open from the cache
        cleanCache(openPrIds)

        console.clear()
        const prompt = inquirer.prompt([
            {
                type: 'list',
                loop: false,
                pageSize: config.pageSize || 25,
                name: 'choice',
                message: `-Heimdallr- ${choices.length} open PRs`,
                choices: [
                    new inquirer.Separator(),
                    {
                        name: chalk.green('Refresh data ') +
                            chalk.white(chalk.bold(`(last refreshed at ${PRs.refreshDate.format('h:mm:ss a')})`)),
                        value: 'refresh'
                    },
                    new inquirer.Separator(),
                    ...choices
                ]
            }
        ])
        timer.setPrompt(prompt)

        const result = await prompt
        choice = result.choice

        if (choice && choice !== 'refresh') {
            // Update cache with new value
            updateCache(choice)

            // Open selected PR in browser
            open(choice)
        }
    } while (choice)
}

const statusColors = {
    UNAPPROVED: chalk.white,
    APPROVED: chalk.green,
    NEEDS_WORK: chalk.red
}
