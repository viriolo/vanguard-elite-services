'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  History,
  Settings,
  User,
  Bell,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { USERS } from '@/lib/config';
import { FileNode } from '@/lib/github-client';
import FileBrowser from './FileBrowser';
import DocumentViewer from './DocumentViewer';
import TaskTracker from './TaskTracker';

type View = 'dashboard' | 'documents' | 'tasks' | 'history';

export default function Portal() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentUser] = useState(USERS[0]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'history', label: 'History', icon: History },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {currentUser.name}
              </h1>
              <p className="text-gray-600">Here&apos;s what&apos;s happening with your projects today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">+2 today</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">12</div>
                <div className="text-sm text-gray-500">Tasks completed</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">This week</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">8</div>
                <div className="text-sm text-gray-500">Documents updated</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Bell className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-sm text-red-600 font-medium">Action needed</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">3</div>
                <div className="text-sm text-gray-500">Blocked tasks</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { user: 'Roger Kumin', action: 'updated', target: 'SOP-001', time: '2 hours ago' },
                    { user: 'Consultant', action: 'completed', target: 'Task 1.6', time: '5 hours ago' },
                    { user: 'Roger Kumin', action: 'created', target: 'Budget v2', time: '1 day ago' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {activity.user.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ready to Start</h3>
                <div className="space-y-3">
                  {[
                    { id: '2.1', task: 'Reserve company name at IPA', priority: 'high' },
                    { id: '2.4', task: 'Apply for police clearance', priority: 'high' },
                    { id: '2.7', task: 'Contact insurers for quotes', priority: 'medium' },
                  ].map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">{task.id}</span>
                          <span className="text-sm text-gray-800">{task.task}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="h-full flex">
            <div className="w-80 flex-shrink-0">
              <FileBrowser 
                onFileSelect={setSelectedFile} 
                selectedPath={selectedFile?.path}
              />
            </div>
            <div className="flex-1">
              <DocumentViewer file={selectedFile} currentUser={currentUser} />
            </div>
          </div>
        );

      case 'tasks':
        return <TaskTracker />;

      case 'history':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Change History</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {[
                  { user: 'Roger Kumin', action: 'Updated SOP-001: Static Guarding', date: '2026-01-30 14:30', type: 'edit' },
                  { user: 'Consultant', action: 'Completed Task 1.6 - Set up folder structure', date: '2026-01-30 11:15', type: 'complete' },
                  { user: 'Roger Kumin', action: 'Created startup budget breakdown', date: '2026-01-30 09:45', type: 'create' },
                  { user: 'Consultant', action: 'Added guard training curriculum', date: '2026-01-29 16:20', type: 'add' },
                  { user: 'Roger Kumin', action: 'Updated insurance requirements matrix', date: '2026-01-29 14:00', type: 'edit' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                      {item.user.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{item.user}</span>{' '}
                        {item.action}
                      </p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.type === 'edit' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'complete' ? 'bg-green-100 text-green-700' :
                      item.type === 'create' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Vanguard Elite</h1>
              <p className="text-xs text-gray-500">Team Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                {currentUser.initials}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Settings</span>
                </button>
                <hr className="border-gray-200" />
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
