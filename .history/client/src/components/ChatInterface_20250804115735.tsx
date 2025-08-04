import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[]; // ✅ Added
}

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  link: string;
  rating?: number;
  reviews?: number;
  features: string[];
}

interface ChatResponse {
  response: string;
  conversationId: string;
  products: Product[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hi! 👋 I\'m your AI shopping assistant. I can help you find the best deals on Amazon!\n\n**Try asking me:**\n• "Gaming laptop under $800"\n• "Best wireless headphones for exercise"\n• "iPhone with good camera under $600"\n\nJust describe what you\'re looking for and I\'ll find great options for you!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post<ChatResponse>('http://localhost:5000/chat', {
        message: inputMessage,
        conversationId,
        selectedProduct
          ? {
              id: selectedProduct.id,
              title: selectedProduct.title,
              price: selectedProduct.price,
              originalPrice: selectedProduct.originalPrice,
              link: selectedProduct.link,
              rating: selectedProduct.rating,
              reviews: selectedProduct.reviews,
              features: selectedProduct.features
            }
          : null
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        products: response.data.products
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.data.conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the server is running and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
  };

  const SelectedProductPreview = ({
    selectedProduct,
    onClear
  }: {
    selectedProduct: Product;
    onClear: () => void;
  }) => (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mx-4 mt-2 mb-2">
      <div className="flex flex-col">
        <span className="font-medium text-blue-900 text-sm line-clamp-1">{selectedProduct.title}</span>
        <span className="text-xs text-blue-700 font-semibold">{selectedProduct.price}</span>
      </div>
      <button
        onClick={onClear}
        className="ml-4 text-blue-500 hover:text-red-500 text-lg font-bold px-2 py-1 rounded-full focus:outline-none"
        title="Remove selected product"
        aria-label="Remove selected product"
      >
        ×
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-gray-200/50 p-4 flex-shrink-0">
        <div className="flex items-center gap-3 pl-5">
          <div>
            <h2 className="font-semibold text-white">AI Assistant</h2>
            <p className="text-xs text-blue-100">Ready to find your perfect products</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 custom-scrollbar min-h-0">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-bubble`}>
              <div className="flex items-start gap-3 max-w-[85%] lg:max-w-[75%]">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm hover-lift ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto shadow-blue-200'
                      : 'bg-white text-gray-800 border border-gray-200/50 shadow-gray-100'
                  }`}
                >
                  <ReactMarkdown className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:text-current prose-code:text-current prose-ul:my-2 prose-li:my-0">
                    {message.content}
                  </ReactMarkdown>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <span className="text-white text-xs">👤</span>
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Render products if available with this assistant message */}
            {message.role === 'assistant' && message.products?.length > 0 && (
              <div className="mt-2 ml-12 animate-slideIn">
                <div className="grid gap-3 max-w-[85%] lg:max-w-[75%]">
                  {message.products.map(product => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-xl border border-gray-200/80 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/30 p-3 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                      title="Select this product for follow-up questions"
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">{/* Image goes here */}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-5 group-hover:text-blue-700 transition-colors">
                            {product.title}
                          </h3>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-900">{product.price}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-gray-500 line-through">
                                {product.originalPrice}
                              </span>
                            )}
                          </div>
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md group-hover:scale-105 mt-1"
                            onClick={e => e.stopPropagation()}
                          >
                            View on Amazon
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🤖</span>
              </div>
              <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm border border-gray-200/50">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {selectedProduct && (
        <SelectedProductPreview selectedProduct={selectedProduct} onClear={handleClearSelectedProduct} />
      )}

      <div className="border-t border-gray-200/50 bg-white p-4 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to find any product... "
              className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-sm text-gray-900"
              rows={1}
              disabled={isLoading}
              maxLength={500}
              style={{ minHeight: '48px', maxHeight: '120px', overflowY: 'hidden' }}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400">
              {inputMessage.length}/500
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 mb-2.5 text-white p-3 rounded-xl transition-all duration-200 shadow-sm"
          >
            <Send
              className={`w-5 h-5 transition-transform duration-200 ${
                isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              AI Powered
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
          <div className="text-xs text-gray-400">Powered by Gemini AI</div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
