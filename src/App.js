import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile] = useState({
    name: 'Guest',
    profilePic: '👤',
  });
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  const [selectedVersion, setSelectedVersion] = useState('Llama 70b');
  const [isListening, setIsListening] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://216.81.245.138:11614/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
        mode: 'cors',
      });
      const data = await response.json();
      if (data.report) {
        setMessages((prev) => [
          ...prev,
          { text: data.report, sender: 'bot' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: 'Error: No report generated', sender: 'bot' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${error.message}`, sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech Recognition API is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setMessages((prev) => [
        ...prev,
        { text: `Voice input error: ${event.error}`, sender: 'bot' },
      ]);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
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
                    <pre>{msg.text}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="input-container">
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
              disabled={loading}
            />
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
            >
              <img
                src="/voice-icon.png"
                alt="Voice"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </button>
            <button type="button" className="send-btn" onClick={handleSendMessage} disabled={loading}>
              {loading ? 'Generating...' : 'Send'}
            </button>
          </div>
          <div className="disclaimer">
            Llama 70b Bot can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;