// Product Router
class ProductRouter {
    constructor() {
        // Use values from the config file instead of hardcoding them
        this.shopifyDomain = SHOPIFY_CONFIG.domain;
        this.shopifyToken = SHOPIFY_CONFIG.storefrontAccessToken;
        
        // Check if we're on GitHub Pages and adjust paths accordingly
        const isGitHubPages = window.location.hostname === "sylvgira.com" || 
                             window.location.pathname.startsWith('/beaubnana/');
        
        this.basePath = isGitHubPages ? '/beaubnana' : '';
        
        this.baseProductPath = `${this.basePath}/products/`;
        this.allProductsPath = `${this.basePath}/all-products.html`;
        this.client = null;
        this.productDetailPage = `${this.basePath}/products/`;
        this.allProductsPage = `${this.basePath}/all-products.html`;
        this.isProductDetailPage = window.location.pathname.includes('/products/');
        
        // Initialize Shopify client
        this.client = ShopifyBuy.buildClient({
            domain: this.shopifyDomain,
            storefrontAccessToken: this.shopifyToken
        });
    }

    initialize() {
        this.setupNavigation();
        
        // If we're on a product detail page, load the product
        if (window.location.pathname.startsWith(this.baseProductPath)) {
            let handle = window.location.pathname.split(this.baseProductPath)[1];
            
            // Remove trailing slash if present
            if (handle.endsWith('/')) {
                handle = handle.slice(0, -1);
            }
            
            // Remove .html extension if present
            if (handle.endsWith('.html')) {
                handle = handle.substring(0, handle.length - 5);
            }
            
            if (handle) {
                console.log("Found handle in URL:", handle);
                this.loadProduct(handle);
            }
        }
    }

    setupNavigation() {
        
        // Use event delegation for handling clicks on product links (works with dynamically added content)
        document.body.addEventListener('click', (event) => {
            const productLink = event.target.closest('[data-product-handle]');
            
            if (productLink) {
                const handle = productLink.getAttribute('data-product-handle');
                
                if (handle) {
                    event.preventDefault();
                    this.navigateToProduct(handle);
                    return false;
                }
            }
        });

        // Handle back/forward navigation
        window.addEventListener('popstate', (event) => {
            
            // Check if we're on a product page
            if (window.location.pathname.startsWith(this.baseProductPath)) {
                const handle = window.location.pathname.split(this.baseProductPath)[1];
                if (handle) {
                    this.loadProduct(handle);
                }
            } 
            // If we're back to all products page
            else if (window.location.pathname.includes(this.allProductsPage)) {
                // Reload the page to display all products
                window.location.reload();
            }
        });
    }

    navigateToProduct(handle) {
        
        // Remove any .html extension from the handle if present
        if (handle.endsWith('.html')) {
            handle = handle.substring(0, handle.length - 5);
        }
        
        // Construct the URL for the product detail page
        const newUrl = `${this.baseProductPath}${handle}`;
        
        // Check if we're currently on the all-products page
        if (window.location.pathname.includes(this.allProductsPage) || 
            window.location.pathname === "/" || 
            window.location.pathname === "/index.html") {
            // Navigate to the product detail page
            window.location.href = newUrl;
        } 
        // We're already on a product page, just update the URL and load the product
        else if (window.location.pathname.startsWith(this.baseProductPath)) {
            // Update the URL without reloading
            window.history.pushState({ handle: handle }, "", newUrl);
            // Load the product
            this.loadProduct(handle);
        }
        // We're on some other page
        else {
            window.location.href = newUrl;
        }
    }

    loadProduct(handle) {
        
        // Remove any .html extension from the handle if present
        if (handle.endsWith('.html')) {
            handle = handle.substring(0, handle.length - 5);
        }
        
        // Query for the specific product using the handle
        this.client.product.fetchByHandle(handle)
            .then(product => {
                if (product) {
                    this.updateProductPage(product);
                } else {
                    alert("Product not found");
                }
            })
            .catch(error => {
                alert("Error loading product");
            });
    }

    updateProductPage(product) {
        
        // Set page title
        document.title = `${product.title} | Beau Banana`;
        
        // Update product information in the DOM - Select elements using the classes from template.html
        const titleElement = document.querySelector('.product-header_sticky h1.heading-style-h3');
        const priceElement = document.querySelector('.product-header_sticky .heading-style-h5');
        const descriptionElement = document.querySelector('.product-header_sticky p'); // Adjust selector if needed
        const galleryList = document.querySelector('.product-header_list'); // Target the gallery list
        const breadcrumbLink = document.querySelector('.breadcrumb_component .breadcrumb-link'); // To update link/text later if needed
        const productComponent = document.getElementById('product-component'); // Get the buy button wrapper

        if (titleElement) {
            titleElement.textContent = product.title;
        } else {
        }
        
        if (priceElement) {
            const variant = product.variants[0]; // Assuming the first variant determines the displayed price
            const price = variant.price.amount;
            const currencyCode = variant.price.currencyCode; // Get currency code
            // Format price based on currency (simple example)
            priceElement.textContent = `${currencyCode} ${price}`; 
        } else {
        }
        
        // Update description (assuming the first <p> after price is description)
        if (descriptionElement) {
            // Use descriptionHtml if available for rich text, otherwise plain description
            descriptionElement.innerHTML = product.descriptionHtml || product.description;
        } else {
        }
        
        // Update image gallery
        if (galleryList && product.images.length > 0) {
            galleryList.innerHTML = ''; // Clear existing images
            
            product.images.forEach((image, index) => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'product-header_item w-dyn-item';
                galleryItem.setAttribute('role', 'listitem');
                
                const img = document.createElement('img');
                img.src = image.src;
                img.loading = 'lazy';
                // Use image altText if available, otherwise default to product title + index
                img.alt = image.altText || `${product.title} - Image ${index + 1}`; 
                img.className = 'product-header_image';
                
                galleryItem.appendChild(img);
                galleryList.appendChild(galleryItem);
            });
        }

        // --- Initialize Shopify Buy Button ---
        // Ensure the target element exists
        if (productComponent) {
            
            // Get the GraphQL GID
            const graphQLId = product.id; // e.g., gid://shopify/Product/1234567890

            // Extract the numeric ID from the GraphQL GID
            const numericProductId = graphQLId.split('/').pop();
            
            // Set the necessary attribute with the GraphQL ID (some scripts might still expect this?)
            // Although the component likely needs the numeric ID, setting this might be harmless.
            productComponent.setAttribute('data-shopify-id', graphQLId); 

            // Now call the global init function from shopify.js, passing the NUMERIC ID
            if (window.ShopifyAPI && typeof window.ShopifyAPI.initProductBuyButton === 'function') {
                // Pass the extracted NUMERIC ID
                window.ShopifyAPI.initProductBuyButton(numericProductId); 
            }
        }

        // Update og:image meta tag dynamically
        const ogImageMeta = document.querySelector('meta[property="og:image"]#og-image-meta');
        if (ogImageMeta) {
            let ogImageUrl = '';
            if (product.images.length >= 2) {
                ogImageUrl = product.images[1].src;
            } else if (product.images.length === 1) {
                ogImageUrl = product.images[0].src;
            }
            ogImageMeta.setAttribute('content', ogImageUrl);
        }
    }
}

// Initialize the router when the script loads
// Ensure ShopifyBuy is loaded before initializing
if (window.ShopifyBuy) {
    window.productRouter = new ProductRouter();
    window.productRouter.initialize();
} else {
    // Wait for the Shopify Buy SDK to load if it hasn't already
    // This might happen if scripts load out of order
    document.addEventListener('shopify-buy-sdk-ready', () => {
         window.productRouter = new ProductRouter();
         window.productRouter.initialize();
    });
    
    // Add a fallback check in case the event doesn't fire or SDK loads very quickly
    let checkInterval = setInterval(() => {
        if (window.ShopifyBuy) {
            clearInterval(checkInterval);
            if (!window.productRouter) { // Avoid double initialization
                 window.productRouter = new ProductRouter();
                 window.productRouter.initialize();
            }
        }
    }, 100);
    
    // Timeout fallback
    setTimeout(() => {
         clearInterval(checkInterval);
         if (!window.productRouter) {
         }
    }, 5000); // 5-second timeout
} 