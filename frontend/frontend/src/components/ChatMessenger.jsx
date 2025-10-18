import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatMessenger.css';
import { useNavigate, Link } from 'react-router-dom';

// === CONFIGURATION ===
// NOTE: These should ideally come from an authentication context in a real app
// === CONFIGURATION ===
// NOTE: These should ideally come from an authentication context in a real app
const CURRENT_USER_ID = 1;
// eslint-disable-next-line no-unused-vars 
const CURRENT_USER_ROLE = 'Freelancer'; // <-- Suppression for static config
const DJANGO_BASE_URL = 'http://localhost:8000';
const WEBSOCKET_URL = 'ws://localhost:8000/ws/chat/'; 

// Define available filters based on roles
const AVAILABLE_FILTERS = [
    { label: 'All', role: 'All' },
    { label: 'Recruiters', role: 'Recruiter' },
    { label: 'Clients', role: 'Client' },
];

function ChatMessenger({ onClose }) {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    // 💡 NEW STATE: To track which filter button is active
    const [activeFilter, setActiveFilter] = useState('All');
          
    const chatSocket = useRef(null);

    const getOtherParticipant = (conv) => {
        // Participants is an array, find the one whose ID is not the current user's ID
        return conv.participants.find(p => p.id !== CURRENT_USER_ID);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- 1. DYNAMIC API CALLS ---

    // Function to FETCH the list of conversations from the backend (REST API)
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            // ⚠️ DYNAMIC CALL: Fetches the list of all conversations for the logged-in user
            const response = await fetch(`${DJANGO_BASE_URL}/api/conversations/`);

            if (!response.ok) {
                // Handle non-200 status codes
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setConversations(data);

            // If no conversation is currently selected, select the first one from the fetched list
            if (!selectedConversation && data.length > 0) {
                setSelectedConversation(data[0]);
            }

        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedConversation]);

    // Function to FETCH messages for the selected conversation (REST API)
    const fetchMessages = useCallback(async (conversationId) => {
        setIsLoading(true);
        try {
            // ⚠️ DYNAMIC CALL: Fetches the message history for a specific conversation ID
            const response = await fetch(`${DJANGO_BASE_URL}/api/conversations/${conversationId}/messages/`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Assume the API returns an array of messages
            setMessages(data);

        } catch (error) {
            console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);


    // --- 2. WEBSOCKET LOGIC (Handles Real-Time connection) ---

    useEffect(() => {
        if (!selectedConversation) return;

        // 1. Construct the specific WebSocket URL for the conversation
        const wsUrl = `${WEBSOCKET_URL}${selectedConversation.id}/`;

        // 2. Close any existing socket connection
        if (chatSocket.current) {
            chatSocket.current.close();
        }

        // 3. Open a new WebSocket connection
        chatSocket.current = new WebSocket(wsUrl);

        chatSocket.current.onopen = () => {
            console.log('WebSocket connection established for conversation:', selectedConversation.id);
            // After connecting, load the history from REST API
            fetchMessages(selectedConversation.id);
        };

        // 4. Handle incoming messages (Real-Time RECEIVE)
        chatSocket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);

            // Expected server payload keys: 'id', 'sender_id', 'content', 'timestamp'
            const receivedMessage = {
                id: data.id || Date.now(),
                senderId: data.sender_id,
                content: data.content,
                timestamp: data.timestamp,
            };

            // Update UI instantly
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
            // Re-fetch conversations here if you want the last message/timestamp
            // in the left panel to update immediately.
            // fetchConversations();
        };

        chatSocket.current.onclose = () => {
            console.log('WebSocket connection closed.');
        };

        chatSocket.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // 5. Cleanup function: close WebSocket when component unmounts or conversation changes
        return () => {
            if (chatSocket.current) {
                chatSocket.current.close();
            }
        };

    }, [selectedConversation, fetchMessages]);


    // --- 3. LIFECYCLE AND HANDLERS ---

    useEffect(() => {
        // Initial fetch of conversations when the component mounts
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleConversationSelect = (conv) => {
        if (conv.id !== selectedConversation?.id) {
            setSelectedConversation(conv);
            setMessages([]); // Clear old messages instantly
        }
    };

    // Send a new message (Real-Time SEND via WebSocket)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessageContent.trim();

        // Check if content is valid and socket is open
        if (content === '' || !selectedConversation || !chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN) return;

        // 1. Optimistically add message to UI
        const tempId = Date.now();
        const newMessage = {
            id: tempId,
            senderId: CURRENT_USER_ID,
            content: content,
            timestamp: new Date().toISOString(),
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setNewMessageContent('');

        // 2. Prepare message for WebSocket
        const messageToSend = {
            command: 'new_message',
            content: content,
            sender_id: CURRENT_USER_ID,
        };

        try {
            // 3. Send the message through the WebSocket
            chatSocket.current.send(JSON.stringify(messageToSend));

        } catch (error) {
            console.error("Failed to send message via WebSocket:", error);
            // On failure, remove the optimistic update
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
        }
    };

    const handleCloseMessenger = () => {
        // Note: The logic for onClose prop wasn't used, sticking to `Maps` as in original code
        navigate('/dashboard');
    };

    const handleNav = (path) => {
        navigate(path);
    };

    // 💡 MODIFIED: Filtering logic now considers both search query and active role filter
    const filteredConversations = conversations.filter(conv => {
        const participant = getOtherParticipant(conv);
        const name = participant?.username?.toLowerCase() || '';
        const role = participant?.role || '';
        const search = searchQuery.toLowerCase();

        // 1. Apply Search Query Filter
        const matchesSearch = name.includes(search) || role.toLowerCase().includes(search);

        // 2. Apply Role Filter
        const matchesRole = activeFilter === 'All' || role === activeFilter;

        return matchesSearch && matchesRole;
    });

    const selectedParticipant = selectedConversation ? getOtherParticipant(selectedConversation) : null;

    // --- 4. RENDER UI ---
    return (
        <div className="chat-messenger-page">

            {/* 1. TOP NAVIGATION BAR (Unchanged) */}
            <nav className="top-nav-bar dashboard-header">
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">
                        <span className="logo-text">TalentLoop</span>
                    </Link>
                </div>

                <div className="nav-links header-buttons">
                    <button className="header-btn profile-btn" onClick={() => handleNav('/profile')}>Profile</button>
                    <button className="header-btn lexi-ai-btn" onClick={() => handleNav('/chat')}>LEXI AI</button>
                    <button className="header-btn logout-btn" onClick={() => handleNav('/logout')}>Logout</button>
                </div>
            </nav>

            {/* 2. MESSAGES PAGE HEADER (Unchanged) */}
            <header className="page-content-header dashboard-content-header">
                <div className="chat-messenger-title content-title-text">
                    <h2 className="title section-title">MESSAGES</h2>
                </div>

                <button
                    className="close-messenger-btn header-btn"
                    onClick={handleCloseMessenger}
                    aria-label="Close Messenger"
                >
                    Close
                </button>
            </header>

            {/* --- Main Content Area --- */}
            <div className="chat-main-container">
                {/* 1. Conversation List (Left Panel) */}
                <div className="conversation-list-panel stats-section">

                    <div className="messages-title-bar">
                         <h3 className="section-subtitle">Messages</h3>
                         <div className="total-count">Total {conversations.length} | Unread 1</div>
                    </div>

                    <div className="conversation-search">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* 💡 MODIFIED: Conversation Filters */}
                    <div className="conversation-filters">
                        {AVAILABLE_FILTERS.map(filter => (
                            <button
                                key={filter.role}
                                className={`filter-btn ${activeFilter === filter.role ? 'active' : ''}`}
                                onClick={() => setActiveFilter(filter.role)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="conversation-list-scroll">
                        {isLoading && conversations.length === 0 ? (
                            <div className="chat-loading">Loading chats...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="chat-no-data">
                                {searchQuery ? 'No results found for your search.' : `No ${activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} conversations.`}
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const participant = getOtherParticipant(conv);
                                const isSelected = selectedConversation && selectedConversation.id === conv.id;

                                return (
                                    <div
                                        key={conv.id}
                                        className={`conversation-item stat-card ${isSelected ? 'selected-conv' : ''}`}
                                        onClick={() => handleConversationSelect(conv)}
                                    >
                                        <div className="participant-avatar">
                                            {participant?.username?.[0] || 'U'}
                                        </div>
                                        <div className="conversation-details">
                                            <p className="participant-name stat-label">{participant?.username || 'Unknown User'}</p>
                                            <span className="participant-role project-earned">{participant?.role || 'User'}</span>
                                            <p className="last-message-content">{conv.last_message || 'Start a conversation.'}</p>
                                        </div>
                                        <div className="conversation-status">
                                            <span className="last-message-time project-earned">
                                                {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Chat Window (Right Panel - Unchanged) */}
                <div className="chat-window-panel">
                    {selectedConversation ? (
                        <>
                            {/* Header */}
                            <div className="chat-window-header">
                                <div className="participant-avatar large">
                                    {selectedParticipant?.username?.[0] || 'U'}
                                </div>
                                <div>
                                    <h3 className="participant-name project-name">{selectedParticipant?.username || 'Unknown User'}</h3>
                                    <p className="participant-role project-earned">{selectedParticipant?.role || 'User'}</p>
                                </div>
                            </div>

                            {/* Messages Body */}
                            <div className="chat-messages-body">
                                {isLoading ? (
                                    <div className="chat-loading">Loading message history...</div>
                                ) : (
                                    messages.map((message) => {
                                        const isCurrentUser = message.senderId === CURRENT_USER_ID;
                                        return (
                                            <div
                                                key={message.id || Math.random()}
                                                className={`message-row ${isCurrentUser ? 'current-user' : 'other-user'}`}
                                            >
                                                <div className="message-bubble">
                                                    <p className="message-content">{message.content}</p>
                                                    <span className="message-timestamp">
                                                        {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSendMessage} className="chat-input-form">
                                <input
                                    type="text"
                                    value={newMessageContent}
                                    onChange={(e) => setNewMessageContent(e.target.value)}
                                    placeholder={`Type a message to ${selectedParticipant?.username}...`}
                                    className="message-input"
                                    disabled={!selectedConversation || chatSocket.current?.readyState !== WebSocket.OPEN}
                                />
                                <button
                                    type="submit"
                                    className={`send-button apply-btn ${newMessageContent.trim() === '' ? 'disabled' : ''}`}
                                    disabled={newMessageContent.trim() === '' || chatSocket.current?.readyState !== WebSocket.OPEN}
                                >
                                    <span role="img" aria-label="send">➤</span>
                                </button>
                                {/* Display status for debugging */}
                                {chatSocket.current?.readyState !== WebSocket.OPEN &&
                                    <span style={{color: 'red', fontSize: '0.7rem', marginLeft: '10px'}}>Connecting...</span>
                                }
                            </form>
                        </>
                    ) : (
                        <div className="chat-no-conversation">
                            Select a conversation to start chatting.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatMessenger;