
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CustomPreferencesProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomPreferences = ({ value, onChange }: CustomPreferencesProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-preferences">Additional Preferences</Label>
      <Textarea
        id="custom-preferences"
        placeholder="Share any additional scheduling preferences or requirements..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
};

export default CustomPreferences;
