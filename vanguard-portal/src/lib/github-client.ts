export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
  url?: string;
  children?: FileNode[];
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export async function getRepositoryContents(path: string = ''): Promise<FileNode[]> {
  try {
    const response = await fetch(`/api/files?action=list&path=${encodeURIComponent(path)}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    return [];
  }
}

export async function getFileContent(path: string): Promise<string> {
  try {
    const response = await fetch(`/api/files?action=content&path=${encodeURIComponent(path)}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return '';
  } catch (error) {
    console.error('Error fetching file content:', error);
    return '';
  }
}

export async function getCommitHistory(path?: string, limit: number = 10): Promise<CommitInfo[]> {
  try {
    const url = `/api/files?action=history&limit=${limit}${path ? `&path=${encodeURIComponent(path)}` : ''}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching commit history:', error);
    return [];
  }
}

export async function getFileSha(path: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/files?action=sha&path=${encodeURIComponent(path)}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching file SHA:', error);
    return null;
  }
}

export async function updateFile(
  path: string,
  content: string,
  message: string,
  sha: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        path,
        content,
        message,
        sha,
      }),
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating file:', error);
    return false;
  }
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileContent: string,
  commitMessage?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload',
        folderPath,
        fileName,
        fileContent,
        commitMessage,
      }),
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error uploading file:', error);
    return false;
  }
}