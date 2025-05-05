/**
 * Beaubnana Development Environment Helper
 * This script provides environment switching between local and production modes
 */
(function() {
    // Check if environment is already set in localStorage
    const storedEnv = localStorage.getItem('beaubananaEnv') || 'production';
    console.log(`🔄 Beaubnana running in ${storedEnv.toUpperCase()} mode`);
    
    // Create global window function to toggle environment
    window.setScriptsENV = function(env) {
        if (env !== 'local' && env !== 'production') {
            console.error('❌ Invalid environment! Use "local" or "production"');
            return false;
        }
        
        localStorage.setItem('beaubananaEnv', env);
        console.log(`✅ Environment switched to: ${env.toUpperCase()}`);
        console.log('🔄 Reloading page to apply changes...');
        
        setTimeout(() => window.location.reload(), 500);
        return true;
    };
    
    // Helper function to get current base path based on environment
    window.getBasePath = function() {
        const env = localStorage.getItem('beaubananaEnv') || 'production';
        if (env === 'local') {
            return ''; // Empty for local development
        } else {
            return '/beaubnana'; // GitHub Pages repository name
        }
    };
    
    // Print helpful instructions
    console.log('ℹ️ To toggle development mode:');
    console.log('   → Production mode: window.setScriptsENV("production")');
    console.log('   → Local dev mode: window.setScriptsENV("local")');
    
    // Automatically patch include.js behavior based on environment
    document.addEventListener('DOMContentLoaded', function() {
        const env = localStorage.getItem('beaubananaEnv') || 'production';
        
        if (env === 'local') {
            console.log('🔧 Running in LOCAL development mode');
            // Anything specific to local mode can be added here
        } else {
            console.log('🚀 Running in PRODUCTION mode');
            // Anything specific to production mode can be added here
        }
    });
})(); 