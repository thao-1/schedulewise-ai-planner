
import React from 'react';

const Logo = ({ size = 24, className = '' }: { size?: number; className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/lovable-uploads/2731b53d-6d10-4854-a187-5fe97c5ccc69.png" 
        alt="ScheduleWise Logo" 
        className="h-8 w-auto"
      />
      <span className="font-bold text-xl">ScheduleWise</span>
    </div>
  );
};

export default Logo;
