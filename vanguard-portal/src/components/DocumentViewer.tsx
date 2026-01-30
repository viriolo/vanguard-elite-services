'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  GitCommit,
  Eye,
  Code,
  Columns,
  Type,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Table,
  CheckSquare,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2
} from 'lucide-react';
import { FileNode, getFileContent, getFileSha, getCommitHistory, updateFile } from '@/lib/github-client';
import { USERS } from '@/lib/config';
import MarkdownEditor from './MarkdownEditor';

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

type EditMode = 'edit' | 'preview' | 'split';

export default function DocumentViewer({ file, currentUser, onNavigate }: DocumentViewerProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('split');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [history, setHistory] = useState<CommitInfo[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    if (file) {
      loadFile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    setLineCount(content.split('\n').length);
    setCharCount(content.length);
    setWordCount(content.split(/\s+/).filter(w => w.length > 0).length);
  }, [content]);

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
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleContentChange = (newContent: string) => {
    setUndoStack(prev => [...prev, content]);
    setRedoStack([]);
    setContent(newContent);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, content]);
      setContent(previousContent);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, content]);
      setContent(nextContent);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const insertText = (before: string, after: string = '') => {
    // Get current selection from window
    const selection = window.getSelection();
    const activeElement = document.activeElement;
    
    // Find the textarea within the MarkdownEditor
    const textarea = document.querySelector('.markdown-editor-textarea') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
      
      handleContentChange(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // Fallback: just append to end
      handleContentChange(content + before + after);
    }
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic' },
    { icon: Heading1, action: () => insertText('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertText('### '), title: 'Heading 3' },
    { icon: List, action: () => insertText('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List' },
    { icon: CheckSquare, action: () => insertText('- [ ] '), title: 'Task List' },
    { icon: Quote, action: () => insertText('> '), title: 'Quote' },
    { icon: Code, action: () => insertText('```\n', '\n```'), title: 'Code Block' },
    { icon: Link, action: () => insertText('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertText('![alt](', ')'), title: 'Image' },
    { icon: Table, action: () => insertText('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'), title: 'Table' },
  ];

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

  const renderEditor = () => (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors mr-2"
          title="Redo"
        >
          <Redo2 className="w-4 h-4 text-slate-600" />
        </button>
        
        <div className="w-px h-5 bg-slate-300 mx-1" />
        
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.action}
            className="p-1.5 rounded hover:bg-slate-200 transition-colors"
            title={btn.title}
          >
            <btn.icon className="w-4 h-4 text-slate-600" />
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 relative bg-white">
        <MarkdownEditor
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing..."
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>{lineCount} lines</span>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <span className="text-amber-600 font-medium">Unsaved changes</span>
          )}
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="h-full overflow-auto custom-scrollbar bg-white">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '*No content*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Breadcrumbs */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Documents</span>
          {breadcrumbs.map((crumb) => (
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
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {isEditing && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
              <button
                onClick={() => setEditMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  editMode === 'edit' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Code className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setEditMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  editMode === 'split' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Columns className="w-4 h-4" />
                Split
              </button>
              <button
                onClick={() => setEditMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  editMode === 'preview' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              showHistory 
                ? 'bg-slate-200 text-slate-800' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            History
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isEditing ? (
          <>
            {(editMode === 'edit' || editMode === 'split') && (
              <div className={`${editMode === 'split' ? 'w-1/2 border-r border-slate-200' : 'flex-1'}`}>
                {renderEditor()}
              </div>
            )}
            {(editMode === 'preview' || editMode === 'split') && (
              <div className={`${editMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
                {renderPreview()}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1">
            {renderPreview()}
          </div>
        )}

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
