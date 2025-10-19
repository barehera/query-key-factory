# Publishing Guide

This document explains how to publish new versions of `@barehera/query-key-factory` to NPM.

## Prerequisites

Before publishing, ensure you have:

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **NPM Token**: Generate an automation token from your NPM account
3. **GitHub Secret**: Add your NPM token as `NPM_TOKEN` in GitHub repository secrets
   - Go to: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

## Publishing Methods

### Method 1: Automatic Publishing via GitHub Release (Recommended)

1. Create a new release on GitHub:
   ```bash
   # Manually on GitHub
   - Go to Releases → Create a new release
   - Create a new tag (e.g., v0.2.0)
   - Fill in release notes
   - Publish release
   ```

2. The workflow will automatically:
   - Run tests and type checks
   - Build the package
   - Publish to NPM with the version from package.json
   - Tag: `latest`

### Method 2: Manual Publishing via Workflow Dispatch

1. Go to GitHub Actions → Publish to NPM → Run workflow

2. Select options:
   - **Branch**: Choose the branch (usually `main`)
   - **Version bump type**: 
     - `patch` - Bug fixes (0.1.0 → 0.1.1)
     - `minor` - New features (0.1.0 → 0.2.0)
     - `major` - Breaking changes (0.1.0 → 1.0.0)
     - `prerelease` - Beta versions (0.1.0 → 0.1.1-beta.0)
   - **NPM dist-tag**:
     - `latest` - Production releases (default)
     - `beta` - Beta releases
     - `next` - Next/canary releases

3. Click "Run workflow"

4. The workflow will:
   - Bump version in package.json
   - Run tests and type checks
   - Build the package
   - Publish to NPM
   - Commit version bump
   - Create git tag (for `latest` tag only)
   - Create GitHub release (for `latest` tag only)

## Publishing Beta/Pre-releases

For beta releases:

```bash
# Option 1: Manual workflow with prerelease
- Go to Actions → Publish to NPM
- Select "prerelease" version type
- Select "beta" as dist-tag
```

This will publish as: `0.1.1-beta.0` with tag `beta`

Users can install beta versions:
```bash
npm install @barehera/query-key-factory@beta
```

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible
- **PRERELEASE** (0.0.1-beta.0): Pre-release versions

## Example Workflow

### Regular Release Flow

1. Develop features on `feature/*` branches
2. Merge to `dev` branch via PR
3. Test on `dev` branch
4. Merge to `main` via PR
5. Create GitHub Release with new version tag
6. Package automatically publishes to NPM

### Beta Release Flow

1. On `dev` or `feature/*` branch
2. Run manual workflow with "prerelease" and "beta" tag
3. Beta version published to NPM
4. Users can test: `npm install @barehera/query-key-factory@beta`

## Verification

After publishing, verify:

1. Check NPM: https://www.npmjs.com/package/@barehera/query-key-factory
2. Test installation:
   ```bash
   npm install @barehera/query-key-factory@latest
   ```
3. Verify the package works in a test project

## Troubleshooting

### Authentication Failed
- Verify NPM_TOKEN is correctly set in GitHub secrets
- Ensure token has publish permissions
- Token type should be "Automation" token

### Version Already Exists
- Cannot publish same version twice
- Bump version first using workflow or manually

### Build Fails
- Check that all tests pass locally
- Ensure `pnpm run build` works locally
- Review GitHub Actions logs for details

## Local Testing (Without Publishing)

Test the package build locally:

```bash
# Build the package
pnpm run build

# Test in another project using link
cd /path/to/test-project
pnpm link /path/to/tanstack-query-key-generator

# Or pack and test
pnpm pack
# This creates a .tgz file you can install: npm install ./package.tgz
```

