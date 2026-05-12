// contexts/DashboardContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = await userService.getCurrentUser();
            const profile = await userService.getProfile();
            const notifs = await userService.getNotifications();
            setUser({ ...currentUser, ...profile });
            setNotifications(notifs.notifications || []);
            setUnreadCount(notifs.unreadCount || 0);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const markNotificationsRead = async () => {
        await userService.markNotificationsRead();
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <DashboardContext.Provider value={{
            user, loading, notifications, unreadCount,
            markNotificationsRead, refreshUser: loadUserData
        }}>
            {children}
        </DashboardContext.Provider>
    );
};
