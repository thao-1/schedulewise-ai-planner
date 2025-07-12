import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
}

export function LoadingButton({
  isLoading = false,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={isLoading} 
      className={`relative ${className}`}
      {...props}
    >
      {isLoading && (
        <Loader2 className="absolute left-4 h-4 w-4 animate-spin" />
      )}
      <span className={isLoading ? 'ml-6' : ''}>
        {children}
      </span>
    </Button>
  );
}
