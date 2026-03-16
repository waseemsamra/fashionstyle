import { useState, useEffect } from 'react';
import {
  RotateCcw,
  Package,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  AlertCircle,
  Download,
  Printer,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import returnsService, {
  type ReturnRequest,
  RETURN_STATUS,
  REFUND_METHODS
} from '@/services/returnsService';

export default function ReturnsManagement() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [refundData, setRefundData] = useState({
    amount: 0,
    method: REFUND_METHODS.ORIGINAL_PAYMENT,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [returnsData, statsData] = await Promise.all([
        returnsService.getReturns({ limit: 50 }),
        returnsService.getReturnStats('month')
      ]);
      
      setReturns(returnsData.items);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading returns data:', error);
      toast.error('Failed to load returns data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReturn = async (returnId: string) => {
    try {
      const returnData = await returnsService.getReturn(returnId);
      setSelectedReturn(returnData);
      setShowReturnModal(true);
    } catch (error) {
      console.error('Error loading return:', error);
      toast.error('Failed to load return details');
    }
  };

  const handleUpdateStatus = async (
    returnId: string,
    status: string,
    note?: string
  ) => {
    try {
      const updated = await returnsService.updateReturnStatus(returnId, status, note);
      setReturns(returns.map(r => r.returnId === returnId ? updated : r));
      if (selectedReturn?.returnId === returnId) {
        setSelectedReturn(updated);
      }
      toast.success(`Return status updated to ${status}`);
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error('Failed to update return status');
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedReturn) return;
    
    try {
      await returnsService.processRefund(selectedReturn.returnId, refundData);
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      await loadData();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    }
  };

  const handleGenerateLabel = async (returnId: string) => {
    try {
      const label = await returnsService.generateReturnLabel(returnId);
      setSelectedReturn(prev => prev ? { ...prev, returnTrackingNumber: label.trackingNumber } : null);
      setShowLabelModal(true);
      toast.success('Return label generated');
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate return label');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      awaiting_return: { color: 'bg-purple-100 text-purple-800', icon: Package },
      item_received: { color: 'bg-indigo-100 text-indigo-800', icon: Package },
      quality_check: { color: 'bg-orange-100 text-orange-800', icon: RefreshCw },
      refund_pending: { color: 'bg-pink-100 text-pink-800', icon: DollarSign },
      refunded: { color: 'bg-green-100 text-green-800', icon: DollarSign },
      exchange_initiated: { color: 'bg-teal-100 text-teal-800', icon: RefreshCw },
      exchange_shipped: { color: 'bg-cyan-100 text-cyan-800', icon: Truck },
      exchange_delivered: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    };
    
    const variant = variants[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    
    const matchesDate = !dateRange.from || !dateRange.to || (
      ret.requestDate >= dateRange.from && ret.requestDate <= dateRange.to
    );
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RotateCcw className="w-8 h-8" />
            Returns Management
          </h1>
          <p className="text-gray-600 mt-1">Manage customer returns, refunds, and exchanges</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <RotateCcw className="w-8 h-8 text-gold opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Refunded</p>
                  <p className="text-2xl font-bold text-green-600">{stats.refunded}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Refunds</p>
                  <p className="text-2xl font-bold text-gold">${stats.totalRefundAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gold opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {Object.values(RETURN_STATUS).map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
          <CardDescription>
            Showing {filteredReturns.length} of {returns.length} returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Return ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Request Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <RotateCcw className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No returns found</p>
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((ret) => (
                    <tr key={ret.returnId} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{ret.returnId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{ret.orderId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{ret.customerName}</p>
                          <p className="text-sm text-gray-500">{ret.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {ret.items.length} item{ret.items.length !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gold">
                          ${ret.estimatedRefund.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ret.status)}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(ret.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReturn(ret.returnId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Return Details Modal */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{selectedReturn.returnId}</h3>
                  <p className="text-sm text-gray-500">Order: {selectedReturn.orderId}</p>
                </div>
                {getStatusBadge(selectedReturn.status)}
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Customer Information</h4>
                <p>{selectedReturn.customerName}</p>
                <p className="text-sm text-gray-600">{selectedReturn.customerEmail}</p>
              </div>

              {/* Return Items */}
              <div>
                <h4 className="font-medium mb-3">Return Items</h4>
                <div className="space-y-2">
                  {selectedReturn.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <span className="font-semibold text-gold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium">{selectedReturn.reason.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Comments</p>
                  <p className="font-medium">{selectedReturn.comments || 'None'}</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gold/5 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedReturn.estimatedRefund.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${selectedReturn.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total Refund:</span>
                    <span className="text-gold">
                      ${(selectedReturn.estimatedRefund + selectedReturn.shippingCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-medium mb-3">Timeline</h4>
                <div className="space-y-3">
                  {selectedReturn.timeline.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-gold flex-shrink-0" />
                      <div>
                        <p className="font-medium">{entry.status.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.note && (
                          <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedReturn.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-600"
                      onClick={() => handleUpdateStatus(selectedReturn.returnId, 'approved', 'Return approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleUpdateStatus(selectedReturn.returnId, 'rejected', 'Return rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {selectedReturn.status === 'approved' && !selectedReturn.returnTrackingNumber && (
                  <Button
                    variant="outline"
                    className="text-purple-600"
                    onClick={() => handleGenerateLabel(selectedReturn.returnId)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Label
                  </Button>
                )}

                {selectedReturn.status === 'item_received' && (
                  <Button
                    className="bg-gold hover:bg-gold/90"
                    onClick={() => setShowRefundModal(true)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={refundData.amount || selectedReturn?.estimatedRefund || 0}
                onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Refund Method</Label>
              <select
                className="w-full p-2 border rounded-lg"
                value={refundData.method}
                onChange={(e) => setRefundData({ ...refundData, method: e.target.value })}
              >
                {Object.entries(REFUND_METHODS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="w-full p-2 border rounded-lg h-20"
                value={refundData.notes}
                onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                placeholder="Optional notes about the refund"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessRefund} className="bg-gold hover:bg-gold/90">
                Process Refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Label Modal */}
      <Dialog open={showLabelModal} onOpenChange={setShowLabelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Label Generated</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && selectedReturn.returnTrackingNumber && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold">Label Generated Successfully</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking Number:</span>
                  <span className="font-mono font-semibold">{selectedReturn.returnTrackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Carrier:</span>
                  <span>{selectedReturn.returnCarrier || 'USPS'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-gold hover:bg-gold/90">
                  <Download className="w-4 h-4 mr-2" />
                  Download Label
                </Button>
                <Button variant="outline" className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Print this label and attach to your package. Drop off at any carrier location.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
