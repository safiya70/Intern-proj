import React, { useState, useRef, useEffect } from 'react';
import './chat.css';

// --- FAQ Responses Object (MODIFIED FOR RECRUITER KEYWORDS) ---
const faqResponses = {
    freelancer: {
        // Freelancer data keys are general because their suggestions are broad
        'project|find projects': "To find the best projects, check the 'Find Projects' section. I've highlighted 'Web Dev' and 'DBA' projects that match your skills perfectly!",
        'earnings|money': "Your total earnings this month are ₹12,000 across 10 completed projects. Keep up the great work!",
        'rating': "Your overall rating is 4.8 ⭐. Your clients consistently praise your promptness and quality of work.",
        'status|active': "You have one project, 'Mobile App Design', currently awaiting client review. It's expected to be finalized by Tuesday.",
        'password|reset': "To change your password, go to 'Profile Settings' in the dashboard and look for the 'Security' tab.",
        'security': "All financial data is encrypted. We use two-factor authentication for added security. For more details, visit the 'Security Policy' link in your footer.",
    },
    recruiter: {
        // Recruiter data keys are more specific to avoid clashes with Freelancer's 'project'
        'post a project': "To post a new project, click the 'Post Projects' section at the bottom of your dashboard. Fill out the title, salary, and requirements.",
        'money have i spent': "Your total money spent this month is ₹80,000. You've successfully completed 10 hires.",
        'find new talent': "Use our advanced search bar to find new talent by skill and rating. I suggest filtering for Python experts.",
        'change password|reset': "To reset your password, click the 'Forgot Password' link on the login page, or visit 'Profile Settings' if you are logged in.",
        'active projects|status': "You currently have two active projects: 'Web Dev' and 'DBA'. Both are on track. Click 'Contact' next to a project to message the freelancer.",
        'security': "Our platform uses secure escrow for all payments. Recruiter accounts are protected with role-based access control.",
    },
    general: {
        'hello|hi|hey': "Hello! I'm LEXI AI, your personal assistant. How can I help you today?",
        'thank|thanks': "You're very welcome! Feel free to ask if anything else comes up.",
    }
};

// --- FAQ SUGGESTIONS (Based on role) ---
const FREELANCER_FAQ_SUGGESTIONS = [
    'How to find projects?', 
    'Tell me about my earnings?', 
    'What is my overall rating?', 
    'How to reset password?',
    'I have an issue'
];

const RECRUITER_FAQ_SUGGESTIONS = [
    'How to post a project?', 
    'How much money have I spent?', 
    'How do I find new talent?', 
    'How to change password?',
    'Tell me about project status'
];

const Chat = ({ onClose, userRole = 'freelancer' }) => {
    
    const isFreelancer = userRole === 'freelancer';
    const suggestions = isFreelancer ? FREELANCER_FAQ_SUGGESTIONS : RECRUITER_FAQ_SUGGESTIONS;
    
    // Dynamically set the initial welcome message using the userRole prop
    const initialWelcomeMessage = `Hello! I'm LEXI AI, your personal ${userRole} assistant. I can help you with your projects, spending, or answer general questions. How can I assist you today?`;

    const [messages, setMessages] = useState([
        { 
            text: initialWelcomeMessage, 
            sender: 'ai' 
        }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const getAiResponse = (userMessage) => {
        const lowerCaseMessage = userMessage.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const roleFAQs = faqResponses[userRole] || {};
        
        // 1. Check Role-Specific FAQs (Recruiter or Freelancer)
        for (const [key, response] of Object.entries(roleFAQs)) {
            // Check if the user's message contains any of the pipe-separated keywords
            const keywords = key.split('|').map(k => k.trim());
            if (keywords.some(k => lowerCaseMessage.includes(k))) {
                return response;
            }
        }
        
        // 2. Check General FAQs
        for (const [key, response] of Object.entries(faqResponses.general)) {
            const keywords = key.split('|').map(k => k.trim());
            if (keywords.some(k => lowerCaseMessage.includes(k))) {
                return response;
            }
        }
        
        return "I'm here to help with your role-specific questions. Try rephrasing your question or clicking one of the suggested FAQs.";
    };
    
    const handleSendMessage = (e, presetMessage = null) => {
        e.preventDefault();
        
        const userMessage = presetMessage || input.trim();
        if (!userMessage) return;

        const newUserMessage = { text: userMessage, sender: 'user' };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInput('');

        setTimeout(() => {
            const aiText = getAiResponse(userMessage);
            const aiResponse = { text: aiText, sender: 'ai' };
            setMessages((prevMessages) => [...prevMessages, aiResponse]);
        }, 1000); 
    };

    const handleSuggestionClick = (suggestion) => {
        // Remove trailing question mark for cleaner lookup in getAiResponse
        handleSendMessage({ preventDefault: () => {} }, suggestion.replace('?', '')); 
    };

    return (
        <div className="chat-overlay">
            <div className="chat-window">
                <header className="chat-header">
                    <div className="chat-title">
                        <span className="robot-icon" role="img" aria-label="robot">🤖</span> LEXI AI Chatbot
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="chat-body">
                    {messages.map((message, index) => (
                        <div key={index} className={`message-row ${message.sender}`}> 
                            <div className="profile-icon">
                                {message.sender === 'ai' ? '🤖' : '👤'}
                            </div>
                            <div className={`message-bubble ${message.sender}`}>
                                {message.text}
                            </div>
                        </div>
                    ))}
                    
                    {/* Role-Aware Suggestion Buttons */}
                    {messages.length === 1 && (
                        <div className="suggestions-container">
                            {/* Dynamically display the correct role name */}
                            <p className="suggestions-prompt">Quick FAQs for {isFreelancer ? 'Freelancers' : 'Recruiters'}:</p>
                            <div className="suggestions-grid">
                                {suggestions.map((q, index) => (
                                    <button 
                                        key={index} 
                                        className="suggestion-btn"
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

                <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        // Dynamically update the placeholder text
                        placeholder={`Ask LEXI about your ${isFreelancer ? 'projects, earnings, or ratings...' : 'projects, spending, or hiring...'}`}
                        className="chat-input"
                    />
                    <button type="submit" className="send-btn">
                          Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;