'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Route, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  AlertCircle,
  GitBranch
} from 'lucide-react';
import { getFileContent } from '@/lib/github-client';

interface Task {
  id: string;
  task: string;
  owner: string;
  status: 'PENDING' | 'IN PROGRESS' | 'DONE' | 'BLOCKED';
  blockedBy: string;
  phase: string;
  estimatedDays: number;
}

export default function CriticalPath() {
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

      const taskMatch = line.match(/\| (\d+\.\d+) \| (.+?) \| (.+?) \| (PENDING|IN PROGRESS|DONE|BLOCKED) \| (.+?) \|/);
      if (taskMatch && currentPhase) {
        tasks.push({
          id: taskMatch[1],
          task: taskMatch[2].trim(),
          owner: taskMatch[3].trim(),
          status: taskMatch[4] as Task['status'],
          blockedBy: taskMatch[5].trim(),
          phase: currentPhase,
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

  const criticalPathAnalysis = useMemo(() => {
    const graph: Record<string, string[]> = {};
    
    tasks.forEach(task => {
      graph[task.id] = [];
    });
    
    tasks.forEach(task => {
      if (task.blockedBy !== '--') {
        const dependencies = task.blockedBy.split(',').map(b => b.trim()).filter(b => b !== '');
        dependencies.forEach(dep => {
          if (graph[dep]) {
            graph[dep].push(task.id);
          }
        });
      }
    });
    
    const findAllPaths = (start: string, end: string, visited: Set<string> = new Set()): string[][] => {
      if (start === end) return [[start]];
      if (visited.has(start)) return [];
      
      visited.add(start);
      const paths: string[][] = [];
      
      for (const neighbor of graph[start] || []) {
        const subPaths = findAllPaths(neighbor, end, new Set(visited));
        for (const subPath of subPaths) {
          paths.push([start, ...subPath]);
        }
      }
      
      return paths;
    };
    
    const startNodes = tasks.filter(t => t.blockedBy === '--' || t.blockedBy === '').map(t => t.id);
    const allDependencies = new Set<string>();
    tasks.forEach(t => {
      if (t.blockedBy !== '--') {
        t.blockedBy.split(',').forEach(b => allDependencies.add(b.trim()));
      }
    });
    const endNodes = tasks.filter(t => !allDependencies.has(t.id)).map(t => t.id);
    
    let criticalPath: string[] = [];
    let criticalPathDuration = 0;
    
    for (const start of startNodes) {
      for (const end of endNodes) {
        const paths = findAllPaths(start, end);
        for (const path of paths) {
          const duration = path.reduce((sum, taskId) => {
            const task = tasks.find(t => t.id === taskId);
            return sum + (task?.estimatedDays || 0);
          }, 0);
          
          if (duration > criticalPathDuration) {
            criticalPathDuration = duration;
            criticalPath = path;
          }
        }
      }
    }
    
    const pendingCriticalTasks = criticalPath.filter(id => {
      const task = tasks.find(t => t.id === id);
      return task && task.status !== 'DONE';
    });
    
    const remainingDuration = pendingCriticalTasks.reduce((sum, id) => {
      const task = tasks.find(t => t.id === id);
      return sum + (task?.estimatedDays || 0);
    }, 0);
    
    return {
      criticalPath,
      criticalPathDuration,
      remainingDuration,
      pendingCriticalTasks: pendingCriticalTasks.length,
    };
  }, [tasks]);

  const criticalTasks = useMemo(() => {
    return tasks.filter(t => criticalPathAnalysis.criticalPath.includes(t.id));
  }, [tasks, criticalPathAnalysis.criticalPath]);

  const bottlenecks = useMemo(() => {
    const blockingCounts: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.blockedBy !== '--') {
        const dependencies = task.blockedBy.split(',').map(b => b.trim()).filter(b => b !== '');
        dependencies.forEach(dep => {
          blockingCounts[dep] = (blockingCounts[dep] || 0) + 1;
        });
      }
    });
    
    return Object.entries(blockingCounts)
      .filter(([, count]) => count >= 2)
      .map(([id, count]) => ({
        task: tasks.find(t => t.id === id),
        blockingCount: count,
      }))
      .filter(item => item.task)
      .sort((a, b) => b.blockingCount - a.blockingCount);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-slate-600">Analyzing critical path...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Route className="w-8 h-8 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-800">Critical Path Analysis</h1>
          </div>
          <p className="text-slate-600">Identify the sequence of tasks that determines the minimum project duration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-500">Total Critical Path</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{criticalPathAnalysis.criticalPathDuration} days</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-slate-500">Remaining on Critical Path</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{criticalPathAnalysis.remainingDuration} days</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-500">Critical Tasks</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{criticalTasks.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-slate-500">Pending Critical Tasks</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{criticalPathAnalysis.pendingCriticalTasks}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-3">
                <Route className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-slate-800">Critical Path Tasks</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {criticalTasks.map((task, index) => {
                  const isCompleted = task.status === 'DONE';
                  const isPending = task.status === 'PENDING';
                  
                  return (
                    <div key={task.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <span className="text-sm font-bold text-red-600">{index + 1}</span>
                          )}
                        </div>
                        {index < criticalTasks.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-300 mt-2" />
                        )}
                      </div>
                      
                      <div className={`flex-1 p-4 rounded-lg border ${
                        isCompleted 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : isPending 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-medium text-slate-400">{task.id}</span>
                            <h3 className={`font-semibold ${isCompleted ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                              {task.task}
                            </h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            task.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{task.phase}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedDays} days
                          </span>
                          <span>{task.owner}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-800">Bottleneck Tasks</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Tasks that block multiple other tasks</p>
            </div>

            <div className="divide-y divide-slate-100">
              {bottlenecks.length > 0 ? (
                bottlenecks.map(({ task, blockingCount }) => (
                  <div key={task!.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-400">{task!.id}</span>
                        <h3 className="font-semibold text-slate-800 mt-1">{task!.task}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task!.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                            task!.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {task!.status}
                          </span>
                          <span className="text-sm text-slate-500">{task!.phase}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">{blockingCount}</div>
                        <div className="text-xs text-slate-500">tasks blocked</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p>No significant bottlenecks detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
