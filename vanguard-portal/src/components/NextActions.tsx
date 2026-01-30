'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  User,
  AlertTriangle,
  Play,
  Lock
} from 'lucide-react';
import { getFileContent } from '@/lib/github-client';

interface Task {
  id: string;
  task: string;
  owner: string;
  status: 'PENDING' | 'IN PROGRESS' | 'DONE' | 'BLOCKED';
  blockedBy: string;
  dateDone: string;
  notes: string;
  phase: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDays: number;
}

interface ActionItem {
  task: Task;
  reason: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  blockedBy?: Task[];
  canStart: boolean;
}

export default function NextActions() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const content = await getFileContent('00_PROJECT_MANAGEMENT/TASK_TRACKER.md');
      const parsedTasks = parseTaskTracker(content);
      setTasks(parsedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
    setIsLoading(false);
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
        const priority = taskMatch[2].toLowerCase().includes('high') ? 'high' : 
                        taskMatch[2].toLowerCase().includes('medium') ? 'medium' : 'low';
        
        tasks.push({
          id: taskMatch[1],
          task: taskMatch[2].trim(),
          owner: taskMatch[3].trim(),
          status: taskMatch[4] as Task['status'],
          blockedBy: taskMatch[5].trim(),
          dateDone: taskMatch[6].trim(),
          notes: taskMatch[7].trim(),
          phase: currentPhase,
          priority,
          estimatedDays: estimateDays(taskMatch[2]),
        });
      }
    }

    return tasks;
  };

  const estimateDays = (taskName: string): number => {
    if (taskName.includes('register') || taskName.includes('license')) return 14;
    if (taskName.includes('apply') || taskName.includes('clearance')) return 7;
    if (taskName.includes('contact') || taskName.includes('quote')) return 3;
    if (taskName.includes('prepare') || taskName.includes('create')) return 5;
    return 3;
  };

  // Calculate next actions based on dependencies and priorities
  const nextActions = useMemo(() => {
    const actions: ActionItem[] = [];
    
    // Get all pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    
    // Get completed tasks for dependency checking
    const completedTaskIds = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
    
    pendingTasks.forEach(task => {
      let action: ActionItem = {
        task,
        reason: '',
        urgency: 'low',
        canStart: false,
      };

      // Check if task is blocked
      if (task.blockedBy !== '--') {
        const blockers = task.blockedBy.split(',').map(b => b.trim());
        const uncompletedBlockers = blockers.filter(b => !completedTaskIds.has(b) && b !== '');
        
        if (uncompletedBlockers.length > 0) {
          const blockerTasks = tasks.filter(t => uncompletedBlockers.includes(t.id));
          action.blockedBy = blockerTasks;
          action.reason = `Waiting for: ${blockerTasks.map(b => b.task).join(', ')}`;
          action.urgency = blockerTasks.some(b => b.status === 'IN PROGRESS') ? 'high' : 'medium';
        } else {
          action.canStart = true;
          action.reason = 'All dependencies completed';
          action.urgency = task.priority === 'high' ? 'critical' : task.priority === 'medium' ? 'high' : 'medium';
        }
      } else {
        // No dependencies - can start immediately
        action.canStart = true;
        action.reason = 'No dependencies';
        action.urgency = task.priority === 'high' ? 'critical' : task.priority === 'medium' ? 'high' : 'medium';
      }

      actions.push(action);
    });

    // Sort by urgency and whether it can start
    return actions.sort((a, b) => {
      if (a.canStart && !b.canStart) return -1;
      if (!a.canStart && b.canStart) return 1;
      
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [tasks]);

  // Get currently in-progress tasks
  const inProgressTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'IN PROGRESS');
  }, [tasks]);

  // Get blocked tasks with details
  const blockedTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'BLOCKED')
      .map(task => {
        const completedTaskIds = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
        const blockers = task.blockedBy.split(',').map(b => b.trim()).filter(b => b !== '');
        const uncompletedBlockers = blockers.filter(b => !completedTaskIds.has(b));
        const blockerTasks = tasks.filter(t => uncompletedBlockers.includes(t.id));
        
        return {
          task,
          blockerTasks,
        };
      });
  }, [tasks]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-slate-600">Calculating next actions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Next Actions</h1>
          <p className="text-slate-600">Smart task prioritization based on dependencies and urgency</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ready to Start */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Play className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Ready to Start</h2>
                    <p className="text-sm text-slate-500">{nextActions.filter(a => a.canStart).length} tasks can begin immediately</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {nextActions
                  .filter(action => action.canStart)
                  .slice(0, 5)
                  .map((action, index) => (
                    <div key={action.task.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-xs font-medium text-slate-400 mb-1 block">{action.task.id}</span>
                              <h3 className="font-semibold text-slate-800">{action.task.task}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(action.urgency)}`}>
                              {action.urgency}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {action.task.owner}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              ~{action.task.estimatedDays} days
                            </span>
                            <span className="text-slate-400">{action.task.phase}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-700">{action.reason}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {nextActions.filter(a => a.canStart).length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                    <p>All available tasks are in progress or completed!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Blocked Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Blocked Tasks</h2>
                    <p className="text-sm text-slate-500">{blockedTasks.length} tasks waiting on dependencies</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {blockedTasks.slice(0, 3).map(({ task, blockerTasks }) => (
                  <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                      
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-slate-400 mb-1 block">{task.id}</span>
                          <h3 className="font-semibold text-slate-800">{task.task}</h3>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800 mb-2">Blocked by:</p>
                          <div className="space-y-1">
                            {blockerTasks.map(blocker => (
                              <div key={blocker.id} className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">{blocker.id}:</span>
                                <span className="text-slate-700">{blocker.task}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  blocker.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                  blocker.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {blocker.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {blockedTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                    <p>No blocked tasks - great progress!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* In Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800">In Progress</h3>
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {inProgressTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {inProgressTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-400">{task.id}</span>
                    <p className="text-sm font-medium text-slate-800 mt-1">{task.task}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      {task.owner}
                    </div>
                  </div>
                ))}

                {inProgressTasks.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No tasks in progress</p>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Tasks</span>
                  <span className="font-semibold text-slate-800">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Completed</span>
                  <span className="font-semibold text-emerald-600">{tasks.filter(t => t.status === 'DONE').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Ready to Start</span>
                  <span className="font-semibold text-blue-600">{nextActions.filter(a => a.canStart).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Blocked</span>
                  <span className="font-semibold text-red-600">{blockedTasks.length}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-800">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-slate-500">Overall Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
