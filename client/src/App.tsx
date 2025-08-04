import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        <header className="text-center mb-6 animate-fadeIn flex-shrink-0">
          <div className="inline-flex items-center gap-3 mb-3">
          
            <div>
              <h1 className="text-2xl  font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Best Deal Finder
              </h1>
              <p className="text-xs pt-2 text-gray-600 font-medium">
                AI-Powered Shopping Assistant
              </p>
            </div>
          </div>
          <p className="text-gray-600 max-w-lg mx-auto leading-relaxed text-sm">
            Discover amazing deals on Amazon & Best Buy with the power of AI. Just describe what you're looking for!
          </p>
        </header>
        
        <div className="flex-1 min-h-0">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}

export default App

