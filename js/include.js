document.addEventListener('DOMContentLoaded', function() {
  // Get the base path for GitHub Pages
  const getBasePath = () => {
    // If running locally, base path is empty
    // If on GitHub Pages, get the repository name from the URL
    const pathSegments = window.location.pathname.split('/');
    // For GitHub Pages, the first segment will be the repo name (e.g., /beaubnana/)
    // For custom domains, this will be empty, which is what we want
    if (pathSegments.length > 1 && pathSegments[1] !== '') {
      return `/${pathSegments[1]}`;
    }
    return '';
  };

  const basePath = getBasePath();
  
  // Function to fetch and include HTML content
  const includeHTML = (elementId, filePath) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Use the detected base path with the include path
      fetch(`${basePath}/${filePath}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} loading ${filePath}`);
          }
          return response.text();
        })
        .then(data => {
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

  // Include navbar
  includeHTML('navbar-placeholder', '_includes/navbar.html');

  // Include footer
  includeHTML('footer-placeholder', '_includes/footer.html'); 
}); 