import React, { useState } from 'react';
import './Chatbot.css';
import axios from 'axios';

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const ruleBasedResponses = {
  "Hi": "Hello, how can I help you?",
  "Hello": "Hi there! How can I assist you today?",
  "What are your business hours?": "Our business hours are from 9 AM to 6 PM, Monday to Friday.",
  "How can I schedule an appointment?": "To schedule an appointment, you can use our website or call our office.",
  "What is the pricing for consultations?": "Consultation fees vary. Please check our website for the most up-to-date information.",
  "Can you help me with health advice?": "I can guide you, but it's best to consult with a professional for personalized advice.",
  "What is telemedicine?": "Telemedicine is a way to consult with a doctor remotely using video calls or online chats.",
  "What is AidME?": "AidME is a healthcare platform that connects patients with doctors for appointments, consultations, and health management.",
  "How do I contact the support team?": "You can contact our support team via email at support@aidme.com or use the chat option on our website.",
  "Is my data secure?": "Yes, we take your privacy seriously. All your information is securely stored and handled according to privacy regulations.",
  "Can I reschedule my appointment?": "Yes, you can reschedule your appointment using your account dashboard or by contacting our support team.",
  "What should I do if I face technical issues?": "If you face any technical issues, please contact our support team and they will assist you promptly.",
  "Do you provide emergency consultations?": "Currently, AidME offers scheduled consultations. For emergencies, please contact your nearest hospital or emergency services.",
  "How do I create an account?": "You can create an account by signing up on the AidME website using your email or phone number.",
  "I forgot my password. What should I do?": "Click on 'Forgot Password' on the login page and follow the instructions to reset your password.",
  "Can I cancel my appointment?": "Yes, you can cancel your appointment from your dashboard or contact the support team for assistance.",
  "What services does AidME offer?": "AidME provides online consultations, appointment booking, telemedicine services, and health management tools.",
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
  
    const ruleResponse = ruleBasedResponses[question];
    if (ruleResponse) {
      setMessages(prev => [...prev, { text: ruleResponse, sender: 'bot', time: new Date().toLocaleTimeString() }]);
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }          
        }
      );
  
      const aiText = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { text: aiText, sender: 'bot', time: new Date().toLocaleTimeString() }]);
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, the AI is currently unavailable. Please try again later.', sender: 'bot', time: new Date().toLocaleTimeString() }
      ]);
    }
  
    setLoading(false);
  };  

  return (
    <>
      <div className="chatbot-toggle" onClick={toggleChat}>
        <img 
          src="/bot.png" 
          alt="Chatbot" 
          style={{ width: "100px", height: "140px", borderRadius: "50%" }} 
        />
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
