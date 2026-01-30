'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Save, 
  History, 
  Edit3, 
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Clock
} from 'lucide-react';
import { FileNode, getFileContent, getFileSha, getCommitHistory, updateFile } from '@/lib/github-client';
import { USERS } from '@/lib/config';

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface DocumentViewerProps {
  file: FileNode | null;
  currentUser: typeof USERS[0];
}

export default function DocumentViewer({ file, currentUser }: DocumentViewerProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [history, setHistory] = useState<CommitInfo[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fileSha, setFileSha] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      loadFile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const loadFile = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setSaveStatus('idle');
    
    const [fileContent, sha, commitHistory] = await Promise.all([
      getFileContent(file.path),
      getFileSha(file.path),
      getCommitHistory(file.path, 5),
    ]);
    
    setContent(fileContent);
    setOriginalContent(fileContent);
    setFileSha(sha);
    setHistory(commitHistory);
    setIsLoading(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!file || !fileSha) return;
    
    setIsSaving(true);
    setSaveStatus('idle');
    
    const changeDescription = generateChangeDescription(file.name, originalContent, content);
    const commitMessage = `${currentUser.name} updated ${file.name}: ${changeDescription}`;
    
    const success = await updateFile(file.path, content, commitMessage, fileSha);
    
    if (success) {
      setOriginalContent(content);
      setSaveStatus('success');
      const newSha = await getFileSha(file.path);
      setFileSha(newSha);
      const newHistory = await getCommitHistory(file.path, 5);
      setHistory(newHistory);
      
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 2000);
    } else {
      setSaveStatus('error');
    }
    
    setIsSaving(false);
  };

  const generateChangeDescription = (filename: string, oldContent: string, newContent: string): string => {
    const oldLines = oldContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    const lineDiff = newLines - oldLines;
    
    if (filename.includes('TASK_TRACKER')) {
      return 'updated task status';
    } else if (filename.includes('SOP')) {
      return 'revised procedures';
    } else if (filename.includes('contract') || filename.includes('Contract')) {
      return 'updated contract terms';
    } else if (filename.includes('budget') || filename.includes('Budget')) {
      return 'updated financial data';
    } else if (lineDiff > 5) {
      return 'major content update';
    } else if (lineDiff > 0) {
      return 'added content';
    } else if (lineDiff < 0) {
      return 'removed content';
    } else {
      return 'minor edits';
    }
  };

  const hasChanges = content !== originalContent;

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a document</h3>
          <p className="text-gray-500">Choose a file from the sidebar to view or edit</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading document...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">{file.name}</h2>
          {hasChanges && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showHistory ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setContent(originalContent);
                  setIsEditing(false);
                  setSaveStatus('idle');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isSaving || !hasChanges
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto ${showHistory ? 'w-2/3' : 'w-full'}`}>
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-6 font-mono text-sm resize-none focus:outline-none"
              placeholder="Start typing..."
            />
          ) : (
            <div className="p-6 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {showHistory && (
          <div className="w-1/3 border-l border-gray-200 bg-gray-50 overflow-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Change History</h3>
              <div className="space-y-3">
                {history.map((commit) => (
                  <div key={commit.sha} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm font-medium text-gray-700">{commit.author}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{commit.message}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(commit.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {saveStatus === 'error' && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">Failed to save. Please try again.</span>
        </div>
      )}
    </div>
  );
}
