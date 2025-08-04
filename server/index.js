const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const SmartProductSearch = require('./scrapers/smartProductSearch');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug environment loading
console.log('Environment loading status:');
console.log('- PORT:', process.env.PORT ? '✓' : '✗');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✓' : '✗');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓' : '✗');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI;

if (mongoUri && !mongoUri.includes('<') && !mongoUri.includes('>')) {
  console.log('🔗 Connecting to MongoDB...');
  MongoClient.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
    .then(client => {
      console.log('✅ Connected to MongoDB Atlas');
      db = client.db('dealfinder');
    })
    .catch(error => {
      console.error('❌ MongoDB connection error:', error.message);
      console.log('⚠️ App will continue without MongoDB storage');
    });
} else {
  console.log('⚠️ MongoDB URI not configured or contains placeholders - running without database storage');
}

// Store conversation context
const conversations = new Map();

// Main chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationId = generateConversationId(), selectedProduct, shop = 'amazon' } = req.body;
    
    console.log('💬 Received message:', message);
    console.log('🆔 Conversation ID:', conversationId);
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }
    
    // Get or create conversation context
    let conversation = conversations.get(conversationId) || {
      messages: [],
      products: []
    };
    // Store selectedProduct in conversation for follow-up
    if (selectedProduct) {
      conversation.selectedProduct = selectedProduct;
    } else {
      delete conversation.selectedProduct;
    }
    
    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    conversation.messages.push(userMessage);
    
    // Process the message
    console.log('⚙️ Processing user message...');
    // Pass selectedProduct explicitly to processUserMessage
    const response = await processUserMessage(message.trim(), conversation, selectedProduct, shop);
    
    // Add assistant response to conversation
    const assistantMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    conversation.messages.push(assistantMessage);
    
    // Update conversation
    conversations.set(conversationId, conversation);
    
    // Store in MongoDB (if available)
    if (db) {
      try {
        await db.collection('conversations').updateOne(
          { conversationId },
          { $set: { ...conversation, lastUpdated: new Date() } },
          { upsert: true }
        );
        console.log('💾 Conversation saved to MongoDB');
      } catch (dbError) {
        console.error('⚠️ Failed to save to MongoDB:', dbError.message);
      }
    }
    
    console.log('✅ Response ready, sending to client');
    
    // Always return existing products to keep them visible in UI
    res.json({
      response,
      conversationId,
      products: conversation.products || []
    });
    
  } catch (error) {
    console.error('❌ Chat endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Please try again in a moment'
    });
  }
});

async function processUserMessage(message, conversation, selectedProduct = null, shop = 'amazon') {
  try {
    const productSpecs = await parseWithGemini(message, conversation);

    // If a selectedProduct is present (from request), always treat as follow-up
    if (selectedProduct) {
      return await handleFollowUpQuestion(message, conversation, selectedProduct);
    }

    // Step 2: If it's a product search, use the selected shop
    if (productSpecs.isProductSearch) {
      const products = await searchAmazonProducts(productSpecs, shop);
      conversation.products = products;
      return formatProductResponse(products, productSpecs);
    } else {
      // Step 3: Handle follow-up questions about existing products
      return await handleFollowUpQuestion(message, conversation);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return 'Sorry, I encountered an error while processing your request. Please try again.';
  }
}

async function parseWithGemini(message, conversation) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🤖 Parsing with Gemini API...');
  console.log('API Key status:', apiKey ? '✅ Present' : '❌ Missing');
  
  if (!apiKey) {
    console.error('❌ Gemini API key not found in environment variables');
    throw new Error('Gemini API key not configured');
  }
  
  const prompt = `
    Analyze this user message and determine if it's a product search or a follow-up question.
    
    User message: "${message}"
    
    Previous conversation context: ${JSON.stringify(conversation.messages.slice(-4))}
    
    If it's a product search, extract:
    - Product category (laptop, phone, headphones, etc.)
    - Brand preferences (if mentioned)
    - Price range (extract min/max from budget mentioned)
    - Key features/specifications
    - Optimized search keywords for Amazon (be specific and include important terms)
    
    If it's a follow-up question, identify:
    - Which product they're referring to
    - What specific information they want
    
    IMPORTANT: Generate very specific and targeted Amazon search keywords. For example:
    - "gaming laptop under $800" → "gaming laptop RTX GTX 15.6 inch under 800"
    - "wireless headphones for exercise" → "wireless bluetooth headphones sports exercise sweat resistant"
    - "iPhone with good camera" → "iPhone 14 15 pro camera photography"
    
    Respond in JSON format:
    {
      "isProductSearch": boolean,
      "category": "string",
      "brand": "string or null",
      "priceRange": {"min": number, "max": number},
      "features": ["array of features"],
      "searchKeywords": "string for Amazon search",
      "followUpContext": "context for follow-up questions"
    }
  `;
  
  try {
    console.log('📡 Making request to Gemini API...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Gemini API response received');
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    
    console.log('📝 Parsed response from Gemini');
    const parsedResult = JSON.parse(cleanedResponse);
    
    return parsedResult;
  } catch (error) {
    console.error('❌ Gemini API error:', error.response?.data || error.message);
    
    // Enhanced fallback parsing with better logic
    console.log('🔄 Using enhanced fallback parsing...');
    
    const messageLower = message.toLowerCase();
    let category = 'product';
    let searchKeywords = message;
    let priceRange = { min: 0, max: 10000 };
    
    // Extract category
    if (messageLower.includes('laptop')) category = 'laptop';
    else if (messageLower.includes('phone') || messageLower.includes('iphone')) category = 'phone';
    else if (messageLower.includes('headphone') || messageLower.includes('audio')) category = 'headphones';
    else if (messageLower.includes('tablet')) category = 'tablet';
    else if (messageLower.includes('watch')) category = 'smartwatch';
    
    // Extract price range
    const priceMatch = messageLower.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less than\s*\$?(\d+)|max\s*\$?(\d+)/);
    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4]);
      priceRange.max = maxPrice;
    }
    
    // Enhance search keywords
    if (category === 'laptop' && messageLower.includes('gaming')) {
      searchKeywords = 'gaming laptop RTX graphics';
    } else if (category === 'phone' && messageLower.includes('camera')) {
      searchKeywords = 'smartphone camera photography';
    }
    
    return {
      isProductSearch: true,
      category,
      searchKeywords,
      features: [],
      priceRange,
      brand: null,
      followUpContext: null
    };
  }
}

async function searchAmazonProducts(specs, shop = 'amazon') {
  console.log('🛒 Starting comprehensive product search for:', specs.searchKeywords, 'Shop:', shop);
  const smartSearch = new SmartProductSearch();
  try {
    let products = [];
    if (shop === 'amazon') {
      products = await smartSearch.tryAmazonScraping(specs, 10);
    } else if (shop === 'bestbuy') {
      console.log('🎯 Starting BestBuy search process...');
      
      // Primary: Try ExaSearch for BestBuy first (most reliable)
      products = await smartSearch.tryBestBuyExaSearch(specs, 10);
      console.log(`🔍 ExaSearch returned ${products.length} BestBuy products`);
      
      // Secondary: Try direct scraping if not enough products
      if (products.length < 3) {
        console.log('🕷️ Trying direct BestBuy scraping as backup...');
        const scrapedProducts = await smartSearch.tryBestBuyScraping(specs, 10);
        const validScraped = scrapedProducts.filter(p => p.source === 'bestbuy');
        products = products.concat(validScraped);
        console.log(`🕷️ Scraping added ${validScraped.length} more products`);
      }
      
      // Filter to keep only real BestBuy products
      products = products.filter(p => p.source === 'bestbuy');
      
      // If still no products, provide helpful feedback
      if (products.length === 0) {
        console.log('⚠️ No BestBuy products found. Possible reasons:');
        console.log('  • Product not available at BestBuy');
        console.log('  • Search terms too specific or too generic');
        console.log('  • ExaSearch API limitations');
        
        // Return a helpful message instead of empty array
        return [{
          id: 'bestbuy_no_results',
          title: `No BestBuy products found for "${specs.searchKeywords}"`,
          price: 'N/A',
          originalPrice: null,
          image: 'https://www.bestbuy.com/~assets/bby/_images/global/header/bestbuy-logo.svg',
          link: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(specs.searchKeywords)}`,
          rating: null,
          reviews: null,
          features: ['Try different search terms', 'Check BestBuy website directly', 'Consider similar products'],
          source: 'bestbuy_message'
        }];
      }
      
      console.log(`✅ BestBuy search completed: ${products.length} products found`);
    } else {
      // fallback: use all sources
      products = await smartSearch.searchProducts(specs, 10);
    }
    console.log(`✅ Smart search completed: ${products.length} products found`);
    return products;
  } catch (error) {
    console.error('❌ Smart search failed:', error.message);
    return [];
  } finally {
    try {
      await smartSearch.close();
    } catch (e) {
      console.error('⚠️ Error closing smart search:', e.message);
    }
  }
}

async function filterProductsWithGemini(products, specs) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('No Gemini API key, returning raw products');
    return products;
  }
  
  const prompt = `
    You are an expert product analyst. I need you to analyze these products and select the BEST ones based on the user's requirements.
    
    User Requirements:
    - Category: ${specs.category}
    - Budget: $${specs.priceRange?.min || 0} - $${specs.priceRange?.max || 'unlimited'}
    - Features: ${specs.features?.join(', ') || 'None specified'}
    - Original Query: "${specs.searchKeywords}"
    
    Available Products:
    ${JSON.stringify(products, null, 2)}
    
    Please:
    1. Filter products that match the user's budget and requirements
    2. Rank them by value (price vs features vs ratings)
    3. Return ONLY the best 5 products in order of recommendation
    4. For each product, ensure the price is properly formatted (e.g., "$299.99")
    5. Add relevant features based on the product title and specifications
    
    Return the filtered products in JSON format as an array, keeping the exact same structure but with enhanced features array.
    
    IMPORTANT: Only return valid JSON array, no additional text or explanation.
  `;
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const filteredProducts = JSON.parse(cleanedResponse);
    
    console.log(`Gemini filtered to ${filteredProducts.length} best products`);
    return Array.isArray(filteredProducts) ? filteredProducts : products.slice(0, 5);
    
  } catch (error) {
    console.error('Error filtering products with Gemini:', error.message);
    console.log('🔄 Gemini API failed, returning original products');
    return products.slice(0, 5); // Return first 5 if filtering fails
  }
}

function formatProductResponse(products, specs) {
  if (products.length === 0) {
    return `I couldn't find any ${specs.category || 'products'} matching your criteria right now. This might be due to Amazon's anti-bot measures. Try:\n\n• Adjusting your search terms\n• Being more specific about features\n• Trying a different price range\n\nOr ask me about a different type of product!`;
  }
  
  // Return a simple message - the product cards will be displayed separately in the UI
  return `🎉 Great! I found **${products.length} excellent ${specs.category || 'product'}${products.length > 1 ? 's' : ''}** for you! You can click on any product card to select it and ask follow-up questions.`;
}

async function handleFollowUpQuestion(message, conversation, selectedProduct = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return 'Sorry, I need the Gemini API key configured to answer follow-up questions.';
  }
  
  let prompt;
  if (selectedProduct) {
    prompt = `You are an expert shopping assistant. The user selected this product: ${JSON.stringify(selectedProduct)}.

User follow-up question: "${message}"

Answer ONLY about the selected product. Be clear, concise, and helpful. Focus on answering their specific question about this product.`;
  } else {
    prompt = `You are an expert shopping assistant. Here are the products previously recommended: ${JSON.stringify(conversation.products)}.

User follow-up question: "${message}"

Answer about the relevant product(s). Be clear, concise, and helpful.`;
  }
  
  try {
    console.log('🤖 Making follow-up query to Gemini...');
    console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Gemini follow-up response received');
    
    // Return only Gemini's answer, trimmed
    const result = response.data.candidates[0].content.parts[0].text || '';
    return result.trim();
  } catch (error) {
    console.error('❌ Gemini follow-up error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Provide a more helpful fallback response
    if (selectedProduct) {
      return `I'm having trouble connecting to my AI service right now. However, I can tell you that you've selected the ${selectedProduct.title} priced at ${selectedProduct.price}. Please try asking your question again, or I can help you with other product searches.`;
    } else {
      return 'Sorry, I encountered an error while processing your follow-up question. Please try rephrasing or ask about specific products.';
    }
  }
}

function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
