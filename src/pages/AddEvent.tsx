
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";

const AddEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    day: '1', // Monday by default
    hour: '9',
    duration: '1',
    type: 'meeting'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get existing schedule from localStorage
      const existingScheduleStr = localStorage.getItem('generatedSchedule');
      const existingSchedule = existingScheduleStr ? JSON.parse(existingScheduleStr) : [];
      
      // Create a date object for the event
      const eventDate = new Date();
      // Set to next occurrence of the selected day (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = parseInt(formData.day);
      const daysToAdd = (dayOfWeek - eventDate.getDay() + 7) % 7;
      eventDate.setDate(eventDate.getDate() + daysToAdd);
      eventDate.setHours(parseInt(formData.hour), 0, 0, 0);
      
      // Create new event in the format expected by Schedule.tsx
      const newEvent = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        startTime: eventDate.toISOString(),
        duration: parseInt(formData.duration) * 60, // Convert hours to minutes
        type: formData.type
      };
      
      // Add new event to schedule
      const updatedSchedule = [...existingSchedule, newEvent];
      
      // Save updated schedule to localStorage
      localStorage.setItem('generatedSchedule', JSON.stringify(updatedSchedule));
      
      toast({
        title: "Event Added",
        description: "Your event has been added to the schedule.",
      });
      
      // Redirect to schedule view
      navigate('/schedule');
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error Adding Event",
        description: "There was a problem adding your event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];

  const typeOptions = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'deep-work', label: 'Deep Work' },
    { value: 'work', label: 'Regular Work' },
    { value: 'workout', label: 'Workout' },
    { value: 'meals', label: 'Meal' },
    { value: 'relaxation', label: 'Relaxation' },
    { value: 'learning', label: 'Learning' },
    { value: 'commute', label: 'Commute' },
    { value: 'sleep', label: 'Sleep' }
  ];

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Add New Event</h2>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Add a new event to your schedule</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Team Meeting"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Weekly team sync meeting to discuss progress"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day">Day</Label>
                <Select
                  value={formData.day}
                  onValueChange={(value) => handleSelectChange('day', value)}
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hour">Start Hour (24h format)</Label>
                <Input
                  id="hour"
                  name="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hour}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="12"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/schedule')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddEvent;
