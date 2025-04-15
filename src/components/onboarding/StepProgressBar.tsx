
import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressBarProps {
  steps: any[];
  currentStep: number;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flex items-center justify-center h-8 w-8 rounded-full ${
                index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`h-1 w-full ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepProgressBar;
