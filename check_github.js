const fs = require('fs');
let envStr = '';
try { envStr = fs.readFileSync('.env.local', 'utf-8'); } catch(e) { envStr = fs.readFileSync('.env', 'utf-8'); }
const match = envStr.match(/GITHUB_TOKEN=([^\s]+)/);
let token = match ? match[1].trim() : '';
if(token.startsWith('"')) token = token.substring(1, token.length-1);
const { Octokit } = require('octokit');
const octokit = new Octokit({ auth: token });
(async () => {
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({ sort: 'created', per_page: 1 });
    const repo = repos[0].name;
    console.log('Checking repo:', repo);
    const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner: user.login,
      repo: repo
    });
    if (runs.workflow_runs.length > 0) {
      const runId = runs.workflow_runs[0].id;
      console.log('Latest workflow run:', runId, runs.workflow_runs[0].name, runs.workflow_runs[0].status, runs.workflow_runs[0].conclusion);
      const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
        owner: user.login,
        repo: repo,
        run_id: runId
      });
      for (const job of jobs.jobs) {
        console.log('Job:', job.name, job.status, job.conclusion);
        for (const step of job.steps) {
          if (step.conclusion === 'failure') {
            console.log('Failed step:', step.name);
            try {
                const { data: log } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
                  owner: user.login,
                  repo: repo,
                  job_id: job.id
                });
                console.log('LOG:\n', log.substring(log.length - 2000));
            } catch(e) {
                console.error('Cannot download log', e.message);
            }
          }
        }
      }
    } else {
      console.log('No workflow runs found.');
    }
  } catch (err) {
    console.error(err);
  }
})();
