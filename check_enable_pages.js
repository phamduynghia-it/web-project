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
    await octokit.rest.repos.createPagesSite({
      owner: user.login,
      repo: 'card-3003',
      source: {
        branch: 'main',
        path: '/'
      }
    });
    console.log('Successfully enabled pages');
  } catch (err) {
    console.error('Error enabling pages:', err.message);
  }
})();
