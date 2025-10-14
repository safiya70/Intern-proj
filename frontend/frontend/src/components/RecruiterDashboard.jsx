import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecruiterDashboard.css';
import Chat from './Chat';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    requirements: '',
    salary: '',
    contactMail: ''
  });

  const handleLogout = async () => {
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/accounts/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) throw new Error('Logout failed');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
    } catch (err) {
      alert(err.message);
      navigate('/');
    }
  };

  const handleLexi = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleProfile = () => {
    console.log('Navigating to profile...');
    navigate('/recruiter-profile');
  };

  const handleContact = (freelancerName) => {
    console.log(`Contacting ${freelancerName}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostProject = (e) => {
    e.preventDefault();
    console.log('Posting project:', formData);
    // Reset form
    setFormData({
      title: '',
      requirements: '',
      salary: '',
      contactMail: ''
    });
  };

  return (
    <div className="recruiter-dashboard-page">
      {/* Header Section */}
      <header className="recruiter-header">
        <div className="welcome-text">
          <h1>Welcome! Recruiter</h1>
        </div>
        <div className="header-buttons">
          <button ClassName ="header-btn" onClick={handleLexi}>
            <span className="robot-icon" role="img" aria-label="robot">🤖</span> LEXI AI
          </button>
          <button className="header-btn" onClick={handleProfile}>
            Profile
          </button>
          <button className="header-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="recruiter-content">
        {/* Top Section: Analytics and Current Projects */}
        <div className="recruiter-top-section">
          {/* Analytics Section (Left) */}
          <div className="analytics-section">
            <h2 className="section-title">Monthly Analytics</h2>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-label">Money Spent</div>
                <div className="analytics-value">₹80,000</div>
              </div>
              
              <div className="analytics-card">
                <div className="analytics-label">Projects Completed</div>
                <div className="analytics-value">10</div>
              </div>
            </div>
          </div>

          {/* Current Projects Section (Right) */}
          <div className="current-projects-section">
            <h2 className="section-title">Current Projects</h2>
            
            <div className="current-projects-list">
              <div className="current-project-card">
                <div className="project-details">
                  <div className="project-field">
                    <span className="field-label">Project:</span>
                    <span className="field-value">Web Dev</span>
                  </div>
                  <div className="project-field">
                    <span className="field-label">Freelancer:</span>
                    <span className="field-value">XYZ</span>
                  </div>
                  <div className="project-field">
                    <span className="field-label">Pay:</span>
                    <span className="field-value pay-amount">₹4000</span>
                  </div>
                </div>
                <button 
                  className="contact-btn"
                  onClick={() => handleContact('XYZ')}
                >
                  Contact
                </button>
              </div>
              
              <div className="current-project-card">
                <div className="project-details">
                  <div className="project-field">
                    <span className="field-label">Project:</span>
                    <span className="field-value">DBA</span>
                  </div>
                  <div className="project-field">
                    <span className="field-label">Freelancer:</span>
                    <span className="field-value">ABC</span>
                  </div>
                  <div className="project-field">
                    <span className="field-label">Pay:</span>
                    <span className="field-value pay-amount">₹4000</span>
                  </div>
                </div>
                <button 
                  className="contact-btn"
                  onClick={() => handleContact('ABC')}
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Post Projects Section (Bottom Full Width) */}
        <div className="post-projects-section">
          <h2 className="section-title">Post Projects</h2>
          
          <form className="post-project-form" onSubmit={handlePostProject}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter project title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="salary">Salary</label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="e.g., ₹5000"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Describe project requirements..."
                rows="4"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactMail">Contact Mail</label>
              <input
                type="email"
                id="contactMail"
                name="contactMail"
                value={formData.contactMail}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="form-submit">
              <button type="submit" className="post-btn">
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Conditional rendering: Only show Chat when isChatOpen is true */}
      {isChatOpen && (
        <Chat
          onClose={() => setIsChatOpen(false)}
          userRole='recruiter'
        />
      )}

    </div>
  );
};

export default RecruiterDashboard;
