import chalk from 'chalk'
import axios from 'axios'

export default async ({baseUrl, token, email, projects = [], repositories = []}) => {
    if (!baseUrl || !token) {
        console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the baseUrl and token variables in your bitbucket source.'))
        process.exit(-1)
    }

    const bitbucket = {
        get: async url => {
            const {data} = await axios.get(`${baseUrl}/${url}`, {
                timeout: 30000,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return data
        }
    }

    let repoCache = null
    const projectPRs = projects
        .map(async project => {
            const {values: repos} = repoCache || await bitbucket.get(`projects/${project}/repos?limit=100`)
            repoCache = {values: repos}
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
            const activities = pr.activities.map(activity => ({
                date: activity.createdDate,
                self: activity.user.emailAddress === email
            }))
            const reviewers = pr.reviewers
                .filter(reviewer => reviewer.user.emailAddress)
                .map(reviewer => ({
                    name: reviewer.user.emailAddress,
                    self: reviewer.user.emailAddress === email,
                    status: reviewer.status
                }))

            return {
                href,
                number: pr.id,
                title: pr.title,
                repoName: `${pr.repo.project.key}/${pr.repo.name}`,
                author: pr.author.user.emailAddress,
                authorSelf: pr.author.user.emailAddress === email,
                updatedDate: pr.updatedDate,
                activities,
                reviewers
            }
        })
}
