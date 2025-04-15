
import React from 'react';
import { Calendar } from 'lucide-react';

const Logo = ({ size = 24, className = '' }: { size?: number; className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Calendar size={size} className="text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-primary-foreground rounded-full opacity-70"></div>
        </div>
      </div>
      <span className="font-bold text-xl">ScheduleWise</span>
    </div>
  );
};

export default Logo;
