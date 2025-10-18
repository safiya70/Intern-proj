import React from 'react';
import FreelancerDashboard from './FreelancerDashboard';
// You will need to create this component next
import RecruiterDashboard from './RecruiterDashboard'; 

// NOTE: In a real application, you would fetch the user's role 
// from a global state (like Redux or Context) or from the decrypted AUTH_TOKEN.

// --- SIMULATION CONFIGURATION ---
// Simulate user data after login
const currentUser = {
    id: 1,
    username: 'JohnDoe',
    role: 'freelancer', // <-- Change this to 'recruiter' to test the other view
};
// --- END SIMULATION CONFIGURATION ---


function RoleRouter() {
    const userRole = currentUser.role;

    if (userRole === 'freelancer') {
        return <FreelancerDashboard currentUser={currentUser} />;
    }

    if (userRole === 'recruiter') {
        return <RecruiterDashboard currentUser={currentUser} />;
    }

    // Default or unauthenticated view
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>Please log in with a valid account type.</p>
            {/* You would typically redirect to a Login component here */}
        </div>
    );
}

export default RoleRouter;