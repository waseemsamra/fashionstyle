// services/userService.js
const API_URL = "https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws";

class UserService {
    constructor() {
        this.currentUser = null;
    }

    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const token = localStorage.getItem('jwt_token');
        if (!token) return null;
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.currentUser = { email: decoded.email, name: decoded.name };
            return this.currentUser;
        } catch (e) {
            return null;
        }
    }

    async request(endpoint, options = {}) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('No user logged in');
        const encodedEmail = encodeURIComponent(user.email);
        const url = `${API_URL}/users/${encodedEmail}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    // Dashboard Overview
    async getDashboardOverview() {
        return this.request('/dashboard/overview');
    }

    // Profile
    async getProfile() { return this.request('/profile'); }
    async updateProfile(data) { return this.request('', { method: 'PUT', body: JSON.stringify(data) }); }

    // Addresses
    async getAddresses() { return this.request('/addresses'); }

    // Orders
    async getOrders() { return this.request('/orders'); }
    async getOrderDetails(orderId) { return this.request(`/orders/${orderId}`); }

    // Wishlist
    async getWishlist() { return this.request('/wishlist'); }
    async addToWishlist(productId) { return this.request('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }); }
    async removeFromWishlist(productId) { return this.request(`/wishlist/${productId}`, { method: 'DELETE' }); }

    // Cart
    async getCart() { return this.request('/cart'); }

    // Payment Methods
    async getPaymentMethods() { return this.request('/payment-methods'); }
    async addPaymentMethod(data) { return this.request('/payment-methods', { method: 'POST', body: JSON.stringify(data) }); }
    async removePaymentMethod(methodId) { return this.request(`/payment-methods/${methodId}`, { method: 'DELETE' }); }

    // Wallet
    async getWallet() { return this.request('/wallet'); }
    async addFunds(amount) { return this.request('/wallet/add-funds', { method: 'POST', body: JSON.stringify({ amount }) }); }

    // Notifications
    async getNotifications() { return this.request('/notifications'); }
    async markNotificationsRead() { return this.request('/notifications/read', { method: 'PUT' }); }

    // Coupons
    async getCoupons() { return this.request('/coupons'); }
}

export const userService = new UserService();
