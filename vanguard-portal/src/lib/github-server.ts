import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'viriolo';
const REPO_NAME = 'vanguard-elite-services';

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
  url?: string;
  children?: FileNode[];
}

export async function getRepositoryContents(path: string = ''): Promise<FileNode[]> {
  try {
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });

    if (Array.isArray(response.data)) {
      return response.data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        sha: item.sha,
        size: item.size,
        url: item.download_url || undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    return [];
  }
}

export async function getFileContent(path: string): Promise<string> {
  try {
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });

    if ('content' in response.data) {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;
    }
    return '';
  } catch (error) {
    console.error('Error fetching file content:', error);
    return '';
  }
}

export async function updateFile(
  path: string,
  content: string,
  message: string,
  sha: string
): Promise<boolean> {
  try {
    const encodedContent = Buffer.from(content).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message,
      content: encodedContent,
      sha,
    });
    return true;
  } catch (error) {
    console.error('Error updating file:', error);
    return false;
  }
}

export async function createFile(
  path: string,
  content: string,
  message: string
): Promise<boolean> {
  try {
    const encodedContent = Buffer.from(content).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message,
      content: encodedContent,
    });
    return true;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
}

export async function getFileSha(path: string): Promise<string | null> {
  try {
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });

    if ('sha' in response.data) {
      return response.data.sha;
    }
    return null;
  } catch (error) {
    console.error('Error fetching file SHA:', error);
    return null;
  }
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export async function getCommitHistory(path?: string, limit: number = 10): Promise<CommitInfo[]> {
  try {
    const response = await octokit.repos.listCommits({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      per_page: limit,
    });

    return response.data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url,
    }));
  } catch (error) {
    console.error('Error fetching commit history:', error);
    return [];
  }
}