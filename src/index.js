#!/usr/bin/env node

const bitbucket = require('./bitbucket')
const chalk = require('chalk')
const terminalLink = require('terminal-link')
const moment = require('moment')
const inquirer = require('inquirer')
const open = require('open')

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

const padding = '         '
const doStuff = async () => {
    try {
        restartTimer()

        const {values: repos} = await bitbucket.get(`projects/${project}/repos`)
        const repoPRs = await Promise.all(
            repos.map(async repo => {
                const {values: PRs} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests`)
                return PRs.map(pr => ({...pr, repo}))
            })
        )
        const choices = repoPRs
            .flat()
            .map(pr => {
                let message = ''
                const value = pr.links.self[0].href
                // PR#123    feat(something): Should do a thing
                const prNumber = chalk.gray(`PR#${`${pr.id}`.padEnd(4)}`)
                const prTitle = chalk.white(terminalLink(pr.title, pr.links.self[0].href))
                message += `${prNumber} ${prTitle}\n`

                // some-repo-name    an.email@whatever.com    25 nanoseconds ago
                const repoName = chalk.gray(terminalLink(pr.repo.name, pr.repo.links.self[0].href))
                const author = chalk.gray(pr.author.user.emailAddress)
                const updated = chalk.gray(moment(pr.updatedDate).fromNow())
                message += `${padding} ${repoName}\t ${author}\t${updated}\n`

                // an.approver@whatever.com, someone.else@whatever.com
                if (pr.reviewers.length) {
                    const reviewers = pr.reviewers.map(reviewer => {
                        const color = {
                            UNAPPROVED: chalk.yellow,
                            APPROVED: chalk.green,
                            NEEDS_WORK: chalk.red
                        }[reviewer.status]
                        return color(reviewer.user.emailAddress)
                    }).join(chalk.white(', '))
                    message += `${padding} ${reviewers}\n`
                }

                return {name: message, value}
            })

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
            // Open selected PR in browser
            open(choice)
        }

        return doStuff()
    } catch (ex) {
        console.log(chalk.red('Something went wrong!'), ex)
    }
}
return doStuff()
