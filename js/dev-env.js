/**
 * Beaubnana Development Environment Helper
 * This script provides environment switching between local and production modes
 */
(function() {
    // Check if environment is already set in localStorage
    const storedEnv = localStorage.getItem('beaubananaEnv') || 'production';    
    // Create global window function to toggle environment
    window.setScriptsENV = function(env) {
        if (env !== 'local' && env !== 'production') {
            return false;
        }
        
        localStorage.setItem('beaubananaEnv', env);
        
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