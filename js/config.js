console.log('📝 Loading config.js...');

// Shopify configuration (DO NOT EDIT DIRECTLY - values are populated during build)
window.SHOPIFY_CONFIG = {
    domain: '0mif5c-fw.myshopify.com',
    storefrontAccessToken: 'ec8f31c45cba8198d673e15d440d75d7' // Use the general Storefront API token
};

// Shopify Buy Button Configuration
window.SHOPIFY_BUY_CONFIG = {
    domain: '0mif5c-fw.myshopify.com',
    storefrontAccessToken: '26f55eabc777cb2e8b91c1233a679536', // Use the specific Buy Button SDK token
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
