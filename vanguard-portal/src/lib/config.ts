export const FOLDER_STRUCTURE = [
  {
    id: '00_PROJECT_MANAGEMENT',
    name: 'Project Management',
    icon: '📋',
    description: 'Task tracking, decisions, and planning',
    subfolders: [
      { id: 'action_plans', name: 'Action Plans' },
      { id: 'decision_log', name: 'Decision Log' },
      { id: 'risk_register', name: 'Risk Register' },
      { id: 'gantt_charts', name: 'Gantt Charts' },
    ],
  },
  {
    id: '01_COMPANY_FORMATION',
    name: 'Company Formation',
    icon: '🏢',
    description: 'Registration and company identity',
    subfolders: [
      { id: 'registration_documents', name: 'Registration Documents' },
      { id: 'company_identity', name: 'Company Identity' },
    ],
  },
  {
    id: '02_LICENSING_CERTIFICATIONS',
    name: 'Licensing & Certifications',
    icon: '📜',
    description: 'SIA licenses and other permits',
    subfolders: [
      { id: 'sia_license', name: 'SIA License' },
      { id: 'other_permits', name: 'Other Permits' },
    ],
  },
  {
    id: '03_INSURANCE_LEGAL',
    name: 'Insurance & Legal',
    icon: '⚖️',
    description: 'Contracts, insurance, and legal documents',
    subfolders: [
      { id: 'insurance_policies', name: 'Insurance Policies' },
      { id: 'contracts_templates', name: 'Contract Templates' },
      { id: 'legal_agreements', name: 'Legal Agreements' },
    ],
  },
  {
    id: '04_OPERATIONS',
    name: 'Operations',
    icon: '🛡️',
    description: 'SOPs, equipment, and operational docs',
    subfolders: [
      { id: 'sops', name: 'Standard Operating Procedures' },
      { id: 'equipment_inventory', name: 'Equipment Inventory' },
    ],
  },
  {
    id: '05_HR_TRAINING',
    name: 'HR & Training',
    icon: '👥',
    description: 'Recruitment, training, and policies',
    subfolders: [
      { id: 'recruitment', name: 'Recruitment' },
      { id: 'training_materials', name: 'Training Materials' },
      { id: 'policies', name: 'Policies' },
    ],
  },
  {
    id: '06_FINANCE',
    name: 'Finance',
    icon: '💰',
    description: 'Budgets, accounting, and financial docs',
    subfolders: [
      { id: 'budgets', name: 'Budgets' },
    ],
  },
  {
    id: '07_BUSINESS_DEVELOPMENT',
    name: 'Business Development',
    icon: '📈',
    description: 'Proposals, marketing, and growth plans',
    subfolders: [
      { id: 'proposals', name: 'Proposals' },
    ],
  },
  {
    id: '08_CONTRACTS_CLIENTS',
    name: 'Contracts & Clients',
    icon: '🤝',
    description: 'Active contracts and client documents',
    subfolders: [],
  },
  {
    id: '09_EXPANSION_INTERNATIONAL',
    name: 'Expansion & International',
    icon: '🌍',
    description: 'International expansion plans',
    subfolders: [],
  },
  {
    id: '10_TEMPLATES',
    name: 'Templates',
    icon: '📄',
    description: 'Reusable document templates',
    subfolders: [],
  },
];

export const USERS = [
  { id: 'roger', name: 'Roger Kumin', role: 'admin', initials: 'RK' },
  { id: 'consultant', name: 'Consultant', role: 'editor', initials: 'CN' },
  { id: 'ops_manager', name: 'Operations Manager', role: 'editor', initials: 'OM' },
  { id: 'hr_lead', name: 'HR Lead', role: 'editor', initials: 'HR' },
];

export function getFolderPermissions(folderId: string, userRole: string): {
  canEdit: boolean;
  needsApproval: boolean;
} {
  const permissions: Record<string, { canEdit: boolean; needsApproval: boolean }> = {
    '00_PROJECT_MANAGEMENT': { canEdit: true, needsApproval: false },
    '01_COMPANY_FORMATION': { canEdit: userRole === 'admin', needsApproval: false },
    '02_LICENSING_CERTIFICATIONS': { canEdit: userRole === 'admin', needsApproval: false },
    '03_INSURANCE_LEGAL': { canEdit: true, needsApproval: userRole !== 'admin' },
    '04_OPERATIONS': { canEdit: true, needsApproval: userRole !== 'admin' },
    '05_HR_TRAINING': { canEdit: true, needsApproval: userRole !== 'admin' },
    '06_FINANCE': { canEdit: userRole === 'admin', needsApproval: false },
    '07_BUSINESS_DEVELOPMENT': { canEdit: true, needsApproval: userRole !== 'admin' },
    '08_CONTRACTS_CLIENTS': { canEdit: true, needsApproval: userRole !== 'admin' },
    '09_EXPANSION_INTERNATIONAL': { canEdit: true, needsApproval: false },
    '10_TEMPLATES': { canEdit: true, needsApproval: userRole !== 'admin' },
  };

  return permissions[folderId] || { canEdit: false, needsApproval: true };
}
