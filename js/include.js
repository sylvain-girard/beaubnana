document.addEventListener('DOMContentLoaded', function() {
  // Function to fetch and include HTML content
  const includeHTML = (elementId, filePath) => {
    const element = document.getElementById(elementId);
    if (element) {
      fetch(`/${filePath}`)
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