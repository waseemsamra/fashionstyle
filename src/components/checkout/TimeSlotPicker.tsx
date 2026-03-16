import { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import timeSlotService, { type TimeSlot } from '@/services/timeSlotService';

interface TimeSlotPickerProps {
  date: string;
  zone: string;
  customerId: string;
  orderId: string;
  onSlotSelected: (slot: TimeSlot) => void;
}

export default function TimeSlotPicker({
  date,
  zone,
  customerId,
  orderId,
  onSlotSelected
}: TimeSlotPickerProps) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  useEffect(() => {
    loadSlots();
  }, [date, zone]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const availability = await timeSlotService.getAvailability({
        date,
        zone,
        customerId
      });
      setSlots(availability.slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      onSlotSelected(slot);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    setBooking(true);
    try {
      await timeSlotService.bookSlot({
        slotId: selectedSlot,
        customerId,
        orderId
      });
      toast.success('Time slot booked successfully!');
      await loadSlots(); // Refresh availability
    } catch (error: any) {
      console.error('Error booking slot:', error);
      toast.error(error.message || 'Failed to book time slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold mb-2">No Time Slots Available</h3>
          <p className="text-sm text-gray-500">
            Please select another date or check back later
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Select Delivery Time
        </h3>

        <RadioGroup value={selectedSlot} onValueChange={handleSlotSelect}>
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedSlot === slot.id
                    ? 'border-gold bg-gold/5'
                    : slot.availableCount > 0
                    ? 'hover:border-gray-300 cursor-pointer'
                    : 'opacity-50 bg-gray-50'
                }`}
                onClick={() => slot.availableCount > 0 && handleSlotSelect(slot.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <RadioGroupItem
                      value={slot.id}
                      id={slot.id}
                      disabled={slot.availableCount === 0}
                    />
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.availableCount === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                        {slot.availableCount > 0 && slot.availableCount <= 3 && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            Only {slot.availableCount} left
                          </Badge>
                        )}
                        {slot.message && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            {slot.message}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {slot.zone}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {slot.price === 0 ? 'Free' : `$${slot.price}`}
                        </span>
                        <span>
                          {slot.availableCount} spots left
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {slot.tier !== 'standard' && (
                    <Badge className="bg-gold/10 text-gold">
                      {slot.tier.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {selectedSlot && (
          <Button
            onClick={handleBookSlot}
            disabled={booking}
            className="w-full mt-4 bg-gold hover:bg-gold/90"
          >
            {booking ? 'Booking...' : 'Confirm Time Slot'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
