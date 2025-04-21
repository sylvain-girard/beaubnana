// Product Router
class ProductRouter {
    constructor() {
        console.log("Product Router initialized");
        this.shopifyDomain = 'beau-banana.myshopify.com';
        this.shopifyToken = '594822dab94e9f663f9df864058e7573';
        
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
        
        // Update product information in the DOM
        const titleElement = document.querySelector('.product-title');
        const priceElement = document.querySelector('.product-price');
        const descriptionElement = document.querySelector('.product-description');
        const mainImageElement = document.querySelector('.product-main-image');
        const thumbnailsContainer = document.querySelector('.product-thumbnails');
        
        if (titleElement) {
            console.log("Updating title element", titleElement);
            titleElement.textContent = product.title;
        } else {
            console.warn("Title element not found");
        }
        
        if (priceElement) {
            console.log("Updating price element", priceElement);
            const variant = product.variants[0];
            const price = variant.price;
            priceElement.textContent = `$${price}`;
        } else {
            console.warn("Price element not found");
        }
        
        if (descriptionElement) {
            console.log("Updating description element", descriptionElement);
            descriptionElement.innerHTML = product.descriptionHtml || product.description;
        } else {
            console.warn("Description element not found");
        }
        
        // Update main image
        if (mainImageElement && product.images.length > 0) {
            console.log("Updating main image element", mainImageElement);
            mainImageElement.src = product.images[0].src;
            mainImageElement.alt = product.title;
        } else {
            console.warn("Main image element not found or product has no images");
        }
        
        // Update thumbnails
        if (thumbnailsContainer && product.images.length > 0) {
            console.log("Updating thumbnails container", thumbnailsContainer);
            thumbnailsContainer.innerHTML = '';
            
            product.images.forEach((image, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.classList.add('product-thumbnail');
                if (index === 0) thumbnail.classList.add('active');
                thumbnail.src = image.src;
                thumbnail.alt = `${product.title} - Image ${index + 1}`;
                thumbnail.dataset.index = index;
                
                thumbnail.addEventListener('click', () => {
                    // Update main image when thumbnail is clicked
                    mainImageElement.src = image.src;
                    // Update active class
                    document.querySelectorAll('.product-thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                });
                
                thumbnailsContainer.appendChild(thumbnail);
            });
        } else {
            console.warn("Thumbnails container not found or product has no images");
        }

        // Initialize Shopify Buy Button
        this.initializeBuyButton(product);
    }

    initializeBuyButton(product) {
        console.log("Initializing buy button for product:", product.id);
        
        // Target div element
        const buyButtonContainer = document.getElementById('product-buy-button');
        
        if (!buyButtonContainer) {
            console.error("Buy button container not found");
            return;
        }
        
        // Clear any existing content
        buyButtonContainer.innerHTML = '';
        
        // Create UI instance
        const ui = ShopifyBuy.UI.init(this.client);
        
        // Render the buy button
        ui.createComponent('product', {
            id: product.id,
            node: buyButtonContainer,
            moneyFormat: '%24%7B%7Bamount%7D%7D',
            options: {
                product: {
                    buttonDestination: 'checkout',
                    contents: {
                        img: false,
                        title: false,
                        price: false,
                        options: true,
                        quantity: true,
                        button: true
                    },
                    text: {
                        button: 'Add to Cart'
                    }
                },
                cart: {
                    startOpen: false
                }
            }
        });
    }
}

// Initialize the router
window.productRouter = new ProductRouter(); 