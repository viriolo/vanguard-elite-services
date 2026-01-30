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
  Clock,
  ChevronRight,
  FileText,
  GitCommit
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
  onNavigate?: (path: string) => void;
}

export default function DocumentViewer({ file, currentUser, onNavigate }: DocumentViewerProps) {
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

  const getBreadcrumbs = (path: string) => {
    const parts = path.split('/');
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/'),
      isLast: index === parts.length - 1,
    }));
  };

  const hasChanges = content !== originalContent;

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Select a document</h3>
          <p className="text-slate-500">Choose a file from the sidebar to view or edit</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          <span className="text-slate-600">Loading document...</span>
        </div>
      </div>
    );
  }

  const breadcrumbs = getBreadcrumbs(file.path);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Documents</span>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              {crumb.isLast ? (
                <span className="font-medium text-slate-900">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => onNavigate?.(crumb.path)}
                  className="text-slate-600 hover:text-slate-900 hover:underline"
                >
                  {crumb.name}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800">{file.name}</h2>
          </div>
          {hasChanges && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              showHistory 
                ? 'bg-slate-200 text-slate-800' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Version History
          </button>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
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
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isSaving || !hasChanges
                    ? 'bg-slate-200 cursor-not-allowed text-slate-500'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto custom-scrollbar ${showHistory ? 'w-2/3' : 'w-full'}`}>
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-8 font-mono text-sm resize-none focus:outline-none bg-slate-50"
              placeholder="Start typing..."
              spellCheck={false}
            />
          ) : (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*No content*'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 border-l border-slate-200 bg-slate-50 overflow-auto custom-scrollbar">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-800">Version History</h3>
              </div>
              
              <div className="space-y-3">
                {history.map((commit, index) => (
                  <div key={commit.sha} className={`bg-white p-3 rounded-lg border ${
                    index === 0 ? 'border-emerald-200 shadow-sm' : 'border-slate-200'
                  }`}>
                    {index === 0 && (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded mb-2">
                        Current
                      </span>
                    )}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700">{commit.author}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2 leading-relaxed">{commit.message}</p>
                    
                    <div className="flex items-center gap-1 text-xs text-slate-400">
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
                  <p className="text-sm text-slate-500 italic">No history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {saveStatus === 'error' && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">Failed to save. Please try again.</span>
        </div>
      )}
    </div>
  );
}
