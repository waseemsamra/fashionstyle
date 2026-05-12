// components/dashboard/TopNavbar.jsx
import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

const TopNavbar = ({ activeTab, setActiveTab }) => {
    const { user, notifications, unreadCount, markNotificationsRead } = useDashboard();
    const [showNotifications, setShowNotifications] = useState(false);

    const tabs = [
        { id: 'overview', label: '📊 Overview', icon: '📊' },
        { id: 'profile', label: '👤 Profile', icon: '👤' },
        { id: 'orders', label: '📦 Orders', icon: '📦' },
        { id: 'wishlist', label: '❤️ Wishlist', icon: '❤️' },
        { id: 'addresses', label: '📍 Addresses', icon: '📍' },
        { id: 'payments', label: '💳 Payments', icon: '💳' },
        { id: 'wallet', label: '👛 Wallet', icon: '👛' },
        { id: 'coupons', label: '🏷️ Coupons', icon: '🏷️' },
        { id: 'security', label: '🔒 Security', icon: '🔒' }
    ];

    return (
        <nav className="dashboard-navbar">
            <div className="nav-logo">
                <h2>👔 FashionStore</h2>
            </div>
            
            <div className="nav-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="nav-actions">
                <div className="notification-wrapper">
                    <button 
                        className="notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        🔔
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </button>
                    
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h4>Notifications</h4>
                                <button onClick={markNotificationsRead}>Mark all read</button>
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <p>No notifications</p>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                                            <p>{notif.message}</p>
                                            <small>{new Date(notif.date).toLocaleDateString()}</small>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="user-menu">
                    <img src={user?.avatar || 'https://via.placeholder.com/40'} alt="Avatar" />
                    <span>{user?.name || user?.email?.split('@')[0]}</span>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
