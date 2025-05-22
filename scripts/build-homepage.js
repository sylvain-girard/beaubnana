const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config(); // Load environment variables from .env file

// Shopify API configuration
const SHOPIFY_CONFIG = {
    domain: process.env.SHOPIFY_STORE_NAME || '',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN || '',
};

console.log(`[Homepage Build] Using Shopify domain: ${SHOPIFY_CONFIG.domain}`);
console.log(`[Homepage Build] Storefront token available: ${SHOPIFY_CONFIG.storefrontAccessToken ? 'Yes' : 'No'}`);

// GraphQL query to fetch products for the homepage (e.g., first 4)
const HOMEPAGE_PRODUCTS_QUERY = `
    query {
        products(first: 4) { # Fetching 4 products for the homepage
            edges {
                node {
                    id
                    title
                    descriptionHtml # Using descriptionHtml for potentially rich text
                    handle
                    priceRange {
                        minVariantPrice {
                            amount
                            currencyCode
                        }
                    }
                    images(first: 2) { # Fetching up to 2 images
                        edges {
                            node {
                                url
                                altText
                            }
                        }
                    }
                }
            }
        }
    }
`;

// Function to make a POST request to the Shopify API (same as in build-product-pages.js)
function fetchFromShopify(query) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SHOPIFY_CONFIG.domain,
            path: '/api/2024-01/graphql.json', // Ensure this API version is still valid
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
                if (res.statusCode >= 300) { // Check for non-2xx status codes
                    reject(new Error(`API request failed with status code ${res.statusCode}: ${data}`));
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    if (json.errors) {
                        reject(new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`));
                        return;
                    }
                    resolve(json);
                } catch (e) {
                    reject(new Error(`Failed to parse API response: ${e.message} (Response: ${data})`));
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

// Function to fetch products for the homepage
async function fetchHomepageProducts() {
    try {
        const response = await fetchFromShopify(HOMEPAGE_PRODUCTS_QUERY);
        if (!response.data || !response.data.products) {
            console.error('[Homepage Build] Invalid response structure from Shopify:', response);
            return [];
        }
        return response.data.products.edges.map(edge => edge.node);
    } catch (error) {
        console.error('[Homepage Build] Error fetching homepage products:', error);
        return [];
    }
}

// Generate HTML for a single product card
function generateProductCardHTML(product) {
    const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
    const productUrl = `products/${product.handle}.html`;

    const image1 = product.images.edges[0]?.node;
    const image2 = product.images.edges[1]?.node || image1; // Use first image if second is not available

    // Basic sanitization for title and alt text to prevent HTML injection issues if content is unexpected
    const safeTitle = product.title.replace(/[<>&"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\"': '&quot;' }[char]));
    const altText1 = image1?.altText?.replace(/[<>&"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\"': '&quot;' }[char])) || safeTitle;
    const altText2 = image2?.altText?.replace(/[<>&"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\"': '&quot;' }[char])) || safeTitle;


    return `
<div role="listitem" class="display-contents w-dyn-item">
  <a href="${productUrl}" class="product-card is-grid-column-quarter inset-effect">
    <div data-inner-rad="top-left" class="product-card_tag">
      <!-- <p class="text-weight-bold">New!</p> --> <!-- Example tag, can be dynamic -->
    </div>
    <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
      <h6 class="product-name">${safeTitle}</h6>
      <p class="product-price text-size-large">$${price}</p>
    </div>
    <div data-product-focus="" class="product-card_image-wrapper">
      <img src="${image1?.url || ''}" alt="${altText1}" loading="lazy" class="product-card_image on-model">
      <img src="${image2?.url || ''}" alt="${altText2}" loading="lazy" class="product-card_image product-focus">
    </div>
  </a>
</div>`;
}

// Main function to update index.html
async function buildHomepage() {
    console.log('[Homepage Build] Starting homepage build process...');

    const products = await fetchHomepageProducts();
    if (!products || products.length === 0) {
        console.warn('[Homepage Build] No products fetched for the homepage. index.html will not be modified for products.');
        // Optionally, clear out the section if no products are found or leave existing placeholders
        // For now, we'll just not add new products.
    }

    let productCardsHTML = '';
    if (products && products.length > 0) {
        console.log(`[Homepage Build] Fetched ${products.length} products for homepage.`);
        productCardsHTML = products.map(generateProductCardHTML).join('\n');
    }


    const indexPath = path.join(__dirname, '..', 'index.html');
    try {
        let indexHTML = fs.readFileSync(indexPath, 'utf8');

        const startMarker = '<!-- HOMEPAGE_FEATURED_PRODUCTS_START -->';
        const endMarker = '<!-- HOMEPAGE_FEATURED_PRODUCTS_END -->';

        const startIndex = indexHTML.indexOf(startMarker);
        const endIndex = indexHTML.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            console.error('[Homepage Build] Error: Product placeholder comments not found or in wrong order in index.html.\nEnsure \'${startMarker}\' and \'${endMarker}\' exist and are correctly placed.');
            // Fallback: Try to find the container and replace its content if markers fail
            const wrapperRegex = /<div role="list" class="top-sellers_card-wrapper is-grid w-dyn-items"[^>]*>([\s\S]*?)<\/div>/;
            if (products && products.length > 0 && wrapperRegex.test(indexHTML)) {
                 console.log('[Homepage Build] Attempting to replace content of "top-sellers_card-wrapper" as a fallback.');
                 indexHTML = indexHTML.replace(wrapperRegex, 
                    `<div role="list" class="top-sellers_card-wrapper is-grid w-dyn-items">\n${startMarker}\n${productCardsHTML}\n${endMarker}\n</div>`
                 );
                 fs.writeFileSync(indexPath, indexHTML);
                 console.log('[Homepage Build] index.html updated successfully using fallback replacement!');
            } else if (products && products.length > 0) {
                 console.error('[Homepage Build] Fallback replacement also failed. index.html not modified.');
                 return; // Stop if markers aren't found and fallback won't work
            } else {
                // If no products, and markers not found, we might want to clear the area or log that nothing was done.
                // For now, just log that no products were added and markers were an issue.
                 console.warn('[Homepage Build] No products to add, and markers not found. Section may remain as is or empty.');
            }
        } else {
            // Markers found, proceed with replacement
            const preContent = indexHTML.substring(0, startIndex + startMarker.length);
            const postContent = indexHTML.substring(endIndex);
            indexHTML = preContent + '\n' + productCardsHTML + '\n' + postContent;
            fs.writeFileSync(indexPath, indexHTML);
            console.log('[Homepage Build] index.html updated successfully with new product data!');
        }

    } catch (error) {
        console.error('[Homepage Build] Error processing index.html:', error);
        return; // Ensure we exit if there's a file processing error
    }
     console.log('[Homepage Build] Homepage build process finished.');
}

buildHomepage(); 