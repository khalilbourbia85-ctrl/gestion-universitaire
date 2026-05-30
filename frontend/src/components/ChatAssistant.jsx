import React, { useState, useEffect, useRef } from 'react';
import axios from "../utils/axiosConfig";
import ReactMarkdown from 'react-markdown';
import './ChatAssistant.css';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant académique IA. Comment puis-je vous aider ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setHistory(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post('ai/chat/', {
        message: userMsg.content,
        // Send history excluding the first greeting to save context, if you want
        history: history.filter(h => h.role !== 'system')
      });

      const aiMsg = { role: 'assistant', content: res.data.reply };
      setHistory(prev => [...prev, aiMsg]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue lors de la connexion à l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {/* Floating Button */}
      <button className="chat-toggle-btn" onClick={toggleChat}>
        {isOpen ? '✕ Fermer' : '💬 Assistant IA'}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Assistant IA</h3>
          </div>
          
          <div className="chat-messages">
            {history.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                <div className="bubble-content">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble assistant">
                <div className="bubble-content loading">...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Posez une question..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()}>
              Envoyer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
