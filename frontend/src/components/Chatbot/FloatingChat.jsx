import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import './FloatingChat.css';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Xin chào! Mình là trợ lý ảo của LDA109. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // We only send the last 5 messages for context to keep it snappy
      const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(userMessage, history);
      
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: res.data.data }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: res.data.message || 'Hệ thống đang bận.' }]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Có lỗi kết nối đến server. Bạn thử lại sau nhé!';
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`floating-chat ${isOpen ? 'open' : ''}`}>
      {/* Floating Button */}
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : <span className="chat-icon">💬</span>}
        {!isOpen && <span className="chat-badge">AI</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window animate-fadeInUp">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">AI</div>
              <div>
                <div className="chat-name">Trợ lý LDA109</div>
                <div className="chat-status">Đang trực tuyến</div>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`message-wrapper ${m.role}`}>
                <div className="message-bubble">
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-wrapper ai">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Hỏi mình về sách..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              {loading ? '...' : '✈️'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
