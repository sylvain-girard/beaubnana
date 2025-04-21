document.addEventListener('DOMContentLoaded', function() {
  console.log('Include.js loaded and running');
  
  // Determine the path prefix based on the current page's directory depth
  const getRelativePath = () => {
    // Get the current path
    const path = window.location.pathname;
    console.log('Current path:', path);
    
    // Check if we're on GitHub Pages with a repo name in the path (like /beaubnana/)
    const pathParts = path.split('/').filter(Boolean);
    const baseRepoName = 'beaubnana'; // The repository name
    
    // First check if we're hosted under the repo name
    if (pathParts.length > 0 && pathParts[0] === baseRepoName) {
      // We're on GitHub Pages with the repo name in the URL
      
      if (pathParts.length > 1 && (pathParts[1] === 'products' || pathParts[1] === 'policies')) {
        // In a subdirectory: /beaubnana/products/ or /beaubnana/policies/
        console.log('Detected page in subdirectory on GitHub Pages, using base-adjusted path');
        return '/beaubnana/';
      } else {
        // At root level: /beaubnana/
        console.log('Detected page at repo root level on GitHub Pages');
        return '/beaubnana/';
      }
    } else {
      // Regular local or custom domain without repo in path
      if (path.includes('/products/') || path.includes('/policies/') || 
          path.match(/\/[^\/]+\/[^\/]+\.html$/)) {
        console.log('Detected page in subdirectory, using relative path: ../');
        return '../';
      }
      
      // If we're at the root level, no prefix needed
      console.log('Detected page at root level, using empty relative path');
      return '';
    }
  };
  
  const relativePath = getRelativePath();
  console.log('Path prefix:', relativePath);
  
  // Function to fetch and include HTML content
  const includeHTML = (elementId, filePath) => {
    const element = document.getElementById(elementId);
    console.log('Looking for element:', elementId, element ? 'Found' : 'Not found');
    
    if (element) {
      // Prepend the relative path to the include path
      const url = `${relativePath}${filePath}`;
      console.log('Fetching:', url);
      
      fetch(url)
        .then(response => {
          console.log('Response status:', response.status, 'for', url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} loading ${filePath}`);
          }
          return response.text();
        })
        .then(data => {
          console.log('Successfully loaded:', filePath);
          element.innerHTML = data;
          
          // If this is the footer, set the current year
          if (elementId === 'footer-placeholder') {
            const yearSpan = document.getElementById('current-year');
            if (yearSpan) {
              yearSpan.textContent = new Date().getFullYear();
            }
          }
        })
        .catch(error => {
          console.error('Error fetching include file:', error);
          element.innerHTML = `<p style="color: red;">Error loading ${elementId}.</p>`; // Display error in placeholder
        });
    }
  };

  // Check if elements exist
  console.log('Navbar placeholder exists:', !!document.getElementById('navbar-placeholder'));
  console.log('Footer placeholder exists:', !!document.getElementById('footer-placeholder'));

  // Include navbar and footer
  includeHTML('navbar-placeholder', 'includes/navbar.html');
  includeHTML('footer-placeholder', 'includes/footer.html'); 
}); 