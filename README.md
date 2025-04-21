# Beaubnana Website

A converted Webflow Ecommerce build that now uses Shopify as the backend. The function of Shopify is to host the product details which are served through the custom UI that was created in Webflow.

## Development Workflow

This project uses a development workflow that:
1. Keeps all development files in the repository
2. Filters out development files during deployment

### File Organization

- **Development Files**: Build scripts, templates, and utility files are kept in the repository
- **Production Site**: Only customer-facing files are deployed to the live site

### Development Files in Repository

These files are committed to GitHub but excluded from the live site:
- Build scripts (`build-*.js`, `dev-*.js`, `generate-*.js`)
- Template files (`template.html`, `*.template.*`)
- Internal pages (`internal-pages/`, `_drafts/`)

## Local Development

To set up for local development:

```bash
# Clone the repository
git clone https://github.com/your-username/beaubnana.git
cd beaubnana

# Install dependencies (if using npm)
npm install

# Run build scripts
node build-product-pages.js
```

## Deployment

Deployment is handled automatically by GitHub Actions when pushing to the main branch:

1. The workflow checks out the repository
2. Development files are filtered out
3. Only production files are deployed to GitHub Pages

See `.github/workflows/deploy.yml` for the deployment configuration.

## Setup

This project uses environment variables for secure API tokens. To set up:

1. Create a `.env` file in the project root (this file is ignored by git)
2. Add the following environment variables:
   ```
   SHOPIFY_DOMAIN=0wrz46-0q.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
   SHOPIFY_ADMIN_TOKEN=your_admin_token
   ```
3. For GitHub deployment, add these as repository secrets

## Shopify Integration

### Storefront API

The website connects to Shopify using the Storefront API with the following credentials:

- Domain: `0wrz46-0q.myshopify.com`
- Storefront Access Token: Stored as environment variable (see Setup section)

### Buy Button Implementation

The site uses an optimized version of the Shopify Buy Button SDK:

- **Product Pages**: Full buy button functionality is loaded on product pages where the `product-component` element exists with a valid `data-shopify-id` attribute.
- **Non-Product Pages**: Only the cart functionality is initialized, reducing unnecessary code loading.

The implementation can be found in:
- `js/shopify.js` - Contains the core Shopify API functionality including the optimized Buy Button code
- `index.html` and product page templates - Call the centralized Shopify functions

### Modifying Products

When adding or updating products, make sure to:

1. Create the product in Shopify admin
2. Note the product ID from the Shopify admin URL (e.g., `7754559848505`)
3. Add the ID to the `data-shopify-id` attribute of the `product-component` element for that product's page

### Other Shopify Features

The site also uses Shopify for:

- Product collections (displaying top sellers)
- Product type collections
- Product carousels/marquees

## File Naming Conventions

See `TEMPLATE_CONVENTIONS.md` for details on file naming patterns used to separate development files from production files.

## Development Notes

- The site uses jQuery for DOM manipulation
- Shopify's Buy Button SDK is loaded dynamically to reduce page load time
- Custom JavaScript in `shopify.js` handles the Shopify integration
- Includes system in `include.js` manages shared elements like headers and footers