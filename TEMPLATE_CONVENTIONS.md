# Template & Development File Conventions

This document outlines how to organize template, draft, and development files that should not be deployed to the live site.

## Naming Conventions

These files will remain in your local project but won't be deployed to the live site:

1. **Template files:**
   - `template.html` - Template file in any folder
   - `products/template.html` - Product template
   - `template.css` - CSS template

2. **Files with specific extensions:**
   - `homepage.template.html` - Template variation
   - `styles.draft.css` - Draft CSS
   - `widget.style-guide.js` - Style guide JS

3. **Files with leading underscore:**
   - `_draft-page.html` - Draft page
   - `_component.html` - Component template

4. **Development utility scripts:**
   - `build-product-pages.js` - Build script 
   - `dev-server.js` - Development server
   - `generate-sitemap.js` - Site generation tool
   - `update-footers.js` - Maintenance script
   - `server.js` - Local development server

## Excluded Directories

These entire directories will not be deployed:

- `/styleguide/` - Style guide assets
- `/ignore/` - Any files to be ignored
- `/internal-pages/` - Internal-use pages
- `/scripts/` - Development scripts
- `/tools/` - Development tools

## How It Works

- The `.gitignore` has been modified to include development files in the repository
- The GitHub deployment workflow filters out development files during deployment
- You can keep template files in their contextual locations (e.g., products/template.html)
- Utility scripts stay with your codebase but won't appear on the live site

## Best Practices

- Keep template files close to their final location
- Name utility scripts with predictable prefixes (`build-`, `dev-`, `generate-`, `update-`)
- For groups of related tools, consider using the `/scripts/` or `/tools/` directories
- For complex examples, consider using the `/ignore/` directory

## Server-Side Scripts

Node.js server scripts like `server.js` are not compatible with static hosting on GitHub Pages. These scripts are kept in the repository for local development but are automatically filtered out during deployment.

This approach lets you maintain development and template files within your project without them appearing on your live site. 