require('dotenv').config();
const ExaSearch = require('./scrapers/exaSearch');

async function testFallbackProducts() {
    console.log('🔍 Testing Fallback Products with Working URLs...\n');
    
    const exaSearch = new ExaSearch();
    
    // Test different product categories
    const testQueries = [
        'wireless earphones',
        'gaming laptop',
        'smartphone',
        'smart watch'
    ];
    
    for (const query of testQueries) {
        console.log(`📱 Testing: "${query}"`);
        
        // Get fallback products directly
        const products = exaSearch.getAmazonFallbackProducts(query);
        
        console.log(`   ✅ Found ${products.length} products`);
        
        if (products.length > 0) {
            const product = products[0];
            console.log(`   📦 Title: ${product.title.substring(0, 50)}...`);
            console.log(`   💰 Price: ${product.price}`);
            console.log(`   🔗 URL: ${product.link}`);
            console.log(`   🏷️  Features: ${product.features.join(', ')}`);
        }
        console.log('');
    }
    
    console.log('🎉 Fallback products test completed!');
}

testFallbackProducts().catch(console.error);
