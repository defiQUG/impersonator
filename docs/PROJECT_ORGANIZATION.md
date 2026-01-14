# Project Organization

This document describes the organization of the Impersonator project after cleanup and reorganization.

## Directory Structure

```
impersonator/
├── app/                          # Next.js App Router
├── components/                   # React components
├── contexts/                     # React contexts
├── helpers/                      # Helper functions
├── utils/                        # Utility functions
├── __tests__/                    # Test files
├── docs/                         # Documentation
│   ├── security/                # Security documentation
│   └── reports/                 # Reports and reviews
├── public/                      # Static assets
├── style/                        # Styles and themes
├── .github/                      # GitHub configuration
│   ├── workflows/               # CI/CD workflows
│   └── dependabot.yml          # Dependency updates
├── .husky/                       # Git hooks
├── types.ts                      # TypeScript types
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── jest.config.js                # Jest config
├── jest.setup.js                 # Jest setup
├── vercel.json                   # Vercel config
└── README.md                     # Project README
```

## File Organization

### Documentation Files

**Root Level:**
- `README.md` - Main project README
- `LICENSE.md` - License file
- `PROJECT_ORGANIZATION.md` - This file

**docs/ Directory:**
- Main documentation (01-12 numbered guides)
- `RECOMMENDATIONS_AND_NEXT_STEPS.md` - Recommendations
- `EXECUTIVE_RECOMMENDATIONS_SUMMARY.md` - Executive summary
- `QUICK_REFERENCE.md` - Quick reference

**docs/security/ Directory:**
- All security audit documents
- Security implementation guides
- Security testing guides

**docs/reports/ Directory:**
- Code review reports
- Testing reports
- Completion summaries

### Configuration Files

**Root Level:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup
- `vercel.json` - Vercel deployment
- `.gitignore` - Git ignore rules
- `.nvmrc` - Node version
- `.editorconfig` - Editor configuration
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Prettier ignore rules

**.github/ Directory:**
- `workflows/ci.yml` - CI/CD pipeline
- `workflows/security-audit.yml` - Security audit workflow
- `dependabot.yml` - Dependency updates

**.husky/ Directory:**
- `pre-commit` - Pre-commit hook

## Cleanup Summary

### Files Moved
- Security documents → `docs/security/`
- Reports → `docs/reports/`

### Files Kept in Root
- `README.md` - Main entry point
- `LICENSE.md` - Legal requirement
- Configuration files (package.json, tsconfig.json, etc.)
- Source code directories

### Files Created
- `.nvmrc` - Node version specification
- `.editorconfig` - Editor configuration
- `.prettierrc` - Code formatting
- `.prettierignore` - Prettier ignore rules
- `.husky/pre-commit` - Pre-commit hook
- `.lintstagedrc.js` - Lint-staged configuration
- `.github/dependabot.yml` - Dependency updates
- `.github/workflows/security-audit.yml` - Security audit
- Sentry configuration files
- Documentation index files

## Best Practices

1. **Keep root clean** - Only essential files in root
2. **Organize by type** - Group related files
3. **Document structure** - Keep this file updated
4. **Use subdirectories** - For related files
5. **Follow conventions** - Standard naming and structure
