const dotenv = require('dotenv');
const path = require('path');
const ExaSearch = require('./scrapers/exaSearch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testBestBuySearch() {
  console.log('🧪 Testing BestBuy search functionality...\n');
  
  const exaSearch = new ExaSearch();
  
  const testQueries = [
    'gaming laptop',
    'wireless headphones',
    'iPhone 15',
    'Samsung TV',
    'laptop'
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('=' .repeat(50));
    
    try {
      const products = await exaSearch.searchProducts(query, 5, 'bestbuy');
      
      if (products && products.length > 0) {
        console.log(`✅ Found ${products.length} BestBuy products:`);
        products.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.title}`);
          console.log(`   Price: ${product.price}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Source: ${product.source}`);
          console.log(`   Link: ${product.link}`);
          if (product.rating) {
            console.log(`   Rating: ${product.rating}/5 (${product.reviews} reviews)`);
          }
          if (product.features && product.features.length > 0) {
            console.log(`   Features: ${product.features.join(', ')}`);
          }
        });
      } else {
        console.log('❌ No products found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
    }
    
    // Brief delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎯 BestBuy test completed!');
}

// Check if EXA_API_KEY is configured
if (!process.env.EXA_API_KEY || process.env.EXA_API_KEY === 'your_exa_api_key_here') {
  console.log('⚠️ EXA_API_KEY not configured in .env file');
  console.log('💡 To test BestBuy functionality, please:');
  console.log('   1. Get an API key from https://exa.ai/');
  console.log('   2. Add EXA_API_KEY=your_actual_key to .env file');
  console.log('   3. Run this test again');
} else {
  console.log('✅ EXA_API_KEY found, starting tests...');
  testBestBuySearch().catch(console.error);
}
