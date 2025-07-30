require('dotenv').config();
const ExaSearch = require('./scrapers/exaSearch');

async function testExaSearch() {
    console.log('🔍 Testing ExaSearch Configuration...\n');
    
    const exaSearch = new ExaSearch();
    
    // Test 1: Check API key configuration
    console.log('1. Checking API Key Configuration:');
    console.log(`   API Key: ${exaSearch.apiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Base URL: ${exaSearch.baseUrl}\n`);
    
    // Test 2: Simple product search
    console.log('2. Testing ExaSearch with a simple query...');
    try {
        const results = await exaSearch.searchProducts('wireless earphones', 3);
        console.log(`   ✅ Search completed successfully!`);
        console.log(`   📦 Found ${results.length} products`);
        
        if (results.length > 0) {
            console.log('\n   Sample Product:');
            const product = results[0];
            console.log(`   📱 Title: ${product.title.substring(0, 60)}...`);
            console.log(`   💰 Price: ${product.price}`);
            console.log(`   ⭐ Rating: ${product.rating}`);
            console.log(`   🔗 URL: ${product.link}`);
            console.log(`   🏷️  Features: ${product.features.join(', ')}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
    }
    
    console.log('\n🎉 ExaSearch test completed!');
}

testExaSearch().catch(console.error);
