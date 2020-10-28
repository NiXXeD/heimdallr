const chalk = require('chalk')
const fetch = require('node-fetch')
const {cache} = require('../cache')

module.exports = async ({baseUrl, token, email, projects, repositories}) => {
    if (!baseUrl || !token) {
        console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the baseUrl and token variables in your bitbucket source.'))
        process.exit(-1)
    }

    const bitbucket = {
        get: async url => {
            const result = await fetch(`${baseUrl}/${url}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return await result.json()
        }
    }

    const projectPRs = projects
        .map(async project => {
            const {values: repos} = await bitbucket.get(`projects/${project}/repos?limit=100`)
            return await Promise.all(repos.map(async repo => {
                const {values: repoPRs} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests`)
                return Promise.all(repoPRs.map(async pr => {
                    const {values: activities} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests/${pr.id}/activities`)
                    return ({...pr, activities, repo})
                }))
            }))
        })
    const repositoryPRs = repositories
        .map(async ({project, repository}) => {
            const repo = await bitbucket.get(`projects/${project}/repos/${repository}`)
            const {values: repoPRs} = await bitbucket.get(`projects/${project}/repos/${repository}/pull-requests`)
            return Promise.all(repoPRs.map(async pr => {
                const {values: activities} = await bitbucket.get(`projects/${project}/repos/${repo.slug}/pull-requests/${pr.id}/activities`)
                return ({...pr, activities, repo})
            }))
        })

    return (await Promise.all([...projectPRs, ...repositoryPRs]))
        .flat().flat()
        .map(pr => {
            const href = pr.links.self[0].href
            const newActivities = pr.activities
                .filter(activity => !cache[href] || activity.createdDate > cache[href])
            const selfActivity = newActivities
                .findIndex(activity => activity.user.emailAddress === email)
            const newActivityCount = selfActivity >= 0
                ? Math.min(selfActivity, newActivities.length)
                : newActivities.length
            const reviewers = pr.reviewers
                .map(reviewer => ({name: reviewer.user.emailAddress, status: reviewer.status}))

            return {
                href,
                number: pr.id,
                title: pr.title,
                repoName: `${pr.repo.project.key}/${pr.repo.name}`,
                author: pr.author.user.emailAddress,
                updatedDate: pr.updatedDate,
                newActivityCount,
                totalActivityCount: pr.activities.length,
                reviewers
            }
        })
}
