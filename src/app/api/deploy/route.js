import { Octokit } from "octokit";
import fs from "fs/promises";
import path from "path";

// Hàm đệ quy đọc tất cả file trong folder
async function getFiles(dir, files = []) {
  const fileList = await fs.readdir(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if ((await fs.stat(name)).isDirectory()) {
      await getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { templateId, data: formData } = body;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return Response.json({ success: false, message: "Thiếu GITHUB_TOKEN trong file .env" }, { status: 500 });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    let nextId = 3000;
    try {
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "created",
        direction: "desc",
        per_page: 50
      });
      
      let maxId = 2999;
      for (const r of repos) {
        let numStr = r.name;
        if (r.name.startsWith('card-')) {
          numStr = r.name.substring(5);
        }
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num.toString() === numStr && num >= 3000) {
          if (num > maxId) maxId = num;
        }
      }
      nextId = maxId + 1;
    } catch(err) {
      console.log("Could not fetch repos, fallback", err);
      nextId = 3000 + Math.floor(Math.random() * 1000);
    }
    
    const repoName = `card-${nextId}`;

    // 1. Create Repo
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      auto_init: true,
      private: false,
      has_pages: true
    });

    // 1.5. Bật Github Pages sử dụng Github Actions (Thực hiện TRƯỚC KHI push commit)
    try {
      await new Promise(r => setTimeout(r, 3000));
      await octokit.request('POST /repos/{owner}/{repo}/pages', {
        owner: user.login,
        repo: repoName,
        build_type: 'workflow',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
    } catch(e) { 
      console.log("Error configuring pages for workflow:", e.message);
    }

    // 2. Lấy SHA của nhánh main
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: refData } = await octokit.rest.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: "heads/main",
    });
    const commitSha = refData.object.sha;
    
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner: user.login,
      repo: repoName,
      commit_sha: commitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    const tree = [];
    const htmlReplacements = { ...formData };

    // 3. Xử lý các file Base64 từ formData
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        const matches = value.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          
          let ext = mimeType.split('/')[1] || 'bin';
          if (ext === 'mpeg') ext = 'mp3';
          if (ext === 'jpeg') ext = 'jpg';
          
          const fileName = `assets/user_${key}.${ext}`;
          htmlReplacements[key] = `./${fileName}`;
          
          const { data: blobData } = await octokit.rest.git.createBlob({
            owner: user.login,
            repo: repoName,
            content: base64Data,
            encoding: 'base64'
          });
          
          tree.push({
            path: fileName,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha
          });
        }
      } else if (Array.isArray(value)) {
        const newArray = [...value];
        let hasBase64 = false;
        for (let i = 0; i < newArray.length; i++) {
          const item = newArray[i];
          if (typeof item === 'string' && item.startsWith('data:')) {
            hasBase64 = true;
            const matches = item.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              
              let ext = mimeType.split('/')[1] || 'bin';
              if (ext === 'mpeg') ext = 'mp3';
              if (ext === 'jpeg') ext = 'jpg';
              
              const fileName = `assets/user_${key}_${i}.${ext}`;
              newArray[i] = `./${fileName}`;
              
              const { data: blobData } = await octokit.rest.git.createBlob({
                owner: user.login,
                repo: repoName,
                content: base64Data,
                encoding: 'base64'
              });
              
              tree.push({
                path: fileName,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha
              });
            }
          }
        }
        if (hasBase64) {
          htmlReplacements[key] = newArray;
        }
      }
    }

    // 4. Đọc files của template và replace biến
    const templatePath = path.join(process.cwd(), "templates", templateId);
    const allFiles = await getFiles(templatePath);

    for (const filePath of allFiles) {
      const relativePath = path.relative(templatePath, filePath).replace(/\\/g, '/');
      if (relativePath === 'config.json') continue;
      
      let content = await fs.readFile(filePath);
      let encoding = 'base64';
      
      if (relativePath === 'index.html') {
        let html = content.toString('utf-8');
        
        // Replace variables
        for (const [key, val] of Object.entries(htmlReplacements)) {
          const placeholder = `__${key.toUpperCase()}__`;
          let replaceStr = val;
          if (Array.isArray(val)) {
            // Xử lý mảng: thay thế \n (chữ) thành ký tự xuống dòng thật, và &nbsp; thành khoảng trắng
            const processedArray = val.map(item => {
              if (typeof item === 'string') {
                return item.replace(/\\n/g, '\n').replace(/&nbsp;/g, ' ');
              }
              return item;
            });
            replaceStr = JSON.stringify(processedArray);
          } else if (typeof val === 'string') {
            replaceStr = val.replace(/\\n/g, '\n').replace(/&nbsp;/g, ' ');
          }
          html = html.split(placeholder).join(replaceStr);
        }
        
        content = Buffer.from(html).toString('base64');
      } else {
        content = content.toString('base64');
      }

      const { data: blobData } = await octokit.rest.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: content,
        encoding: encoding
      });

      tree.push({
        path: relativePath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    // 5. Tạo Tree, Commit, Ref (Bao gồm cả custom workflow)
    const workflowContent = `name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

    const { data: workflowBlob } = await octokit.rest.git.createBlob({
      owner: user.login,
      repo: repoName,
      content: Buffer.from(workflowContent).toString('base64'),
      encoding: 'base64'
    });

    tree.push({
      path: '.github/workflows/pages.yml',
      mode: '100644',
      type: 'blob',
      sha: workflowBlob.sha
    });

    const { data: newTree } = await octokit.rest.git.createTree({
      owner: user.login,
      repo: repoName,
      tree: tree,
      base_tree: baseTreeSha
    });

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: user.login,
      repo: repoName,
      message: "Deploy greeting card with dynamic assets and custom workflow",
      tree: newTree.sha,
      parents: [commitSha]
    });

    await octokit.rest.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: "heads/main",
      sha: newCommit.sha
    });

    const pagesUrl = `https://${user.login}.github.io/${repoName}`;
    return Response.json({ success: true, url: pagesUrl });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
