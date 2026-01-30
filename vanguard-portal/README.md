# Vanguard Elite Services - Team Portal

A user-friendly web interface for managing documents and tasks for Vanguard Elite Services Limited. This portal provides an intuitive interface for non-technical team members to collaborate on documents while automatically managing GitHub repository changes.

## Features

### Dashboard
- Overview of project statistics (tasks completed, documents updated, blocked items)
- Recent activity feed
- Quick access to ready-to-start tasks

### Document Management
- **File Browser**: Navigate your 10-folder structure with ease
- **Document Viewer**: View markdown files with rich formatting
- **Document Editor**: Edit documents with automatic Git commits
- **Change History**: See who changed what and when in plain English
- **Auto-sync**: Every save automatically commits to GitHub with descriptive messages

### Task Tracker
- Visual task board organized by phases
- Filter by status (All, Blocked, Ready to Start)
- Progress statistics
- Quick task status updates

### User Management
- Role-based permissions (Admin, Editor)
- Folder-level access control
- User profiles and activity tracking

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **GitHub Integration**: Octokit REST API
- **Markdown**: react-markdown with remark-gfm
- **Icons**: Lucide React
- **Hosting**: Vercel (recommended)

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. A GitHub account
3. A GitHub Personal Access Token with repo permissions

### Step 1: Clone and Install

```bash
git clone https://github.com/viriolo/vanguard-elite-services.git
cd vanguard-elite-services/vanguard-portal
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the `vanguard-portal` directory:

```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

**To create a GitHub Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Vanguard Portal"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)

### Step 3: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 4: Build for Production

```bash
npm run build
```

The static files will be in the `dist` folder.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd vanguard-portal
vercel --prod
```

4. Add environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `GITHUB_TOKEN` with your token value
   - Redeploy

### Option 2: Deploy via GitHub Integration

1. Push the `vanguard-portal` folder to your GitHub repository
2. Go to https://vercel.com and sign up/login
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `vanguard-portal`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variable: `GITHUB_TOKEN`
7. Click Deploy

## User Guide

### For Team Members

1. **Access the Portal**: Open the deployed URL in your browser
2. **Navigate Documents**: Click "Documents" in the sidebar, browse folders, click files to view
3. **Edit Documents**: Click "Edit" button, make changes, click "Save Changes"
4. **Track Tasks**: Click "Tasks" to see all tasks, filter by status, click tasks to update
5. **View History**: Click "History" to see recent changes across all documents

### Change Management

The portal automatically handles Git operations:
- **Opening a file**: Automatically pulls latest version
- **Saving changes**: Automatically commits with descriptive message
- **Commit messages**: Generated automatically based on file type and changes
  - Example: "Roger Kumin updated SOP-001: revised procedures"
  - Example: "Consultant completed Task 1.6: Set up folder structure"

### Folder Permissions

| Folder | Who Can Edit | Needs Approval |
|--------|-------------|----------------|
| 00_PROJECT_MANAGEMENT | Anyone | No |
| 01_COMPANY_FORMATION | Roger only | -- |
| 02_LICENSING_CERTIFICATIONS | Roger only | -- |
| 03_INSURANCE_LEGAL | Roger + Legal | Yes (if not Roger) |
| 04_OPERATIONS | Ops Manager + Roger | Yes (if not Roger) |
| 05_HR_TRAINING | HR Lead + Roger | Yes (if not Roger) |
| 06_FINANCE | Roger only | -- |
| 07_BUSINESS_DEVELOPMENT | Anyone | Yes (if not Roger) |
| 08_CONTRACTS_CLIENTS | Roger + Client Manager | Yes (if not Roger) |
| 09_EXPANSION_INTERNATIONAL | Roger + Consultant | No |
| 10_TEMPLATES | Anyone | Yes (if not Roger) |

## Architecture

### File Structure
```
vanguard-portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main portal page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── Portal.tsx      # Main portal component
│   │   ├── FileBrowser.tsx # Document navigation
│   │   ├── DocumentViewer.tsx # View/edit documents
│   │   └── TaskTracker.tsx # Task management
│   └── lib/
│       ├── github.ts       # GitHub API integration
│       └── config.ts       # Folder structure & permissions
├── package.json
├── next.config.mjs
└── README.md
```

### Key Components

**Portal.tsx**: Main layout with sidebar navigation and view switching
**FileBrowser.tsx**: Folder tree with GitHub repository integration
**DocumentViewer.tsx**: Markdown viewer/editor with auto-commit
**TaskTracker.tsx**: Task board with filtering and statistics

### GitHub Integration

The portal uses the GitHub REST API to:
- Fetch repository contents
- Read file contents
- Update files with commits
- Retrieve commit history

All Git operations are abstracted away from users - they just see "Save" and "History".

## Customization

### Adding New Users

Edit `src/lib/config.ts`:

```typescript
export const USERS = [
  { id: 'roger', name: 'Roger Kumin', role: 'admin', initials: 'RK' },
  { id: 'consultant', name: 'Consultant', role: 'editor', initials: 'CN' },
  // Add new users here
];
```

### Modifying Folder Structure

Edit the `FOLDER_STRUCTURE` array in `src/lib/config.ts` to match your organization.

### Changing Permissions

Edit the `getFolderPermissions` function in `src/lib/config.ts`.

## Troubleshooting

### "Repository not found" error
- Check that your GitHub token has `repo` scope
- Verify the repository name in `src/lib/github.ts`

### "Failed to save" error
- Check your internet connection
- Verify the file hasn't been modified by someone else
- Try refreshing the page and editing again

### Changes not appearing
- Click the refresh button next to folder names
- Check the History view to see if commits were made
- Verify your GitHub token is valid

## Security Considerations

1. **GitHub Token**: Never commit your `.env.local` file. Add it to `.gitignore`.
2. **Access Control**: The portal currently uses client-side role checking. For production, consider server-side authentication.
3. **HTTPS**: Always deploy with HTTPS enabled (Vercel does this automatically).

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the GitHub repository issues
3. Contact the development team

## License

Private - For Vanguard Elite Services Limited internal use only.
