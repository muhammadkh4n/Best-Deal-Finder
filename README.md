# Best Deal Finder

An AI-powered application that helps users find the best deals on Amazon through natural language chat interface.

## Features

- 🤖 AI-powered product search using Gemini API
- 🔍 Real-time Amazon product scraping with Playwright
- 💬 ChatGPT-like conversational interface
- 🛍️ Direct links to Amazon products
- 📱 Responsive design with Tailwind CSS
- 💾 Conversation history stored in MongoDB

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS for styling
- Vite for development
- Axios for API calls
- Lucide React for icons
- React Markdown for message formatting

**Backend:**
- Node.js with Express.js
- MongoDB for data storage
- Playwright for web scraping
- Gemini AI for natural language processing
- CORS enabled for cross-origin requests

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Gemini API key from Google AI Studio

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dealfinder
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to your `.env` file

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Then start the service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
- Create a cluster and get connection string
- Update MONGODB_URI in .env

### 5. Install Playwright Browsers

```bash
cd server
npx playwright install
```

### 6. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Usage Examples

### Basic Product Search
```
User: "I want a gaming laptop under $800"
```

### Specific Requirements
```
User: "Find me an iPhone with good camera under $600"
```

### Follow-up Questions
```
User: "Is the 2nd option good for video editing?"
```

## API Endpoints

### POST /chat
Send a message to the AI assistant

**Request:**
```json
{
  "message": "I want a gaming laptop under $800",
  "conversationId": "optional_conversation_id"
}
```

**Response:**
```json
{
  "response": "I found 3 great gaming laptop deals for you...",
  "conversationId": "conv_1234567890_xyz",
  "products": [
    {
      "id": "1",
      "title": "ASUS TUF Gaming Laptop",
      "price": "$749.99",
      "originalPrice": "$899.99",
      "image": "https://...",
      "link": "https://amazon.com/dp/...",
      "rating": 4.4,
      "reviews": 1250,
      "features": ["AMD Ryzen 5", "8GB RAM", "GTX 1650"]
    }
  ]
}
```

### GET /health
Health check endpoint

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── ChatInterface.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── scrapers/          # Web scraping modules
│   │   └── amazonScraper.js
│   ├── index.js           # Main server file
│   ├── package.json
│   └── .env.example
└── README.md
```

## Development Workflow

1. **User types query** → "I want a gaming laptop under $800"
2. **React sends request** → POST to `/chat`
3. **Express server processes:**
   - Calls Gemini API to parse specs
   - Uses Playwright to scrape Amazon
   - Stores conversation in MongoDB
4. **Server responds** with product list
5. **Frontend displays** products with links
6. **User can follow up** with specific questions

## Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Ensure MongoDB is running
- Check MONGODB_URI in .env file

**"Gemini API errors"**
- Verify GEMINI_API_KEY is correct
- Check API quota and billing

**"Playwright browser errors"**
- Run `npx playwright install`
- Try running with different browser

**"CORS errors"**
- Ensure backend is running on port 5000
- Check frontend is connecting to correct URL

### Performance Notes

- Amazon may rate-limit or block scraping attempts
- Consider implementing caching for frequently searched products
- Use ExaSearch MCP as fallback if Amazon blocks requests

## Next Steps

- [ ] Implement MCP (Model Context Protocol) servers
- [ ] Add ExaSearch integration as fallback
- [ ] Implement user authentication
- [ ] Add product price tracking
- [ ] Create mobile app version
- [ ] Add support for other e-commerce sites

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details
