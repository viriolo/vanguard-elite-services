'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  File,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Clock,
  HardDrive,
  ChevronLeft
} from 'lucide-react';
import { FileNode, getRepositoryContents, uploadFile } from '@/lib/github-client';

interface FileBrowserProps {
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  isOpen: boolean;
  children: TreeItem[];
  loading: boolean;
  size?: number;
  lastModified?: string;
}

export default function FileBrowser({ 
  onFileSelect, 
  selectedPath, 
  onToggleSidebar,
  isSidebarOpen = true 
}: FileBrowserProps) {
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileNode[]>([]);

  useEffect(() => {
    loadRootDirectories();
    loadRecentFiles();
  }, []);

  // Real-time sync: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllOpenFolders();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

  const loadRecentFiles = () => {
    // Load from localStorage
    const stored = localStorage.getItem('recentFiles');
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent files:', e);
      }
    }
  };

  const addToRecentFiles = (file: FileNode) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.path !== file.path);
      const updated = [file, ...filtered].slice(0, 5);
      localStorage.setItem('recentFiles', JSON.stringify(updated));
      return updated;
    });
  };

  const loadRootDirectories = async () => {
    setSyncStatus('syncing');
    try {
      const contents = await getRepositoryContents('');
      const rootDirs = contents
        .filter(item => item.type === 'dir')
        .map(dir => ({
          name: dir.name,
          path: dir.path,
          type: 'dir' as const,
          isOpen: false,
          children: [] as TreeItem[],
          loading: false,
        }));
      setTreeData(rootDirs);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading root directories:', error);
      setSyncStatus('error');
    }
  };

  const refreshAllOpenFolders = useCallback(async () => {
    const refreshItem = async (item: TreeItem): Promise<TreeItem> => {
      if (!item.isOpen) return item;
      
      try {
        const contents = await getRepositoryContents(item.path);
        const updatedChildren = contents.map(child => {
          const existingChild = item.children.find(c => c.path === child.path);
          return {
            name: child.name,
            path: child.path,
            type: child.type,
            isOpen: existingChild?.isOpen || false,
            children: existingChild?.children || [],
            loading: false,
            size: child.size,
          };
        });
        
        return {
          ...item,
          children: await Promise.all(updatedChildren.map(refreshItem)),
        };
      } catch (error) {
        console.error('Error refreshing folder:', error);
        return item;
      }
    };

    const updatedTree = await Promise.all(treeData.map(refreshItem));
    setTreeData(updatedTree);
  }, [treeData]);

  const toggleFolder = async (path: string) => {
    const updateItem = async (item: TreeItem): Promise<TreeItem> => {
      if (item.path === path) {
        if (!item.isOpen && item.children.length === 0) {
          try {
            const contents = await getRepositoryContents(path);
            const children = contents.map(child => ({
              name: child.name,
              path: child.path,
              type: child.type as 'file' | 'dir',
              isOpen: false,
              children: [] as TreeItem[],
              loading: false,
              size: child.size,
            }));
            return { ...item, isOpen: true, children };
          } catch (error) {
            console.error('Error loading folder contents:', error);
            return item;
          }
        } else {
          return { ...item, isOpen: !item.isOpen };
        }
      }
      
      if (item.children.length > 0) {
        return {
          ...item,
          children: await Promise.all(item.children.map(updateItem)),
        };
      }
      
      return item;
    };

    const updatedTree = await Promise.all(treeData.map(updateItem));
    setTreeData(updatedTree);
  };

  const handleFileSelect = (file: FileNode) => {
    addToRecentFiles(file);
    onFileSelect(file);
  };

  const refreshFolder = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncStatus('syncing');
    
    const updateItem = async (item: TreeItem): Promise<TreeItem> => {
      if (item.path === path) {
        try {
          const contents = await getRepositoryContents(path);
          const children = contents.map(child => {
            const existingChild = item.children.find(c => c.path === child.path);
            return {
              name: child.name,
              path: child.path,
              type: child.type as 'file' | 'dir',
              isOpen: existingChild?.isOpen || false,
              children: existingChild?.children || [],
              loading: false,
              size: child.size,
            };
          });
          return { ...item, children };
        } catch (error) {
          console.error('Error refreshing folder:', error);
          return item;
        }
      }
      
      if (item.children.length > 0) {
        return {
          ...item,
          children: await Promise.all(item.children.map(updateItem)),
        };
      }
      
      return item;
    };

    const updatedTree = await Promise.all(treeData.map(updateItem));
    setTreeData(updatedTree);
    setSyncStatus('synced');
  };

  const getFileIcon = (filename: string, isSelected: boolean = false) => {
    const baseClass = `w-4 h-4 ${isSelected ? 'text-slate-700' : ''}`;
    if (filename.endsWith('.md')) return <FileText className={`${baseClass} text-blue-500`} />;
    if (filename.endsWith('.pdf')) return <File className={`${baseClass} text-red-500`} />;
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <File className={`${baseClass} text-blue-600`} />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <File className={`${baseClass} text-emerald-600`} />;
    return <File className={`${baseClass} text-slate-400`} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFolder || !uploadFileName || !uploadContent) return;
    
    setIsUploading(true);
    setUploadStatus('idle');
    
    const success = await uploadFile(selectedFolder, uploadFileName, uploadContent);
    
    if (success) {
      setUploadStatus('success');
      await refreshAllOpenFolders();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFileName('');
        setUploadContent('');
        setUploadStatus('idle');
      }, 1500);
    } else {
      setUploadStatus('error');
    }
    
    setIsUploading(false);
  };

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return treeData;
    
    const filterItem = (item: TreeItem): TreeItem | null => {
      const matches = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (item.type === 'file') {
        return matches ? item : null;
      }
      
      const filteredChildren = item.children
        .map(filterItem)
        .filter((child): child is TreeItem => child !== null);
      
      if (matches || filteredChildren.length > 0) {
        return {
          ...item,
          isOpen: true,
          children: filteredChildren,
        };
      }
      
      return null;
    };
    
    return treeData.map(filterItem).filter((item): item is TreeItem => item !== null);
  }, [treeData, searchQuery]);

  const renderTreeItem = (item: TreeItem, depth: number = 0) => {
    const paddingLeft = depth * 16 + 12;
    const isSelected = selectedPath === item.path;
    
    if (item.type === 'file') {
      return (
        <div
          key={item.path}
          onClick={() => handleFileSelect({
            name: item.name,
            path: item.path,
            type: item.type,
            sha: '',
            size: item.size,
          })}
          className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all ${
            isSelected
              ? 'bg-slate-100 border-l-2 border-slate-800 text-slate-900'
              : 'hover:bg-slate-50 text-slate-600 border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          title={item.name}
        >
          {getFileIcon(item.name, isSelected)}
          <div className="flex-1 min-w-0">
            <span className={`text-sm truncate block ${isSelected ? 'font-medium' : ''}`}>
              {item.name}
            </span>
          </div>
          {item.size && (
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatFileSize(item.size)}
            </span>
          )}
        </div>
      );
    }

    return (
      <div key={item.path}>
        <div
          onClick={() => toggleFolder(item.path)}
          className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all hover:bg-slate-50 ${
            isSelected ? 'bg-slate-100' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <button className="p-0.5 hover:bg-slate-200 rounded transition-colors">
            {item.isOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
          <Folder className={`w-4 h-4 flex-shrink-0 ${item.isOpen ? 'text-amber-500' : 'text-amber-400'}`} />
          <span className="flex-1 text-sm font-medium text-slate-700 truncate">
            {item.name}
          </span>
          <button
            onClick={(e) => refreshFolder(item.path, e)}
            className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Refresh folder"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {item.isOpen && (
          <div className="mt-0.5">
            {item.children.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400 italic" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                Empty folder
              </div>
            ) : (
              item.children.map(child => renderTreeItem(child, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
        isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      }`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-800">Documents</h2>
            </div>
            <div className="flex items-center gap-1">
              {syncStatus === 'synced' && (
                <div title="Synced">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              )}
              {syncStatus === 'syncing' && (
                <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
              )}
              {syncStatus === 'error' && (
                <div title="Sync error">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
            />
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>

        {/* Recent Files */}
        {recentFiles.length > 0 && !searchQuery && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent</h3>
            <div className="space-y-1">
              {recentFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleFileSelect(file)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white transition-colors group"
                  title={file.name}
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-sm text-slate-600 truncate flex-1 group-hover:text-slate-900">
                    {file.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {treeData.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : (
            filteredTree.map(item => renderTreeItem(item))
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-white border border-slate-200 border-l-0 rounded-r-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
        style={{ left: isSidebarOpen ? '18rem' : '0' }}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] max-w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">Upload File</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Folder Path</label>
                <input 
                  type="text"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  placeholder="e.g., 00_PROJECT_MANAGEMENT/action_plans"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter the full folder path where you want to upload the file
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">File Name</label>
                <input 
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g., document.md"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                <textarea 
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Enter file content..."
                  rows={6}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all resize-none font-mono"
                />
              </div>
              
              {uploadStatus === 'success' && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  File uploaded successfully!
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Failed to upload file. Please try again.
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFolder || !uploadFileName || !uploadContent}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
