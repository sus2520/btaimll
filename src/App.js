import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from './index';
import './App.css';

const LOGIN_API_URL = 'https://login-1-8dx3.onrender.com';
const BOT_API_URL = 'https://fullstack-bot.ngrok.app';

function MessageItem({
  msg,
  index,
  inlineEditingMessage,
  setInlineEditingMessage,
  handleSaveInlineEdit,
  handleCancelInlineEdit,
  currentSession,
  loading,
  setShowJsonView,
  showJsonView,
  downloadTableAsCSV,
  downloadJson,
  convertTableToJson,
}) {
  const messageType = msg.type || (msg.text ? 'text' : 'unknown');
  const messageData = msg.data || msg.text || '';
  const rawData = msg.raw || msg.text || '';
  const isEditing = inlineEditingMessage && inlineEditingMessage.index === index;
  const textareaRef = useRef(null);
  const measureRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current && measureRef.current) {
      const height = measureRef.current.offsetHeight;
      const width = measureRef.current.offsetWidth;
      textareaRef.current.style.height = `${Math.max(height, 60)}px`;
      textareaRef.current.style.width = `${Math.max(width, 200)}px`; // Ensure minimum width
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 60)}px`;
    }
  }, [isEditing, inlineEditingMessage?.content]);

  const handleEditPrompt = (data) => {
    setInlineEditingMessage({ index, content: data });
  };

  return (
    <div className={`message ${msg.sender} ${msg.error ? 'error' : ''}`}>
      {isEditing ? (
        <div>
          <div
            ref={measureRef}
            className={`message-measure ${msg.sender}`}
            style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'pre-wrap' }}
          >
            {inlineEditingMessage.content}
          </div>
          <textarea
            ref={textareaRef}
            value={inlineEditingMessage.content}
            onChange={(e) => {
              setInlineEditingMessage({ ...inlineEditingMessage, content: e.target.value });
              const textarea = e.target;
              textarea.style.height = 'auto';
              textarea.style.height = `${Math.max(textarea.scrollHeight, 60)}px`;
            }}
            className="inline-edit-textarea"
            autoFocus
          />
          <div className="inline-edit-actions">
            <button
              onClick={() => handleSaveInlineEdit(currentSession.id, index, inlineEditingMessage.content)}
              className="save-btn"
              disabled={loading}
            >
              Save
            </button>
            <button onClick={handleCancelInlineEdit} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      ) : messageType === 'table' && messageData.headers && messageData.rows ? (
        <div className="table-container">
          <table className="response-table">
            <thead>
              <tr>
                {messageData.headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {messageData.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-actions">
            <button
              className="download-btn"
              onClick={() => downloadTableAsCSV(messageData, `table_${index}`)}
            >
              Download Table
            </button>
            <button
              className="json-view-btn"
              onClick={() => setShowJsonView(showJsonView === index ? null : index)}
            >
              {showJsonView === index ? 'Hide JSON' : 'JSON View'}
            </button>
          </div>
          {showJsonView === index && (
            <div className="json-container">
              <div className="json-display">
                <pre>{JSON.stringify(convertTableToJson(messageData), null, 2)}</pre>
              </div>
              <div className="table-actions">
                <button
                  className="download-btn"
                  onClick={() => downloadJson(convertTableToJson(messageData), `table_${index}`)}
                >
                  Download JSON
                </button>
                <button
                  className="close-json-btn"
                  onClick={() => setShowJsonView(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      ) : messageType === 'json' ? (
        <div className="json-container">
          <div className="json-display">
            <pre>{JSON.stringify(messageData, null, 2)}</pre>
          </div>
          <div className="table-actions">
            <button
              className="download-btn"
              onClick={() => downloadJson(messageData, `data_${index}`)}
            >
              Download JSON
            </button>
          </div>
        </div>
      ) : (
        <ReactMarkdown>{messageData}</ReactMarkdown>
      )}
      {msg.sender === 'user' && !isEditing && (
        <div>
          <button onClick={() => handleEditPrompt(messageData)} className="edit">
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState('basic');
  const [inlineEditingMessage, setInlineEditingMessage] = useState(null);
  const [showJsonView, setShowJsonView] = useState(null);
  const fileInputRef = useRef(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setChatSessions(parsedSessions);
    }
  }, []);

  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    } else {
      localStorage.removeItem('chatSessions');
    }
  }, [chatSessions]);

  useEffect(() => {
    const messagesDiv = document.querySelector('.messages');
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }, [currentSession?.messages]);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  const parseTableFromText = (text) => {
    if (!text || typeof text !== 'string') return null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let headers = null;
    const rows = [];
    let isTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^\|.*\|$/)) {
        const parts = line.split('|').map(item => item.trim()).filter(item => item !== '');
        if (!headers) {
          headers = parts;
          isTable = true;
          if (i + 1 < lines.length && lines[i + 1].match(/^\|[-:\s|]+\|$/)) {
            i++;
          }
        } else {
          const row = parts;
          if (row.length === headers.length) {
            rows.push(row);
          }
        }
      }
    }
    return isTable && headers && rows.length > 0 ? { headers, rows } : null;
  };

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const downloadTableAsCSV = (tableData, fileName = 'table') => {
    const { headers, rows } = tableData;
    const escapeCSV = (value) => {
      if (typeof value !== 'string') return value;
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJson = (jsonData, fileName = 'data') => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertTableToJson = (tableData) => {
    const { headers, rows } = tableData;
    return rows.map(row => 
      headers.reduce((obj, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {})
    );
  };

  const startNewSession = (title = 'Untitled Chat') => {
    const newSession = {
      id: Date.now(),
      title: title.length > 30 ? title.slice(0, 27) + '...' : title,
      messages: [],
      timestamp: new Date().toISOString(),
    };
    setChatSessions((prev) => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('textarea').value;
    if (input.trim() === '') return;

    let session = currentSession;
    if (!session || session.messages.length === 0) {
      session = startNewSession(input);
    }

    const newMessage = { type: 'text', data: input, raw: input, sender: 'user' };
    const updatedSession = {
      ...session,
      messages: [...session.messages, newMessage],
    };

    setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
    setCurrentSession(updatedSession);
    e.target.querySelector('textarea').value = '';
    setLoading(true);

    try {
      const response = await fetch(`${BOT_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          model: selectedModel,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot backend error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.error || 'Failed to generate response');
      }

      let botMessage;
      const tableData = parseTableFromText(data.response);
      if (tableData) {
        botMessage = { type: 'table', data: tableData, raw: data.response, sender: 'bot' };
      } else if (isJsonString(data.response)) {
        botMessage = { type: 'json', data: JSON.parse(data.response), raw: data.response, sender: 'bot' };
      } else {
        botMessage = { type: 'text', data: data.response, raw: data.response, sender: 'bot' };
      }

      const updatedSessionWithBot = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithBot : s)));
      setCurrentSession(updatedSessionWithBot);
    } catch (error) {
      const errorMessage = { type: 'text', data: `Error: ${error.message}`, raw: error.message, sender: 'bot', error: true };
      const updatedSessionWithError = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithError : s)));
      setCurrentSession(updatedSessionWithError);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let session = currentSession;
    if (!session || session.messages.length === 0) {
      session = startNewSession(`Uploaded: ${file.name}`);
    }

    const newMessage = { type: 'text', data: `Uploaded file: ${file.name}`, raw: `Uploaded file: ${file.name}`, sender: 'user' };
    const updatedSession = {
      ...session,
      messages: [...session.messages, newMessage],
    };
    setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
    setCurrentSession(updatedSession);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', selectedModel);
      formData.append('userEmail', user.email);

      const response = await fetch(`${BOT_API_URL}/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Bot backend error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.error || 'Failed to process file');
      }

      let botMessage;
      const tableData = parseTableFromText(data.response);
      if (tableData) {
        botMessage = { type: 'table', data: tableData, raw: data.response, sender: 'bot' };
      } else if (isJsonString(data.response)) {
        botMessage = { type: 'json', data: JSON.parse(data.response), raw: data.response, sender: 'bot' };
      } else {
        botMessage = { type: 'text', data: data.response, raw: data.response, sender: 'bot' };
      }

      const updatedSessionWithBot = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithBot : s)));
      setCurrentSession(updatedSessionWithBot);
    } catch (error) {
      const errorMessage = { type: 'text', data: `Error: ${error.message}`, raw: error.message, sender: 'bot', error: true };
      const updatedSessionWithError = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithError : s)));
      setCurrentSession(updatedSessionWithError);
    } finally {
      setLoading(false);
      fileInputRef.current.value = null;
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      const errorMessage = { type: 'text', data: 'Voice input not supported.', raw: 'Voice input not supported.', sender: 'bot', error: true };
      let session = currentSession;
      if (!session || session.messages.length === 0) {
        session = startNewSession('Voice Input Error');
      }
      const updatedSession = {
        ...session,
        messages: [...session.messages, errorMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
      setCurrentSession(updatedSession);
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
      let session = currentSession;
      if (!session || session.messages.length === 0) {
        session = startNewSession(transcript);
      }
      const newMessage = { type: 'text', data: transcript, raw: transcript, sender: 'user' };
      const updatedSession = {
        ...session,
        messages: [...session.messages, newMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
      setCurrentSession(updatedSession);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      const errorMessage = { type: 'text', data: `Voice input error: ${event.error}`, raw: `Voice input error: ${event.error}`, sender: 'bot', error: true };
      let session = currentSession;
      if (!session || session.messages.length === 0) {
        session = startNewSession('Voice Input Error');
      }
      const updatedSession = {
        ...session,
        messages: [...session.messages, errorMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
      setCurrentSession(updatedSession);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
  };

  const handleDeleteSession = (sessionId) => {
    const updatedSessions = chatSessions.filter((session) => session.id !== sessionId);
    setChatSessions(updatedSessions);
    if (currentSession && currentSession.id === sessionId) {
      setCurrentSession(null);
    }
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
  };

  const handleSaveInlineEdit = async (sessionId, index, newContent) => {
    if (!newContent.trim()) {
      setInlineEditingMessage(null);
      return;
    }

    const session = chatSessions.find((s) => s.id === sessionId);
    const updatedMessages = [...session.messages];
    updatedMessages[index] = { ...updatedMessages[index], data: newContent, raw: newContent };

    if (updatedMessages[index + 1]?.sender === 'bot') {
      updatedMessages.splice(index + 1, 1);
    }

    const updatedSession = { ...session, messages: updatedMessages };
    setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
    setCurrentSession(updatedSession);
    setInlineEditingMessage(null);

    setLoading(true);
    try {
      const response = await fetch(`${BOT_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newContent,
          model: selectedModel,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot backend error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.error || 'Failed to generate response');
      }

      let botMessage;
      const tableData = parseTableFromText(data.response);
      if (tableData) {
        botMessage = { type: 'table', data: tableData, raw: data.response, sender: 'bot' };
      } else if (isJsonString(data.response)) {
        botMessage = { type: 'json', data: JSON.parse(data.response), raw: data.response, sender: 'bot' };
      } else {
        botMessage = { type: 'text', data: data.response, raw: data.response, sender: 'bot' };
      }

      const updatedSessionWithBot = {
        ...updatedSession,
        messages: [...updatedMessages, botMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithBot : s)));
      setCurrentSession(updatedSessionWithBot);
    } catch (error) {
      const errorMessage = { type: 'text', data: `Error: ${error.message}`, raw: error.message, sender: 'bot', error: true };
      const updatedSessionWithError = {
        ...updatedSession,
        messages: [...updatedMessages, errorMessage],
      };
      setChatSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSessionWithError : s)));
      setCurrentSession(updatedSessionWithError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingMessage(null);
  };

  const handleUpdateSessionTitle = (sessionId, newTitle) => {
    const updatedSessions = chatSessions.map((session) =>
      session.id === sessionId ? { ...session, title: newTitle.length > 30 ? newTitle.slice(0, 27) + '...' : newTitle } : session
    );
    setChatSessions(updatedSessions);
    if (currentSession && currentSession.id === sessionId) {
      setCurrentSession({ ...currentSession, title: newTitle.length > 30 ? newTitle.slice(0, 27) + '...' : newTitle });
    }
  };

  const handleSelectSession = (session) => {
    setCurrentSession(session);
    setInlineEditingMessage(null);
  };

  const models = [
    { value: 'basic', label: 'Basic (LLaMA 3 8B)' },
    { value: 'ultra', label: 'Ultra (LLaMA 3 70B)' },
  ];

  const isToday = (timestamp) => {
    const today = new Date();
    const sessionDate = new Date(timestamp);
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  };

  const isWithinLast7Days = (timestamp) => {
    const now = new Date();
    const sessionDate = new Date(timestamp);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return sessionDate >= sevenDaysAgo && sessionDate <= yesterdayEnd;
  };

  if (!user) {
    navigate('/Login');
    return null;
  }

  return (
    <div className="app">
      <div className="main-container">
        <div className="sidebar">
          <div className="brand-section">
            <img
              src={logoSrc}
              alt="Logo"
              className="sidebar-logo"
              onError={() => setLogoSrc('https://via.placeholder.com/40')}
            />
            <h1 className="brand-name">AI Chatbot</h1>
          </div>
          <div className="conversations">
            <h3>Today</h3>
            {chatSessions
              .filter((session) => isToday(session.timestamp))
              .map((session) => (
                <div
                  key={session.id}
                  className={`conversation-item ${currentSession && currentSession.id === session.id ? 'active' : ''}`}
                >
                  <span onClick={() => handleSelectSession(session)} style={{ flex: 1 }}>
                    {session.title}
                  </span>
                  <button
                    onClick={() => {
                      const newTitle = prompt('Enter new title:', session.title);
                      if (newTitle) handleUpdateSessionTitle(session.id, newTitle);
                    }}
                    className="edit"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteSession(session.id)} className="delete">
                    Delete
                  </button>
                </div>
              ))}
            <h3>Previous 7 Days</h3>
            {chatSessions
              .filter((session) => isWithinLast7Days(session.timestamp))
              .map((session) => (
                <div
                  key={session.id}
                  className={`conversation-item ${currentSession && currentSession.id === session.id ? 'active' : ''}`}
                >
                  <span onClick={() => handleSelectSession(session)} style={{ flex: 1 }}>
                    {session.title}
                  </span>
                  <button
                    onClick={() => {
                      const newTitle = prompt('Enter new title:', session.title);
                      if (newTitle) handleUpdateSessionTitle(session.id, newTitle);
                    }}
                    className="edit"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteSession(session.id)} className="delete">
                    Delete
                  </button>
                </div>
              ))}
            <button className="renew-btn" onClick={() => startNewSession()}>
              New Chat
            </button>
          </div>
        </div>
        <div className="chat-container">
          <header className="header">
            <div className="version-selector">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="version-dropdown"
              >
                {models.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="profile-section">
              <button className="share-btn">🔗</button>
              {user?.profilePic ? (
                <img
                  src={`data:image/jpeg;base64,${user.profilePic}`}
                  alt="Profile"
                  className="profile-pic"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
                />
              ) : (
                <span className="profile-pic">👤</span>
              )}
              <span className="profile-name">{user?.name || 'Guest'}</span>
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  navigate('/Login');
                }}
              >
                Logout
              </button>
            </div>
          </header>
          <div className="main-chat">
            {currentSession ? (
              <div className="chat-content">
                <h2>{currentSession.title}</h2>
                <div className="messages">
                  {currentSession.messages.map((msg, index) => (
                    <MessageItem
                      key={index}
                      msg={msg}
                      index={index}
                      inlineEditingMessage={inlineEditingMessage}
                      setInlineEditingMessage={setInlineEditingMessage}
                      handleSaveInlineEdit={handleSaveInlineEdit}
                      handleCancelInlineEdit={handleCancelInlineEdit}
                      currentSession={currentSession}
                      loading={loading}
                      setShowJsonView={setShowJsonView}
                      showJsonView={showJsonView}
                      downloadTableAsCSV={downloadTableAsCSV}
                      downloadJson={downloadJson}
                      convertTableToJson={convertTableToJson}
                    />
                  ))}
                  {loading && <div className="loading">Loading...</div>}
                </div>
              </div>
            ) : (
              <div className="welcome-message">
                What can I help with? Try typing a prompt or uploading a file (.txt, .docx, .pdf, or image).
              </div>
            )}
          </div>
          <form className="input-container" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".txt,.docx,.pdf,image/*"
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
                className="attachment-icon"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/24')}
              />
            </button>
            <textarea
              placeholder="Type a prompt or upload a file (.txt, .docx, .pdf, or image)..."
              disabled={loading}
              className="prompt-textarea"
              rows="4"
            />
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
            >
              <img
                src="/voice-icon.png"
                alt="Voice"
                className="voice-icon"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/24')}
              />
            </button>
            <button type="submit" className="send-btn" disabled={loading}>
              {loading ? 'Generating...' : 'Send'}
            </button>
          </form>
          <div className="disclaimer">
            AI Chatbot can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;