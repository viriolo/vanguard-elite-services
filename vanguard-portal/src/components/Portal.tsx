'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  History,
  Settings,
  User,
  Bell,
  LogOut,
  ChevronDown,
  Calendar,
  Wallet,
  AlertTriangle,
  Clock,
  Loader2,
  Columns,
  Zap,
  Flag,
  Route,
  Menu,
  X
} from 'lucide-react';
import { USERS } from '@/lib/config';
import { FileNode, getFileContent } from '@/lib/github-client';
import FileBrowser from './FileBrowser';
import DocumentViewer from './DocumentViewer';
import TaskTracker from './TaskTracker';
import KanbanBoard from './KanbanBoard';
import NextActions from './NextActions';
import Milestones from './Milestones';
import CriticalPath from './CriticalPath';

type View = 'dashboard' | 'documents' | 'tasks' | 'history' | 'kanban' | 'next-actions' | 'milestones' | 'critical-path';

interface Task {
  id: string;
  task: string;
  owner: string;
  status: 'PENDING' | 'IN PROGRESS' | 'DONE' | 'BLOCKED';
  blockedBy: string;
  dateDone: string;
  notes: string;
  phase: string;
}

export default function Portal() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentUser] = useState(USERS[0]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    tasks: Task[];
    isLoading: boolean;
  }>({ tasks: [], isLoading: true });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const content = await getFileContent('00_PROJECT_MANAGEMENT/TASK_TRACKER.md');
      const tasks = parseTaskTracker(content);
      setDashboardData({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData({ tasks: [], isLoading: false });
    }
  };

  const parseTaskTracker = (content: string): Task[] => {
    const tasks: Task[] = [];
    const lines = content.split('\n');
    let currentPhase = '';

    for (const line of lines) {
      const phaseMatch = line.match(/## (PHASE \d+):/);
      if (phaseMatch) {
        currentPhase = phaseMatch[1];
        continue;
      }

      const taskMatch = line.match(/\| (\d+\.\d+) \| (.+?) \| (.+?) \| (PENDING|IN PROGRESS|DONE|BLOCKED) \| (.+?) \| (.+?) \| (.+?) \|/);
      if (taskMatch && currentPhase) {
        tasks.push({
          id: taskMatch[1],
          task: taskMatch[2].trim(),
          owner: taskMatch[3].trim(),
          status: taskMatch[4] as Task['status'],
          blockedBy: taskMatch[5].trim(),
          dateDone: taskMatch[6].trim(),
          notes: taskMatch[7].trim(),
          phase: currentPhase,
        });
      }
    }

    return tasks;
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'kanban', label: 'Kanban Board', icon: Columns },
    { id: 'next-actions', label: 'Next Actions', icon: Zap },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'critical-path', label: 'Critical Path', icon: Route },
    { id: 'history', label: 'History', icon: History },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        if (dashboardData.isLoading) {
          return (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
          );
        }

        const { tasks } = dashboardData;
        
        // Group tasks by phase
        const tasksByPhase = tasks.reduce((acc, task) => {
          if (!acc[task.phase]) acc[task.phase] = [];
          acc[task.phase].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
        
        // Calculate phase completion
        const phases = ['PHASE 1', 'PHASE 2', 'PHASE 3', 'PHASE 4', 'PHASE 5', 'PHASE 6'];
        const phaseProgress = phases.map(phase => {
          const phaseTasks = tasksByPhase[phase] || [];
          const completed = phaseTasks.filter(t => t.status === 'DONE').length;
          const total = phaseTasks.length;
          const percent = total > 0 ? (completed / total) * 100 : 0;
          return { phase, completed, total, percent };
        });
        
        // Find current phase (first incomplete phase)
        const currentPhaseIndex = phaseProgress.findIndex(p => p.percent < 100);
        const currentPhase = currentPhaseIndex >= 0 ? phaseProgress[currentPhaseIndex] : phaseProgress[phaseProgress.length - 1];
        
        // Calculate real stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const inProgressTasks = tasks.filter(t => t.status === 'IN PROGRESS').length;
        const blockedTasksCount = tasks.filter(t => t.status === 'BLOCKED').length;
        
        // Calculate completion percentage
        const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Get ready to start tasks (Phase 2+ tasks that can start)
        const getPhaseNumber = (phase: string): number => {
          const match = phase.match(/PHASE (\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const isPhaseComplete = (phase: string): boolean => {
          const phaseTasks = tasksByPhase[phase] || [];
          if (phaseTasks.length === 0) return true;
          return phaseTasks.every(t => t.status === 'DONE');
        };
        
        const readyToStartTasks = tasks.filter(t => {
          if (t.status !== 'PENDING') return false;
          const phaseNum = getPhaseNumber(t.phase);
          if (phaseNum <= 1) return true; // Phase 1 tasks
          const prevPhase = `PHASE ${phaseNum - 1}`;
          return isPhaseComplete(prevPhase);
        }).slice(0, 3);
        
        // Calculate days until SIA license
        const siaExpiryDate = new Date('2027-01-30');
        const daysUntilSIA = Math.ceil((siaExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate estimated launch date based on critical path
        const remainingTasks = totalTasks - completedTasks;
        const avgTaskDuration = 5; // days per task
        const daysToLaunch = remainingTasks * avgTaskDuration;
        const launchDate = new Date();
        launchDate.setDate(launchDate.getDate() + daysToLaunch);
        
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Welcome back, {currentUser.name}
              </h1>
              <p className="text-slate-600">Here&apos;s what&apos;s happening with your projects today.</p>
            </div>

            {/* Critical Dashboard Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Time to Launch Widget */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {daysToLaunch} days remaining
                  </span>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-sm text-slate-500">Estimated Launch</div>
                <div className="mt-3 text-xs text-slate-400">
                  Based on {remainingTasks} remaining tasks
                </div>
              </div>

              {/* Current Phase Widget */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm text-emerald-600 font-medium">
                    {currentPhase?.completed || 0} of {currentPhase?.total || 0} done
                  </span>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {currentPhase?.phase || 'Complete'}
                </div>
                <div className="text-sm text-slate-500">Current Phase</div>
                <div className="mt-3">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all" 
                      style={{ width: `${currentPhase?.percent || 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{currentPhase?.percent.toFixed(0) || 100}% complete</div>
                </div>
              </div>

              {/* Ready to Start Widget */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {readyToStartTasks.length} tasks ready
                  </span>
                </div>
                <div className="space-y-3">
                  {readyToStartTasks.length > 0 ? (
                    readyToStartTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{task.task}</p>
                          <p className="text-xs text-slate-500">{task.phase} • {task.owner}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 mb-2">🎉 Phase 1 Complete!</p>
                      <p className="text-xs text-slate-400">Start Phase 2 tasks</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phase Progress */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Phase Progress</h3>
              <div className="space-y-4">
                {phaseProgress.map((phase, index) => {
                  const isCurrent = index === currentPhaseIndex;
                  const isComplete = phase.percent === 100;
                  return (
                    <div key={phase.phase} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-slate-600">
                        {phase.phase}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              isComplete ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${phase.percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 text-right text-sm text-slate-600">
                        {isComplete ? (
                          <span className="text-emerald-600">✓ Complete</span>
                        ) : isCurrent ? (
                          <span className="text-blue-600">← You are here</span>
                        ) : (
                          `${phase.completed}/${phase.total}`
                        )}
                      </div>
                    </div>
                  );
                })}
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

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Task Status Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-700">Completed</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-700">In Progress</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{inProgressTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-slate-700">Pending</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{tasks.filter(t => t.status === 'PENDING').length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-slate-700">Blocked</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{blockedTasksCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="h-full flex relative">
            <FileBrowser 
              onFileSelect={setSelectedFile} 
              selectedPath={selectedFile?.path}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <div className="flex-1 min-w-0">
              <DocumentViewer 
                file={selectedFile} 
                currentUser={currentUser}
                onNavigate={(path) => {
                  // Handle breadcrumb navigation
                  console.log('Navigate to:', path);
                }}
              />
            </div>
          </div>
        );

      case 'tasks':
        return <TaskTracker />;

      case 'kanban':
        return <KanbanBoard />;

      case 'next-actions':
        return <NextActions />;

      case 'milestones':
        return <Milestones />;

      case 'critical-path':
        return <CriticalPath />;

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
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300`}>
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">V</span>
            </div>
            <span className="font-bold text-gray-800">Vanguard Elite</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
