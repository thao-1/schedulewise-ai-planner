
import React from 'react';

const Logo = ({ size = 24, className = '' }: { size?: number; className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/pictures/logo.png" 
        alt="ScheduleWise Logo" 
        className="h-8 w-auto"
      />
      <span className="font-bold text-xl">ScheduleWise</span>
    </div>
  );
};

export default Logo;
