import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

// Define types
const Chat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  // Handle Send
  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    const newUserMsg = {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/message", {
        message: userMessage
      });

      const assistantMsg = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
        products: response.data.products || []
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Failed to get product suggestions.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col px-4 sm:px-8 py-4">
      {/* Chat container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {messages.map((message, index) => (
          <div key={index} className={`my-3`}>
            {/* User or Assistant message */}
            <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-xl text-sm ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>

            {/* Product cards (only shown with assistant messages) */}
            {message.role === "assistant" && message.products?.length > 0 && (
              <div className="mt-2 ml-12 animate-slideIn">
                <div className="grid gap-3 max-w-[85%] lg:max-w-[75%]">
                  {message.products.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-xl border border-gray-200/80 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/30 p-3 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                      title="Select this product for follow-up questions"
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          {/* You can add a product image here */}
                        </div>
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
                            onClick={(e) => e.stopPropagation()}
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
      </div>

      {/* Input bar */}
      <div className="pt-4">
        <div className="flex items-center gap-3">
          <textarea
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your query..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
            disabled={loading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
