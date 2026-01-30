'use client';

import { useState, useEffect } from 'react';
import { 
  Flag, 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle,
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';
import { getFileContent } from '@/lib/github-client';

interface Milestone {
  id: string;
  name: string;
  phase: string;
  description: string;
  tasks: string[];
  completedTasks: number;
  totalTasks: number;
  status: 'completed' | 'in-progress' | 'pending';
  estimatedCompletion?: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    name: 'Company Formation Complete',
    phase: 'PHASE 1',
    description: 'All foundational documents and structures in place',
    tasks: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10', '1.11', '1.12', '1.13'],
    completedTasks: 0,
    totalTasks: 13,
    status: 'in-progress',
  },
  {
    id: 'm2',
    name: 'Legal Registration',
    phase: 'PHASE 2',
    description: 'IPA registration, tax compliance, and licenses obtained',
    tasks: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10', '2.11', '2.12'],
    completedTasks: 0,
    totalTasks: 12,
    status: 'pending',
  },
  {
    id: 'm3',
    name: 'First Contract Secured',
    phase: 'PHASE 3',
    description: 'Signed agreement with first client',
    tasks: ['3.1', '3.2', '3.3', '3.4', '3.5'],
    completedTasks: 0,
    totalTasks: 5,
    status: 'pending',
  },
  {
    id: 'm4',
    name: 'Operational Ready',
    phase: 'PHASE 4',
    description: 'Guards hired, trained, and equipped',
    tasks: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'],
    completedTasks: 0,
    totalTasks: 7,
    status: 'pending',
  },
  {
    id: 'm5',
    name: 'Go Live',
    phase: 'PHASE 5',
    description: 'First deployment active',
    tasks: ['5.1', '5.2', '5.3'],
    completedTasks: 0,
    totalTasks: 3,
    status: 'pending',
  },
];

export default function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestoneData();
  }, []);

  const loadMilestoneData = async () => {
    setIsLoading(true);
    try {
      const content = await getFileContent('00_PROJECT_MANAGEMENT/TASK_TRACKER.md');
      const completedTasks = parseCompletedTasks(content);
      
      // Update milestones with actual completion data
      const updatedMilestones = MILESTONES.map(milestone => {
        const completedCount = milestone.tasks.filter(taskId => 
          completedTasks.has(taskId)
        ).length;
        
        let status: Milestone['status'] = 'pending';
        if (completedCount === milestone.totalTasks) {
          status = 'completed';
        } else if (completedCount > 0) {
          status = 'in-progress';
        }
        
        return {
          ...milestone,
          completedTasks: completedCount,
          status,
        };
      });
      
      setMilestones(updatedMilestones);
    } catch (error) {
      console.error('Error loading milestone data:', error);
    }
    setIsLoading(false);
  };

  const parseCompletedTasks = (content: string): Set<string> => {
    const completed = new Set<string>();
    const lines = content.split('\n');
    
    for (const line of lines) {
      const taskMatch = line.match(/\| (\d+\.\d+) \| .+? \| .+? \| DONE \|/);
      if (taskMatch) {
        completed.add(taskMatch[1]);
      }
    }
    
    return completed;
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>;
      case 'in-progress':
        return <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>;
      default:
        return <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
          <Circle className="w-6 h-6 text-slate-400" />
        </div>;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500 bg-emerald-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const overallProgress = milestones.length > 0 
    ? milestones.reduce((acc, m) => acc + (m.completedTasks / m.totalTasks), 0) / milestones.length * 100
    : 0;

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-slate-600">Loading milestones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Flag className="w-8 h-8 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-800">Project Milestones</h1>
          </div>
          <p className="text-slate-600">Track progress toward major project goals</p>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Overall Progress</h2>
                <p className="text-sm text-slate-500">{completedMilestones} of {milestones.length} milestones completed</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-800">{overallProgress.toFixed(0)}%</div>
            </div>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const progress = (milestone.completedTasks / milestone.totalTasks) * 100;
            
            return (
              <div 
                key={milestone.id}
                className={`relative rounded-xl border-2 p-6 transition-all ${getStatusColor(milestone.status)}`}
              >
                {/* Connector Line */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-10 top-full w-0.5 h-6 bg-slate-300" />
                )}
                
                <div className="flex items-start gap-4">
                  {getStatusIcon(milestone.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-slate-400">{milestone.phase}</span>
                        <h3 className="text-xl font-bold text-slate-800">{milestone.name}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        milestone.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {milestone.status === 'completed' ? 'Completed' :
                         milestone.status === 'in-progress' ? 'In Progress' :
                         'Pending'}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{milestone.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-800">
                          {milestone.completedTasks} / {milestone.totalTasks} tasks
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 border border-slate-200">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            milestone.status === 'completed' ? 'bg-emerald-500' :
                            milestone.status === 'in-progress' ? 'bg-blue-500' :
                            'bg-slate-300'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Task List Preview */}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Target className="w-4 h-4" />
                      <span>{milestone.tasks.length} key tasks</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
