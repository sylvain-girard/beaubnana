// Product Router
class ProductRouter {
    constructor() {
        console.log("Product Router initialized");
        // Use values from the config file instead of hardcoding them
        this.shopifyDomain = SHOPIFY_CONFIG.domain;
        this.shopifyToken = SHOPIFY_CONFIG.storefrontAccessToken;
        
        // Check if we're on GitHub Pages and adjust paths accordingly
        const isGitHubPages = window.location.hostname === "sylvgira.com" || 
                             window.location.pathname.startsWith('/beaubnana/');
        
        this.basePath = isGitHubPages ? '/beaubnana' : '';
        console.log("Base path detected:", this.basePath);
        
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
        console.log("Initializing Product Router");
        this.setupNavigation();
        
        // If we're on a product detail page, load the product
        if (window.location.pathname.startsWith(this.baseProductPath)) {
            console.log("On product detail page, loading product");
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
        console.log("Setting up navigation");
        
        // Use event delegation for handling clicks on product links (works with dynamically added content)
        document.body.addEventListener('click', (event) => {
            console.log("Click detected", event.target);
            const productLink = event.target.closest('[data-product-handle]');
            
            if (productLink) {
                console.log("Product link found", productLink);
                const handle = productLink.getAttribute('data-product-handle');
                console.log("Product handle:", handle);
                
                if (handle) {
                    event.preventDefault();
                    this.navigateToProduct(handle);
                    return false;
                }
            }
        });

        // Handle back/forward navigation
        window.addEventListener('popstate', (event) => {
            console.log("Popstate event triggered", event);
            
            // Check if we're on a product page
            if (window.location.pathname.startsWith(this.baseProductPath)) {
                const handle = window.location.pathname.split(this.baseProductPath)[1];
                if (handle) {
                    console.log("Loading product from popstate:", handle);
                    this.loadProduct(handle);
                }
            } 
            // If we're back to all products page
            else if (window.location.pathname.includes(this.allProductsPage)) {
                console.log("Back to all products page");
                // Reload the page to display all products
                window.location.reload();
            }
        });
    }

    navigateToProduct(handle) {
        console.log("Navigating to product:", handle);
        
        // Remove any .html extension from the handle if present
        if (handle.endsWith('.html')) {
            handle = handle.substring(0, handle.length - 5);
        }
        
        // Construct the URL for the product detail page
        const newUrl = `${this.baseProductPath}${handle}`;
        console.log("Setting new URL:", newUrl);
        
        // Check if we're currently on the all-products page
        if (window.location.pathname.includes(this.allProductsPage) || 
            window.location.pathname === "/" || 
            window.location.pathname === "/index.html") {
            console.log("We're on the all products page or home page, redirecting to product page");
            // Navigate to the product detail page
            window.location.href = newUrl;
        } 
        // We're already on a product page, just update the URL and load the product
        else if (window.location.pathname.startsWith(this.baseProductPath)) {
            console.log("We're on a product page, loading in-place");
            // Update the URL without reloading
            window.history.pushState({ handle: handle }, "", newUrl);
            // Load the product
            this.loadProduct(handle);
        }
        // We're on some other page
        else {
            console.log("We're on another page, redirecting to product page");
            window.location.href = newUrl;
        }
    }

    loadProduct(handle) {
        console.log("Loading product with handle:", handle);
        
        // Remove any .html extension from the handle if present
        if (handle.endsWith('.html')) {
            handle = handle.substring(0, handle.length - 5);
        }
        
        // Query for the specific product using the handle
        this.client.product.fetchByHandle(handle)
            .then(product => {
                console.log("Product loaded:", product);
                if (product) {
                    this.updateProductPage(product);
                } else {
                    console.error("Product not found:", handle);
                    alert("Product not found");
                }
            })
            .catch(error => {
                console.error("Error loading product:", error);
                alert("Error loading product");
            });
    }

    updateProductPage(product) {
        console.log("Updating product page with:", product);
        
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
            console.log("Updating title element", titleElement);
            titleElement.textContent = product.title;
        } else {
            console.warn("Title element (h1.heading-style-h3) not found");
        }
        
        if (priceElement) {
            console.log("Updating price element", priceElement);
            const variant = product.variants[0]; // Assuming the first variant determines the displayed price
            const price = variant.price.amount;
            const currencyCode = variant.price.currencyCode; // Get currency code
            // Format price based on currency (simple example)
            priceElement.textContent = `${currencyCode} ${price}`; 
        } else {
            console.warn("Price element (.heading-style-h5) not found");
        }
        
        // Update description (assuming the first <p> after price is description)
        if (descriptionElement) {
            console.log("Updating description element", descriptionElement);
            // Use descriptionHtml if available for rich text, otherwise plain description
            descriptionElement.innerHTML = product.descriptionHtml || product.description;
        } else {
            console.warn("Description element (p) not found");
        }
        
        // Update image gallery
        if (galleryList && product.images.length > 0) {
            console.log("Updating gallery list", galleryList);
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
        } else {
             console.warn("Gallery list (.product-header_list) not found or product has no images");
        }

        // --- Initialize Shopify Buy Button ---
        // Ensure the target element exists
        if (productComponent) {
            console.log("Found product component for Buy Button:", productComponent);
            
            // Get the GraphQL GID
            const graphQLId = product.id; // e.g., gid://shopify/Product/1234567890
            console.log(`Using GraphQL ID: ${graphQLId}`);

            // Extract the numeric ID from the GraphQL GID
            const numericProductId = graphQLId.split('/').pop();
            console.log(`Extracted Numeric Product ID: ${numericProductId}`);
            
            // Set the necessary attribute with the GraphQL ID (some scripts might still expect this?)
            // Although the component likely needs the numeric ID, setting this might be harmless.
            productComponent.setAttribute('data-shopify-id', graphQLId); 

            // Now call the global init function from shopify.js, passing the NUMERIC ID
            if (window.ShopifyAPI && typeof window.ShopifyAPI.initProductBuyButton === 'function') {
                 console.log(`Calling ShopifyAPI.initProductBuyButton with NUMERIC ID: ${numericProductId}`);
                // Pass the extracted NUMERIC ID
                window.ShopifyAPI.initProductBuyButton(numericProductId); 
            } else {
                console.error("ShopifyAPI.initProductBuyButton is not available!");
            }
        } else {
            console.error("Product component element (#product-component) not found! Cannot initialize Buy Button.");
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
         console.log("Shopify Buy SDK ready event caught in product-router.");
         window.productRouter = new ProductRouter();
         window.productRouter.initialize();
    });
    
    // Add a fallback check in case the event doesn't fire or SDK loads very quickly
    let checkInterval = setInterval(() => {
        if (window.ShopifyBuy) {
            clearInterval(checkInterval);
            if (!window.productRouter) { // Avoid double initialization
                 console.log("Shopify Buy SDK detected via interval in product-router.");
                 window.productRouter = new ProductRouter();
                 window.productRouter.initialize();
            }
        }
    }, 100);
    
    // Timeout fallback
    setTimeout(() => {
         clearInterval(checkInterval);
         if (!window.productRouter) {
             console.error("Shopify Buy SDK did not load within timeout in product-router.");
         }
    }, 5000); // 5-second timeout
} 