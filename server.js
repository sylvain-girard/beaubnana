const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8000;

// Serve static files
app.use(express.static('.', {
  extensions: ['html']
}));

// Handle product routes
app.get('/products/:handle', (req, res) => {
  const productHandle = req.params.handle;
  
  // Check if this is a request for the product template
  if (productHandle === 'index.html' || productHandle === 'template.html') {
    res.sendFile(path.join(__dirname, 'products', productHandle));
    return;
  }
  
  // Send the products/index.html file for all product handles
  res.sendFile(path.join(__dirname, 'products', 'index.html'));
});

// For any other route that doesn't exist as a file, check if .html version exists
app.use((req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  const htmlPath = `${filePath}.html`;
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else if (req.path.endsWith('/') && fs.existsSync(path.join(filePath, 'index.html'))) {
    res.sendFile(path.join(filePath, 'index.html'));
  } else {
    next();
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`To view products, go to: http://localhost:${port}/all-products.html`);
}); 