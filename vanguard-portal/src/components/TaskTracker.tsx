'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2
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
}

interface TaskTrackerProps {
  onTaskSelect?: (task: Task) => void;
}

const PHASES = [
  { id: 'PHASE 1', name: 'Foundation', color: 'bg-blue-100 text-blue-800' },
  { id: 'PHASE 2', name: 'Registration & Licensing', color: 'bg-purple-100 text-purple-800' },
  { id: 'PHASE 3', name: 'First Contract', color: 'bg-orange-100 text-orange-800' },
  { id: 'PHASE 4', name: 'Operational Readiness', color: 'bg-green-100 text-green-800' },
  { id: 'PHASE 5', name: 'Go Live', color: 'bg-red-100 text-red-800' },
  { id: 'PHASE 6', name: 'Growth & Expansion', color: 'bg-teal-100 text-teal-800' },
];

export default function TaskTracker({ onTaskSelect }: TaskTrackerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['PHASE 1']));
  const [filter, setFilter] = useState<'all' | 'mine' | 'blocked' | 'ready'>('all');

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    const content = await getFileContent('00_PROJECT_MANAGEMENT/TASK_TRACKER.md');
    const parsedTasks = parseTaskTracker(content);
    setTasks(parsedTasks);
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

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'IN PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'BLOCKED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const styles = {
      'DONE': 'bg-green-100 text-green-700',
      'IN PROGRESS': 'bg-blue-100 text-blue-700',
      'BLOCKED': 'bg-red-100 text-red-700',
      'PENDING': 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'blocked') return task.status === 'BLOCKED';
    if (filter === 'ready') return task.status === 'PENDING' && task.blockedBy === '--';
    return true;
  });

  const tasksByPhase = PHASES.map((phase) => ({
    ...phase,
    tasks: filteredTasks.filter((t) => t.phase === phase.id),
  }));

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    inProgress: tasks.filter((t) => t.status === 'IN PROGRESS').length,
    blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
    ready: tasks.filter((t) => t.status === 'PENDING' && t.blockedBy === '--').length,
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Task Tracker</h2>
          <button
            onClick={loadTasks}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Loader2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Tasks</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-blue-600">In Progress</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-xs text-red-600">Blocked</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.ready}</div>
            <div className="text-xs text-purple-600">Ready to Start</div>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'blocked', label: 'Blocked' },
            { id: 'ready', label: 'Ready to Start' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {tasksByPhase.map((phase) => (
            <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${phase.color}`}>
                    {phase.id}
                  </span>
                  <span className="font-medium text-gray-800">{phase.name}</span>
                  <span className="text-sm text-gray-500">({phase.tasks.length} tasks)</span>
                </div>
                {expandedPhases.has(phase.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedPhases.has(phase.id) && phase.tasks.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskSelect?.(task)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">{task.id}</span>
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {task.task}
                          </span>
                        </div>
                        {task.notes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{task.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{task.owner}</span>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expandedPhases.has(phase.id) && phase.tasks.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-400 italic">
                  No tasks match the current filter
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
