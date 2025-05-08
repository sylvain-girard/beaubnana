const fs = require('fs');
const path = require('path');
const glob = require('glob');

const workspaceRoot = path.resolve(__dirname, '..');

const navbarPath = path.join(workspaceRoot, 'includes', 'navbar.html');
const footerPath = path.join(workspaceRoot, 'includes', 'footer.html');

const placeholderNavbar = '<div id="navbar-placeholder"></div>';
const placeholderFooter = '<footer id="footer-placeholder"></footer>';
const yearPlaceholder = '{{CURRENT_YEAR}}';

const filesToProcessPattern = '*.html';
const productsTemplate = 'products/template.html'; // Specific template path
const policiesTemplate = 'policies/template.html'; // Specific template path
// Note: We won't process generated product/policy files directly with this script anymore

const excludePatterns = [
  'node_modules/**',
  'ignore/**',
  'includes/**',
  'styleguide/**',
  '.github/**',
  'scripts/**',
  'products/*.html', // Exclude generated product files (except template)
  'policies/*.html'  // Exclude generated policy files (except template)
];

console.log('Starting HTML inclusion process (Placeholders Only)...');

try {
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  let footerContent = fs.readFileSync(footerPath, 'utf8');
  console.log('Successfully read navbar.html and footer.html');

  const currentYear = new Date().getFullYear();
  footerContent = footerContent.replace(new RegExp(yearPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), currentYear);
  console.log(`Replaced ${yearPlaceholder} with ${currentYear} in footer source content.`);

  // Define the specific files to process (templates + root files)
  let filesToProcess = [];
  
  // Add templates if they exist
  if (fs.existsSync(path.join(workspaceRoot, productsTemplate))) {
    filesToProcess.push(productsTemplate);
  }
  if (fs.existsSync(path.join(workspaceRoot, policiesTemplate))) {
    filesToProcess.push(policiesTemplate);
  }

  // Add root HTML files
  const globOptions = {
    cwd: workspaceRoot,
    nodir: true,
    ignore: excludePatterns, // Use ignore patterns mainly for root files now
  };
  const rootHtmlFiles = glob.sync(filesToProcessPattern, globOptions);
  filesToProcess = [...new Set([...filesToProcess, ...rootHtmlFiles])]; // Combine and remove duplicates

  if (filesToProcess.length === 0) {
    console.log('No target HTML files (Templates or Root HTML) found to process.');
  } else {
    console.log(`Found ${filesToProcess.length} target HTML file(s) to process:`);
    filesToProcess.forEach(file => console.log(`  - ${file}`));
  }

  filesToProcess.forEach(relativeFilePath => {
    const absoluteFilePath = path.join(workspaceRoot, relativeFilePath);
    try {
      let fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
      let originalContent = fileContent;
      let modified = false;

      // Replace Navbar Placeholder
      if (fileContent.includes(placeholderNavbar)) {
        // Use replaceAll to handle multiple potential placeholders, though there should only be one
        fileContent = fileContent.replaceAll(placeholderNavbar, navbarContent);
        console.log(`Injected navbar using placeholder in ${relativeFilePath}`);
        modified = true;
      } else {
        console.log(`Navbar placeholder not found in ${relativeFilePath}.`);
      }

      // Replace Footer Placeholder
      if (fileContent.includes(placeholderFooter)) {
        fileContent = fileContent.replaceAll(placeholderFooter, footerContent);
        console.log(`Injected footer using placeholder in ${relativeFilePath}`);
        modified = true;
      } else {
        console.log(`Footer placeholder not found in ${relativeFilePath}.`);
      }

      if (modified && fileContent !== originalContent) {
        fs.writeFileSync(absoluteFilePath, fileContent, 'utf8');
        console.log(`Successfully updated ${relativeFilePath}`);
      }
    } catch (fileError) {
      console.error(`Error processing file ${relativeFilePath}:`, fileError);
    }
  });

  console.log('HTML inclusion process completed.');

} catch (error) {
  console.error('Error during HTML inclusion process:', error);
  process.exit(1);
} 