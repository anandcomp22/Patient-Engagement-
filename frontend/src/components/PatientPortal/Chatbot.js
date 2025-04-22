import React, { useState } from 'react';
import './Chatbot.css';
import axios from 'axios';
import { Support } from '@mui/icons-material';

// Replace with your DeepAI API key
const API_KEY = "3dc581ec-c6af-4c79-bfaa-aedccb15ec47";

const ruleBasedResponses = {
  "What are your business hours?": "Our business hours are from 9 AM to 6 PM, Monday to Friday.",
  "How can I schedule an appointment?": "To schedule an appointment, you can use our website or call our office.",
  "What is the pricing for consultations?": "Consultation fees vary. Please check our website for the most up-to-date information.",
  "Can you help me with health advice?": "I can guide you, but it's best to consult with a professional for personalized advice.",
  "What is telemedicine?": "Telemedicine is a way to consult with a doctor remotely using video calls or online chats.",
};

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => {
    setOpen(!open);
  };

  const handleSend = async () => {
    if (!question.trim()) return;
    const newMessage = { text: question, sender: 'user', time: new Date().toLocaleTimeString() };
    setMessages([...messages, newMessage]);
    setQuestion('');
    setLoading(true);

    // Check for rule-based response first
    const ruleResponse = ruleBasedResponses[question];
    if (ruleResponse) {
      setMessages(prev => [...prev, { text: ruleResponse, sender: 'bot', time: new Date().toLocaleTimeString() }]);
      setLoading(false);
      return;
    }

    // Fallback to DeepAI if no rule-based response is found
    try {
      const response = await axios.post(
        'https://api.deepai.org/api/text-generator',
        {
          text: newMessage.text
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiText = response.data.output;
      setMessages(prev => [...prev, { text: aiText, sender: 'bot', time: new Date().toLocaleTimeString() }]);
    } catch (error) {
      console.error("Error from DeepAI:", error);

      // Fallback message if DeepAI API fails
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, the AI service is currently unavailable. Please ask a different question.', sender: 'bot', time: new Date().toLocaleTimeString() }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="chatbot-toggle" onClick={toggleChat}>
        <Support style={{ fontSize: 40 }} />
      </div>

      {open && (
        <div className="chatbox">
          <div className="chat-header">Ask Our AI Expert</div>
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div>{msg.text}</div>
                <span className="timestamp">{msg.time}</span>
              </div>
            ))}
            {loading && <div className="chat-message bot"><em>Typing...</em></div>}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
