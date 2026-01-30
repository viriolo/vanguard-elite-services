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
import { FOLDER_STRUCTURE } from '@/lib/config';
import { FileNode, getRepositoryContents, uploadFile } from '@/lib/github-client';

interface FileBrowserProps {
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

interface TreeNode {
  folder: typeof FOLDER_STRUCTURE[0];
  isOpen: boolean;
  files: FileNode[];
  loading: boolean;
}

export default function FileBrowser({ onFileSelect, selectedPath }: FileBrowserProps) {
  const [treeData, setTreeData] = useState<Record<string, TreeNode>>({});
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    initializeTree();
  }, []);

  // Real-time sync: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllOpenFolders();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

  const initializeTree = () => {
    const initialTree: Record<string, TreeNode> = {};
    FOLDER_STRUCTURE.forEach((folder) => {
      initialTree[folder.id] = {
        folder,
        isOpen: false,
        files: [],
        loading: false,
      };
    });
    setTreeData(initialTree);
  };

  const refreshAllOpenFolders = useCallback(async () => {
    const openFolders = Object.entries(treeData)
      .filter(([, node]) => node.isOpen)
      .map(([id]) => id);

    for (const folderId of openFolders) {
      await refreshFolderSilent(folderId);
    }
  }, [treeData]);

  const refreshFolderSilent = async (folderId: string) => {
    try {
      const contents = await getRepositoryContents(folderId);
      setTreeData((prev) => ({
        ...prev,
        [folderId]: {
          ...prev[folderId],
          files: contents,
        },
      }));
    } catch (error) {
      console.error('Error refreshing folder:', error);
    }
  };

  const toggleFolder = async (folderId: string) => {
    const node = treeData[folderId];
    if (!node) return;

    if (!node.isOpen && node.files.length === 0) {
      setTreeData((prev) => ({
        ...prev,
        [folderId]: { ...prev[folderId], loading: true },
      }));

      const contents = await getRepositoryContents(folderId);
      
      setTreeData((prev) => ({
        ...prev,
        [folderId]: {
          ...prev[folderId],
          isOpen: true,
          files: contents,
          loading: false,
        },
      }));
    } else {
      setTreeData((prev) => ({
        ...prev,
        [folderId]: { ...prev[folderId], isOpen: !prev[folderId].isOpen },
      }));
    }
  };

  const refreshFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncStatus('syncing');
    
    setTreeData((prev) => ({
      ...prev,
      [folderId]: { ...prev[folderId], loading: true },
    }));

    const contents = await getRepositoryContents(folderId);
    
    setTreeData((prev) => ({
      ...prev,
      [folderId]: {
        ...prev[folderId],
        files: contents,
        loading: false,
      },
    }));
    
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
      // Refresh the folder to show the new file
      await refreshFolderSilent(selectedFolder);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                <select 
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a folder...</option>
                  {FOLDER_STRUCTURE.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.name}
                    </option>
                  ))}
                </select>
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
        {FOLDER_STRUCTURE.map((folder) => {
          const node = treeData[folder.id];
          if (!node) return null;

          return (
            <div key={folder.id} className="mb-1">
              <div
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <button className="p-1 hover:bg-gray-200 rounded">
                  {node.isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <span className="text-lg">{folder.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {folder.name}
                </span>
                <button
                  onClick={(e) => refreshFolder(folder.id, e)}
                  className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RefreshCw className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              {node.isOpen && (
                <div className="ml-6 mt-1">
                  {node.loading ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <>
                      {folder.subfolders.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <Folder className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{sub.name}</span>
                        </div>
                      ))}
                      
                      {node.files.map((file) => (
                        <div
                          key={file.path}
                          onClick={() => onFileSelect(file)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            selectedPath === file.path
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getFileIcon(file.name)}
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                      ))}
                      
                      {node.files.length === 0 && folder.subfolders.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400 italic">
                          No files yet
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
