import React, { useState, useRef } from 'react';
import './App.css';

// Use environment variable for API URL, with fallback to the provided ngrok URL
const API_URL = process.env.REACT_APP_API_URL || 'https://2a7d-216-81-248-128.ngrok-free.app';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile] = useState({
    name: 'Guest',
    profilePic: '👤',
  });
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  const [selectedVersion, setSelectedVersion] = useState('Llama 3 70b');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize Web Speech API for voice input
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  // Handle sending a message to the backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user message to chat
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      // Check if unsupported model is selected
      if (selectedVersion === 'GPT 4o') {
        setMessages((prev) => [
          ...prev,
          { text: 'Error: GPT 4o is not supported yet. Please use Llama 3 70b.', sender: 'bot' },
        ]);
        setLoading(false);
        return;
      }

      // Send request to backend
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, max_new_tokens: 20 }), // Add max_new_tokens
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success' && data.response) {
        // Add successful bot response
        setMessages((prev) => [
          ...prev,
          { text: data.response, sender: 'bot' },
        ]);
      } else {
        // Handle backend error
        setMessages((prev) => [
          ...prev,
          { text: `Error: ${data.error || 'Failed to generate a response'}`, sender: 'bot' },
        ]);
      }
    } catch (error) {
      // Handle network or server errors
      setMessages((prev) => [
        ...prev,
        { text: `Error: Failed to connect to the server (${error.message})`, sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload (currently unsupported)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      { text: `Uploaded file: ${file.name}`, sender: 'user' },
      { text: 'Error: File uploads are not supported yet. Please send a text prompt instead.', sender: 'bot' },
    ]);
    fileInputRef.current.value = null;
  };

  // Handle model version change
  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

  // Handle voice input using Web Speech API
  const handleVoiceInput = () => {
    if (!recognition) {
      setMessages((prev) => [
        ...prev,
        { text: 'Voice input is not supported in this browser. Please type your message instead.', sender: 'bot' },
      ]);
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
        { text: `Voice input error: ${event.error}. Please try typing your message.`, sender: 'bot' },
      ]);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Static list of conversation topics
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
            <h1 className="brand-name">Llama 3 70b Bot</h1>
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
                <option value="Llama 3 70b">Llama 3 70b</option>
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
                {loading && <div className="loading">Loading...</div>}
              </div>
            )}
          </div>
          <form className="input-container" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="attachment-btn"
              onClick={() => fileInputRef.current.click()}
            >
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
            <button type="submit" className="send-btn" disabled={loading}>
              {loading ? 'Generating...' : 'Send'}
            </button>
          </form>
          <div className="disclaimer">
            Llama 3 70b Bot can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;