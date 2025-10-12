import React, { useState, useRef, useEffect } from 'react';
import './chat.css'; // Assuming you are using the full-screen styles

// --- 1. Define FAQ Responses Object ---
const faqResponses = {
  freelancer: {
    'how to get started': "To get started as a freelancer: 1) Create your profile with your skills and portfolio 2) Browse available projects 3) Submit proposals 4) Communicate with clients 5) Deliver quality work on time!",
    'payment': "Payments are processed securely through our platform. You'll receive payment once the client approves your work. We support multiple payment methods including bank transfers, PayPal, and cryptocurrency.",
    'profile': "Your profile is your professional showcase. Include: a professional photo, detailed bio, skills, portfolio samples, certifications, and client testimonials to stand out!",
    'proposals': "Write personalized proposals that address the client's specific needs. Include relevant experience, timeline, and clear pricing. Quality over quantity wins projects!",
    'rates': "Set competitive rates based on your experience and market demand. Research similar freelancers in your field. You can adjust rates as you gain more experience and positive reviews."
  },
  recruiter: {
    'posting jobs': "Post jobs by clicking 'Post a Job', describe your project requirements, set a budget, add required skills, and publish. Your job will be visible to qualified freelancers immediately.",
    'finding talent': "Use our advanced search filters to find freelancers by skills, experience, ratings, and availability. Save promising candidates to your shortlist for easy comparison.",
    'interviewing': "Conduct interviews through our platform's video call feature. Prepare questions about their experience, approach to your project, and availability. Check their portfolio thoroughly.",
    'contracts': "All contracts are legally binding and protected by our platform. Define clear milestones, deadlines, and payment terms. Our escrow system ensures secure transactions.",
    'managing projects': "Use our project management tools to track progress, communicate with freelancers, share files, and approve milestones. Regular check-ins ensure project success."
  },
  general: {
    'about lexi': "I'm Lexi AI, your intelligent assistant for all things freelancing and recruiting. I can help you navigate the platform, answer questions, and provide tips for success!",
    'help': "I can assist with: Creating profiles, posting jobs, writing proposals, payment questions, finding talent, project management, and general platform navigation. What would you like to know?",
    'contact support': "For technical issues or account problems, contact our human support team at support@lexiai.com or use the live chat feature in your dashboard.",
    'fees': "Platform fees are 10% for freelancers on completed projects. Recruiters can post jobs for free, with optional premium features for enhanced visibility.",
    'security': "Your data is protected with enterprise-grade encryption. We use secure payment processing and never share your personal information without consent."
  }
};

// Simplified list of freelancer FAQs for the suggestion buttons
const FREELANCER_FAQ_SUGGESTIONS = [
    'How to get started', 
    'Tell me about payment', 
    'Tips for writing proposals', 
    'How to set my rates', 
    'How to update my profile'
];


const Chat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const welcomeMessage = "Hello! I'm LEXI AI, your personal assistant. I can help you find projects, check project statuses, or answer general freelancing questions. How can I assist you today?";

  // Automatically scroll to the bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  useEffect(scrollToBottom, [messages]);
  
  // Trigger initial AI message when chat opens
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{ text: welcomeMessage, sender: 'ai' }]);
    }
  }, [messages]);


  // --- 2. Updated AI Response Logic (using the faqResponses object) ---
  const getAiResponse = (userMessage) => {
    const input = userMessage.toLowerCase().trim();

    // 1. Check for specific simple greetings/thanks
    if (input.includes('thank')) {
      return "You're welcome! Is there anything else you'd like to know about freelancing or recruiting?";
    }
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
        return "Hello! I'm Lexi AI, your freelancing and recruiting assistant. How can I help you today? You can ask me about freelancing tips, recruiting best practices, or platform features.";
    }

    // 2. Check for Role-based queries (Freelancer/Recruiter)
    if (input.includes('freelancer') || input.includes('freelancing')) {
        return "I can help you with freelancing! Ask me about getting started, setting rates, writing proposals, creating your profile, or handling payments.";
    }        
    if (input.includes('recruiter') || input.includes('hiring') || input.includes('recruit')) {
        return "I can assist with recruiting! Ask about posting jobs, finding talent, interviewing candidates, managing contracts, or project management.";
    }

    // 3. Check specific FAQ keywords and return the corresponding response
    // Iterate through all categories (freelancer, recruiter, general)
    for (const category in faqResponses) {
        for (const query in faqResponses[category]) {
            // Check if the input contains the specific query keyword
            if (input.includes(query)) {
                return faqResponses[category][query];
            }
        }
    }

    // 4. Default response with generalized suggestions
    return "I'm here to help with freelancing and recruiting questions! Try asking about:\n• How to get started as a freelancer\n• Posting jobs as a recruiter\n• Payment and fees\n• Finding talent\n• Writing proposals\n• Managing projects";
  };


  // --- Suggestion Button Handler ---
  const handleSuggestionClick = (suggestion) => {
      handleSendMessage({ preventDefault: () => {} }, suggestion); 
  };

  // --- Send Message Handler ---
  const handleSendMessage = (e, presetMessage = null) => {
    e.preventDefault();
    
    const userMessage = presetMessage || input.trim();
    if (!userMessage) return;

    // 1. Add user message
    const newUserMessage = { text: userMessage, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput(''); 

    // 2. Simulate typing and add AI response
    setTimeout(() => {
      const aiText = getAiResponse(userMessage);
      const aiResponse = { text: aiText, sender: 'ai' };
      
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000); 
  };


  return (
    <div className="chat-overlay-full-screen">
      <div className="chat-window-full-screen">
        
        <header className="chat-header-full-screen">
          <h1 className="chat-title-main">Lexi AI</h1>
          <button className="close-btn-full-screen" onClick={onClose}>&times;</button>
        </header>

        <div className="chat-body-full-screen">
          {messages.map((message, index) => (
            <div key={index} className={`message-row ${message.sender}`}>
              <div className="profile-icon">
                {message.sender === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="message-bubble-full-screen">
                {message.text}
              </div>
            </div>
          ))}

          {/* SUGGESTION BUTTONS (Appear after the first message) */}
          {messages.length === 1 && messages[0].text === welcomeMessage && (
            <div className="suggestions-container-full-screen">
              <p className="suggestions-prompt">Quick FAQs for Freelancers:</p>
              <div className="suggestions-grid">
                {FREELANCER_FAQ_SUGGESTIONS.map((q, index) => (
                  <button 
                    key={index} 
                    className="suggestion-btn-full-screen"
                    onClick={() => handleSuggestionClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form-full-screen" onSubmit={handleSendMessage}>
          <button type="button" className="emoji-btn">😊</button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here something..."
            className="chat-input-full-screen"
          />
          <button type="submit" className="send-btn-full-screen">
             <span role="img" aria-label="send">✏️</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;