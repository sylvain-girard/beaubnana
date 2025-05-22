'use strict'; // Add strict mode



// This file uses configurations from config.js
// Make sure to import config.js before this file in your HTML

// The config variables SHOPIFY_CONFIG and SHOPIFY_BUY_CONFIG are now imported from config.js
// No need to redefine them here

// Log config values to ensure they're loaded correctly



// --- Module-level variables for Shopify Buy SDK Client and UI ---
let shopifyClient = null;
let shopifyUi = null;
let shopifyInitializationPromise = null; // To track initialization state
// ---------------------------------------------------------------

// GraphQL query to fetch products with their variants and images
const PRODUCTS_QUERY = `
    query {
        products(first: 50) {
            edges {
                node {
                    id
                    title
                    description
                    handle
                    tags
                    productType
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
                    collections(first: 10) {
                        edges {
                            node {
                                handle
                            }
                        }
                    }
                    variants(first: 1) {
                        edges {
                            node {
                                id
                                price {
                                    amount
                                    currencyCode
                                }
                                compareAtPrice {
                                    amount
                                    currencyCode
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

// Function to fetch products with a specific tag
async function fetchProductsByTag(tag, limit = 50) {
    try {
        const query = `
            query {
                products(first: ${limit}, query: "tag:${tag}") {
                    edges {
                        node {
                            id
                            title
                            description
                            handle
                            tags
                            productType
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
                                        price {
                                            amount
                                            currencyCode
                                        }
                                        compareAtPrice {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch(`https://${window.SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': window.SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.products.edges.map(edge => edge.node);
    } catch (error) {
        console.error(`Error fetching products with tag ${tag}:`, error);
        return [];
    }
}

// Function to fetch products from Shopify
async function fetchProducts() {

    try {
        const query = PRODUCTS_QUERY;

        
        const fetchUrl = `https://${window.SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`;

        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': window.SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query
            })
        });



        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        
        if (!data || !data.data || !data.data.products || !data.data.products.edges) {
            console.error('Invalid response structure from Shopify API:', data);
            return [];
        }
        
        const products = data.data.products.edges.map(edge => edge.node);

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        console.log('Current Shopify config:', {
            domain: window.SHOPIFY_CONFIG.domain,
            tokenAvailable: !!window.SHOPIFY_CONFIG.storefrontAccessToken
        });
        return [];
    }
}

// Function to fetch a single product by handle
async function fetchProductByHandle(handle) {
    try {
        const query = `
            query {
                productByHandle(handle: "${handle}") {
                    id
                    title
                    description
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
                    variants(first: 10) {
                        edges {
                            node {
                                id
                                title
                                price {
                                    amount
                                    currencyCode
                                }
                                compareAtPrice {
                                    amount
                                    currencyCode
                                }
                                selectedOptions {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch(`https://${window.SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': window.SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.productByHandle;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Shared function to fetch products with optional filters
async function fetchProductsWithFilters(filters = {}) {
    // If tag filter is provided, use tag-based query
    if (filters.tag) {
        const taggedProducts = await fetchProductsByTag(filters.tag);
        return filters.limit ? taggedProducts.slice(0, filters.limit) : taggedProducts;
    }
    
    // Otherwise use regular products query
    let products = await fetchProducts();
    
    // Apply filters if provided
    if (filters.limit) {
        products = products.slice(0, filters.limit);
    }
    
    return products;
}

// Function to display products in a marquee
async function displayMarqueeProducts(selector, options = {}) {

    
    // Try selecting the wrapper first
    const marqueeWrap = document.querySelector(".hero-cta_marquee-wrap");
    if (!marqueeWrap) {
        console.error(`[displayMarqueeProducts] Marquee WRAP element not found: .hero-cta_marquee-wrap`);
        // Also try the original selector again for comparison
        const trackDirect = document.querySelector(selector);
        console.error(`[displayMarqueeProducts] Direct selector result: ${trackDirect ? 'Found' : 'Not Found'}`);
        return;
    }


    // Now find the track *within* the wrap
    const marqueeTrack = marqueeWrap.querySelector(".marquee-track"); 
    if (!marqueeTrack) {
        console.error(`[displayMarqueeProducts] Marquee TRACK element not found within .hero-cta_marquee-wrap`);
        return;
    }


    const products = await fetchProductsWithFilters({ limit: options.limit || 10 });


    if (products.length === 0) {
        console.warn(`[displayMarqueeProducts] No products found to display.`);
        marqueeTrack.innerHTML = ''; // Clear track even if no products
        return;
    }

    // Create the marquee list
    const marqueeList = document.createElement('div');
    // Combine classes correctly
    marqueeList.className = 'marquee_list w-dyn-items';
    marqueeList.setAttribute('role', 'list');


    // Add product images to the marquee list
    products.forEach((product, index) => {
        const imageUrl = product.images.edges[0]?.node.url || '';

        if (!imageUrl) {
            console.warn(`[displayMarqueeProducts] Missing image URL for product: ${product.title}`);
        }
        const marqueeItem = document.createElement('div');
        marqueeItem.className = 'marquee_item w-dyn-item';
        marqueeItem.setAttribute('role', 'listitem');
        marqueeItem.innerHTML = `
            <img src="${imageUrl}" 
                 loading="lazy" 
                 alt="${product.title}" 
                 class="marquee_image scale-up">
        `;
        marqueeList.appendChild(marqueeItem);
    });


    // Clear existing content and add the marquee list three times for seamless looping
    marqueeTrack.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const clone = marqueeList.cloneNode(true);
        marqueeTrack.appendChild(clone);

    }

}

// Function to display products in a grid
async function displayProductGrid(selector, options = {}) {
    const grid = document.querySelector(selector);
    if (!grid) return;

    // If tag option is provided, fetch products with that tag
    const products = await fetchProductsWithFilters({ 
        limit: options.limit || 4,
        tag: options.tag || null 
    });
    
    // Clear existing items
    grid.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product, {
            showTag: true,
            tagText: options.tagText || '',
            additionalClasses: 'is-grid-column-quarter inset-effect',
            basePath: ''
        });
        grid.appendChild(productCard);
    });
}

// Function to fetch products and metadata for a collection (using metaobject product references)
async function fetchProductsFromCollection(collectionHandle) {

    try {
        // Query the metaobject with product references - using the specific handle of the collection
        // but with the metaobject type "collections" (which is the definition type, not the handle)
        const metadataQuery = `
            query {
                metaobjects(
                    first: 1,
                    type: "collections", 
                    query: "handle:${collectionHandle}"
                ) {
                    edges {
                        node {
                            handle
                            id
                            type
                            fields { // Only request basic field info for now
                                key
                                value
                                type
                            }
                        }
                    }
                }
            }
        `;
        
        const metadataResponse = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query: metadataQuery
            })
        });
        
        if (!metadataResponse.ok) {
            throw new Error(`HTTP error! status: ${metadataResponse.status}`);
        }
        
        const metadataData = await metadataResponse.json();

        
        // Get the first metaobject that matches our query
        const metaobject = metadataData.data?.metaobjects?.edges?.[0]?.node;
        console.log('Metaobject found:', !!metaobject); // DEBUG LINE
        
        // Handle null metaobject (collection doesn't exist)
        if (!metaobject) {
            console.warn(`No metaobject found for handle: ${collectionHandle}`);
            // Fall back to tag-based query and default values
            const products = await fetchProductsByTag(collectionHandle);
            return {
                collection: {
                    title: collectionHandle.split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                    description: '',
                    color: '#00ff00',
                    image: '',
                    imageAlt: ''
                },
                products
            };
        }
        
        const fields = metaobject.fields || [];

        
        // Dump each field's key and value for debugging
        fields.forEach(field => {

            if (field.reference) {

                if (field.reference.__typename === 'MediaImage' || field.reference.__typename === 'File') {

                }
            }
        });
        
        // Extract metadata values using the exact field names from the metaobject definition
        // Check alternative field names in case the metaobject definition uses different naming
        const nameField = fields.find(f => f.key === 'name' || f.key === 'title' || f.key === 'collection_name');
        const descriptionField = getMetafieldByKey(fields, 'collection_description') || 
          getMetafieldByKey(fields, 'description');
        const colorField = getMetafieldByKey(fields, 'collection_color') || 
          getMetafieldByKey(fields, 'color') || 
          getMetafieldByKey(fields, 'accent_color');
        
        // DEBUG LOGS



        // END DEBUG LOGS
        
        let color = '';
        if (colorField) {
          if (colorField.value) {
            // Direct value (string)
            color = colorField.value;

          } else if (colorField.references && colorField.references.edges.length > 0) {
            // Reference value
            const colorRef = colorField.references.edges[0].node;

            
            // Try to find color value in the reference
            if (colorRef.value) {
              color = colorRef.value;
            } else if (colorRef.colorValue) {
              color = colorRef.colorValue;
            } else if (colorRef.hexValue) {
              color = colorRef.hexValue;
            }
            

          }
        }
        
        const title = nameField?.value || '';
        let description = '';
        if (descriptionField) {
          if (descriptionField.value) {
            // Direct value (string)
            description = descriptionField.value;

          } else if (descriptionField.references && descriptionField.references.edges.length > 0) {
            // Reference value
            const descRef = descriptionField.references.edges[0].node;

            
            // Try to find description text in the reference
            if (descRef.value) {
              description = descRef.value;
            } else if (descRef.text) {
              description = descRef.text;
            } else if (descRef.content) {
              description = descRef.content;
            }
            

          }
        }
        



        
        // Handle image field which may be a file reference
        let imageUrl = '';
        let imageAlt = '';
        const imageField = fields.find(f => f.key === 'collection_image' || f.key === 'image' || f.key === 'featured_image');
        console.log('Image field found:', imageField); // DEBUG LINE

        if (imageField) {
          // DEBUG LOGS
          console.log('Image field details:', { 
            value: imageField.value, 
            type: imageField.type, 
            reference: imageField.reference 
          });
          // END DEBUG LOGS

          // Check for direct image URL value
          if (imageField.value && (imageField.value.startsWith('http') || imageField.value.startsWith('//'))) {

            imageUrl = imageField.value;
          } 
          // Check for image reference
          else if (imageField.reference) {

            
            // Log the entire reference object to see what's available

            
            if (imageField.reference.__typename === 'MediaImage') {

              if (imageField.reference.image) {
                imageUrl = imageField.reference.image.url;
                imageAlt = imageField.reference.image.altText || '';
              } else if (imageField.reference.url) {
                imageUrl = imageField.reference.url;
              }
            } else if (imageField.reference.__typename === 'File') {

              imageUrl = imageField.reference.originalSource?.url || imageField.reference.url || '';
              imageAlt = imageField.reference.altText || '';
            } else {

              // Try to find any URL property recursively
              imageUrl = findUrl(imageField.reference) || '';
            }
          }
          // Check for image references array
          else if (imageField.references && imageField.references.edges && imageField.references.edges.length > 0) {

            const imageReference = imageField.references.edges[0].node;
            
            // Log the entire reference object to see what's available

            
            if (imageReference.__typename === 'MediaImage') {

              if (imageReference.image) {
                imageUrl = imageReference.image.url;
                imageAlt = imageReference.image.altText || '';
              } else if (imageReference.url) {
                imageUrl = imageReference.url;
              }
            } else if (imageReference.__typename === 'File') {

              imageUrl = imageReference.originalSource?.url || imageReference.url || '';
              imageAlt = imageReference.altText || '';
            } else {

              // Try to find any URL property recursively
              imageUrl = findUrl(imageReference) || '';
            }
          } else {

          }
          

        } else {

        }
        
        // Extract products from the products field references
        const productsField = fields.find(f => f.key === 'products');
        let products = [];
        
        if (productsField && productsField.references && productsField.references.edges) {
            products = productsField.references.edges.map(edge => edge.node);

        } else {

            // Fall back to tag-based approach if no products field or no references
            products = await fetchProductsByTag(collectionHandle);
        }
        
        // Final collection data being returned
        const collectionData = {
            title,
            description,
            color,
            image: imageUrl,
            imageAlt
        };
        

        
        return {
            collection: collectionData,
            products
        };
    } catch (error) {
        console.error('Error fetching collection products:', error);
        // Fall back to tag-based approach if metaobject query fails
        try {

            const products = await fetchProductsByTag(collectionHandle);
            
        return {
            collection: {
                    title: collectionHandle.split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                    description: '',
                    color: '#00ff00',
                    image: '',
                    imageAlt: ''
                },
                products
            };
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return {
                collection: {
                    title: collectionHandle.split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                description: '',
                color: '#00ff00',
                image: '',
                imageAlt: ''
            },
            products: []
        };
        }
    }
}

// Function to display products in a marquee from a specific collection
async function displayCollectionMarquee(selector, collectionHandle) {
    const marqueeTrack = document.querySelector(selector);
    if (!marqueeTrack) {
        console.error('Marquee track element not found:', selector);
        return;
    }


    const { collection, products } = await fetchProductsFromCollection(collectionHandle);
    


    
    // Format the collection title - capitalize words and remove hyphens
    const formattedTitle = collection.title 
        ? collection.title 
        : collectionHandle.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    
    // Update collection title and description
    const collectionTitle = document.querySelector('.collection_heading');
    const collectionDescription = document.querySelector('.collection_content .text-size-large');
    const collectionSection = document.querySelector('.section_collections');
    const collectionImage = document.querySelector('.collection_image-wrap img');
    const shopCollectionButton = document.querySelector('.collection_content .button');
    






    
    if (collectionTitle) {
        collectionTitle.textContent = `${formattedTitle} Collection`;

    } else {
        console.warn('Collection title element not found');
    }
    
    if (collectionDescription) {
        if (collection.description) {
        collectionDescription.textContent = collection.description;

        } else {
            console.warn('No collection description available in data');
        }
    } else {
        console.warn('Collection description element not found');
    }

    if (collectionSection) {
        if (collection.color) {

        collectionSection.style.setProperty('--collection-color', collection.color);

            
            // Check if the color was actually applied
            const computedStyle = getComputedStyle(collectionSection);
            const appliedColor = computedStyle.getPropertyValue('--collection-color');

        } else {
            console.warn('No collection color available in data');
        }
    } else {
        console.warn('Collection section element not found');
    }

    if (collectionImage) {
        if (collection.image) {

        collectionImage.src = collection.image;
            collectionImage.alt = collection.imageAlt || formattedTitle;
        collectionImage.style.objectPosition = 'center 15%';

        } else {
            console.warn('No collection image URL available in data');
        }
    } else {
        console.warn('Collection image element not found');
    }
    
    // Update shop collection button link
    if (shopCollectionButton) {
        shopCollectionButton.href = `all-products.html?collection=${collectionHandle}`;

    } else {
        console.warn('Shop collection button element not found');
    }
    
    // Create the marquee list
    const marqueeList = document.createElement('div');
    marqueeList.className = 'display-contents w-dyn-list';
    marqueeList.setAttribute('role', 'list');
    marqueeList.className = 'marquee_list w-dyn-items';

    // Add product images to the marquee list
    if (products.length > 0) {

    products.forEach(product => {
        const imageUrl = product.images.edges[0]?.node.url || '';
        const marqueeItem = document.createElement('div');
        marqueeItem.className = 'marquee_item w-dyn-item';
        marqueeItem.setAttribute('role', 'listitem');
        marqueeItem.innerHTML = `
            <img src="${imageUrl}" 
                 loading="lazy" 
                 alt="${product.title}" 
                 class="marquee_image scale-up">
        `;
        marqueeList.appendChild(marqueeItem);
    });
    } else {
        console.warn('No products available for the marquee');
    }

    // Clear existing content and add the marquee list three times for seamless looping
    marqueeTrack.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const clone = marqueeList.cloneNode(true);
        marqueeTrack.appendChild(clone);
    }
    

}

// Function to fetch product type collections (now based on tags)
async function fetchProductTypeCollections() {
    try {
        // Fetch all products
        const products = await fetchProducts();
        
        // Extract unique type tags (format: "type:earrings", "type:necklaces", etc.)
        const typeTagsMap = new Map();
        
        products.forEach(product => {
            if (!product.tags) return;
            
            product.tags.forEach(tag => {
                if (tag.startsWith('type:')) {
                    // Extract the type name (everything after "type:")
                    const typeName = tag.substring(5);
                    // Use product image for the type if not already set
                    if (!typeTagsMap.has(tag)) {
                        typeTagsMap.set(tag, {
                            id: tag,
                            title: typeName.charAt(0).toUpperCase() + typeName.slice(1),
                            handle: typeName,
                            image: product.images.edges[0]?.node || null
                        });
                    }
                }
            });
        });
        

        return [...typeTagsMap.values()];
    } catch (error) {
        console.error('Error fetching product type collections:', error);
        return [];
    }
}

// Function to display product type collections
async function displayProductTypeCollections() {
    const container = document.querySelector('.section_categories-feature .categories-feature_card-wrapper');
    if (!container) return;

    // Get the template card
    const templateCard = container.querySelector('.categories-feature_card');
    if (!templateCard) return;

    // Fetch product type categories
    const typeCategories = await fetchProductTypeCategories();


    // Clear existing content but keep the template
    const template = templateCard.cloneNode(true);
    container.innerHTML = '';

    // Create cards for each category type
    typeCategories.forEach(category => {
        // Convert the card to a clickable link by creating an anchor with the same classes
        const card = document.createElement('a');
        card.className = template.className;
        card.href = `all-products.html?type=${category.handle}`;
        
        // Copy the inner HTML from the template
        card.innerHTML = template.innerHTML;
        
        // Preserve the data-image-hover attribute
        card.setAttribute('data-image-hover', '');
        
        // Update heading
        const heading = card.querySelector('.categories-feature_detail-wrapper .heading-style-h4');
        if (heading) {
            heading.textContent = category.title;
        }

        // Update image if available
        const image = card.querySelector('.categories-feature_image');
        if (image && category.image) {
            image.src = category.image.url;
            image.alt = category.image.altText || category.title;
        }

        container.appendChild(card);
    });
}

// Function to sort products
function sortProducts(products, sortOption) {
    const sortedProducts = [...products];
    
    switch(sortOption) {
        case 'name-asc':
            sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price-asc':
            sortedProducts.sort((a, b) => 
                parseFloat(a.priceRange.minVariantPrice.amount) - 
                parseFloat(b.priceRange.minVariantPrice.amount)
            );
            break;
        case 'price-desc':
            sortedProducts.sort((a, b) => 
                parseFloat(b.priceRange.minVariantPrice.amount) - 
                parseFloat(a.priceRange.minVariantPrice.amount)
            );
            break;
        case 'clear':
            // Reset to original order (by published date)
            sortedProducts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        default:
            // Default sort (most recent)
            sortedProducts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    return sortedProducts;
}

// Function to initialize sorting functionality
function initializeSorting() {
    const dropdown = document.querySelector('.dropdown_component');
    if (!dropdown) return;

    const toggle = dropdown.querySelector('.dropdown_toggle');
    const dropdownList = dropdown.querySelector('.dropdown_dropdown-list');
    const links = dropdownList.querySelectorAll('.dropdown_dropdown-link');
    
    // Add data attributes to links for sorting
    links[0].setAttribute('data-sort', 'name-asc');
    links[1].setAttribute('data-sort', 'name-desc');
    links[2].setAttribute('data-sort', 'price-asc');
    links[3].setAttribute('data-sort', 'price-desc');
    links[4].setAttribute('data-sort', 'clear');
    
    // Toggle dropdown visibility
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        dropdownList.classList.toggle('is-open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdownList.classList.remove('is-open');
        }
    });
    
    // Handle sort selection
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const sortOption = link.getAttribute('data-sort');
            
            // Update toggle text
            toggle.querySelector('div').textContent = sortOption === 'clear' ? 'Sort by' : link.textContent;
            
            // Close dropdown
            dropdownList.classList.remove('is-open');
            
            // Get current products
            const products = await fetchProducts();
            
            // Sort products
            const sortedProducts = sortProducts(products, sortOption);
            
            // Re-display products
            const filterFeed = document.querySelector('.filter_feed .collection-list');
            if (!filterFeed) return;
            
            // Clear existing items
            filterFeed.innerHTML = '';
            
            // Display sorted products
            sortedProducts.forEach(product => {
                const productCard = createProductCard(product, {
                    showTag: true,
                    basePath: '',
                    onClick: (product) => {

                        if (window.productRouter) {
                            window.productRouter.navigateToProduct(product.handle);
                        } else {
                            console.error('Product router not initialized');
                        }
                    }
                });
                filterFeed.appendChild(productCard);
            });
        });
    });
}

// Function to fetch product colors from metafields
async function fetchProductColors() {
    const query = `
        query {
            metaobjects(type: "shopify--color-pattern", first: 50) {
                edges {
                    node {
                        id
                        type
                        fields {
                            key
                            value
                            reference {
                                ... on Metaobject {
                                    id
                                    fields {
                                        key
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();


        const colorPatterns = data.data.metaobjects.edges.map(edge => {
            const fields = edge.node.fields;
            return {
                id: edge.node.id,
                label: fields.find(f => f.key === 'label')?.value || '',
                color: fields.find(f => f.key === 'color')?.value || '',
                baseColor: fields.find(f => f.key === 'color_taxonomy_reference')?.value || ''
            };
        });



        // Populate the color filters UI
        const colorFilters = document.getElementById('colour-filters');
        if (colorFilters && colorPatterns.length > 0) {
            colorFilters.innerHTML = ''; // Clear existing filters
            colorPatterns.forEach(pattern => {
                const colorFilter = document.createElement('div');
                colorFilter.className = 'filter_item';
                colorFilter.innerHTML = `
                    <label class="filter_form-checkbox2">
                        <div style="background-color:${pattern.color}" class="filters_form-checkbox-overlay"></div>
                        <div class="filter_form-checkbox2-icon"></div>
                        <input 
                            type="checkbox" 
                            name="color" 
                            value="${pattern.id}" 
                            data-base-color="${pattern.baseColor}"
                            style="opacity:0;position:absolute;z-index:-1"
                        >
                        <span style="color:${getDarkerColor(pattern.color)}" class="filter_form-checkbox2-label">
                            ${pattern.label || 'Unnamed Color'}
                        </span>
                        <div style="background-color:${pattern.color}" class="filters_checkbox-indicator"></div>
                    </label>
                `;
                colorFilters.appendChild(colorFilter);
            });
        }

        return colorPatterns;
    } catch (error) {
        console.error('Error fetching product colors:', error);
        return [];
    }
}

// Function to determine if text should be white or black based on background color
function getContrastColor(hexColor) {
    // Remove the hash if it exists
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(hexColor.substr(0, 2), 16);
    let g = parseInt(hexColor.substr(2, 2), 16);
    let b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate brightness (YIQ formula)
    let brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for bright colors, white for dark colors
    return brightness > 128 ? '#000000' : '#ffffff';
}

// Function to create a darker version of the color for text
function getDarkerColor(hexColor) {
    // Remove the hash if it exists
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(hexColor.substr(0, 2), 16);
    let g = parseInt(hexColor.substr(2, 2), 16);
    let b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate brightness (YIQ formula)
    let brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // If already dark, return as is
    if (brightness < 50) {
        return '#' + hexColor;
    }
    
    // For lighter colors, darken them (multiply by a factor less than 1)
    const darkenFactor = 0.5;
    r = Math.floor(r * darkenFactor);
    g = Math.floor(g * darkenFactor);
    b = Math.floor(b * darkenFactor);
    
    // Convert back to hex, ensuring 2 digits per color
    return '#' + 
        (r < 16 ? '0' : '') + r.toString(16) +
        (g < 16 ? '0' : '') + g.toString(16) +
        (b < 16 ? '0' : '') + b.toString(16);
}

// Function to fetch all filter categories from tags
async function fetchFilterCategories() {
    try {
        // Fetch all products
        const products = await fetchProducts();
        
        // Extract unique types and other utility tags vs regular collection tags
        const typesMap = new Map();
        const collectionsMap = new Map();
        const filtersMap = new Map();
        
        products.forEach(product => {
            if (!product.tags) return;
            
            product.tags.forEach(tag => {
                if (tag.startsWith('util:')) {
                    // Skip utility tags - they're not meant for customer-facing filters
                    return;
                }
                else if (tag.startsWith('type:')) {
                    // Extract the type name (everything after "type:")
                    const typeName = tag.substring(5);
                    const handle = typeName.toLowerCase().replace(/\s+/g, '-');
                    
                    if (!typesMap.has(handle)) {
                        typesMap.set(handle, {
                            id: tag,
                            title: typeName.charAt(0).toUpperCase() + typeName.slice(1),
                            handle
                        });
                    }
                }
                else if (tag.startsWith('filter:')) {
                    // Extract the filter name (everything after "filter:")
                    const filterName = tag.substring(7);
                    const handle = filterName.toLowerCase().replace(/\s+/g, '-');
                    
                    if (!filtersMap.has(handle)) {
                        filtersMap.set(handle, {
                            id: tag,
                            title: filterName.charAt(0).toUpperCase() + filterName.slice(1),
                            handle
                        });
                    }
                }
                else {
                    // All other tags are treated as collections
                    const handle = tag.toLowerCase().replace(/\s+/g, '-');
                    
                    if (!collectionsMap.has(handle)) {
                        collectionsMap.set(handle, {
                            id: tag,
                            title: tag.charAt(0).toUpperCase() + tag.slice(1),
                            handle
                        });
                    }
                }
            });
        });
        



        
        // Return all three categories
        return { 
            types: [...typesMap.values()], 
            collections: [...collectionsMap.values()], 
            filters: [...filtersMap.values()] 
        };
    } catch (error) {
        console.error('Error fetching tag categories:', error);
        // Return empty arrays in case of error
        return { types: [], collections: [], filters: [] };
    }
}

// Map product categories to consolidated types
function mapCategoryToType(category) {
    // Convert to lowercase for case-insensitive matching
    const lowerCategory = (category || '').toLowerCase();
    
    // Bag categories
    if (lowerCategory.includes('bag') || 
        lowerCategory.includes('handbag') || 
        lowerCategory.includes('wallet') || 
        lowerCategory.includes('case')) {
        return 'Bags';
    }
    
    // Hair accessories
    if (lowerCategory.includes('headband') || 
        lowerCategory.includes('hair band') || 
        lowerCategory.includes('hair accessory')) {
        return 'Hair Accessories';
    }
    
    // Necklaces
    if (lowerCategory.includes('necklace')) {
        return 'Necklaces';
    }
    
    // Earrings
    if (lowerCategory.includes('earring')) {
        return 'Earrings';
    }
    
    // Return the original if no mapping found - first letter capitalized
    if (category && category.length > 0) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    return 'Other';
}

// Function to fetch product types from the metaobject (Revised approach v3 - include product GIDs)
async function fetchTypesFromMetaobject() {

    try {
        // 1. Initial Query: Fetch metaobjects with basic fields + image GID + product GIDs list
        const initialQuery = `
            query {
                metaobjects(type: "types", first: 20) {
                    edges {
                        node {
                            id
                            handle
                            fields {
                                key
                                value # Expecting image GID or product GID list JSON string
                            }
                        }
                    }
                }
            }
        `;

        // ... (rest of fetch logic remains the same until processing metaobjects) ...
         const initialResponse = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query: initialQuery })
        });
        
        if (!initialResponse.ok) {
            throw new Error(`[fetchTypesFromMetaobject] Initial query HTTP error! status: ${initialResponse.status}`);
        }
        
        const initialData = await initialResponse.json();

        
        if (initialData.errors) {
            console.error('[fetchTypesFromMetaobject] GraphQL errors in initial query:', initialData.errors);
             return []; 
        }
        
        const metaobjects = initialData.data?.metaobjects?.edges || [];
        if (metaobjects.length === 0) {

             return [];
        }

        // 2. Extract GIDs and basic info, separating MediaImage GIDs and parsing product GIDs
        const typesInfo = [];
        const mediaImageGids = [];
        // No need for fileGids list if we only encounter MediaImages
        metaobjects.forEach(edge => {
            const node = edge.node;
            const fields = node.fields || [];
            const nameField = fields.find(f => f.key === 'name');
            const imageField = fields.find(f => f.key === 'image');
            const productsField = fields.find(f => f.key === 'products'); // Find products field

            const name = nameField ? nameField.value : node.handle;
            const imageGid = imageField ? imageField.value : null;
            let productGids = [];

             // Parse product GIDs if the field exists and has a value
            if (productsField?.value) {
                try {
                    productGids = JSON.parse(productsField.value);
                    if (!Array.isArray(productGids)) {
                        console.warn(`[fetchTypesFromMetaobject] Products field for type '${name}' is not a valid JSON array:`, productsField.value);
                        productGids = [];
                    }
                } catch (e) {
                    console.error(`[fetchTypesFromMetaobject] Error parsing products field JSON for type '${name}':`, e, productsField.value);
                    productGids = [];
                }
            }
            


            let typeData = {
                id: node.id,
                title: name,
                handle: node.handle,
                imageGid: null,
                image: null,
                productGids: productGids // Store parsed product GIDs
            };

            if (imageGid && typeof imageGid === 'string' && imageGid.startsWith('gid://shopify/MediaImage/')) {
                typeData.imageGid = imageGid;
                mediaImageGids.push(imageGid);
            } else if (imageGid) {
                console.warn(`[fetchTypesFromMetaobject] Unrecognized or missing image GID format for type: ${name} - ${imageGid}`);
            }
            typesInfo.push(typeData);
        });

        if (mediaImageGids.length === 0) {

             // Still return types, just without images, include productGids
            return typesInfo.map(t => { delete t.imageGid; return t; }); 
        }

        // 3. Second Query (Nodes): Fetch MediaImage URLs

        const nodesQuery = `
            query GetNodeUrls($ids: [ID!]!) {
                nodes(ids: $ids) {
                    __typename
                    ... on MediaImage {
                        id
                        image {
                            url
                            altText
                        }
                    }
                }
            }
        `;
        // ... (rest of nodes fetch and processing remains similar, just for MediaImage) ...
         const nodesResponse = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ 
                query: nodesQuery,
                variables: { ids: mediaImageGids } // Only query MediaImage GIDs
            })
        });

        if (!nodesResponse.ok) {
            throw new Error(`[fetchTypesFromMetaobject] Nodes query HTTP error! status: ${nodesResponse.status}`);
        }

        const nodesData = await nodesResponse.json();


         if (nodesData.errors) {
            console.error('[fetchTypesFromMetaobject] GraphQL errors in nodes query:', nodesData.errors);
        }

        const urlDataMap = new Map();
        (nodesData.data?.nodes || []).forEach(node => {
             if (!node) return;
             if (node.__typename === 'MediaImage' && node.image?.url) {
                  urlDataMap.set(node.id, { url: node.image.url, altText: node.image.altText });
             } else {
                  console.warn(`[fetchTypesFromMetaobject] URL data missing or unexpected type for GID: ${node.id}, Type: ${node.__typename}`);
             }
        });


        // 4. Combine Data (Image URLs and Product GIDs)
        const finalTypesList = typesInfo.map(typeInfo => {
            const fetchedUrlData = typeInfo.imageGid ? urlDataMap.get(typeInfo.imageGid) : null;
            if (fetchedUrlData) {
                typeInfo.image = { url: fetchedUrlData.url, altText: fetchedUrlData.altText || typeInfo.title }; 
            } else if (typeInfo.imageGid) {
                console.warn(`[fetchTypesFromMetaobject] Failed to find fetched URL data for image GID: ${typeInfo.imageGid} for type: ${typeInfo.title}`);
            }
            delete typeInfo.imageGid; // Clean up temporary GID field
            return typeInfo; // Keep productGids
        });

        // 5. Return

        return finalTypesList;

    } catch (error) {
        console.error('[fetchTypesFromMetaobject] Error fetching product types:', error);
        return [];
    }
}

// Modified function to fetch product type categories (now uses metaobject)
async function fetchProductTypeCategories() {
    try {
        // First try to fetch types from metaobject
        const typesFromMetaobject = await fetchTypesFromMetaobject();
        
        // If we got types from the metaobject, use those
        if (typesFromMetaobject.length > 0) {
            return typesFromMetaobject;
        }
        
        // Fallback to the old method if no types were found in the metaobject

        
        // Fetch all products
        const products = await fetchProducts();
        
        // Extract unique product categories and map to consolidated types
        const typeMap = new Map();
        
        products.forEach(product => {
            // Extract product category from product's properties
            const category = product.productType || '';
            
            if (category) {
                const mappedType = mapCategoryToType(category);
                
                if (!typeMap.has(mappedType)) {
                    typeMap.set(mappedType, {
                        id: mappedType,
                        title: mappedType,
                        handle: mappedType.toLowerCase().replace(/\s+/g, '-'),
                        image: product.images.edges[0]?.node || null
                    });
                }
            }
        });
        

        return [...typeMap.values()];
    } catch (error) {
        console.error('Error fetching product categories:', error);
        return [];
    }
}

// Update the applyFilters function for metaobject-based collection filtering
async function applyFilters() {
    // Get current selected filters
    const colorFilters = document.getElementById('colour-filters');
    const typeFilters = document.getElementById('type-filters');
    const collectionFilters = document.getElementById('collection-filters');
    
    if (!colorFilters || !typeFilters || !collectionFilters) {
         console.error('[applyFilters] Filter container elements not found.');
         return;
    }
    
    const selectedColors = Array.from(colorFilters.querySelectorAll('input:checked')).map(input => ({
        id: input.value,
        label: input.getAttribute('data-label'),
        color: input.getAttribute('data-color')
    }));
    
    const selectedType = typeFilters.querySelector('input[name="type"]:checked');
    const selectedTypeValue = selectedType?.value || 'all'; // Type handle
    const selectedTypeLabel = selectedType?.getAttribute('data-label') || 'All';
    
    const selectedCollection = collectionFilters.querySelector('input[name="collection"]:checked');
    const selectedCollectionValue = selectedCollection?.value || 'all'; // Collection handle
    const selectedCollectionLabel = selectedCollection?.getAttribute('data-label') || 'All';

    console.log('[applyFilters] Applying filters:', {
        selectedTypeValue,
        selectedCollectionValue,
        selectedColors: selectedColors.map(c => c.id)
    });
    
    try {
        // Build the GraphQL query - NO server-side filters needed initially anymore
        // We fetch all (or a large number) and filter everything client-side
        const query = `
            query {
                products(first: 250) {
                    edges {
                        node {
                            id
                            title
                            handle
                            tags
                            productType 
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
                                        price {
                                            amount
                                            currencyCode
                                        }
                                        compareAtPrice {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                            metafield(namespace: "shopify", key: "color-pattern") {
                                value
                            }
                        }
                    }
                }
            }
        `;


        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.errors) {
            console.error('[applyFilters] GraphQL errors:', data.errors);
            displayFilteredProducts([]);
            return;
        }

        let products = data.data.products.edges.map(edge => edge.node);


        // Apply collection filter using productGids from stored metaobject data (client-side)
        if (selectedCollectionValue !== 'all') {

            const selectedCollectionData = window.allCollectionsData?.find(coll => coll.handle === selectedCollectionValue);
            
            if (selectedCollectionData && selectedCollectionData.productGids) {
                const allowedProductGids = new Set(selectedCollectionData.productGids);

                products = products.filter(product => allowedProductGids.has(product.id));
            } else {
                console.warn(`[applyFilters] Could not find product GID list for selected collection handle: ${selectedCollectionValue}. Filter not applied.`);
                // products = []; // Optionally clear if collection data is missing
            }

        }

        // Apply type filter using productGids from stored metaobject data (client-side)
        if (selectedTypeValue !== 'all') {

            const selectedTypeData = window.allProductTypesData?.find(type => type.handle === selectedTypeValue);
            
            if (selectedTypeData && selectedTypeData.productGids) {
                const allowedProductGids = new Set(selectedTypeData.productGids); 

                products = products.filter(product => allowedProductGids.has(product.id));
            } else {
                console.warn(`[applyFilters] Could not find product GID list for selected type handle: ${selectedTypeValue}. Filter not applied.`);
                // products = []; 
            }

        }

        // Apply color filter (client-side)
        if (selectedColors.length > 0) {
             // ... existing color filter logic ...

            products = products.filter(product => {
                if (!product.metafield?.value) return false;
                try {
                    const productColorIds = JSON.parse(product.metafield.value);
                    // Change 'some' to 'every' for AND logic
                    return selectedColors.every(selectedColor => 
                        productColorIds.includes(selectedColor.id)
                    );
                } catch (e) {
                    console.error('[applyFilters] Error parsing color IDs:', e, product.metafield.value);
                    return false;
                }
            });

        }

        // Re-render products
        displayFilteredProducts(products);

    } catch (error) {
        console.error('[applyFilters] Error applying filters:', error);
        displayFilteredProducts([]);
    }
}

// Function to initialize filters
async function initializeFilters() {

    const filterModal = document.querySelector('.filter_filters-modal');
    const filterButton = document.querySelector('.filter_filters-button');
    const colorFilters = document.getElementById('colour-filters');
    const typeFilters = document.getElementById('type-filters');
    const collectionFilters = document.getElementById('collection-filters');
    const filterTagsWrapper = document.querySelector('.filter_tags-wrapper');
    
    // Global variable to store fetched type data including product GIDs
    window.allProductTypesData = [];

    // Check URL for collection and type parameters
    let preSelectedCollection = null;
    let preSelectedType = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        preSelectedCollection = urlParams.get('collection');
        preSelectedType = urlParams.get('type');
        
        if (preSelectedCollection) {

        }
        
        if (preSelectedType) {

        }
    } catch (error) {
        console.error('Error parsing URL parameters:', error);
    }
    
    // Toggle filter modal visibility
    filterButton?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        filterModal.classList.toggle('is-open');
    });

    // Close filter modal when clicking outside
    document.addEventListener('click', (e) => {
        if (filterModal && filterButton && !filterModal.contains(e.target) && 
            !filterButton.contains(e.target) && 
            filterModal.classList.contains('is-open')) {
            filterModal.classList.remove('is-open');
        }
    });
    
    // Fetch filter data
    const colorPatterns = await fetchProductColors();
    
    // Fetch type categories and store globally
    const types = await fetchProductTypeCategories(); 
    window.allProductTypesData = types; // Store the fetched types data

    
    // Fetch collections using the new metaobject function and store globally
    const collections = await fetchCollectionsFromMetaobject();
    window.allCollectionsData = collections; // Store the fetched collections data

    
    // Log fetched filter data (optional, for debugging)
    // console.log('Fetched filter data:', { colorPatterns, types, collections });
    
    // Populate color filters
    if (colorFilters && colorPatterns.length > 0) {
        // ... existing color filter population ...

        colorFilters.innerHTML = ''; // Clear existing filters
        colorPatterns.forEach(pattern => {
            const colorFilter = document.createElement('div');
            colorFilter.className = 'filter_item';
            colorFilter.innerHTML = `
                <label class="filter_form-checkbox2">
                    <div style="background-color:${pattern.color}" class="filters_form-checkbox-overlay"></div>
                    <div class="filter_form-checkbox2-icon"></div>
                    <input 
                        type="checkbox" 
                        name="color" 
                        value="${pattern.id}" 
                        data-label="${pattern.label || 'Unnamed Color'}"
                        data-color="${pattern.color}"
                        data-base-color="${pattern.baseColor}"
                        style="opacity:0;position:absolute;z-index:-1"
                    >
                    <span style="color:${getDarkerColor(pattern.color)}" class="filter_form-checkbox2-label">
                        ${pattern.label || 'Unnamed Color'}
                    </span>
                    <div style="background-color:${pattern.color}" class="filters_checkbox-indicator"></div>
                </label>
            `;
            colorFilters.appendChild(colorFilter);
        });
    }
    
    // Populate type filters (using the globally stored data now)
    if (typeFilters && window.allProductTypesData.length > 0) {
       // ... existing type filter population ...

        typeFilters.innerHTML = ''; 
        
        // Add single "All" option
        const allTypeFilter = document.createElement('div');
        allTypeFilter.className = 'filter_item';
        allTypeFilter.innerHTML = `
            <label class="filter_form-radio1">
                <input 
                    type="radio" 
                    name="type" 
                    value="all" 
                    ${!preSelectedType ? 'checked' : ''}
                    data-label="All"
                    style="opacity:0;position:absolute;z-index:-1"
                >
                <div class="filter_form-radio1-icon"></div>
                <span class="filter_form-radio2-label">All</span>
            </label>
        `;
        typeFilters.appendChild(allTypeFilter);
        
        // Add other type options from the stored data
        window.allProductTypesData.forEach(type => {
            const isSelected = preSelectedType === type.handle;
            const typeFilter = document.createElement('div');
            typeFilter.className = 'filter_item';
            typeFilter.innerHTML = `
                <label class="filter_form-radio1">
                    <input 
                        type="radio" 
                        name="type" 
                        value="${type.handle}"
                        ${isSelected ? 'checked' : ''}
                        data-label="${type.title}"
                        style="opacity:0;position:absolute;z-index:-1"
                    >
                    <div class="filter_form-radio1-icon"></div>
                    <span class="filter_form-radio2-label">${type.title}</span>
                </label>
            `;
            typeFilters.appendChild(typeFilter);
        });
    }
    
    // Populate collection filters (using the new globally stored data)
    if (collectionFilters && window.allCollectionsData.length > 0) {

        collectionFilters.innerHTML = ''; 
        
        // Add single "All" option
        const allCollectionFilter = document.createElement('div');
        allCollectionFilter.className = 'filter_item';
        allCollectionFilter.innerHTML = `
            <label class="filter_form-radio1">
                <input 
                    type="radio" 
                    name="collection" 
                    value="all" 
                    ${!preSelectedCollection ? 'checked' : ''}
                    data-label="All"
                    style="opacity:0;position:absolute;z-index:-1"
                >
                <div class="filter_form-radio1-icon"></div>
                <span class="filter_form-radio2-label">All</span>
            </label>
        `;
        collectionFilters.appendChild(allCollectionFilter);
        
        // Add other collection options from the stored data
        window.allCollectionsData.forEach(collection => {
            const isSelected = preSelectedCollection === collection.handle;
            const collectionFilter = document.createElement('div');
            collectionFilter.className = 'filter_item';
            collectionFilter.innerHTML = `
                <label class="filter_form-radio1">
                    <input 
                        type="radio" 
                        name="collection" 
                        value="${collection.handle}"
                        ${isSelected ? 'checked' : ''}
                        data-label="${collection.title}"
                        style="opacity:0;position:absolute;z-index:-1"
                    >
                    <div class="filter_form-radio1-icon"></div>
                    <span class="filter_form-radio2-label">${collection.title}</span>
                </label>
            `;
            collectionFilters.appendChild(collectionFilter);
        });
    }

     // ... rest of initializeFilters ...
     // Handle filter button clicks
    const applyButton = document.getElementById('apply-filters');
    const clearAllButton = document.getElementById('clear-all-filters');
    const clearButtons = filterModal.querySelectorAll('.is-filter-clear');

    // Apply filters
    applyButton?.addEventListener('click', async () => {

        
        // Get selected filters
        const selectedColors = Array.from(colorFilters.querySelectorAll('input:checked')).map(input => ({
            id: input.value,
            label: input.getAttribute('data-label'),
            color: input.getAttribute('data-color')
        }));
        
        const selectedType = typeFilters.querySelector('input[name="type"]:checked');
        const selectedTypeValue = selectedType?.value || 'all';
        const selectedTypeLabel = selectedType?.getAttribute('data-label') || 'All';
        
        const selectedCollection = collectionFilters.querySelector('input[name="collection"]:checked');
        const selectedCollectionValue = selectedCollection?.value || 'all';
        const selectedCollectionLabel = selectedCollection?.getAttribute('data-label') || 'All';
        
        console.log('Selected filters:', { 
            selectedColors: selectedColors.map(c => c.id), 
            selectedType: { value: selectedTypeValue, label: selectedTypeLabel }, 
            selectedCollection: { value: selectedCollectionValue, label: selectedCollectionLabel } 
        });

            // Create filter tags
            createFilterTags(selectedColors, selectedTypeValue, selectedTypeLabel, 
                            selectedCollectionValue, selectedCollectionLabel);

        // Apply filters
        await applyFilters();

            // Close filter modal
            filterModal.classList.remove('is-open');
    });

    // Clear all filters
    clearAllButton?.addEventListener('click', (e) => {
        e.preventDefault();
        colorFilters.querySelectorAll('input').forEach(input => input.checked = false);
        typeFilters.querySelector('input[value="all"]').checked = true;
        collectionFilters.querySelector('input[value="all"]').checked = true;
        
        // Clear filter tags
        clearFilterTags();
        
        // Display all products (or apply empty filters)
         applyFilters(); 
        // displayAllProducts(); // Consider if applyFilters(empty) is better
    });

    // Clear individual filter groups
    clearButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const filterGroup = button.closest('.filter_filter-group');
            if (filterGroup.contains(colorFilters)) {
                filterGroup.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
                
                // Remove color filter tags
                document.querySelectorAll('.filter_tag[data-filter-type="color"]').forEach(tag => {
                    tag.remove();
                });
                
                // Hide tags wrapper if empty
                updateFilterTagsVisibility();
            } else if (filterGroup.contains(typeFilters)) {
                filterGroup.querySelector('input[value="all"]').checked = true;
                
                // Remove type filter tag
                document.querySelector('.filter_tag[data-filter-type="type"]')?.remove();
                
                // Hide tags wrapper if empty
                updateFilterTagsVisibility();
            } else if (filterGroup.contains(collectionFilters)) {
                filterGroup.querySelector('input[value="all"]').checked = true;
                
                // Remove collection filter tag
                document.querySelector('.filter_tag[data-filter-type="collection"]')?.remove();
                
                // Hide tags wrapper if empty
                updateFilterTagsVisibility();
            }
            
            // Re-apply filters after clearing a group
            applyFilters();
        });
    });
    
    // If a collection or type was selected from the URL, automatically apply the filter
    if (preSelectedCollection || preSelectedType) {

        
        // Find the selected collection's title for the filter tag
        let selectedCollectionTitle = 'Collection';
        if (preSelectedCollection) {
            const selectedCollectionInput = collectionFilters.querySelector(`input[value="${preSelectedCollection}"]`);
            if (selectedCollectionInput) {
                selectedCollectionTitle = selectedCollectionInput.getAttribute('data-label') || 'Collection';
            }
        }
        
        // Find the selected type's title for the filter tag
        let selectedTypeTitle = 'Type';
        if (preSelectedType) {
            const selectedTypeInput = typeFilters.querySelector(`input[value="${preSelectedType}"]`);
            if (selectedTypeInput) {
                selectedTypeTitle = selectedTypeInput.getAttribute('data-label') || 'Type';
            }
        }
        
        // Create filter tags for the selected parameters
        createFilterTags(
            [], // no color filters
            preSelectedType || 'all', preSelectedType ? selectedTypeTitle : 'All', // type filter if set
            preSelectedCollection || 'all', preSelectedCollection ? selectedCollectionTitle : 'All' // collection filter if set
        );
        
        // Apply the filters
        await applyFilters();
    }
}

// Function to create filter tags
function createFilterTags(selectedColors, selectedTypeValue, selectedTypeLabel, selectedCollectionValue, selectedCollectionLabel) {
    const filterTagsWrapper = document.querySelector('.filter_tags-wrapper');
    if (!filterTagsWrapper) return;
    
    // Clear existing tags
    filterTagsWrapper.innerHTML = '';
    
    let hasFilters = false;
    
    // Add color tags
    selectedColors.forEach(color => {
        hasFilters = true;
        const tag = document.createElement('div');
        tag.className = 'filter_tag';
        tag.setAttribute('data-filter-type', 'color');
        tag.setAttribute('data-filter-id', color.id);
        tag.innerHTML = `
            <span class="filter_tag-color" style="background-color: ${color.color}"></span>
            <span class="filter_tag-text">${color.label}</span>
            <span class="filter_tag-remove">✕</span>
        `;
        
        // Add click handler to remove tag
        tag.querySelector('.filter_tag-remove').addEventListener('click', () => {
            // Uncheck the corresponding color filter checkbox
            const colorInput = document.querySelector(`input[name="color"][value="${color.id}"]`);
            if (colorInput) {
                colorInput.checked = false;
            }
            
            // Remove the tag
            tag.remove();
            
            // Hide tags wrapper if empty
            updateFilterTagsVisibility();
            
            // Re-apply filters
            applyFilters();
        });
        
        filterTagsWrapper.appendChild(tag);
    });
    
    // Add type tag if not "All"
    if (selectedTypeValue !== 'all') {
        hasFilters = true;
        const tag = document.createElement('div');
        tag.className = 'filter_tag';
        tag.setAttribute('data-filter-type', 'type');
        tag.setAttribute('data-filter-value', selectedTypeValue);
        tag.innerHTML = `
            <span class="filter_tag-text">Type: ${selectedTypeLabel}</span>
            <span class="filter_tag-remove">✕</span>
        `;
        
        // Add click handler to remove tag
        tag.querySelector('.filter_tag-remove').addEventListener('click', () => {
            // Set type to "All"
            const typeInput = document.querySelector('input[name="type"][value="all"]');
            if (typeInput) {
                typeInput.checked = true;
            }
            
            // Remove the tag
            tag.remove();
            
            // Hide tags wrapper if empty
            updateFilterTagsVisibility();
            
            // Re-apply filters
            applyFilters();
        });
        
        filterTagsWrapper.appendChild(tag);
    }
    
    // Add collection tag if not "All"
    if (selectedCollectionValue !== 'all') {
        hasFilters = true;
        const tag = document.createElement('div');
        tag.className = 'filter_tag';
        tag.setAttribute('data-filter-type', 'collection');
        tag.setAttribute('data-filter-value', selectedCollectionValue);
        tag.innerHTML = `
            <span class="filter_tag-text">Collection: ${selectedCollectionLabel}</span>
            <span class="filter_tag-remove">✕</span>
        `;
        
        // Add click handler to remove tag
        tag.querySelector('.filter_tag-remove').addEventListener('click', () => {
            // Set collection to "All"
            const collectionInput = document.querySelector('input[name="collection"][value="all"]');
            if (collectionInput) {
                collectionInput.checked = true;
            }
            
            // Remove the tag
            tag.remove();
            
            // Hide tags wrapper if empty
            updateFilterTagsVisibility();
            
            // Re-apply filters
            applyFilters();
        });
        
        filterTagsWrapper.appendChild(tag);
    }
    
    // Show/hide tags wrapper based on whether there are any tags
    filterTagsWrapper.style.display = hasFilters ? 'flex' : 'none';
}

// Helper function to clear all filter tags
function clearFilterTags() {
    const filterTagsWrapper = document.querySelector('.filter_tags-wrapper');
    if (filterTagsWrapper) {
        filterTagsWrapper.innerHTML = '';
        filterTagsWrapper.style.display = 'none';
    }
}

// Helper function to check if filter tags wrapper should be visible
function updateFilterTagsVisibility() {
    const filterTagsWrapper = document.querySelector('.filter_tags-wrapper');
    if (filterTagsWrapper) {
        const hasTags = filterTagsWrapper.children.length > 0;
        filterTagsWrapper.style.display = hasTags ? 'flex' : 'none';
    }
}

// Helper function to display filtered/sorted products
function displayFilteredProducts(products) {
    const filterFeed = document.querySelector('.filter_feed .collection-list');
    if (!filterFeed) return;
    
    filterFeed.innerHTML = '';
    
    if (products.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = '<div>No products found</div>';
        filterFeed.appendChild(noResults);
        return;
    }

    // Check if we're on GitHub Pages and adjust paths accordingly
    const isGitHubPages = window.location.hostname === "sylvgira.com" || 
                         window.location.pathname.startsWith('/beaubnana/');
    const basePath = isGitHubPages ? '/beaubnana' : '';

    products.forEach(product => {
        const productCard = createProductCard(product, {
            showTag: true,
            basePath: basePath,
            onClick: (product) => {

                if (window.productRouter) {
                    window.productRouter.navigateToProduct(product.handle);
                } else {
                    console.error('Product router not initialized');
                }
            }
        });
        
        productCard.setAttribute('role', 'listitem');
        filterFeed.appendChild(productCard);
    });
}

// Function to display all products in the all-products page format
async function displayAllProducts() {

    const filterFeed = document.querySelector('.filter_feed .collection-list');
    if (!filterFeed) {
        console.error('Could not find filter feed element (.filter_feed .collection-list)');


        return;
    }


    try {
    const products = await fetchProducts();

        
        if (!products || products.length === 0) {
            console.error('No products returned from API - check Shopify domain and access token');
            console.log('Using API credentials:', {
                domain: window.SHOPIFY_CONFIG.domain,
                tokenLength: window.SHOPIFY_CONFIG.storefrontAccessToken?.length
            });
            return;
        }
        

    
    // Clear existing items
    filterFeed.innerHTML = '';
        
        // Check if we're on GitHub Pages and adjust paths accordingly
        const isGitHubPages = window.location.hostname === "sylvgira.com" || 
                             window.location.pathname.startsWith('/beaubnana/');
        const basePath = isGitHubPages ? '/beaubnana' : '';


    products.forEach(product => {
        const productCard = createProductCard(product, {
            showTag: true,
            basePath: basePath
        });
        filterFeed.appendChild(productCard);
    });



    // Initialize sorting after products are displayed
    initializeSorting();
    
    // Initialize filters
    await initializeFilters();

    } catch (error) {
        console.error('Error in displayAllProducts:', error);
    }
}

// Initialize the ShopifyAPI object ONLY ONCE at the end
window.ShopifyAPI = {
    // Core functions
    fetchProducts,
    fetchProductByHandle,
    fetchProductsByTag,
    fetchProductsWithFilters,
    displayMarqueeProducts,
    displayProductGrid,
    fetchProductsFromCollection,
    displayCollectionMarquee, // Use the latest version defined below
    fetchProductTypeCategories,
    mapCategoryToType,
    displayProductTypeCollections,
    displayAllProducts,
    initializeSorting,
    initializeFilters,
    displayCollectionGrid, // Use the version defined below
    fetchFilterCategories,
    fetchProductColors, // Added missing function
    applyFilters, // Added missing function
    displayFilteredProducts, // Added missing function
    createFilterTags, // Added missing function
    clearFilterTags, // Added missing function
    updateFilterTagsVisibility, // Added missing function
    getContrastColor, // Added missing function
    getDarkerColor, // Added missing function
    sortProducts, // Added missing function

    // Buy SDK related functions
    initShopifyBuyClient,
    initProductBuyButton,
    initCart,
    initShopifyBuy,

    // Metaobject related functions
    debugCollectionsMetaobjects,
    debugCollectionByHandle,
    getMetafieldByKey,
    findUrl,
    fetchSingleMetaobjectById, // Use the latest version defined below
    fetchReferencedProducts, // Use the latest version defined below
    getMetaobjectField,
    fetchCollectionDataByGid, // Use the latest version defined below
    listAllMetaobjects,
    fetchCollectionsFromMetaobject // Added missing function
};



// Initialize Shopify Buy SDK client (modified to run only once)
function initShopifyBuyClient() {
    // If initialization already started or completed, return the existing promise
    if (shopifyInitializationPromise) {

        return shopifyInitializationPromise;
    }


    shopifyInitializationPromise = new Promise((resolve, reject) => {
        const scriptURL = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
        
        // If SDK is already loaded, use it
        if (window.ShopifyBuy) {

            if (window.ShopifyBuy.UI) {
                try {

                    shopifyClient = ShopifyBuy.buildClient({
                        domain: window.SHOPIFY_BUY_CONFIG.domain,
                        storefrontAccessToken: window.SHOPIFY_BUY_CONFIG.storefrontAccessToken,
                    });

                    ShopifyBuy.UI.onReady(shopifyClient).then(ui => {

                        shopifyUi = ui; // Store the UI object
                        resolve({ client: shopifyClient, ui: shopifyUi });
                    }).catch(err => {
                         console.error('Error during ShopifyBuy.UI.onReady:', err);
                         reject(err);
                     });
                } catch (err) {
                     console.error('Error building Shopify client or waiting for UI:', err);
                     reject(err);
                 }
            } else {
                 console.warn('ShopifyBuy exists, but ShopifyBuy.UI does not. Reloading script...');
                loadScript(resolve, reject); // Reload script if UI isn't ready
            }
        } else {

            loadScript(resolve, reject);
        }
    });
    
    return shopifyInitializationPromise;
}

// Helper function to load the Buy Button script
function loadScript(resolve, reject) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
    
    script.onload = () => {

         try {

             shopifyClient = ShopifyBuy.buildClient({
                 domain: window.SHOPIFY_BUY_CONFIG.domain,
                 storefrontAccessToken: window.SHOPIFY_BUY_CONFIG.storefrontAccessToken,
             });

             // Wait for the UI layer to be ready
             ShopifyBuy.UI.onReady(shopifyClient).then(ui => {

                 shopifyUi = ui; // Store the UI object
                 resolve({ client: shopifyClient, ui: shopifyUi });
             }).catch(err => {
                 console.error('Error during ShopifyBuy.UI.onReady after script load:', err);
                 reject(err);
             });
         } catch (err) {
             console.error('Error initializing Shopify Buy SDK after script load:', err);
             reject(err);
         }
    };
    
    script.onerror = (err) => {
         console.error('Failed to load Shopify Buy SDK script:', err);
         reject(new Error('Failed to load Shopify Buy SDK script'));
     };
    
    (document.getElementsByTagName("head")[0] || 
     document.getElementsByTagName("body")[0]).appendChild(script);
}

// Initialize product buy button for product pages (updated to use shared client/ui)
async function initProductBuyButton(productId) {

    try {
        // Ensure initialization is complete before proceeding
        await initShopifyBuyClient(); 

        // Check if UI object is available
        if (!shopifyUi) {
            console.error("Shopify UI is not initialized. Cannot create product button.");
            return;
        }

        const productComponentNode = document.getElementById("product-component");
        
        if (!productComponentNode) {
            console.warn("Product component node (#product-component) not found. Cannot create button.");
            return;
        }
        
        // Use productId parameter directly (already verified in product-router.js)
        const productIdToUse = productId;

        
        // Clear the container FIRST
        productComponentNode.innerHTML = '';

        
        // --- REVERT TO ORIGINAL COMPLEX OPTIONS --- 
        // These match closer to the user's example and config.js defaults

        shopifyUi.createComponent("product", {
            id: productIdToUse, // This should now be the numeric ID
            node: productComponentNode,
            moneyFormat: window.SHOPIFY_BUY_CONFIG.moneyFormat,
            options: {
                product: {
                    styles: {
                        product: {
                            "@media (min-width: 601px)": {
                                "max-width": "100%", // Adjusted from user example to fit container
                                "margin-left": "0",
                                "margin-bottom": "0",
                            },
                        },
                        buttonWrapper: {
                             "margin-top": "0", // Keep our wrapper style adjustments
                             "padding-top": "0",
                         },
                        button: { 
                            // --- Make button invisible but clickable ---
                            "opacity": 0,
                            "background-color": "transparent",
                            "color": "transparent", // Hide text color
                            "border": "none", // Remove any border
                            ":hover": {
                                "background-color": "transparent" // Keep transparent on hover
                            },
                            ":focus": {
                                "background-color": "transparent", // Keep transparent on focus
                                "outline": "none" // Hide focus ring if possible
                            },
                             // --- Ensure it fills the container ---
                            "width": "100%", 
                            "height": "100%",
                            "padding": "0", // Remove padding to maximize clickable area
                            "font-size": "1px", // Make text tiny just in case
                            "cursor": "pointer", // Explicitly set cursor
                            // No border-radius needed for the invisible overlay button
                        },
                    },
                    contents: { // Keep hidden as per original logic
                        img: false,
                        title: false,
                        price: false,
                    },
                    text: {
                        button: "Add to cart",
                    },
                },
                modalProduct: { // Include Modal options from original logic
                    contents: {
                        img: false,
                        imgWithCarousel: true,
                        button: false,
                        buttonWithQuantity: true,
                    },
                    styles: {
                        product: {
                            "@media (min-width: 601px)": {
                                "max-width": "100%",
                                "margin-left": "0px",
                                "margin-bottom": "0px",
                            },
                        },
                        button: window.SHOPIFY_BUY_CONFIG.buttonStyles, // Reuse config styles
                        title: {
                            "font-size": "34px",
                            color: "#4a376c",
                        },
                        price: {
                            color: "#4a376c",
                        },
                        compareAt: {
                            color: "#4a376c",
                        },
                        unitPrice: {
                            color: "#4a376c",
                        },
                        description: {
                            "font-size": "16px",
                            color: "#4a376c",
                        },
                    },
                    text: {
                        button: "Add to cart",
                    },
                },
                modal: { // Include Modal options from original logic
                    styles: {
                        modal: {
                            "background-color": "#f7f4e7",
                        },
                    },
                },
                option: {}, // Keep option rendering enabled
                cart: { // Include Cart options from original logic
                    styles: {
                        button: window.SHOPIFY_BUY_CONFIG.buttonStyles,
                    },
                    text: {
                        total: "Subtotal",
                        button: "Checkout",
                    },
                },
                toggle: { // Include Toggle options from original logic
                    styles: {
                        toggle: {
                            ...window.SHOPIFY_BUY_CONFIG.buttonStyles,
                        },
                    },
                },
            },
        });
        // --- END REVERTED OPTIONS ---
        

    } catch (error) {
        // Log the specific error encountered during initialization
        console.error(`❌ Error initializing product buy button for ID ${productId}:`, error);
    }
}

// Initialize cart for non-product pages (updated to use shared client/ui)
async function initCart(cartPosition = 'bottom right') {

    try {
        // Ensure initialization is complete before proceeding
        await initShopifyBuyClient();

        // Check if UI object is available
        if (!shopifyUi) {
            console.error("Shopify UI is not initialized. Cannot create cart.");
            return;
        }

        // Create cart component

        shopifyUi.createComponent("cart", {
            moneyFormat: window.SHOPIFY_BUY_CONFIG.moneyFormat,
            options: {
                cart: {
                    styles: {
                        button: { // Checkout Button
                            ...window.SHOPIFY_BUY_CONFIG.buttonStyles, // Use base styles
                            "border-radius": "8px" // Apply standard radius
                        },
                    },
                    text: {
                        total: "Subtotal",
                        button: "Checkout",
                    },
                    popup: false, // Ensure cart doesn't pop up automatically
                },
                toggle: {
                    styles: {
                        toggle: { // Cart Toggle Button
                            ...window.SHOPIFY_BUY_CONFIG.buttonStyles, // Use base styles
                            "background-color": "#e4007f", // Specific toggle color (already set in base, but explicit)
                            "border-radius": "8px 0 0 8px" // Apply specific radius ONLY here
                        },
                    },
                    count: {
                        fill: "#fff", // Color for the item count number
                    },
                },
            },
        });
        

    } catch (error) {
        console.error("❌ Error initializing cart:", error);
    }
}

// Initialize Shopify Buy functionality based on page type (Simplified)
async function initShopifyBuy() {

    // Product page initialization is handled by product-router.js calling initProductBuyButton directly.
    // This function now primarily ensures the SDK is loaded and initializes the cart for non-product pages.
    
    try {
        // Ensure the SDK client/UI are ready (or start initialization)
        await initShopifyBuyClient();
        
        // Determine if we are on a product page (check URL structure)
        const isProductPage = window.location.pathname.includes('/products/');
        
        if (!isProductPage) {

            // Initialize the cart on non-product pages
            await initCart();
        } else {

         }
         
         // Optionally dispatch an event to signal readiness
         document.dispatchEvent(new CustomEvent('shopify-buy-initialized'));

         
    } catch (error) {
        console.error('Error during initShopifyBuy:', error);
    }
}

// --- Call the main initialization function early --- 
// It will ensure the client/UI are ready for later calls
// initShopifyBuy(); // Let's call this later, perhaps after DOMContentLoaded or via include.js

// Function to display products in a grid from a specific collection
async function displayCollectionGrid(selector, collectionHandle, options = {}) {
    const grid = document.querySelector(selector);
    if (!grid) return;

    // Fetch products from the collection metaobject
    const { products } = await fetchProductsFromCollection(collectionHandle);
    
    // Apply limit if specified
    const limitedProducts = options.limit ? products.slice(0, options.limit) : products;
    
    // Clear existing items
    grid.innerHTML = '';

    limitedProducts.forEach(product => {
        const productCard = createProductCard(product, {
            showTag: true,
            tagText: options.tagText || '',
            additionalClasses: 'is-grid-column-quarter inset-effect',
            basePath: ''
        });
        
        productCard.setAttribute('role', 'listitem');
        grid.appendChild(productCard);
    });
}

// Function to debug available collections metaobjects and their structure
async function debugCollectionsMetaobjects() {
    try {
        const query = `
            query {
                metaobjects(first: 10, type: "collections") {
                    edges {
                        node {
                            handle
                            id
                            type
                            fields {
                                key
                                value
                            }
                        }
                    }
                }
            }
        `;
        
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        
        const metaobjects = data.data?.metaobjects?.edges || [];

        
        metaobjects.forEach((edge, index) => {
            const metaobject = edge.node;





            metaobject.fields.forEach(field => {

            });
        });
        
        return metaobjects.map(edge => edge.node);
    } catch (error) {
        console.error('Error debugging collections metaobjects:', error);
        return [];
    }
}

// Function to debug a specific collection metaobject by handle
async function debugCollectionByHandle(handle) {
    try {

        
        const query = `
            query {
                metaobjects(first: 1, type: "collections", query: "handle:${handle}") {
                    edges {
                        node {
                            handle
                            id
                            type
                            fields {
                                key
                                value
                                type
                                reference {
                                    ... on MediaImage {
                                        id
                                        url
                                        image {
                                            url
                                            altText
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        
        const metaobject = data.data?.metaobjects?.edges?.[0]?.node;
        if (!metaobject) {
            console.error(`No metaobject found with handle: "${handle}"`);
            return null;
        }
        





        
        metaobject.fields.forEach(field => {

            if (field.reference) {

                if (field.reference.image?.url) {

                }
            }
        });
        
        return metaobject;
    } catch (error) {
        console.error(`Error debugging collection "${handle}":`, error);
        return null;
    }
}

// Helper function to extract the metafield by key
function getMetafieldByKey(fields, key) {
  return fields.find(f => f.key === key);
}

// Helper function to recursively find a URL property in a reference object
function findUrl(obj) {
  // Base case: null or undefined
  if (!obj) return null;
  
  // Base case: if the object is a string that looks like a URL, return it
  if (typeof obj === 'string' && (obj.startsWith('http') || obj.startsWith('//'))) {
    return obj;
  }
  
  // For objects and arrays, scan all properties
  if (typeof obj === 'object') {
    // Check common URL property names first
    const commonUrlProps = ['url', 'src', 'href', 'link', 'image', 'originalSource'];
    for (const prop of commonUrlProps) {
      if (obj[prop]) {
        if (typeof obj[prop] === 'string' && (obj[prop].startsWith('http') || obj[prop].startsWith('//'))) {
          return obj[prop];
        } else if (typeof obj[prop] === 'object') {
          const nestedUrl = findUrl(obj[prop]);
          if (nestedUrl) return nestedUrl;
        }
      }
    }
    
    // Check all other properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Recursively search nested objects
        const nestedUrl = findUrl(value);
        if (nestedUrl) return nestedUrl;
      }
    }
  }
  
  return null;
}

// Function to fetch a single metaobject by its GID using the singular metaobject query
async function fetchSingleMetaobjectById(metaobjectId) {

    
    // Use the singular metaobject query
    const query = `
        query GetMetaobject($id: ID!) {
          metaobject(id: $id) {
            id
            handle
            type
            fields {
              key
              value
              type
              # Add reference for MediaImage to get URL
              reference {
                __typename # Get the type of the reference
                ... on MediaImage {
                  image {
                    url
                    altText
                  }
                }
                # File type removed as it's not valid here
              }
            }
          }
        }
    `;

    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ 
                query,
                variables: { id: metaobjectId } // Pass the ID as a variable
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return null;
        }
        
        const metaobject = data.data?.metaobject;

        
        if (!metaobject) {
            console.warn(`No metaobject found for ID: ${metaobjectId}`);
            return null;
        }
        
        // You can process the metaobject fields here if needed

        
        return metaobject;

    } catch (error) {
        console.error('Error fetching single metaobject:', error);
        return null;
    }
}

// Function to fetch product details for a list of product GIDs
async function fetchReferencedProducts(productIds) {
    if (!productIds || productIds.length === 0) {

        return [];
    }


    // Use the nodes query to fetch multiple products by their GIDs
    const query = `
        query GetNodes($ids: [ID!]!) {
            nodes(ids: $ids) {
                ... on Product {
                    id
                    title
                    description
                    handle
                    tags
                    productType
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
                                price {
                                    amount
                                    currencyCode
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ 
                query,
                variables: { ids: productIds }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL errors fetching products by ID:', data.errors);
            return [];
        }

        // Filter out any null results (e.g., if an ID was invalid)
        const products = data.data?.nodes?.filter(node => node !== null) || [];

        return products;

    } catch (error) {
        console.error('Error fetching referenced products:', error);
        return [];
    }
}

// Helper function to safely get a field from the metaobject
function getMetaobjectField(metaobject, key) {
    return metaobject?.fields?.find(f => f.key === key);
}

// Function to fetch Collection Metaobject data and its referenced products by GID
async function fetchCollectionDataByGid(metaobjectId) {

    
    const metaobject = await fetchSingleMetaobjectById(metaobjectId);
    
    if (!metaobject) {
        console.error(`Failed to fetch metaobject with ID: ${metaobjectId}`);
        return { collection: {}, products: [] }; // Return default structure on failure
    }
    
    // Extract basic fields
    const nameField = getMetaobjectField(metaobject, 'name');
    const descriptionField = getMetaobjectField(metaobject, 'collection_description');
    const colorField = getMetaobjectField(metaobject, 'collection_color');
    const imageField = getMetaobjectField(metaobject, 'image'); 
    const productsField = getMetaobjectField(metaobject, 'products');
    
    // --- Data Extraction ---
    const title = nameField?.value || metaobject.handle || 'Collection'; // Fallback title
    const description = descriptionField?.value || '';
    const color = colorField?.value || '#cccccc'; // Fallback color
    
    // Extract image URL and Alt text from the reference
    let imageUrl = '';
    let imageAlt = '';
    // Log the reference details BEFORE trying to extract

    
    if (imageField?.reference) {
        if (imageField.reference.__typename === 'MediaImage') {
            imageUrl = imageField.reference.image?.url || '';
            imageAlt = imageField.reference.image?.altText || title; 
        } else if (imageField.reference.__typename === 'File') {
            // Handle File type - check common properties
            imageUrl = imageField.reference.url || ''; // Or preview.image.url etc.
            imageAlt = title; // File type might not have specific alt text here
        }
    }
    
    // Extract product GIDs (value is usually a JSON string array)
    let productIds = [];
    if (productsField?.value) {
        try {
            productIds = JSON.parse(productsField.value);
            if (!Array.isArray(productIds)) {
                console.warn('Products field value is not an array:', productIds);
                productIds = [];
            }
        } catch (e) {
            console.error('Error parsing products field JSON:', e, productsField.value);
            productIds = [];
        }
    } else {

    }
    

    
    // --- Fetch Referenced Products ---
    const products = await fetchReferencedProducts(productIds);
    
    // --- Construct Result ---
    const collectionData = {
        title,
        description,
        color,
        image: imageUrl,
        imageAlt
    };
    


    
    return {
        collection: collectionData,
        products,
        handle: metaobject.handle // Return the handle too
    };
}

// Function to display products in a marquee from a specific collection metaobject
async function displayCollectionMarquee(selector, collectionMetaobjectId) { // Ensure this definition is the latest intended one
    const marqueeTrack = document.querySelector(selector);
    if (!marqueeTrack) {
        console.error('Marquee track element not found:', selector);
        return;
    }


    // Fetch data using the GID
    const { collection, products, handle } = await fetchCollectionDataByGid(collectionMetaobjectId); // Destructure handle
    
    if (!collection || !products) {
        console.error('Failed to get collection data or products for marquee.');
        return;
    }
    


    
    // --- Update HTML Elements (similar to before, but using fetched data) ---
    const collectionTitle = document.querySelector('.collection_heading');
    const collectionDescription = document.querySelector('.collection_content .text-size-large');
    const collectionSection = document.querySelector('.section_collections');
    const collectionImage = document.querySelector('.collection_image-wrap img');
    const shopCollectionButton = document.querySelector('.collection_content .button');
    
    const formattedTitle = collection.title || 'Collection'; // Use fetched title
    
    if (collectionTitle) {
        collectionTitle.textContent = `${formattedTitle}`; // Just use the name field
    } else {
        console.warn('Collection title element not found');
    }
    
    if (collectionDescription) {
        if (collection.description) {
            collectionDescription.textContent = collection.description;
        } else {
            collectionDescription.textContent = ''; // Clear if no description
            console.warn('No collection description available in data');
        }
    } else {
        console.warn('Collection description element not found');
    }

    if (collectionSection) {
        if (collection.color) {
            collectionSection.style.setProperty('--collection-color', collection.color);
        } else {
            collectionSection.style.removeProperty('--collection-color'); // Remove if no color
            console.warn('No collection color available in data');
        }
    } else {
        console.warn('Collection section element not found');
    }

    if (collectionImage) {
        if (collection.image) {
            collectionImage.src = collection.image;
            collectionImage.alt = collection.imageAlt || formattedTitle;
            // Optional: Adjust styling if needed
            // collectionImage.style.objectPosition = 'center 15%'; 
        } else {
            collectionImage.src = ''; // Clear if no image
            collectionImage.alt = '';
            console.warn('No collection image URL available in data');
        }
    } else {
        console.warn('Collection image element not found');
    }
    
    // Update shop collection button link (use metaobject handle if available, or construct)
    const collectionHandle = handle || formattedTitle.toLowerCase().replace(/\s+/g, '-'); // Use the received handle
    if (shopCollectionButton) {
        shopCollectionButton.href = `all-products.html?collection=${collectionHandle}`; // Link might need review based on filtering strategy
    } else {
        console.warn('Shop collection button element not found');
    }
    
    // --- Create the marquee list (same as before) ---
    const marqueeList = document.createElement('div');
    marqueeList.className = 'display-contents w-dyn-list';
    marqueeList.setAttribute('role', 'list');
    marqueeList.className = 'marquee_list w-dyn-items';

    if (products.length > 0) {
        products.forEach(product => {
            const imageUrl = product.images.edges[0]?.node.url || '';
            const marqueeItem = document.createElement('div');
            marqueeItem.className = 'marquee_item w-dyn-item';
            marqueeItem.setAttribute('role', 'listitem');
            marqueeItem.innerHTML = `
                <img src="${imageUrl}" 
                     loading="lazy" 
                     alt="${product.title}" 
                     class="marquee_image scale-up">
            `;
            marqueeList.appendChild(marqueeItem);
        });
    } else {
        console.warn('No products available for the marquee');
    }

    // Clear existing content and add the marquee list three times
    marqueeTrack.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const clone = marqueeList.cloneNode(true);
        marqueeTrack.appendChild(clone);
    }
    

}

// Function to retrieve and list all available metaobject definitions and instances
async function listAllMetaobjects() {

    
    const query = `
        query {
            metaobjectDefinitions(first: 20) {
                edges {
                    node {
                        name
                        type
                        fieldDefinitions {
                            name
                            key
                            type {
                                name
                            }
                        }
                    }
                }
            }
            metaobjects(first: 50) {
                edges {
                    node {
                        id
                        handle
                        type
                        fields {
                            key
                            value
                            type
                        }
                    }
                }
            }
        }
    `;
    
    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        
        const metaobjectDefinitions = data.data?.metaobjectDefinitions?.edges || [];

        
        metaobjectDefinitions.forEach((edge, index) => {
            const metaobjectDefinition = edge.node;




            metaobjectDefinition.fieldDefinitions.forEach(fieldDefinition => {



            });
        });
        
        const metaobjects = data.data?.metaobjects?.edges || [];

        
        metaobjects.forEach((edge, index) => {
            const metaobject = edge.node;





            metaobject.fields.forEach(field => {

                if (field.reference) {

                    if (field.reference.__typename === 'MediaImage' || field.reference.__typename === 'File') {

                    }
                }
            });
        });
        
        return {
            metaobjectDefinitions,
            metaobjects
        };
    } catch (error) {
        console.error('Error listing metaobjects:', error);
        return { metaobjectDefinitions: [], metaobjects: [] };
    }
}

// Function to fetch Collections from the metaobject (including product GIDs)
async function fetchCollectionsFromMetaobject() {

    try {
        // 1. Initial Query: Fetch metaobjects with basic fields + product GIDs list
        const initialQuery = `
            query {
                metaobjects(type: "collections", first: 50) { # Fetch more collections if needed
                    edges {
                        node {
                            id
                            handle
                            fields {
                                key
                                value # Expecting name or product GID list JSON string
                            }
                        }
                    }
                }
            }
        `;
        
        const initialResponse = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({ query: initialQuery })
        });
        
        if (!initialResponse.ok) {
            throw new Error(`[fetchCollectionsFromMetaobject] Initial query HTTP error! status: ${initialResponse.status}`);
        }
        
        const initialData = await initialResponse.json();

        
        if (initialData.errors) {
            console.error('[fetchCollectionsFromMetaobject] GraphQL errors in initial query:', initialData.errors);
             return []; 
        }
        
        const metaobjects = initialData.data?.metaobjects?.edges || [];
        if (metaobjects.length === 0) {

             return [];
        }
        
        // 2. Extract data and parse product GIDs
        const collectionsInfo = metaobjects.map(edge => {
            const node = edge.node;
            const fields = node.fields || [];
            const nameField = fields.find(f => f.key === 'name'); // Or the correct key for collection name
            const productsField = fields.find(f => f.key === 'products'); 

            const name = nameField ? nameField.value : node.handle; // Fallback to handle if name field missing
            let productGids = [];

            if (productsField?.value) {
                try {
                    productGids = JSON.parse(productsField.value);
                    if (!Array.isArray(productGids)) {
                        console.warn(`[fetchCollectionsFromMetaobject] Products field for collection '${name}' is not a valid JSON array:`, productsField.value);
                        productGids = [];
                    }
                } catch (e) {
                    console.error(`[fetchCollectionsFromMetaobject] Error parsing products field JSON for collection '${name}':`, e, productsField.value);
                    productGids = [];
                }
            } else {
                console.warn(`[fetchCollectionsFromMetaobject] No 'products' field found for collection '${name}'.`);
            }
            


            return {
                id: node.id,
                title: name,
                handle: node.handle,
                productGids: productGids
            };
        });


        return collectionsInfo;

    } catch (error) {
        console.error('[fetchCollectionsFromMetaobject] Error fetching collections:', error);
        return [];
    }
}

// Function to create a product card with consistent structure
function createProductCard(product, options = {}) {
    const {
        showTag = true,
        tagText = '',
        isTopSeller = false,
        additionalClasses = '',
        basePath = '',
        onClick = null
    } = options;




    const price = product.priceRange.minVariantPrice.amount;
    const currency = product.priceRange.minVariantPrice.currencyCode;
    
    // Get compare-at price if available
    const variant = product.variants?.edges[0]?.node;


    
    const compareAtPrice = variant?.compareAtPrice?.amount;


    
    const hasCompareAtPrice = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);

    
    // Get all images for the product
    const images = product.images.edges.map(edge => edge.node);
    const primaryImage = images[0]?.url || '';
    const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

    // Determine if product is a top seller
    const hasTopSellerTag = product.tags && product.tags.includes('top-seller');
    const finalIsTopSeller = isTopSeller || hasTopSellerTag;
    const finalTagText = tagText || (finalIsTopSeller ? 'best seller' : '');

    // Create the product card element
    const productCard = document.createElement('a');
    productCard.href = `${basePath}/products/${product.handle}`;
    productCard.setAttribute('data-product-handle', product.handle);
    productCard.className = `product-card_link w-inline-block ${additionalClasses}`.trim();
    
    // Build the HTML structure
    let priceHtml = '';
    if (hasCompareAtPrice) {
        priceHtml = `
            <p data-commerce-type="variation-compare-at-price" class="text-size-large display-inline" style="text-decoration: line-through; opacity: 0.7; margin-right: 0.5rem;">${currency} ${compareAtPrice}</p>
            <p data-commerce-type="variation-price" class="text-size-large display-inline">${currency} ${price}</p>
        `;
    } else {
        priceHtml = `<p data-commerce-type="variation-price" class="text-size-large display-inline">${currency} ${price}</p>`;
    }

    productCard.innerHTML = `
        <div data-inner-rad="top-left" class="product-card_tag" style="${showTag && finalTagText ? '' : 'display: none;'}">
            <p class="text-weight-bold">${finalTagText}</p>
        </div>
        <div data-product-focus="" class="product-card_image-wrapper">
            <img src="${secondaryImage}" 
                 alt="${product.title}" 
                 loading="lazy" 
                 class="product-card_image on-model">
            <img src="${primaryImage}" 
                 alt="${product.title}" 
                 loading="lazy" 
                 class="product-card_image product-focus">
        </div>
        <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
            <h6 class="display-inline">${product.title}</h6>
            <div class="spacer-0d25"></div>
            <div class="product-price-wrapper">
                ${priceHtml}
            </div>
        </div>
    `;

    // Add click handler if provided
    if (onClick) {
        productCard.addEventListener('click', (e) => {
            e.preventDefault();
            onClick(product);
        });
    }

    return productCard;
}
