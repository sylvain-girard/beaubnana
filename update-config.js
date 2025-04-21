// Script to update config.js with environment variables
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the config file
const configPath = path.join(__dirname, 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the placeholders with actual values
configContent = configContent.replace(
  'STOREFRONT_TOKEN_PLACEHOLDER', 
  process.env.SHOPIFY_STOREFRONT_TOKEN || ''
);

// Write the updated config back to the file
fs.writeFileSync(configPath, configContent);

console.log('Updated js/config.js with environment variables'); 