<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Llama 70b Bot</title>
  <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/babel-standalone@7.22.5/babel.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    .app { display: flex; height: 100vh; font-family: Arial, sans-serif; }
    .main-container { display: flex; flex: 1; }
    .sidebar { width: 250px; background-color: #1e40af; color: white; padding: 20px; display: flex; flex-direction: column; }
    .brand-section { display: flex; align-items: center; margin-bottom: 20px; }
    .sidebar-logo { width: 40px; height: 40px; margin-right: 10px; }
    .brand-name { font-size: 1.5rem; font-weight: bold; }
    .conversations h3 { font-size: 1rem; margin: 10px 0; }
    .conversation-item { padding: 10px; background-color: #2563eb; margin: 5px 0; border-radius: 5px; cursor: pointer; }
    .conversation-item:hover { background-color: #3b82f6; }
    .renew-btn { margin-top: 20px; padding: 10px; background-color: #f97316; color: white; border: none; border-radius: 5px; cursor: pointer; }
    .renew-btn:hover { background-color: #ea580c; }
    .chat-container { flex: 1; display: flex; flex-direction: column; background-color: #f9fafb; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-bottom: 1px solid #e5e7eb; }
    .version-selector { flex: 1; text-align: center; }
    .version-dropdown { padding: 5px; border-radius: 5px; border: 1px solid #d1d5db; }
    .profile-section { display: flex; align-items: center; }
    .share-btn { margin-right: 10px; padding: 5px 10px; border: 1px solid #d1d5db; border-radius: 5px; background: none; cursor: pointer; }
    .profile-pic { font-size: 1.5rem; }
    .main-chat { flex: 1; padding: 20px; overflow-y: auto; }
    .welcome-message { text-align: center; color: #4b5563; font-size: 1.5rem; margin-top: 20%; }
    .messages { display: flex; flex-direction: column; gap: 10px; }
    .message { max-width: 80%; padding: 10px; border-radius: 10px; }
    .message.user { align-self: flex-end; background-color: #3b82f6; color: white; }
    .message.bot { align-self: flex-start; background-color: #e5e7eb; color: black; }
    .input-container { display: flex; align-items: center; padding: 10px 20px; border-top: 1px solid #e5e7eb; background-color: white; }
    .attachment-btn, .voice-btn, .send-btn { padding: 10px; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px; }
    .attachment-btn { background-color: #d1d5db; }
    .voice-btn { background-color: #f97316; }
    .voice-btn.listening { background-color: #ef4444; }
    .send-btn { background-color: #2563eb; color: white; }
    .send-btn:disabled { background-color: #9ca3af; cursor: not-allowed; }
    input[type="text"] { flex: 1; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; outline: none; }
    .disclaimer { text-align: center; color: #6b7280; font-size: 0.875rem; padding: 10px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;

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

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>