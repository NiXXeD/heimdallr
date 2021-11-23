import chalk from 'chalk'
import fetch from 'node-fetch'

export default async ({baseUrl, token, email, projects = [], repositories = []}) => {
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
            const json = await result.json()
            if (json.errors) {
                json.errors.map(({message}) => {
                    console.log(chalk.red('ERROR!') + ' ' + chalk.yellow(message) + ' ' + chalk.yellow('Please check your config file.'))
                })
                process.exit(-1)
            }
            return json
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
