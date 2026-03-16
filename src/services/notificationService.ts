export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  phoneNumber?: string;
  orderConfirmed: boolean;
  orderShipped: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  exceptions: boolean;
  reminders: boolean;
}

export interface Notification {
  id: string;
  orderId: string;
  customerId: string;
  type: string;
  channel: 'email' | 'sms';
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

const API_BASE = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

class NotificationService {
  async sendNotification(data: {
    type: string;
    orderId: string;
    customerId: string;
    channel?: 'email' | 'sms';
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/delivery/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notification failure shouldn't block user flow
      return { results: [] };
    }
  }

  async getPreferences(customerId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${API_BASE}/admin/delivery/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      
      // Cache in localStorage
      localStorage.setItem(`notification_prefs_${customerId}`, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem(`notification_prefs_${customerId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Default preferences
      return {
        email: true,
        sms: false,
        phoneNumber: undefined,
        orderConfirmed: true,
        orderShipped: true,
        outForDelivery: true,
        delivered: true,
        exceptions: true,
        reminders: true
      };
    }
  }

  async updatePreferences(
    customerId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/delivery/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId, preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      // Update cache
      const current = await this.getPreferences(customerId);
      localStorage.setItem(
        `notification_prefs_${customerId}`,
        JSON.stringify({ ...current, ...preferences })
      );
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  async getNotificationHistory(
    customerId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/delivery/notifications/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId, limit })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification history');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  async getOrderNotifications(orderId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/delivery/notifications/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order notifications');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching order notifications:', error);
      return [];
    }
  }
}

export default new NotificationService();
