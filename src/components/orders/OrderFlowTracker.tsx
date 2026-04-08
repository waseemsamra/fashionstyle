import { getOrderConfig, type OrderStatus, type OrderTimelineEvent, canTransition, ORDER_STATUS_FLOW } from '@/services/orderManagement';

interface OrderFlowTrackerProps {
  currentStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  onStatusChange?: (newStatus: OrderStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🟡' },
  confirmed: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: '🔵' },
  'vendor-notified': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', icon: '🟣' },
  'vendor-accepted': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', icon: '🔷' },
  'vendor-rejected': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '🔴' },
  processing: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', icon: '🟠' },
  'ready-to-ship': { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', icon: '📦' },
  shipped: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', icon: '🚚' },
  delivered: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: '✅' },
  cancelled: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', icon: '⛔' },
  returned: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', icon: '↩️' },
};

// Full order flow sequence
const FLOW_SEQUENCE: OrderStatus[] = [
  'pending',
  'confirmed',
  'vendor-notified',
  'vendor-accepted',
  'processing',
  'ready-to-ship',
  'shipped',
  'delivered',
];

export default function OrderFlowTracker({ currentStatus, timeline, onStatusChange, showActions = true, compact = false }: OrderFlowTrackerProps) {
  const config = getOrderConfig(currentStatus);
  const colors = STATUS_COLORS[currentStatus] || STATUS_COLORS.pending;

  // Find current step index in flow
  const currentIndex = FLOW_SEQUENCE.indexOf(currentStatus);
  const isComplete = currentStatus === 'delivered';
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'returned';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className={`font-medium text-sm ${colors.text}`}>{config.label}</p>
          <p className="text-xs text-gray-600">{config.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Current Status Header */}
      <div className={`flex items-center justify-between mb-6 p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className={`font-bold text-lg ${colors.text}`}>{config.label}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        {isComplete && (
          <div className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
            Complete ✓
          </div>
        )}
        {isCancelled && (
          <div className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
            Cancelled ✕
          </div>
        )}
      </div>

      {/* Order Flow Progress Bar */}
      {!isCancelled && (
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Order Progress</h4>
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-green-500 transition-all duration-500"
              style={{ width: `${(currentIndex / (FLOW_SEQUENCE.length - 1)) * 100}%` }}
            />

            {/* Steps */}
            {FLOW_SEQUENCE.map((step, index) => {
              const stepConfig = getOrderConfig(step);
              const stepColors = STATUS_COLORS[step];
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              // isUpcoming is intentionally unused (future use)

              return (
                <div key={step} className="flex flex-col items-center relative z-10 flex-1">
                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? `${stepColors.bg} ${stepColors.border} ${stepColors.text} scale-110`
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCompleted ? 'text-green-700 font-medium' : isCurrent ? 'font-semibold text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {stepConfig.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Timeline</h4>
          <div className="space-y-3">
            {timeline.map((event, index) => {
              const eventConfig = getOrderConfig(event.status);
              const eventColors = STATUS_COLORS[event.status] || STATUS_COLORS.pending;

              return (
                <div key={index} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 ${eventColors.text.replace('text-', 'bg-')}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{eventConfig.icon}</span>
                      <span className="font-medium text-sm">{eventConfig.label}</span>
                      {event.note && (
                        <span className="text-xs text-gray-500">— {event.note}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(event.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.updatedBy && ` • by ${event.updatedBy}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showActions && onStatusChange && !isComplete && !isCancelled && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h4>
          <div className="flex flex-wrap gap-2">
            {config.next.map((nextStatus: OrderStatus) => {
              const nextConfig = getOrderConfig(nextStatus);
              const nextColors = STATUS_COLORS[nextStatus] || STATUS_COLORS.pending;

              return (
                <button
                  key={nextStatus}
                  onClick={() => onStatusChange(nextStatus)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border hover:shadow-sm ${nextColors.bg} ${nextColors.border} ${nextColors.text} hover:scale-105`}
                >
                  {nextConfig.icon} {nextConfig.label}
                </button>
              );
            })}

            {/* Cancel option if not already cancelled */}
            {(currentStatus !== 'cancelled' && currentStatus !== 'returned') && canTransition(currentStatus, 'cancelled') && (
              <button
                onClick={() => onStatusChange('cancelled' as OrderStatus)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              >
                🚫 Cancel Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
