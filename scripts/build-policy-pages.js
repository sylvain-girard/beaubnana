// Build script to generate static policy pages from Shopify
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Shopify API configuration
const SHOPIFY_CONFIG = {
    domain: process.env.SHOPIFY_STORE_NAME || '',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN || '',
    adminApiAccessToken: process.env.SHOPIFY_ADMIN_TOKEN || ''
};

console.log(`Using Shopify domain: ${SHOPIFY_CONFIG.domain}`);
console.log(`Storefront token available: ${SHOPIFY_CONFIG.storefrontAccessToken ? 'Yes' : 'No'}`);
console.log(`Admin token available: ${SHOPIFY_CONFIG.adminApiAccessToken ? 'Yes' : 'No'}`);

// Function to make a request to the Shopify Admin API
function fetchFromShopifyAdmin(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SHOPIFY_CONFIG.domain,
            path: `/admin/api/2024-01/${endpoint}`,
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_CONFIG.adminApiAccessToken,
                'Content-Type': 'application/json'
            }
        };

        console.log(`Fetching from: ${options.hostname}${options.path}`);

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
        
        req.end();
    });
}

// Function to fetch all policies
async function fetchPolicies() {
    try {
        // Fetch all shop policies using the correct endpoint
        console.log('Attempting to fetch policies from Shopify Admin API...');
        const shopPolicies = await fetchFromShopifyAdmin('policies.json');
        
        if (!shopPolicies || !shopPolicies.policies) {
            console.warn('No policies found in API response, using sample content instead.');
            return getSamplePolicies();
        }
        
        console.log(`Successfully fetched ${shopPolicies.policies.length} policies from Shopify`);
        
        // Map API response to our policy objects
        const policies = shopPolicies.policies.map(policy => {
            // Get the policy type/handle and normalize it
            let policyType = policy.handle || policy.policy_type;
            
            // Create a clean handle for the file name, removing "policy" if it occurs twice
            let handle = policyType.replace(/_/g, '-');
            if (handle.includes('policy')) {
                handle = handle.replace('-policy', '');
            }
            
            // Add "-policy" suffix if it doesn't already end with it
            if (!handle.endsWith('-policy')) {
                handle = `${handle}-policy`;
            }
            
            // Format the title nicely
            let title = policy.title || 
                        policyType.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
            
            return {
                type: policy.policy_type,
                title: title,
                body: policy.body,
                handle: handle
            };
        });
        
        return policies;
    } catch (error) {
        console.error('Error fetching policies from Shopify:', error);
        console.log('Falling back to sample policies...');
        return getSamplePolicies();
    }
}

// Sample policies as fallback
function getSamplePolicies() {
    return [
        {
            type: 'refund',
            title: 'Refund Policy',
            body: `
            <p><strong>Return Policy</strong></p>
            <p>As a small business, we strive to ensure customer satisfaction while balancing our capabilities. We have a <strong>7-day return policy</strong>, which means you have 7 days after receiving your item to request a return.</p>
            <p>To be eligible for a return, your item must be in the same condition as when you received it – unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.</p>
            <p>To start a return, please contact us at <strong>hello@beaubnana.com.au</strong>.</p>
            <p>For any questions regarding returns, feel free to reach out to us at <strong>hello@beaubnana.com.au</strong>.</p>
            <p><strong>Damages and Issues</strong></p>
            <p>We encourage you to inspect your order upon receipt and contact us immediately if the item is defective, damaged, or if you received the wrong item. This way, we can evaluate the issue and find the best resolution for you.</p>
            <p><strong>Exceptions / Non-Returnable Items</strong></p>
            <p>Certain items cannot be returned, such as:</p>
            <p>• Custom products (e.g., special orders or personalised items)</p>
            <p>• Earrings for hygiene reasons</p>
            <p>• Sale items or gift cards</p>
            <p>If you have any questions about the eligibility of your specific item, please get in touch with us before making your purchase.</p>
            `,
            handle: 'refund-policy'
        },
        {
            type: 'privacy',
            title: 'Privacy Policy',
            body: `
            <p><strong>Privacy Policy</strong></p>
            <p>This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from Beaubnana.</p>
            <p><strong>Personal Information We Collect</strong></p>
            <p>When you visit the site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>
            <p>Additionally, as you browse the site, we collect information about the individual web pages that you view, what websites or search terms referred you to the site, and information about how you interact with the site. We refer to this automatically-collected information as "Device Information."</p>
            <p><strong>How We Use Your Personal Information</strong></p>
            <p>We use the order information that we collect generally to fulfill any orders placed through the site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).</p>
            <p>Additionally, we use this order information to:</p>
            <p>• Communicate with you;</p>
            <p>• Screen our orders for potential risk or fraud; and</p>
            <p>• When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</p>
            `,
            handle: 'privacy-policy'
        },
        {
            type: 'terms_of_service',
            title: 'Terms of Service',
            body: `
            <p><strong>Terms of Service</strong></p>
            <p>These Terms of Service govern your use of the website located at Beaubnana and any related services provided by Beaubnana.</p>
            <p>By accessing Beaubnana, you agree to abide by these Terms of Service and to comply with all applicable laws and regulations. If you do not agree with these Terms of Service, you are prohibited from using or accessing this website or using any other services provided by Beaubnana.</p>
            <p><strong>Products or Services</strong></p>
            <p>The images of the products on our website are for illustrative purposes only. Although we have made every effort to display the colors accurately, we cannot guarantee that your computer's display of the colors accurately reflects the color of the products. Your products may vary slightly from those images.</p>
            <p>We have the right to revise and amend these terms and conditions from time to time to reflect changes in market conditions affecting our business, changes in technology, changes in payment methods, changes in relevant laws and regulatory requirements and changes in our system's capabilities.</p>
            `,
            handle: 'terms-of-service'
        },
        {
            type: 'shipping',
            title: 'Shipping Policy',
            body: `
            <p><strong>Shipping Policy</strong></p>
            <p>At Beaubnana, we strive to deliver your handmade crochet items to you safely and promptly. Please review our shipping policies below.</p>
            <p><strong>Processing Time</strong></p>
            <p>All orders are processed within 3-5 business days. If we're experiencing a high volume of orders, shipments may be delayed by a few days. If that happens, we'll contact you via email.</p>
            <p><strong>Shipping Rates & Delivery Times</strong></p>
            <p>Shipping within Australia:</p>
            <p>• Standard Shipping: 5-7 business days ($9.95)</p>
            <p>• Express Shipping: 2-3 business days ($15.95)</p>
            <p>International Shipping:</p>
            <p>• Standard International: 10-20 business days (starting at $24.95)</p>
            <p>These are estimates and we cannot guarantee these delivery times.</p>
            <p><strong>Tracking Information</strong></p>
            <p>You'll receive a shipping confirmation email with tracking information once your order has shipped. If you have any questions about the status of your order, please email us at hello@beaubnana.com.au.</p>
            `,
            handle: 'shipping-policy'
        }
    ];
}

// Read template file
function readTemplate() {
    return fs.readFileSync(path.join(__dirname, '../policies/template.html'), 'utf8');
}

// Generate HTML for a policy
function generatePolicyHTML(template, policy) {
    let html = template;
    
    // Replace page title and meta information
    html = html.replace(/<title>.*?<\/title>/, `<title>${policy.title} | Beaubnana</title>`);
    
    // Create a safe meta description
    const metaDescription = `${policy.title} for Beaubnana - Handmade crochet accessories`;
    
    html = html.replace(/<meta content=".*?" name="description" \/>/, 
                       `<meta content="${metaDescription}" name="description" />`);
    
    // Replace Open Graph data
    html = html.replace(/<meta content=".*?" property="og:title" \/>/, 
                       `<meta content="${policy.title} | Beaubnana" property="og:title" />`);
    html = html.replace(/<meta content=".*?" property="twitter:title" \/>/, 
                       `<meta content="${policy.title} | Beaubnana" property="twitter:title" />`);
    
    // Insert policy title
    html = html.replace(/<h1 class="heading-style-h2">.*?<\/h1>/, `<h1 class="heading-style-h2">${policy.title}</h1>`);
    
    // Replace policy content
    const richTextStart = '<div class="text-rich-text w-richtext">';
    const richTextEnd = '</div>';
    
    const startIndex = html.indexOf(richTextStart) + richTextStart.length;
    const endIndex = html.indexOf(richTextEnd, startIndex);
    
    const beforeContent = html.substring(0, startIndex);
    const afterContent = html.substring(endIndex);
    
    html = beforeContent + '\n' + policy.body + '\n' + afterContent;
    
    return html;
}

// Create the directory structure
function createDirectories() {
    const policiesDir = path.join(__dirname, '../policies');
    
    // Make sure base directory exists
    if (!fs.existsSync(policiesDir)) {
        fs.mkdirSync(policiesDir);
    }
}

// Write the policy HTML files
function writePolicyFile(handle, html) {
    const filePath = path.join(__dirname, '../policies', `${handle}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Created: policies/${handle}.html`);
}

// Main build function
async function buildPolicyPages() {
    try {
        console.log('Fetching policies from Shopify...');
        const policies = await fetchPolicies();
        
        if (policies.length === 0) {
            console.error('No policies found. Check your Shopify API credentials or ensure policies are set in your Shopify store.');
            return;
        }
        
        console.log(`Found ${policies.length} policies`);
        
        console.log('Reading template file...');
        const template = readTemplate();
        
        console.log('Creating output directories...');
        createDirectories();
        
        console.log('Generating policy pages...');
        policies.forEach(policy => {
            console.log(`Generating page for ${policy.title}`);
            const html = generatePolicyHTML(template, policy);
            writePolicyFile(policy.handle, html);
        });
        
        console.log('\nBuild complete!');
        console.log('To view your policies: open your browser and navigate to policy files directly');
    } catch (error) {
        console.error('Build failed:', error);
    }
}

// Run the build
buildPolicyPages(); 