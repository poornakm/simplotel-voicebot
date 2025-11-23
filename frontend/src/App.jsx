import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, BarChart3, Loader2, MessageSquare, Database } from 'lucide-react';


function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    avgResponseTime: 0,
    successRate: 100,
    commonIntents: []
  });

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          handleUserInput(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Load analytics
    fetchAnalytics();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleUserInput = async (text) => {
    if (!text.trim()) return;

    const userMessage = { type: 'user', text, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    setTranscript('');
    setIsProcessing(true);

    try {
      const startTime = Date.now();

      // Call backend API
      const response = await fetch('https://simplotel-voicebot-api.onrender.com/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const botMessage = {
        type: 'bot',
        text: data.response,
        intent: data.intent,
        entities: data.entities,
        timestamp: new Date(),
        responseTime
      };

      setConversation(prev => [...prev, botMessage]);

      // Text-to-Speech
      // if ('speechSynthesis' in window && data.response) {
      //   const utterance = new SpeechSynthesisUtterance(data.response);
      //   utterance.rate = 0.9;
      //   utterance.pitch = 1;
      //   utterance.volume = 1;
      //   window.speechSynthesis.speak(utterance);
      // }

      if ('speechSynthesis' in window && data.response) {
        // STOP any current speech before speaking a new response
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }


      // Update analytics
      fetchAnalytics();
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('https://simplotel-voicebot-api.onrender.com/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (transcript.trim()) {
      handleUserInput(transcript);
    }
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Simplotel Voice Bot</h1>
                <p className="text-gray-600">AI-Powered Customer Support Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversation</h2>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {conversation.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Start a conversation by speaking or typing</p>
                    <p className="text-sm mt-2">Try asking about hotel bookings, room availability, or amenities</p>
                  </div>
                )}

                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${msg.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.intent && (
                        <div className="mt-2 pt-2 border-t border-gray-300 text-xs opacity-75">
                          Intent: {msg.intent}
                        </div>
                      )}
                      <p className="text-xs mt-1 opacity-75">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span className="text-gray-600">Processing...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type your message or click the mic..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`px-6 py-3 rounded-lg transition ${isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  disabled={isProcessing || !transcript.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }}
                  className={`px-6 py-3 rounded-lg transition ${isSpeaking
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }`}
                  disabled={!isSpeaking}
                >
                  Stop
                </button>


              </form>
            </div>
          </div>

          {/* Analytics & Info Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-indigo-600">{analytics.totalQueries}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.successRate}%</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.avgResponseTime}ms</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Speech-to-Text Recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Natural Language Understanding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Intent Recognition & Entity Extraction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>AI-Powered Response Generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Text-to-Speech Output</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Database Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Real-time Analytics Dashboard</span>
                </li>
              </ul>
            </div>

            {/* Sample Queries */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Try Asking</h3>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => handleUserInput("What are your room rates?")}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  disabled={isProcessing}
                >
                  "What are your room rates?"
                </button>
                <button
                  onClick={() => handleUserInput("Do you have rooms available?")}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  disabled={isProcessing}
                >
                  "Do you have rooms available?"
                </button>
                <button
                  onClick={() => handleUserInput("What amenities do you offer?")}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  disabled={isProcessing}
                >
                  "What amenities do you offer?"
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Queries</p>
                    <p className="text-3xl font-bold text-indigo-600">{analytics.totalQueries}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-green-600">{analytics.successRate}%</p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average Response Time</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.avgResponseTime}ms</p>
                </div>

                {analytics.commonIntents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Common Intents</h3>
                    <div className="space-y-2">
                      {analytics.commonIntents.map((intent, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">{intent.intent}</span>
                          <span className="text-indigo-600 font-bold">{intent.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;