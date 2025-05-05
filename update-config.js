// Script to update config.js with environment variables
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get values from environment variables
// For GitHub Actions, these come from secrets and variables
// For local development, these come from .env file
const shopifyDomain = process.env.SHOPIFY_STORE_NAME || '';
const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN || ''; // For GraphQL API
const buySDKToken = process.env.SHOPIFY_BUY_SDK_TOKEN || ''; // For Buy Button SDK
const adminToken = process.env.SHOPIFY_ADMIN_TOKEN || ''; // Keep admin token if needed elsewhere

console.log(`Using Shopify domain: ${shopifyDomain}`);
console.log(`Using Storefront API Token: ${storefrontToken ? '✓ (set)' : '✗ (missing)'}`);
console.log(`Using Buy SDK Token: ${buySDKToken ? '✓ (set)' : '✗ (missing)'}`);
console.log(`Using Admin Token: ${adminToken ? '✓ (set)' : '✗ (missing)'}`);

// Create config content with the environment variables
const configContent = `console.log('📝 Loading config.js...');

// Shopify configuration (DO NOT EDIT DIRECTLY - values are populated during build)
window.SHOPIFY_CONFIG = {
    domain: '${shopifyDomain}',
    storefrontAccessToken: '${storefrontToken}' // Use the general Storefront API token
};

// Shopify Buy Button Configuration
window.SHOPIFY_BUY_CONFIG = {
    domain: '${shopifyDomain}',
    storefrontAccessToken: '${buySDKToken}', // Use the specific Buy Button SDK token
    moneyFormat: '%24%7B%7Bamount%7D%7D',
    buttonStyles: {
        ":hover": {
            "background-color": "#e6318e",
        },
        "background-color": "#e4007f",
        ":focus": {
            "background-color": "#e6318e",
        },
        "border-radius": "8px 0 0 8px",
    }
};

console.log('✅ Config.js loaded successfully with window.SHOPIFY_CONFIG:', window.SHOPIFY_CONFIG);
console.log('✅ Config.js loaded successfully with window.SHOPIFY_BUY_CONFIG:', window.SHOPIFY_BUY_CONFIG); // Log the Buy config too
`;

// Write to config.js
const configPath = path.join(__dirname, 'js', 'config.js');
fs.writeFileSync(configPath, configContent);

console.log('Updated js/config.js with environment variables'); 