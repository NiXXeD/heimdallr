#!/usr/bin/env node

const bitbucket = require('./bitbucket')
const chalk = require('chalk')
const moment = require('moment')
const inquirer = require('inquirer')
const open = require('open')
const {cache, updateCache, cleanCache} = require('./cache')

const {
    HEIMDALLR_PROJECT: project,
    HEIMDALLR_URL: baseUrl,
    HEIMDALLR_TOKEN: token
} = process.env

if (!project) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_PROJECT environment variable.'))
if (!baseUrl) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_URL environment variable.'))
if (!token) return console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the HEIMDALLR_TOKEN environment variable.'))

let prompt
let timerId
const restartTimer = () => {
    clearInterval(timerId)
    timerId = setTimeout(() => {
        prompt.ui.close()
        return doStuff()
    }, 5 * 60 * 60 * 1000)
}

const doStuff = async () => {
    try {
        restartTimer()

        const {values: repos} = await bitbucket.get(`projects/${project}/repos`)
        const repoPRs = await Promise.all(
            repos.map(async repo => {
                const {values: PRs} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests`)

                return Promise.all(PRs.map(async pr => {
                    const {values: activities} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests/${pr.id}/activities`)
                    return {
                        ...pr,
                        activities,
                        repo
                    }
                }))
            })
        )
        const openPrIds = []
        const choices = repoPRs
            .flat()
            .map(pr => {
                const value = pr.links.self[0].href
                openPrIds.push(value)
                let message = ''
                // PR#123    feat(something): Should do a thing
                const prNumber = chalk.gray(`PR#${`${pr.id}`.padEnd(5)}`)
                const prTitle = chalk.white(pr.title)
                message += `${prNumber} ${prTitle}\n`

                // some-repo-name    an.email@whatever.com    25 nanoseconds ago
                const repoName = chalk.gray(pr.repo.name)
                const author = chalk.gray(pr.author.user.emailAddress)
                const updated = chalk.gray(moment(pr.updatedDate).fromNow())
                const newActivityCount = pr.activities.filter(activity => !cache[value] || activity.createdDate > cache[value]).length
                const activityCountText = newActivityCount > 0 ? chalk.red(`+${newActivityCount}`.padEnd(7)) : '      '
                message += `   ${activityCountText} ${repoName}\t ${author}\t${updated}\n`

                // +123   an.approver@whatever.com, someone.else@whatever.com
                const reviewers = pr.reviewers.length
                    ? pr.reviewers.map(reviewer => {
                        const color = {
                            UNAPPROVED: chalk.yellow,
                            APPROVED: chalk.green,
                            NEEDS_WORK: chalk.red
                        }[reviewer.status]
                        return color(reviewer.user.emailAddress)
                    }).join(chalk.white(', '))
                    : ''

                const totalActivity = chalk.yellow(`${pr.activities.length}`.padEnd(6))
                message += `    ${totalActivity} ${reviewers}\n`

                return {name: message, value}
            })

        // Clean out PRs that are no longer open from the cache
        cleanCache(openPrIds)

        console.clear()
        prompt = inquirer.prompt([
            {
                type: 'list',
                pageSize: 20,
                name: 'choice',
                message: `All open PRs currently in BitBucket Project ${project}`,
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

        return doStuff()
    } catch (ex) {
        console.log(chalk.red('Something went wrong!'), ex)
        process.exit(1)
    }
}
return doStuff()
