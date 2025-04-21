document.addEventListener('DOMContentLoaded', function() {
  console.log('Include.js loaded and running');
  
  // Determine the path prefix based on the current page's directory depth
  const getRelativePath = () => {
    // Get the current path
    const path = window.location.pathname;
    console.log('Current path:', path);
    
    // Simple check: if the path contains /products/ or /policies/ or any subdirectory
    // we need to go up one level
    if (path.includes('/products/') || path.includes('/policies/') || 
        path.match(/\/[^\/]+\/[^\/]+\.html$/)) {
      console.log('Detected page in subdirectory, using relative path: ../');
      return '../';
    }
    
    // If we're at the root level, no prefix needed
    console.log('Detected page at root level, using empty relative path');
    return '';
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