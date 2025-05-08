// Build script to generate static product pages
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config(); // Load environment variables from .env file

// Shopify API configuration
const SHOPIFY_CONFIG = {
    domain: process.env.SHOPIFY_STORE_NAME || '',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN || '',
    adminApiAccessToken: process.env.SHOPIFY_ADMIN_TOKEN || ''
};

// Log configuration for debugging
console.log(`Using Shopify domain: ${SHOPIFY_CONFIG.domain}`);
console.log(`Storefront token available: ${SHOPIFY_CONFIG.storefrontAccessToken ? 'Yes' : 'No'}`);
console.log(`Admin token available: ${SHOPIFY_CONFIG.adminApiAccessToken ? 'Yes' : 'No'}`);

// GraphQL query to fetch products
const PRODUCTS_QUERY = `
    query {
        products(first: 50) {
            edges {
                node {
                    id
                    title
                    description
                    handle
                    priceRange {
                        minVariantPrice {
                            amount
                            currencyCode
                        }
                    }
                    images(first: 10) {
                        edges {
                            node {
                                url
                                altText
                            }
                        }
                    }
                    variants(first: 1) {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        }
    }
`;

// Function to make a POST request to the Shopify API
function fetchFromShopify(query) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SHOPIFY_CONFIG.domain,
            path: '/api/2024-01/graphql.json',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`API request failed with status code ${res.statusCode}: ${data}`));
                    return;
                }
                
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error(`Failed to parse API response: ${e.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(JSON.stringify({ query }));
        req.end();
    });
}

// Function to fetch all products
async function fetchProducts() {
    try {
        const data = await fetchFromShopify(PRODUCTS_QUERY);
        return data.data.products.edges.map(edge => edge.node);
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Read template file
function readTemplate() {
    return fs.readFileSync(path.join(__dirname, '../products/template.html'), 'utf8');
}

// Generate HTML for a product
function generateProductHTML(template, product) {
    let html = template;
    
    // Replace page title and meta information
    html = html.replace('<title>| Beaubnana</title>', `<title>${product.title} | Beaubnana</title>`);
    
    // Create a safe meta description (truncate and escape HTML)
    const metaDescription = product.description
        ? product.description.substring(0, 150).replace(/"/g, '&quot;') + '...'
        : `${product.title} - Handmade crochet accessories from Beaubnana`;
    
    html = html.replace('<meta content="" name="description" />', 
                       `<meta content="${metaDescription}" name="description" />`);
    
    // Replace Open Graph data
    html = html.replace('<meta content="| Beaubnana" property="og:title" />', 
                       `<meta content="${product.title} | Beaubnana" property="og:title" />`);
    html = html.replace('<meta content="| Beaubnana" property="twitter:title" />', 
                       `<meta content="${product.title} | Beaubnana" property="twitter:title" />`);
    
    // Insert product data in the template
    html = html.replace('<h1 class="heading-style-h3"></h1>', `<h1 class="heading-style-h3">${product.title}</h1>`);
    html = html.replace('<div class="heading-style-h5"></div>', 
                       `<div class="heading-style-h5">$${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}</div>`);
    
    // Replace description, handling HTML safely
    if (product.description) {
        html = html.replace('<p></p>', `<p>${product.description}</p>`);
    }
    
    // Replace Shopify product ID for the buy button
    const productId = product.id.split('/').pop();
    html = html.replace('data-shopify-id=""', `data-shopify-id="${productId}"`);
    
    // Replace images
    if (product.images.edges.length > 0) {
        const mainImage = product.images.edges[0].node.url;
        html = html.replace(/src="" alt="" class="product-header_image main"/, 
                           `src="${mainImage}" alt="${product.title}" class="product-header_image main"`);
        
        // Generate gallery HTML
        if (product.images.edges.length > 1) {
            let galleryHTML = '';
            product.images.edges.forEach((image, index) => {
                galleryHTML += `
                    <div role="listitem" class="product-header_item w-dyn-item">
                        <div class="product-header_image-wrapper">
                            <img src="${image.node.url}" loading="lazy" alt="${product.title} - Image ${index + 1}" class="product-header_image">
                        </div>
                    </div>
                `;
            });
            
            // Replace the empty gallery list with our generated gallery HTML
            html = html.replace('<!-- Product gallery images will be populated dynamically -->', galleryHTML);
        }
    }
    
    return html;
}

// Create the directory structure
function createDirectories() {
    const productsDir = path.join(__dirname, '../products');
    
    // Make sure base directory exists
    if (!fs.existsSync(productsDir)) {
        fs.mkdirSync(productsDir);
    }
}

// Write the product HTML files
function writeProductFile(handle, html) {
    const filePath = path.join(__dirname, '../products', `${handle}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Created: products/${handle}.html`);
}

// Main build function
async function buildProductPages() {
    try {
        console.log('Fetching products from Shopify...');
        const products = await fetchProducts();
        
        if (products.length === 0) {
            console.error('No products found. Check your Shopify API credentials.');
            return;
        }
        
        console.log(`Found ${products.length} products`);
        
        console.log('Reading template file...');
        const template = readTemplate();
        
        console.log('Creating output directories...');
        createDirectories();
        
        console.log('Generating product pages...');
        products.forEach(product => {
            console.log(`Generating page for ${product.title} (${product.handle})`);
            const html = generateProductHTML(template, product);
            writeProductFile(product.handle, html);
        });
        
        console.log('\nBuild complete!');
        console.log('To view your site: open your product HTML files directly in your browser');
        console.log('To deploy: upload all files to your web server');
    } catch (error) {
        console.error('Build failed:', error);
    }
}

// Run the build
buildProductPages();