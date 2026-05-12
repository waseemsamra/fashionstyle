// components/dashboard/Overview.jsx
import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import userService from '../../services/userService';

const Overview = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        const data = await userService.getDashboardOverview();
        setDashboardData(data);
        setLoading(false);
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    const { kpis, monthlyTrends, recentOrders, user } = dashboardData;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="dashboard-overview">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h1>Welcome back, {user?.name || 'Valued Customer'}! 👋</h1>
                <p>Here's what's happening with your account today.</p>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon">📦</div>
                    <div className="kpi-value">{kpis.totalOrders}</div>
                    <div className="kpi-label">Total Orders</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">💰</div>
                    <div className="kpi-value">${kpis.totalSpent.toFixed(2)}</div>
                    <div className="kpi-label">Total Spent</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">📊</div>
                    <div className="kpi-value">${kpis.averageOrderValue.toFixed(2)}</div>
                    <div className="kpi-label">Avg Order Value</div>
                </div>
                <div className="kpi-card pending">
                    <div className="kpi-icon">⏳</div>
                    <div className="kpi-value">{kpis.pendingOrders}</div>
                    <div className="kpi-label">Pending Orders</div>
                </div>
                <div className="kpi-card shipped">
                    <div className="kpi-icon">🚚</div>
                    <div className="kpi-value">{kpis.shippedOrders}</div>
                    <div className="kpi-label">Shipped Orders</div>
                </div>
                <div className="kpi-card delivered">
                    <div className="kpi-icon">✅</div>
                    <div className="kpi-value">{kpis.deliveredOrders}</div>
                    <div className="kpi-label">Delivered Orders</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Order Trends (Monthly)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Spending ($)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Order Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Pending', value: kpis.pendingOrders },
                                    { name: 'Processing', value: kpis.processingOrders },
                                    { name: 'Shipped', value: kpis.shippedOrders },
                                    { name: 'Delivered', value: kpis.deliveredOrders },
                                    { name: 'Cancelled', value: kpis.cancelledOrders }
                                ]}
                                cx="50%" cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                            >
                                {Object.keys(kpis).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="recent-orders">
                <h3>Recent Orders</h3>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map(order => (
                            <tr key={order.orderId}>
                                <td>{order.orderId?.slice(-8)}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>${order.total?.toFixed(2)}</td>
                                <td><span className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</span></td>
                                <td><button className="view-btn">View</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Overview;
