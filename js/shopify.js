// This file uses configurations from config.js
// Make sure to import config.js before this file in your HTML

// Shopify Storefront API configuration
const SHOPIFY_CONFIG = {
    domain: '0wrz46-0q.myshopify.com',
    storefrontAccessToken: '274905cf05e4e73a7e1993be2fffc9d1'
};

// Shopify Buy Button Configuration
const SHOPIFY_BUY_CONFIG = {
    domain: '0wrz46-0q.myshopify.com',
    storefrontAccessToken: '514828cb596d687316a4de3ab8b6aafd',
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
                            }
                        }
                    }
                }
            }
        }
    }
`;

// Function to fetch products from Shopify
async function fetchProducts() {
    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query: PRODUCTS_QUERY
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.products.edges.map(edge => edge.node);
    } catch (error) {
        console.error('Error fetching products:', error);
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

        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
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
    let products = await fetchProducts();
    
    // Apply filters if provided
    if (filters.limit) {
        products = products.slice(0, filters.limit);
    }
    
    // Add more filter options here as needed
    return products;
}

// Function to display products in a marquee
async function displayMarqueeProducts(selector, options = {}) {
    const marqueeTrack = document.querySelector(selector);
    if (!marqueeTrack) return;

    const products = await fetchProductsWithFilters({ limit: options.limit || 10 });
    
    // Create the marquee list
    const marqueeList = document.createElement('div');
    marqueeList.className = 'display-contents w-dyn-list';
    marqueeList.setAttribute('role', 'list');
    marqueeList.className = 'marquee_list w-dyn-items';

    // Add product images to the marquee list
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

    const products = await fetchProductsWithFilters({ limit: options.limit || 4 });
    
    // Clear existing items
    grid.innerHTML = '';

    products.forEach(product => {
        const price = product.priceRange.minVariantPrice.amount;
        const currency = product.priceRange.minVariantPrice.currencyCode;
        
        // Get all images for the product
        const images = product.images.edges.map(edge => edge.node);
        const primaryImage = images[0]?.url || '';
        const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

        const productCard = document.createElement('div');
        productCard.className = 'display-contents w-dyn-item';
        productCard.setAttribute('role', 'listitem');
        
        productCard.innerHTML = `
            <div class="product-card is-grid-column-quarter inset-effect">
                <a href="/products/${product.handle}" data-product-handle="${product.handle}" class="product-card_link w-inline-block">
                    <div data-inner-rad="top-left" class="product-card_tag">
                        <p class="text-weight-bold">${options.tagText || 'best seller'}</p>
                    </div>
                    <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
                        <h6 class="product-name">${product.title}</h6>
                        <p class="product-price text-size-large">${currency} ${price}</p>
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
                </a>
            </div>
        `;
        
        grid.appendChild(productCard);
    });
}

// Function to display products in a grid from a specific collection
async function displayCollectionGrid(selector, collectionHandle, options = {}) {
    const grid = document.querySelector(selector);
    if (!grid) return;

    // Fetch products from the specified collection
    const { products: collectionProducts } = await fetchProductsFromCollection(collectionHandle);
    
    // Apply limit if provided
    const products = options.limit ? collectionProducts.slice(0, options.limit) : collectionProducts;
    
    // Clear existing items
    grid.innerHTML = '';

    products.forEach(product => {
        const price = product.priceRange.minVariantPrice.amount;
        const currency = product.priceRange.minVariantPrice.currencyCode;
        
        // Get all images for the product
        const images = product.images.edges.map(edge => edge.node);
        const primaryImage = images[0]?.url || '';
        const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

        const productCard = document.createElement('div');
        productCard.className = 'display-contents w-dyn-item';
        productCard.setAttribute('role', 'listitem');
        
        productCard.innerHTML = `
            <div class="product-card is-grid-column-quarter inset-effect">
                <a href="/products/${product.handle}" data-product-handle="${product.handle}" class="product-card_link w-inline-block">
                    <div data-inner-rad="top-left" class="product-card_tag">
                        <p class="text-weight-bold">${options.tagText || ''}</p>
                    </div>
                    <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
                        <h6 class="product-name">${product.title}</h6>
                        <p class="product-price text-size-large">${currency} ${price}</p>
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
                </a>
            </div>
        `;
        
        // Hide tag if tagText is empty or not provided
        const tagElement = productCard.querySelector('.product-card_tag');
        if (!options.tagText && tagElement) {
            tagElement.style.display = 'none';
        }
        
        grid.appendChild(productCard);
    });
}

// Function to fetch products from a specific collection
async function fetchProductsFromCollection(collectionHandle) {
    try {
        const query = `
            query {
                collectionByHandle(handle: "${collectionHandle}") {
                    title
                    description
                    image {
                        url
                        altText
                    }
                    metafield(namespace: "custom", key: "collection_colour") {
                        value
                    }
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
            body: JSON.stringify({
                query
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Collection metafield response:', data.data.collectionByHandle.metafield);
        return {
            collection: {
                title: data.data.collectionByHandle.title,
                description: data.data.collectionByHandle.description,
                color: data.data.collectionByHandle.metafield?.value || '#00ff00',
                image: data.data.collectionByHandle.image?.url || '',
                imageAlt: data.data.collectionByHandle.image?.altText || ''
            },
            products: data.data.collectionByHandle.products.edges.map(edge => edge.node)
        };
    } catch (error) {
        console.error('Error fetching collection products:', error);
        return {
            collection: {
                title: '',
                description: '',
                color: '#00ff00',
                image: '',
                imageAlt: ''
            },
            products: []
        };
    }
}

// Function to display products in a marquee from a specific collection
async function displayCollectionMarquee(selector, collectionHandle) {
    const marqueeTrack = document.querySelector(selector);
    if (!marqueeTrack) return;

    const { collection, products } = await fetchProductsFromCollection(collectionHandle);
    
    // Update collection title and description
    const collectionTitle = document.querySelector('.collection_heading');
    const collectionDescription = document.querySelector('.collection_content .text-size-large');
    const collectionSection = document.querySelector('.section_collections');
    const collectionImage = document.querySelector('.collection_image-wrap img');
    const shopCollectionButton = document.querySelector('.collection_content .button');
    
    if (collectionTitle) {
        collectionTitle.textContent = `${collection.title} Collection`;
    }
    
    if (collectionDescription) {
        collectionDescription.textContent = collection.description;
    }

    if (collectionSection) {
        collectionSection.style.setProperty('--collection-color', collection.color);
    }

    if (collectionImage && collection.image) {
        collectionImage.src = collection.image;
        collectionImage.alt = collection.imageAlt || collection.title;
        collectionImage.style.objectPosition = 'center 15%';
    }
    
    // Update shop collection button link
    if (shopCollectionButton) {
        shopCollectionButton.href = `all-products.html?collection=${collectionHandle}`;
    }
    
    // Create the marquee list
    const marqueeList = document.createElement('div');
    marqueeList.className = 'display-contents w-dyn-list';
    marqueeList.setAttribute('role', 'list');
    marqueeList.className = 'marquee_list w-dyn-items';

    // Add product images to the marquee list
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

    // Clear existing content and add the marquee list three times for seamless looping
    marqueeTrack.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const clone = marqueeList.cloneNode(true);
        marqueeTrack.appendChild(clone);
    }
}

// Function to fetch product type collections
async function fetchProductTypeCollections() {
    try {
        const query = `
            query {
                collections(first: 20) {
                    edges {
                        node {
                            id
                            title
                            handle
                            image {
                                url
                                altText
                            }
                            metafield(namespace: "custom", key: "product_type_collection") {
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
            body: JSON.stringify({
                query
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('All collections response:', data.data.collections.edges);
        
        // Filter collections where product_type_collection is true
        const filteredCollections = data.data.collections.edges
            .map(edge => edge.node)
            .filter(collection => {
                console.log('Collection metafield:', collection.title, collection.metafield);
                return collection.metafield?.value === 'true';
            });
            
        console.log('Filtered collections:', filteredCollections);
        return filteredCollections;
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

    // Fetch collections
    const collections = await fetchProductTypeCollections();
    console.log('Product type collections:', collections);

    // Clear existing content but keep the template
    const template = templateCard.cloneNode(true);
    container.innerHTML = '';

    // Create cards for each collection
    collections.forEach(collection => {
        // Convert the card to a clickable link by creating an anchor with the same classes
        const card = document.createElement('a');
        card.className = template.className;
        card.href = `all-products.html?type=${collection.handle}`;
        
        // Copy the inner HTML from the template
        card.innerHTML = template.innerHTML;
        
        // Preserve the data-image-hover attribute
        card.setAttribute('data-image-hover', '');
        
        // Update heading
        const heading = card.querySelector('.categories-feature_detail-wrapper .heading-style-h4');
        if (heading) {
            heading.textContent = collection.title;
        }

        // Update image
        const image = card.querySelector('.categories-feature_image');
        if (image && collection.image) {
            image.src = collection.image.url;
            image.alt = collection.image.altText || collection.title;
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
                const price = product.priceRange.minVariantPrice.amount;
                const currency = product.priceRange.minVariantPrice.currencyCode;
                
                const images = product.images.edges.map(edge => edge.node);
                const primaryImage = images[0]?.url || '';
                const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

                const productCard = document.createElement('div');
                productCard.className = 'w-dyn-item';
                productCard.setAttribute('role', 'listitem');
                
                productCard.innerHTML = `
                    <div class="product-card">
                        <a href="/products/${product.handle}" 
                           data-product-handle="${product.handle}"
                           class="product-card_link w-inline-block">
                            <div data-inner-rad="top-left" class="product-card_tag">
                                <p class="text-weight-bold"></p>
                            </div>
                            <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
                                <h6 class="display-inline">${product.title}</h6>
                                <div class="spacer-0d25"></div>
                                <p data-commerce-type="variation-price" class="text-size-large display-inline">${currency} ${price}</p>
                            </div>
                            <div class="product-card_image-wrapper">
                                <img src="${secondaryImage}" 
                                     alt="${product.title}" 
                                     loading="lazy" 
                                     class="product-card_image on-model">
                                <img src="${primaryImage}" 
                                     alt="${product.title}" 
                                     loading="lazy" 
                                     class="product-card_image product-focus">
                            </div>
                        </a>
                    </div>
                `;
                
                // Check if product is in 'top-sellers' collection and update/hide the tag
                const isTopSeller = product.collections.edges.some(edge => edge.node.handle === 'top-sellers');
                const tagElement = productCard.querySelector('.product-card_tag');
                if (isTopSeller) {
                    tagElement.querySelector('p').textContent = 'best seller';
                } else {
                    tagElement.style.display = 'none';
                }
                
                // Add click handler directly to the link
                const link = productCard.querySelector('a');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Product clicked:', product.handle);
                    if (window.productRouter) {
                        window.productRouter.navigateToProduct(product.handle);
                    } else {
                        console.error('Product router not initialized');
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
        console.log('Raw color patterns:', JSON.stringify(data, null, 2));

        const colorPatterns = data.data.metaobjects.edges.map(edge => {
            const fields = edge.node.fields;
            return {
                id: edge.node.id,
                label: fields.find(f => f.key === 'label')?.value || '',
                color: fields.find(f => f.key === 'color')?.value || '',
                baseColor: fields.find(f => f.key === 'color_taxonomy_reference')?.value || ''
            };
        });

        console.log('Processed color patterns:', colorPatterns);

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

// Function to fetch all collections and separate them into types and regular collections
async function fetchFilterCollections() {
    try {
        const query = `
            query {
                collections(first: 50) {
                    edges {
                        node {
                            id
                            title
                            handle
                            metafield(namespace: "custom", key: "collection_type") {
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
        
        // Check for GraphQL errors
        if (data.errors) {
            console.error('GraphQL errors fetching collections:', JSON.stringify(data.errors, null, 2));
            throw new Error('GraphQL errors occurred while fetching collections.');
        }
        
        // Ensure data.data and data.data.collections exist
        if (!data.data || !data.data.collections) {
            console.error('Unexpected response structure fetching collections:', data);
            throw new Error('Unexpected response structure while fetching collections.');
        }
        
        // Split collections into types, regular collections, and filters
        const types = [];
        const collections = [];
        const filters = [];
        
        data.data.collections.edges.forEach(edge => {
            const collection = {
                id: edge.node.id,
                title: edge.node.title,
                handle: edge.node.handle
            };
            
            const collectionType = edge.node.metafield?.value; // Get the string value
            
            if (collectionType === 'type') {
                types.push(collection);
            } else if (collectionType === 'collection') {
                collections.push(collection);
            } else if (collectionType === 'filter') {
                filters.push(collection);
            } 
            // Optionally handle collections without the metafield or with unexpected values
            // else {
            //     console.log(`Collection "${collection.title}" has no or unexpected type:`, collectionType);
            //     // Decide where to put these, e.g., into 'collections' by default
            //     // collections.push(collection); 
            // }
        });

        console.log('Types:', types);
        console.log('Collections:', collections);
        console.log('Filters:', filters);
        
        // Return all three categories
        return { types, collections, filters };
    } catch (error) {
        console.error('Error fetching collections:', error);
        // Return empty arrays in case of error
        return { types: [], collections: [], filters: [] };
    }
}

// Function to initialize filters
async function initializeFilters() {
    console.log('Initializing filters...');
    const filterModal = document.querySelector('.filter_filters-modal');
    const filterButton = document.querySelector('.filter_filters-button');
    const colorFilters = document.getElementById('colour-filters');
    const typeFilters = document.getElementById('type-filters');
    const collectionFilters = document.getElementById('collection-filters');
    const filterTagsWrapper = document.querySelector('.filter_tags-wrapper');
    
    // Check URL for collection and type parameters
    let preSelectedCollection = null;
    let preSelectedType = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        preSelectedCollection = urlParams.get('collection');
        preSelectedType = urlParams.get('type');
        
        if (preSelectedCollection) {
            console.log('Found collection in URL:', preSelectedCollection);
        }
        
        if (preSelectedType) {
            console.log('Found type in URL:', preSelectedType);
        }
    } catch (error) {
        console.error('Error parsing URL parameters:', error);
    }
    
    // Toggle filter modal visibility
    filterButton?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Filter button clicked');
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
    // Fetch all collection categories, but only use types and collections for the UI
    const { types, collections } = await fetchFilterCollections(); 
    console.log('Fetched filter data:', { colorPatterns, types, collections });
    
    // Populate color filters
    if (colorFilters && colorPatterns.length > 0) {
        console.log('Populating color filters:', colorPatterns);
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
    
    // Populate type filters
    if (typeFilters && types.length > 0) {
        console.log('Populating type filters:', types);
        typeFilters.innerHTML = ''; // Clear existing content
        
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
        
        // Add other type options
        types.forEach(type => {
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
    
    // Populate collection filters
    if (collectionFilters && collections.length > 0) {
        console.log('Populating collection filters:', collections);
        collectionFilters.innerHTML = ''; // Clear existing content
        
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
        
        // Add other collection options
        collections.forEach(collection => {
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

    // Handle filter button clicks
    const applyButton = document.getElementById('apply-filters');
    const clearAllButton = document.getElementById('clear-all-filters');
    const clearButtons = filterModal.querySelectorAll('.is-filter-clear');

    // Apply filters
    applyButton?.addEventListener('click', async () => {
        console.log('Apply button clicked');
        
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
            selectedColors, 
            selectedType: { value: selectedTypeValue, label: selectedTypeLabel }, 
            selectedCollection: { value: selectedCollectionValue, label: selectedCollectionLabel } 
        });

        try {
            // Build the query based on collection/type selection
            let query = `
                query {
                    products(first: 50) {
                        edges {
                            node {
                                id
                                title
                                handle
                                productType
                                collections(first: 10) {
                                    edges {
                                        node {
                                            handle
                                        }
                                    }
                                }
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
            console.log('Filter query response:', data);

            if (data.errors) {
                console.error('GraphQL errors:', data.errors);
                return;
            }

            let products = data.data.products.edges.map(edge => edge.node);
            console.log('All products before filtering:', products.map(p => ({
                title: p.title,
                collections: p.collections.edges.map(e => e.node.handle)
            })));

            // Apply type filter
            if (selectedTypeValue !== 'all') {
                console.log('Filtering by type:', selectedTypeValue);
                products = products.filter(product => {
                    const matches = product.collections.edges.some(edge => 
                        edge.node.handle === selectedTypeValue
                    );
                    console.log(`Product "${product.title}":`, {
                        collections: product.collections.edges.map(e => e.node.handle),
                        selectedTypeValue,
                        matches
                    });
                    return matches;
                });
            }

            // Apply collection filter
            if (selectedCollectionValue !== 'all') {
                console.log('Filtering by collection:', selectedCollectionValue);
                products = products.filter(product => {
                    const matches = product.collections.edges.some(edge => 
                        edge.node.handle === selectedCollectionValue
                    );
                    console.log(`Product "${product.title}":`, {
                        collections: product.collections.edges.map(e => e.node.handle),
                        selectedCollectionValue,
                        matches
                    });
                    return matches;
                });
            }

            // Apply color filter
            if (selectedColors.length > 0) {
                products = products.filter(product => {
                    if (!product.metafield?.value) return false;
                    try {
                        const productColorIds = JSON.parse(product.metafield.value);
                        return selectedColors.every(selectedColor => 
                            productColorIds.includes(selectedColor.id)
                        );
                    } catch (e) {
                        console.error('Error parsing color IDs:', e);
                        return false;
                    }
                });
            }

            console.log('Filtered products:', products);

            // Create filter tags
            createFilterTags(selectedColors, selectedTypeValue, selectedTypeLabel, 
                            selectedCollectionValue, selectedCollectionLabel);

            // Re-render products
            displayFilteredProducts(products);

            // Close filter modal
            filterModal.classList.remove('is-open');
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    });

    // Clear all filters
    clearAllButton?.addEventListener('click', (e) => {
        e.preventDefault();
        colorFilters.querySelectorAll('input').forEach(input => input.checked = false);
        typeFilters.querySelector('input[value="all"]').checked = true;
        collectionFilters.querySelector('input[value="all"]').checked = true;
        
        // Clear filter tags
        clearFilterTags();
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
        });
    });
    
    // If a collection or type was selected from the URL, automatically apply the filter
    if (preSelectedCollection || preSelectedType) {
        console.log('Auto-applying filters from URL parameters');
        
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

// Helper function to re-apply filters when a filter tag is removed
async function applyFilters() {
    // Get current selected filters
    const colorFilters = document.getElementById('colour-filters');
    const typeFilters = document.getElementById('type-filters');
    const collectionFilters = document.getElementById('collection-filters');
    
    if (!colorFilters || !typeFilters || !collectionFilters) return;
    
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
    
    try {
        // Build the query
        let query = `
            query {
                products(first: 50) {
                    edges {
                        node {
                            id
                            title
                            handle
                            productType
                            collections(first: 10) {
                                edges {
                                    node {
                                        handle
                                    }
                                }
                            }
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
            console.error('GraphQL errors:', data.errors);
            return;
        }

        let products = data.data.products.edges.map(edge => edge.node);

        // Apply type filter
        if (selectedTypeValue !== 'all') {
            products = products.filter(product => {
                return product.collections.edges.some(edge => 
                    edge.node.handle === selectedTypeValue
                );
            });
        }

        // Apply collection filter
        if (selectedCollectionValue !== 'all') {
            products = products.filter(product => {
                return product.collections.edges.some(edge => 
                    edge.node.handle === selectedCollectionValue
                );
            });
        }

        // Apply color filter
        if (selectedColors.length > 0) {
            products = products.filter(product => {
                if (!product.metafield?.value) return false;
                try {
                    const productColorIds = JSON.parse(product.metafield.value);
                    return selectedColors.every(selectedColor => 
                        productColorIds.includes(selectedColor.id)
                    );
                } catch (e) {
                    console.error('Error parsing color IDs:', e);
                    return false;
                }
            });
        }

        // Re-render products
        displayFilteredProducts(products);
    } catch (error) {
        console.error('Error re-applying filters:', error);
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

    products.forEach(product => {
        const price = product.priceRange.minVariantPrice.amount;
        const currency = product.priceRange.minVariantPrice.currencyCode;
        
        const images = product.images.edges.map(edge => edge.node);
        const primaryImage = images[0]?.url || '';
        const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

        const productCard = document.createElement('div');
        productCard.className = 'w-dyn-item';
        productCard.setAttribute('role', 'listitem');
        
        productCard.innerHTML = `
            <div class="product-card">
                <a href="/products/${product.handle}" 
                   data-product-handle="${product.handle}"
                   class="product-card_link w-inline-block">
                    <div data-inner-rad="top-left" class="product-card_tag">
                        <p class="text-weight-bold"></p>
                    </div>
                    <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
                        <h6 class="display-inline">${product.title}</h6>
                        <div class="spacer-0d25"></div>
                        <p data-commerce-type="variation-price" class="text-size-large display-inline">${currency} ${price}</p>
                    </div>
                    <div class="product-card_image-wrapper">
                        <img src="${secondaryImage}" 
                             alt="${product.title}" 
                             loading="lazy" 
                             class="product-card_image on-model">
                        <img src="${primaryImage}" 
                             alt="${product.title}" 
                             loading="lazy" 
                             class="product-card_image product-focus">
                    </div>
                </a>
            </div>
        `;
        
        // Check if product is in 'top-sellers' collection and update/hide the tag
        const isTopSeller = product.collections.edges.some(edge => edge.node.handle === 'top-sellers');
        const tagElement = productCard.querySelector('.product-card_tag');
        if (isTopSeller) {
            tagElement.querySelector('p').textContent = 'best seller';
        } else {
            tagElement.style.display = 'none';
        }
        
        filterFeed.appendChild(productCard);
    });
}

// Function to display all products in the all-products page format
async function displayAllProducts() {
    console.log('Displaying all products...');
    const filterFeed = document.querySelector('.filter_feed .collection-list');
    if (!filterFeed) {
        console.error('Could not find filter feed element');
        return;
    }

    const products = await fetchProducts();
    console.log('Fetched products:', products.length);
    
    // Clear existing items
    filterFeed.innerHTML = '';
    
    // Check if we're on GitHub Pages and adjust paths accordingly
    const isGitHubPages = window.location.hostname === "sylvgira.com" || 
                         window.location.pathname.startsWith('/beaubnana/');
    const basePath = isGitHubPages ? '/beaubnana' : '';
    console.log("Shopify basePath for product links:", basePath);

    products.forEach(product => {
        const price = product.priceRange.minVariantPrice.amount;
        const currency = product.priceRange.minVariantPrice.currencyCode;
        
        const images = product.images.edges.map(edge => edge.node);
        const primaryImage = images[0]?.url || '';
        const secondaryImage = (images.length > 1 ? images[1]?.url : images[0]?.url) || primaryImage;

        const productCard = document.createElement('div');
        productCard.className = 'w-dyn-item';
        productCard.setAttribute('role', 'listitem');
        
        productCard.innerHTML = `
            <div class="product-card">
                <a href="${basePath}/products/${product.handle}" 
                   data-product-handle="${product.handle}"
                   class="product-card_link w-inline-block">
                    <div data-inner-rad="top-left" class="product-card_tag">
                        <p class="text-weight-bold"></p>
                    </div>
                    <div data-inner-rad="bottom-left" class="product-card_detail-wrapper">
                        <h6 class="display-inline">${product.title}</h6>
                        <div class="spacer-0d25"></div>
                        <p data-commerce-type="variation-price" class="text-size-large display-inline">${currency} ${price}</p>
                    </div>
                    <div class="product-card_image-wrapper">
                        <img src="${secondaryImage}" 
                             alt="${product.title}" 
                             loading="lazy" 
                             class="product-card_image on-model">
                        <img src="${primaryImage}" 
                             alt="${product.title}" 
                             loading="lazy" 
                             class="product-card_image product-focus">
                    </div>
                </a>
            </div>
        `;
        
        // Check if product is in 'top-sellers' collection and update/hide the tag
        const isTopSeller = product.collections.edges.some(edge => edge.node.handle === 'top-sellers');
        const tagElement = productCard.querySelector('.product-card_tag');
        if (isTopSeller) {
            tagElement.querySelector('p').textContent = 'best seller';
        } else {
            tagElement.style.display = 'none';
        }
        
        filterFeed.appendChild(productCard);
    });

    // Initialize sorting after products are displayed
    initializeSorting();
    
    // Initialize filters
    await initializeFilters();
    console.log('Products and filters initialized');
}

// Initialize the ShopifyAPI object
window.ShopifyAPI = {
    fetchProducts,
    fetchProductByHandle,
    fetchProductsWithFilters,
    displayMarqueeProducts,
    displayProductGrid,
    fetchProductsFromCollection,
    displayCollectionMarquee,
    fetchProductTypeCollections,
    displayProductTypeCollections,
    displayAllProducts,
    initializeSorting,
    initializeFilters,
    displayCollectionGrid
};

// Initialize Shopify Buy SDK client
function initShopifyBuyClient() {
    return new Promise((resolve, reject) => {
        const scriptURL = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
        
        // If SDK is already loaded, use it
        if (window.ShopifyBuy) {
            if (window.ShopifyBuy.UI) {
                const client = ShopifyBuy.buildClient({
                    domain: SHOPIFY_BUY_CONFIG.domain,
                    storefrontAccessToken: SHOPIFY_BUY_CONFIG.storefrontAccessToken,
                });
                resolve({ client, ui: window.ShopifyBuy.UI });
            } else {
                loadScript();
            }
        } else {
            loadScript();
        }
        
        function loadScript() {
            const script = document.createElement("script");
            script.async = true;
            script.src = scriptURL;
            
            script.onload = () => {
                const client = ShopifyBuy.buildClient({
                    domain: SHOPIFY_BUY_CONFIG.domain,
                    storefrontAccessToken: SHOPIFY_BUY_CONFIG.storefrontAccessToken,
                });
                
                ShopifyBuy.UI.onReady(client).then(ui => {
                    resolve({ client, ui });
                }).catch(reject);
            };
            
            script.onerror = reject;
            
            (document.getElementsByTagName("head")[0] || 
             document.getElementsByTagName("body")[0]).appendChild(script);
        }
    });
}

// Initialize product buy button for product pages
async function initProductBuyButton(productId) {
    try {
        const { client, ui } = await initShopifyBuyClient();
        const productComponentNode = document.getElementById("product-component");
        
        if (!productComponentNode) {
            console.warn("Product component node not found");
            return;
        }
        
        // Use productId parameter or get from the data attribute
        const productIdToUse = productId || productComponentNode.getAttribute("data-shopify-id");
        
        if (!productIdToUse) {
            console.warn("No product ID found");
            return;
        }
        
        ui.createComponent("product", {
            id: productIdToUse,
            node: productComponentNode,
            moneyFormat: SHOPIFY_BUY_CONFIG.moneyFormat,
            options: {
                product: {
                    styles: {
                        product: {
                            "@media (min-width: 601px)": {
                                "max-width": "100%",
                                "margin-left": "0",
                                "margin-bottom": "0",
                            },
                        },
                        buttonWrapper: {
                            "margin-top": "0",
                            "padding-top": "0",
                        },
                        button: {
                            ...SHOPIFY_BUY_CONFIG.buttonStyles,
                            width: "100%",
                            height: "100%",
                            padding: "15px 20px",
                            "font-size": "18px",
                            "font-weight": "bold",
                            opacity: "0",
                        },
                    },
                    contents: {
                        img: false,
                        title: false,
                        price: false,
                    },
                    text: {
                        button: "Add to cart",
                    },
                },
                modalProduct: {
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
                        button: SHOPIFY_BUY_CONFIG.buttonStyles,
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
                modal: {
                    styles: {
                        modal: {
                            "background-color": "#f7f4e7",
                        },
                    },
                },
                option: {},
                cart: {
                    styles: {
                        button: SHOPIFY_BUY_CONFIG.buttonStyles,
                    },
                    text: {
                        total: "Subtotal",
                        button: "Checkout",
                    },
                },
                toggle: {
                    styles: {
                        toggle: {
                            ...SHOPIFY_BUY_CONFIG.buttonStyles,
                        },
                    },
                },
            },
        });
        
        console.log(`Product buy button initialized for product ID: ${productIdToUse}`);
    } catch (error) {
        console.error("Error initializing product buy button:", error);
    }
}

// Initialize cart for non-product pages
async function initCart(cartPosition = 'bottom right') {
    try {
        const { client, ui } = await initShopifyBuyClient();
        
        // Create cart component
        ui.createComponent("cart", {
            moneyFormat: SHOPIFY_BUY_CONFIG.moneyFormat,
            options: {
                cart: {
                    styles: {
                        button: SHOPIFY_BUY_CONFIG.buttonStyles,
                    },
                    text: {
                        total: "Subtotal",
                        button: "Checkout",
                    },
                    popup: false,
                },
                toggle: {
                    styles: {
                        toggle: {
                            ...SHOPIFY_BUY_CONFIG.buttonStyles,
                            "background-color": "#e4007f",
                        },
                    },
                    count: {
                        fill: "#fff",
                    },
                },
            },
        });
        
        console.log("Cart initialized");
    } catch (error) {
        console.error("Error initializing cart:", error);
    }
}

// Initialize Shopify Buy functionality based on page type
async function initShopifyBuy() {
    // Check if we're on a product page by looking for the product-component element
    const productComponent = document.getElementById("product-component");
    
    if (productComponent && productComponent.getAttribute("data-shopify-id")) {
        // We're on a product page, initialize the product buy button
        await initProductBuyButton();
    } else {
        // We're on a non-product page, just initialize the cart
        await initCart();
    }
}

// Export the additional methods
Object.assign(window.ShopifyAPI, {
    initShopifyBuyClient,
    initProductBuyButton,
    initCart,
    initShopifyBuy
}); 