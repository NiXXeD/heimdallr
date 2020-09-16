#!/usr/bin/env node

const bitbucket = require('./bitbucket')
const chalk = require('chalk')
const terminalLink = require('terminal-link')
const _ = require('lodash')
const moment = require('moment')

const {HEIMDALLR_PROJECT: project} = process.env

const doStuff = async () => {
    try {
        const {values: repos} = await bitbucket.get(`projects/${project}/repos`)
        const repoPRs = await Promise.all(
            repos.map(async repo => {
                const {values: PRs} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests`)
                return PRs
            })
        )
        const padding = '       '
        _.chain(repoPRs)
            .flatten()
            .forEach(pr => {
                const prNumber = chalk.gray(`PR#${_.padEnd(pr.id, 4)}`)
                const prTitle = chalk.white(terminalLink(pr.title, pr.links.self[0].href))
                console.log(`${prNumber} ${prTitle}`)

                const repoName = chalk.gray(terminalLink(pr.fromRef.repository.name, pr.fromRef.repository.links.self[0].href))
                const author = chalk.gray(pr.author.user.emailAddress)
                const updated = chalk.gray(moment(pr.updatedDate).fromNow())
                console.log(`${padding} ${repoName}\t ${author}\t${updated}`)

                if (pr.reviewers.length) {
                    const reviewers = pr.reviewers.map(reviewer => {
                        const color = {
                            UNAPPROVED: chalk.yellow,
                            APPROVED: chalk.green,
                            NEEDS_WORK: chalk.red
                        }[reviewer.status]
                        return color(reviewer.user.emailAddress)
                    }).join(chalk.white(', '))
                    console.log(`${padding} ${reviewers}`)
                }

                console.log('') // spacer
            })
            .value()
    } catch (ex) {
        console.log('Something went wrong!', ex)
    }
}
return doStuff()
