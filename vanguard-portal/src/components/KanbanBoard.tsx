'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  User, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  Filter,
  Search,
  GripVertical
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
  estimatedDays?: number;
}

interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'pending', title: 'To Do', status: 'PENDING', color: 'bg-slate-100' },
  { id: 'in-progress', title: 'In Progress', status: 'IN PROGRESS', color: 'bg-blue-50' },
  { id: 'blocked', title: 'Blocked', status: 'BLOCKED', color: 'bg-red-50' },
  { id: 'done', title: 'Done', status: 'DONE', color: 'bg-green-50' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
      return matchesSearch && matchesPhase;
    });
  }, [tasks, searchQuery, filterPhase]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    COLUMNS.forEach(col => {
      grouped[col.id] = filteredTasks.filter(task => task.status === col.status);
    });
    return grouped;
  }, [filteredTasks]);

  const phases = useMemo(() => {
    const uniquePhases = Array.from(new Set(tasks.map(t => t.phase)));
    return uniquePhases.sort();
  }, [tasks]);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const newStatus = COLUMNS.find(c => c.id === columnId)?.status;
    if (!newStatus || newStatus === draggedTask.status) return;

    setTasks(prev => prev.map(task => 
      task.id === draggedTask.id 
        ? { ...task, status: newStatus }
        : task
    ));
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'IN PROGRESS': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'BLOCKED': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-slate-600">Loading Kanban board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kanban Board</h1>
            <p className="text-slate-500">Drag and drop tasks to update status</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {tasks.filter(t => t.status === 'DONE').length} of {tasks.length} completed
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="all">All Phases</option>
              {phases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map(column => (
            <div
              key={column.id}
              className={`w-80 flex flex-col rounded-xl ${column.color} border border-slate-200`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(column.status)}
                    <h3 className="font-semibold text-slate-700">{column.title}</h3>
                  </div>
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-slate-600">
                    {tasksByColumn[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tasksByColumn[column.id]?.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow group"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400">{task.id}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-medium text-slate-800 mb-3 leading-relaxed">
                      {task.task}
                    </h4>

                    {/* Task Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.blockedBy !== '--' && (
                          <span className="flex items-center gap-1 text-xs text-red-600" title={`Blocked by: ${task.blockedBy}`}>
                            <AlertCircle className="w-3 h-3" />
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.owner}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        ~{task.estimatedDays}d
                      </div>
                    </div>

                    {/* Phase Badge */}
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">{task.phase}</span>
                    </div>
                  </div>
                ))}

                {tasksByColumn[column.id]?.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
