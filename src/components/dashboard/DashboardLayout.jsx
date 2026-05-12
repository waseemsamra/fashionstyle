// components/dashboard/DashboardLayout.jsx
import React, { useState } from 'react';
import { DashboardProvider } from '../../contexts/DashboardContext';
import TopNavbar from './TopNavbar';
import Overview from './Overview';
import Profile from './Profile';
import Orders from './Orders';
import Wishlist from './Wishlist';
import Addresses from './Addresses';
import PaymentMethods from './PaymentMethods';
import Wallet from './Wallet';
import Coupons from './Coupons';
import Security from './Security';

const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <Overview />;
            case 'profile': return <Profile />;
            case 'orders': return <Orders />;
            case 'wishlist': return <Wishlist />;
            case 'addresses': return <Addresses />;
            case 'payments': return <PaymentMethods />;
            case 'wallet': return <Wallet />;
            case 'coupons': return <Coupons />;
            case 'security': return <Security />;
            default: return <Overview />;
        }
    };

    return (
        <DashboardProvider>
            <div className="dashboard-container">
                <TopNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="dashboard-main">
                    {renderContent()}
                </main>
            </div>
        </DashboardProvider>
    );
};

export default DashboardLayout;
