import { Bot, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onRetry?: () => void;
}

export const LoadingScreen = ({ onRetry }: LoadingScreenProps) => {
  const [dots, setDots] = useState('');
  const [showRetry, setShowRetry] = useState(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Show retry button after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Setting up your AI assistant{dots}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Connecting to chat services...
          </p>
          {showRetry && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 flex items-center gap-2 mx-auto px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Taking too long? Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
