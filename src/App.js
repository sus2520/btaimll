import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [profile] = useState({
    name: 'Guest',
    profilePic: '👤', // Default profile icon
  });
  const [logoSrc, setLogoSrc] = useState('/logo.png'); // State for logo fallback
  const [selectedVersion, setSelectedVersion] = useState('Llama 70b');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setMessages([...messages, { text: input, sender: 'user' }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: `You said: ${input}`, sender: 'bot' },
      ]);
    }, 500);
    setInput('');
  };

  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

  const conversations = [
    'Project Proposal Rewrite',
    'Image similarity',
    'Factory Management System',
    'AI Data Extraction Bid',
    'Flight Price Prediction Model',
    'Push to GitHub Tutorial',
    'Image modification request',
    'Flowchart Redraw Request',
    'API Development for PL',
  ];

  return (
    <div className="app">
      <div className="main-container">
        <div className="sidebar">
          <div className="brand-section">
            <img
              src={logoSrc}
              alt="Logo"
              className="sidebar-logo"
              onError={() => setLogoSrc('https://via.placeholder.com/100')}
            />
            <h1 className="brand-name">Llama 70b Bot</h1>
          </div>
          <div className="conversations">
            <h3>Today</h3>
            {conversations.slice(0, 3).map((conv, index) => (
              <div key={index} className="conversation-item">
                {conv}
              </div>
            ))}
            <h3>Previous 7 Days</h3>
            {conversations.slice(3).map((conv, index) => (
              <div key={index + 3} className="conversation-item">
                {conv}
              </div>
            ))}
            <button className="renew-btn">Renew Plus</button>
          </div>
        </div>
        <div className="chat-container">
          <header className="header">
            <div className="version-selector">
              <select value={selectedVersion} onChange={handleVersionChange} className="version-dropdown">
                <option value="Llama 70b">Llama 70b</option>
                <option value="GPT 4o">GPT 4o</option>
              </select>
            </div>
            <div className="profile-section">
              <button className="share-btn">Share</button>
              <span className="profile-pic">{profile.profilePic}</span>
              {/* Removed <span className="profile-name">{profile.name}</span> */}
            </div>
          </header>
          <div className="main-chat">
            {messages.length === 0 ? (
              <div className="welcome-message">What can I help with?</div>
            ) : (
              <div className="messages">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.sender === 'user' ? 'user' : 'bot'}`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className="input-container" onSubmit={handleSendMessage}>
            <button type="button" className="attachment-btn">
              <img
                src="/attach-icon.png"
                alt="Attach"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
            />
            <button type="button" className="voice-btn">
              <img
                src="/voice-icon.png"
                alt="Voice"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </button>
            <button type="submit" className="send-btn">
              Send
            </button>
          </form>
          <div className="disclaimer">
            Llama 70b Bot can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;