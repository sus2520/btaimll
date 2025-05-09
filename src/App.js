import React, { useState, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  // Initialize Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://0xq2bqc3sxjbga-8888.proxy.runpod.net/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success' && data.report) {
        setMessages((prev) => [
          ...prev,
          { text: data.report, sender: 'bot' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: `Error: ${data.error || 'Failed to generate a response'}`, sender: 'bot' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: `Error: Failed to connect to the server (${error.message})`, sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

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

  const conversations = [
    'Project Proposal Rewrite',
    'Image similarity',
    'Factory Management System',
    'AI Data Extraction Bid',
    'Flight Price Prediction Model',
    'Push to