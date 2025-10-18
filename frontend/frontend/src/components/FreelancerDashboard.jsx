import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FreelancerDashboard.css';
// 1. Lexi AI Chat component (Your existing AI file)
import LexiAIChat from './Chat'; 
// *** MODIFICATION: Corrected import name/path for P2P Chat component ***
// Assuming the P2P chat component is called ChatMessenger and is located in './ChatMessenger'
import ChatMessenger from './ChatMessenger'; 

const FreelancerDashboard = () => {
    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();

    // State for the Lexi AI Chatbot
    const [isLexiChatOpen, setIsLexiChatOpen] = useState(false);
    
    // State for the Recruiter Message Chat (P2P)
    const [isRecruiterChatOpen, setIsRecruiterChatOpen] = useState(false);

    // Function to toggle the Lexi AI chat window
    const handleLexi = () => {
        // Toggle Lexi AI chat
        setIsLexiChatOpen(prev => !prev);
        // Ensure P2P chat is closed
        if (isRecruiterChatOpen) setIsRecruiterChatOpen(false);
    };

    // Function to toggle the Recruiter Messages window
    const handleMessages = () => {
        // Toggle P2P chat
        setIsRecruiterChatOpen(prev => !prev);
        // Ensure Lexi AI chat is closed
        if (isLexiChatOpen) setIsLexiChatOpen(false);
    };
    
    // Placeholder functions (assuming logic is elsewhere or simplified for brevity)
    const handleLogout = async () => { 
        // Example logic from Recruiter Dashboard:
        /*
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        try {
          // ... fetch logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/');
        } catch (err) {
          // ... handle error
          navigate('/');
        }
        */
        console.log('Logging out...');
        navigate('/'); // Placeholder navigation
    };
    const handleProfile = () => { 
        console.log('Navigating to profile...');
        navigate('/freelancer-profile');
    };
    // eslint-disable-next-line no-unused-vars
    const handleApply = (projectName) => { 
        console.log(`Applying for project: ${projectName}`);
        // In a real app, this would trigger an API call
    };

    // *** MODIFICATION: Full-Page Conditional Rendering for P2P Chat ***
    // If the P2P chat is open, render it as a full-page view, hiding the dashboard.
    if (isRecruiterChatOpen) {
        return (
            <ChatMessenger 
                onClose={() => setIsRecruiterChatOpen(false)} 
                // You would pass the actual current user ID here in a real app
                // currentUserId={123} 
            />
        );
    }
    // ******************************************************************


    return (
        <div className="dashboard-page">
            {/* Header Section */}
            <header className="dashboard-header">
                <div className="welcome-text">
                    <h1>Welcome! Freelancer</h1>
                </div>
                <div className="header-buttons">
                    
                    {/* LEXI AI Button - Calls handleLexi */}
                    <button className="header-btn" onClick={handleLexi}>
                        <span className="robot-icon" role="img" aria-label="robot">🤖</span> LEXI AI
                    </button>
                    
                    {/* MESSAGES Button - Calls handleMessages */}
                    {/* This button is now responsible for opening the full-page ChatMessenger */}
                    <button 
                        className="header-btn message-icon-btn" 
                        onClick={handleMessages}
                        title="Messages" 
                    >
                        <span className="message-icon" role="img" aria-label="messages">💬</span> Messages
                    </button>

                    <button className="header-btn" onClick={handleProfile}>
                        Profile
                    </button>
                    <button className="header-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Dashboard Content - Only visible if P2P chat is NOT open */}
            <div className="dashboard-content"> 
                {/* Top Section: Stats and Projects Completed */}
                <div className="dashboard-top-section">
                    {/* ... (Existing Stats/Projects Completed sections) ... */}
                    <div className="stats-section">
                        <h2 className="section-title">Total Earnings this month</h2>
                        <div className="earnings-amount">₹12,000</div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Projects completed</div>
                                <div className="stat-value">10</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Overall ratings</div>
                                <div className="stat-value">4.8 ⭐</div>
                            </div>
                        </div>
                    </div>
                    <div className="projects-completed-section">
                        <h2 className="section-title">Projects Completed</h2>
                        <div className="completed-projects-list">
                            <div className="completed-project-card">
                                <div className="project-name">Web Dev</div>
                                <div className="project-earned">Earned ₹4000</div>
                            </div>
                            <div className="completed-project-card">
                                <div className="project-name">Python Dev</div>
                                <div className="project-earned">Earned ₹4000</div>
                            </div>
                            <div className="completed-project-card">
                                <div className="project-name">DBA</div>
                                <div className="project-earned">Earned ₹4000</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Find Projects Section (Bottom Full Width) */}
                <div className="find-projects-section">
                    <h2 className="section-title">Find Projects</h2>
                    <div className="available-projects">
                        <div className="project-card">
                            <div className="project-info">
                                <h3 className="project-title">Web Dev</h3>
                                <div className="project-details">
                                    <span className="project-budget">₹4500</span>
                                    <span className="project-separator">•</span>
                                    <span className="project-client">XYZ Solutions</span>
                                </div>
                            </div>
                            <button 
                                className="apply-btn"
                                onClick={() => handleApply('Web Dev')}
                            >
                                Apply
                            </button>
                        </div>
                        <div className="project-card">
                            <div className="project-info">
                                <h3 className="project-title">DBA</h3>
                                <div className="project-details">
                                    <span className="project-budget">₹4500</span>
                                    <span className="project-separator">•</span>
                                    <span className="project-client">ABC Solutions</span>
                                </div>
                            </div>
                            <button 
                                className="apply-btn"
                                onClick={() => handleApply('DBA')}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div> 
            
            {/* Conditional rendering: Lexi AI Chat - Renders as an overlay/side panel */}
            {isLexiChatOpen && (
                <LexiAIChat
                    onClose={() => setIsLexiChatOpen(false)}
                    userRole='freelancer'
                    isAIChat={true}
                />
            )}
            
            {/* The P2P chat (ChatMessenger) is now rendered as a full-page view 
                via the 'if (isRecruiterChatOpen) return <ChatMessenger ...>' block above, 
                so this conditional block is no longer needed.
            */}
        </div>
    );
};
export default FreelancerDashboard;