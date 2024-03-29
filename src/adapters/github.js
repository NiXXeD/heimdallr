import chalk from 'chalk'
import {Octokit} from '@octokit/rest'

export default async ({baseUrl, token, username, repositories = []}) => {
    if (!token) {
        console.log(chalk.red('ERROR!') + ' ' + chalk.yellow('Set the token variable in your github source.'))
        process.exit(-1)
    }

    const octokit = new Octokit({auth: token, baseUrl})

    const PRs = await Promise.all(repositories.map(async ({owner, repo}) => {
        try {
            const {data: repoPRs} = await octokit.pulls.list({owner, repo})
            return Promise.all(repoPRs.map(async pr => {
                const {data: reviews} = await octokit.pulls.listReviews({owner, repo, pull_number: pr.number})
                const {data: comments} = await octokit.issues.listComments({owner, repo, issue_number: pr.number})
                const reviewComments = (await Promise.all(reviews.map(async review => {
                    const {data} = await octokit.pulls.listCommentsForReview({
                        owner,
                        repo,
                        pull_number: pr.number,
                        review_id: review.id
                    })
                    return data
                }))).flat()
                return ({...pr, owner, reviews, repo, comments, reviewComments})
            }))
        } catch(ex) {
            if (ex.status === 404) {
                const message = `Repository ${owner}/${repo} does not exist.`
                console.log(chalk.red('ERROR!') + ' ' + chalk.yellow(message) + ' ' + chalk.yellow('Please check your config file.'))
                process.exit(-1)
            }
        }
    }))

    return PRs
        .flat()
        .filter(x => x)
        .map(pr => {
            const href = pr._links.html.href
            // Requested reviewers as not yet reviewed
            let reviewers = pr.requested_reviewers.reduce((acc, value) => {
                const name = value.login
                const status = 'UNAPPROVED'
                acc[name] = {name, status}
                return acc
            }, {})
            // Actual reviews for approved / denied
            reviewers = Object.values(pr.reviews
                .reduce((acc, review) => {
                    const name = review.user.login
                    const self = review.user.login === username
                    const status = review.state === 'CHANGES_REQUESTED' ? 'NEEDS_WORK' : review.state
                    if (['APPROVED', 'UNAPPROVED', 'NEEDS_WORK'].includes(status)) acc[name] = {name, self, status}
                    return acc
                }, reviewers)
            )

            const activities = pr.comments.map(c => ({self: c.user.login === username, date: new Date(c.updated_at).getTime()}))
                .concat(pr.reviewComments.map(c => ({self: c.user.login === username, date: new Date(c.updated_at).getTime()})))
                .concat(pr.reviews.map(c => ({self: c.user.login === username, date: new Date(c.submitted_at).getTime()})))
                .sort((a, b) => b.date - a.date)

            return {
                href,
                number: pr.number,
                title: pr.title,
                repoName: `${pr.owner}/${pr.repo}`,
                author: pr.user.login,
                authorSelf: pr.user.login === username,
                updatedDate: pr.updated_at,
                activities,
                reviewers
            }
        })
}
