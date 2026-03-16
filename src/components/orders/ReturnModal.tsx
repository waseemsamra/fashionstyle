import { useState } from 'react';
import { Order } from '@/services/ordersService';
import { X, AlertCircle } from 'lucide-react';

interface ReturnModalProps {
  order: Order;
  onClose: () => void;
  onSubmit: (items: string[], reason: string) => void;
}

export function ReturnModal({ order, onClose, onSubmit }: ReturnModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'select' | 'reason' | 'confirm'>('select');

  const returnableItems = order.items.filter(item => !item.returned);

  const handleSelectAll = () => {
    if (selectedItems.length === returnableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(returnableItems.map(item => item.id));
    }
  };

  const handleSubmit = () => {
    if (step === 'select') {
      if (selectedItems.length === 0) {
        alert('Please select items to return');
        return;
      }
      setStep('reason');
    } else if (step === 'reason') {
      if (!reason.trim()) {
        alert('Please provide a reason for return');
        return;
      }
      setStep('confirm');
    } else {
      onSubmit(selectedItems, reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {step === 'select' && 'Select Items to Return'}
            {step === 'reason' && 'Return Reason'}
            {step === 'confirm' && 'Confirm Return'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between pb-4 border-b">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === returnableItems.length}
                    onChange={handleSelectAll}
                    className="rounded text-gold"
                  />
                  <span className="font-medium">Select All Items</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedItems.length} of {returnableItems.length} selected
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {returnableItems.map((item) => (
                  <label key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="mt-1 rounded text-gold"
                    />
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>Qty: {item.quantity}</span>
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'reason' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Return *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="wrong_size">Wrong size</option>
                  <option value="wrong_item">Wrong item received</option>
                  <option value="defective">Defective or damaged</option>
                  <option value="quality">Quality not as expected</option>
                  <option value="changed_mind">Changed my mind</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {reason === 'other' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Please specify *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Tell us more about why you're returning..."
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Return Policy</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Items must be returned within 30 days</li>
                      <li>Items should be unworn and with original tags</li>
                      <li>Refund will be processed within 5-7 business days</li>
                      <li>Return shipping is free for defective items</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-2">Please confirm your return:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• {selectedItems.length} item(s) will be returned</li>
                      <li>• Reason: {reason}</li>
                      <li>• Refund amount: ${selectedItems.reduce((sum, itemId) => {
                        const item = order.items.find(i => i.id === itemId);
                        return sum + (item ? item.price * item.quantity : 0);
                      }, 0).toFixed(2)}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Next Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Print the return label (available after submission)</li>
                  <li>Pack the items securely in original packaging</li>
                  <li>Attach the return label to the package</li>
                  <li>Drop off at any carrier location</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
          {step !== 'select' && (
            <button
              onClick={() => setStep(step === 'reason' ? 'select' : 'reason')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gold text-white py-2 rounded-lg hover:bg-gold/90 transition"
          >
            {step === 'confirm' ? 'Submit Return Request' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
