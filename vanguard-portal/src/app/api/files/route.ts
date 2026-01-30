import { NextResponse } from 'next/server';
import { getRepositoryContents, getFileContent, getCommitHistory, getFileSha, updateFile, createFile } from '@/lib/github-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const action = searchParams.get('action') || 'list';

  try {
    switch (action) {
      case 'list':
        const contents = await getRepositoryContents(path);
        return NextResponse.json({ success: true, data: contents });
      
      case 'content':
        const content = await getFileContent(path);
        return NextResponse.json({ success: true, data: content });
      
      case 'sha':
        const sha = await getFileSha(path);
        return NextResponse.json({ success: true, data: sha });
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10');
        const history = await getCommitHistory(path, limit);
        return NextResponse.json({ success: true, data: history });
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, path, content, message, sha, folderPath, fileName, fileContent, commitMessage } = body;

    if (action === 'update') {
      const success = await updateFile(path, content, message, sha);
      return NextResponse.json({ success });
    }

    if (action === 'upload') {
      const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
      const success = await createFile(fullPath, fileContent, commitMessage || `Upload ${fileName}`);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update file' },
      { status: 500 }
    );
  }
}