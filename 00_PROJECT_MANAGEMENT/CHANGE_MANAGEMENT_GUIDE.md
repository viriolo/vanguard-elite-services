# Change Management Guide -- Shared Directory
## Vanguard Elite Services Limited

---

## Why This Matters

This directory is shared among the team. To prevent confusion, lost work, and conflicting edits, everyone must follow these simple rules.

---

## Git Version Control -- Quick Start

This directory uses **git** to track all changes. Git records who changed what, when, and why -- so nothing is ever lost and changes can be reviewed or undone.

### First Time Setup (Each Team Member)

Open a terminal/command prompt in the project directory and run:
```bash
git config user.name "Your Full Name"
git config user.email "your.email@example.com"
```

### Daily Workflow

**Before you start working:**
```bash
git pull          # Get the latest changes from the team
```

**After making changes:**
```bash
git add .                                    # Stage all changes
git commit -m "Brief description of changes" # Save a snapshot
git push                                     # Share with the team
```

### Commit Message Format

Use clear, descriptive messages:
- `Add: SOP for K9 operations`
- `Update: Guard training curriculum - added first aid module`
- `Fix: Corrected insurance premium estimates`
- `Complete: Task 2.3 - IPA registration lodged`

### View Change History
```bash
git log --oneline    # See list of all changes
git diff             # See what's changed since last commit
```

---

## File Editing Rules

1. **Always update the TASK_TRACKER.md** when you start or complete a task
2. **Never delete files** -- move to an `_archive` folder if no longer needed
3. **Use the folder structure** -- don't dump files in the root directory
4. **Name files clearly** -- use descriptive names, not "Document (1).docx"
5. **Add dates to important documents** -- e.g., `SOP_001_static_guarding_v1.1_2026-02-15.md`

---

## Who Can Change What

| Folder | Who Can Edit | Approval Needed? |
|--------|-------------|-----------------|
| 00_PROJECT_MANAGEMENT | Anyone | No |
| 01_COMPANY_FORMATION | Roger Kumin only | -- |
| 02_LICENSING_CERTIFICATIONS | Roger Kumin only | -- |
| 03_INSURANCE_LEGAL | Roger Kumin + Legal | Roger for contracts |
| 04_OPERATIONS | Ops Manager + Roger | Roger for SOPs |
| 05_HR_TRAINING | HR Lead + Roger | Roger for policies |
| 06_FINANCE | Roger Kumin only | -- |
| 07_BUSINESS_DEVELOPMENT | Anyone | Roger for final proposals |
| 08_CONTRACTS_CLIENTS | Roger + Client Manager | Roger for contracts |
| 09_EXPANSION_INTERNATIONAL | Roger + Consultant | -- |
| 10_TEMPLATES | Anyone | Roger for official templates |

---

## Document Versioning

For critical documents (SOPs, contracts, policies):

1. Use version numbers in the document header: `Version: 1.0`, `Version: 1.1`, `Version: 2.0`
2. Major changes = new major version (1.0 -> 2.0)
3. Minor edits = minor version (1.0 -> 1.1)
4. Record changes in the Document Control table at the bottom of each document
5. Git handles the actual version history -- the version numbers are for easy reference

---

## Resolving Conflicts

If two people edit the same file at the same time:

1. Git will flag a **merge conflict**
2. Don't panic -- open the file and look for `<<<<<<` markers
3. Choose which version to keep (or combine both)
4. Remove the conflict markers
5. Save, `git add .`, and `git commit -m "Resolve merge conflict in [filename]"`
6. If unsure, ask Roger or the consultant for help

---

## OneDrive + Git Note

Since this directory is on OneDrive, be aware:
- OneDrive may sync files in the background
- **Always use `git pull` before starting work** to avoid conflicts
- If OneDrive creates conflict copies (files with "... (1)" in the name), check which version is correct and delete the duplicate
- Consider using a dedicated Git hosting platform (GitHub, GitLab) as the team grows -- this gives a proper remote repository with web-based review tools

---

## Setting Up a Remote Repository (Recommended)

For better team collaboration, consider setting up a private GitHub or GitLab repository:

1. Create a free account at github.com
2. Create a new private repository named "vanguard-elite-services"
3. In your project directory, run:
   ```bash
   git remote add origin https://github.com/[your-username]/vanguard-elite-services.git
   git push -u origin main
   ```
4. Add team members as collaborators in repository settings
5. This provides a single source of truth independent of OneDrive sync

---

## Questions?

Contact Roger Kumin (Director) for access and permissions.
