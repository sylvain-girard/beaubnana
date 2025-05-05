/**
 * SHOPIFY COLLECTIONS BACKUP FILE
 * 
 * This file contains the original collection-based implementation that requires
 * a Shopify Basic plan or higher. This approach uses custom collections to filter
 * and display products based on categories.
 * 
 * If upgrading from a Starter plan to Basic or higher in the future, this code can be
 * referenced to reimplement collection-based functionality.
 */

// COLLECTION-BASED IMPLEMENTATIONS

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
        
        // Filter collections where product_type_collection is true
        const filteredCollections = data.data.collections.edges
            .map(edge => edge.node)
            .filter(collection => {
                return collection.metafield?.value === 'true';
            });
            
        return filteredCollections;
    } catch (error) {
        console.error('Error fetching product type collections:', error);
        return [];
    }
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
        });
        
        // Return all three categories
        return { types, collections, filters };
    } catch (error) {
        console.error('Error fetching collections:', error);
        // Return empty arrays in case of error
        return { types: [], collections: [], filters: [] };
    }
}

/**
 * MIGRATION GUIDE: FROM COLLECTIONS TO TAGS
 * 
 * When migrating from collections to tags, the following changes are needed:
 * 
 * 1. Collection Concepts to Tags:
 *    - Replace "top-sellers" collection with "top-seller" tag
 *    - Replace product type collections with product type tags (e.g., "type:earrings")
 *    - Replace filter collections with filter tags (e.g., "filter:new-arrivals")
 * 
 * 2. API Queries:
 *    - Instead of querying collections, use the query parameter with tag filters
 *    - Example: products(first: 10, query: "tag:top-seller") instead of collectionByHandle
 * 
 * 3. Product Categorization:
 *    - Store category information in product tags instead of adding products to collections
 *    - Use a consistent tag naming convention (e.g., "type:earrings", "collection:summer")
 * 
 * 4. UI Elements:
 *    - Modify filter UI to use tags instead of collections
 *    - Update category displays to use tag-based filtering
 */

// Example of how to use the tag-based filter in Shopify Storefront API
async function fetchProductsByTag(tag, limit = 10) {
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
                            tags
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
        return data.data.products.edges.map(edge => edge.node);
    } catch (error) {
        console.error(`Error fetching products with tag ${tag}:`, error);
        return [];
    }
} 