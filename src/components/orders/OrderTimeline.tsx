import { OrderTimeline as TimelineEvent } from '@/services/ordersService';
import { CheckCircle, Package, Truck, Check, Clock, XCircle } from 'lucide-react';

interface OrderTimelineProps {
  timeline: TimelineEvent[];
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  returned: XCircle,
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-8">
        {timeline.map((event, index) => {
          const Icon = statusIcons[event.status as keyof typeof statusIcons] || Check;
          
          return (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div className={`
                relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                ${event.status === 'delivered' ? 'bg-green-100 text-green-600' :
                  event.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                  'bg-gold/10 text-gold'}
              `}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600">{event.description}</p>
                {event.actor && (
                  <p className="text-xs text-gray-500 mt-1">
                    by {event.actor}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
