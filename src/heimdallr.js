const chalk = require('chalk')
const bitbucket = require('./bitbucket')
const moment = require('moment')
const inquirer = require('inquirer')
const open = require('open')
const {cache, updateCache, cleanCache} = require('./cache')

module.exports = async ({project, email}) => {
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
            const newActivities = pr.activities
                .filter(activity => !cache[value] || activity.createdDate > cache[value])
            const selfActivity = newActivities
                .findIndex(activity => activity.user.emailAddress === email)
            const newActivityCount = selfActivity >= 0
                ? Math.min(selfActivity, newActivities.length)
                : newActivities.length
            const activityCountText = newActivityCount > 0 ? chalk.red(`+${newActivityCount}`.padEnd(7)) : '       '
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
            pageSize: 50,
            name: 'choice',
            message: `${choices.length} open PRs currently in BitBucket Project ${project}`,
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