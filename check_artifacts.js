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
    const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner: user.login,
      repo: 'card-3003'
    });
    if (runs.workflow_runs.length > 0) {
      const runId = runs.workflow_runs[0].id;
      const { data: artifacts } = await octokit.rest.actions.listWorkflowRunArtifacts({
        owner: user.login,
        repo: 'card-3003',
        run_id: runId
      });
      for (const a of artifacts.artifacts) {
          console.log(a.name, a.size_in_bytes);
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
