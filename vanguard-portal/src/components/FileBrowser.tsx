'use client';

import { useState, useEffect, useCallback } from 'react';
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
  X
} from 'lucide-react';
import { FileNode, getRepositoryContents, uploadFile } from '@/lib/github-client';

interface FileBrowserProps {
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  isOpen: boolean;
  children: TreeItem[];
  loading: boolean;
}

export default function FileBrowser({ onFileSelect, selectedPath }: FileBrowserProps) {
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadRootDirectories();
  }, []);

  // Real-time sync: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllOpenFolders();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

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
          // Load children
          try {
            const contents = await getRepositoryContents(path);
            const children = contents.map(child => ({
              name: child.name,
              path: child.path,
              type: child.type as 'file' | 'dir',
              isOpen: false,
              children: [] as TreeItem[],
              loading: false,
            }));
            return { ...item, isOpen: true, children };
          } catch (error) {
            console.error('Error loading folder contents:', error);
            return item;
          }
        } else {
          // Just toggle
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

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.md')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (filename.endsWith('.pdf')) return <File className="w-4 h-4 text-red-500" />;
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <File className="w-4 h-4 text-blue-700" />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <File className="w-4 h-4 text-green-600" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const handleUpload = async () => {
    if (!selectedFolder || !uploadFileName || !uploadContent) return;
    
    setIsUploading(true);
    setUploadStatus('idle');
    
    const success = await uploadFile(selectedFolder, uploadFileName, uploadContent);
    
    if (success) {
      setUploadStatus('success');
      // Refresh all folders to show the new file
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

  const renderTreeItem = (item: TreeItem, depth: number = 0) => {
    const paddingLeft = depth * 16 + 12;
    
    if (item.type === 'file') {
      return (
        <div
          key={item.path}
          onClick={() => onFileSelect({
            name: item.name,
            path: item.path,
            type: item.type,
            sha: '',
          })}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
            selectedPath === item.path
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {getFileIcon(item.name)}
          <span className="text-sm truncate">{item.name}</span>
        </div>
      );
    }

    return (
      <div key={item.path}>
        <div
          onClick={() => toggleFolder(item.path)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <button className="p-1 hover:bg-gray-200 rounded">
            {item.isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <Folder className="w-4 h-4 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-700">
            {item.name}
          </span>
          <button
            onClick={(e) => refreshFolder(item.path, e)}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <RefreshCw className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        {item.isOpen && (
          <div>
            {item.children.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400 italic" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                No files
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
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
          <div className="flex items-center gap-2">
            {syncStatus === 'synced' && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {syncStatus === 'syncing' && (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            )}
            {syncStatus === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Upload File</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folder Path</label>
                <input 
                  type="text"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  placeholder="e.g., 00_PROJECT_MANAGEMENT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the folder path (e.g., 00_PROJECT_MANAGEMENT or 00_PROJECT_MANAGEMENT/action_plans)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                <input 
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g., document.md"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea 
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Enter file content..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {uploadStatus === 'success' && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  File uploaded successfully!
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  Failed to upload file. Please try again.
                </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFolder || !uploadFileName || !uploadContent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {treeData.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          treeData.map(item => renderTreeItem(item))
        )}
      </div>
    </div>
  );
}
