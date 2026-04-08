import { useState } from 'react';
import { Mail, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { orderManagementApi, type Order } from '@/services/orderManagement';

interface VendorNotificationPanelProps {
  order: Order;
  onStatusUpdate?: () => void;
}

export default function VendorNotificationPanel({ order, onStatusUpdate }: VendorNotificationPanelProps) {
  const [isNotifying, setIsNotifying] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleNotifyVendor = async () => {
    if (!order.vendorEmail) {
      toast.error('No vendor email configured for this order');
      return;
    }

    setIsNotifying(true);
    try {
      await orderManagementApi.notifyVendor(order.orderId || order.id, order.vendorEmail);
      toast.success(`✅ Vendor notification sent to ${order.vendorEmail}`);
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(`Failed to notify vendor: ${error.message}`);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleVendorAccept = async () => {
    try {
      await orderManagementApi.vendorAccept(order.orderId || order.id);
      toast.success('✅ Vendor has accepted the order');
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(`Failed to accept: ${error.message}`);
    }
  };

  const handleVendorReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await orderManagementApi.vendorReject(order.orderId || order.id, rejectReason);
      toast.success('Order rejected and returned to pending');
      setShowRejectModal(false);
      setRejectReason('');
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(`Failed to reject: ${error.message}`);
    }
  };

  // Don't show if not relevant
  if (order.status !== 'vendor-notified' && order.status !== 'vendor-accepted' && order.status !== 'vendor-rejected') {
    return null;
  }

  const isNotified = order.vendorStatus === 'pending' || order.status === 'vendor-notified';
  const isAccepted = order.vendorStatus === 'accepted' || order.status === 'vendor-accepted';
  const isRejected = order.vendorStatus === 'rejected' || order.status === 'vendor-rejected';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-lg">Vendor Communication</h3>
      </div>

      {/* Vendor Email */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Vendor Email:</p>
        <p className="font-medium">{order.vendorEmail || 'Not configured'}</p>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
        isAccepted ? 'bg-green-50 border border-green-200' :
        isRejected ? 'bg-red-50 border border-red-200' :
        'bg-purple-50 border border-purple-200'
      }`}>
        {isAccepted ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : isRejected ? (
          <XCircle className="w-6 h-6 text-red-600" />
        ) : (
          <Clock className="w-6 h-6 text-purple-600" />
        )}
        <div>
          <p className={`font-semibold ${
            isAccepted ? 'text-green-700' :
            isRejected ? 'text-red-700' :
            'text-purple-700'
          }`}>
            {isAccepted ? 'Vendor Accepted' :
             isRejected ? 'Vendor Rejected' :
             'Awaiting Vendor Response'}
          </p>
          {order.vendorNotifiedAt && (
            <p className="text-xs text-gray-600">
              Notified: {new Date(order.vendorNotifiedAt).toLocaleString()}
            </p>
          )}
          {order.vendorAcceptedAt && (
            <p className="text-xs text-gray-600">
              Accepted: {new Date(order.vendorAcceptedAt).toLocaleString()}
            </p>
          )}
          {order.vendorRejectedReason && (
            <p className="text-xs text-red-600 mt-1">
              Reason: {order.vendorRejectedReason}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Notify Vendor */}
        {(order.status === 'confirmed' as boolean) && order.vendorEmail && (
          <Button
            onClick={handleNotifyVendor}
            disabled={isNotifying}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isNotifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Notify Vendor
              </>
            )}
          </Button>
        )}

        {/* Accept Order */}
        {isNotified && (
          <Button
            onClick={handleVendorAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept
          </Button>
        )}

        {/* Reject Order */}
        {isNotified && (
          <Button
            onClick={() => setShowRejectModal(true)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-lg">Reject Order</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this order. The order will be returned to pending status.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 mb-4"
              rows={4}
            />

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVendorReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
