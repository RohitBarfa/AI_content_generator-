import { ReactNode, useCallback, useState, useEffect } from "react";
import { User } from "stream-chat";
import { Chat, useCreateChatClient } from "stream-chat-react";
import { LoadingScreen } from "../components/loading-screen";
import { useTheme } from "../hooks/use-theme";

interface ChatProviderProps {
  user: User;
  children: ReactNode;
}

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

if (!apiKey) {
  console.error('Missing VITE_STREAM_API_KEY in .env file');
  console.log('Available env vars:', import.meta.env);
  throw new Error("Missing VITE_STREAM_API_KEY in .env file");
}

console.log('Chat Provider Configuration:');
console.log('API Key:', apiKey?.substring(0, 8) + '...');
console.log('Backend URL:', backendUrl);

export const ChatProvider = ({ user, children }: ChatProviderProps) => {
  const { theme } = useTheme();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Set a timeout for loading to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!client) {
        setLoadingTimeout(true);
        setError('Stream Chat client initialization timed out. Please check your API keys.');
        console.error('Chat client initialization timed out after 20 seconds');
      }
    }, 20000); // 20 second timeout

    return () => clearTimeout(timer);
  }, [retryCount]); // Re-run when retry count changes

  /**
   * Token provider function that fetches authentication tokens from our backend.
   * This is called automatically by the Stream Chat client when:
   * - Initial connection is established
   * - Token expires and needs refresh
   * - Connection is re-established after network issues
   */
  const tokenProvider = useCallback(async () => {
    if (!user) {
      throw new Error("User not available");
    }

    try {
      console.log(`Fetching token for user ${user.id} from ${backendUrl}/token`);

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token fetch failed: ${response.status} - ${errorText}`);
        setError(`Token fetch failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch token: ${errorText}`);
      }

      const { token } = await response.json();
      console.log('Token fetched successfully');
      return token;
    } catch (err) {
      console.error("Error fetching token:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Token fetch failed: ${errorMessage}`);
      throw err;
    }
  }, [user]);

  /**
   * Create the Stream Chat client with automatic token management.
   * This handles:
   * - Initial authentication
   * - WebSocket connection management
   * - Automatic token refresh
   * - Real-time event handling
   */
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });



  // Show error state if there's an error or timeout
  if (error || loadingTimeout) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center mx-auto">
            <span className="text-destructive-foreground text-xl">⚠</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Connection Issue</h2>
            <p className="text-sm text-muted-foreground">
              {error || 'Connection timed out after 30 seconds'}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while client is being initialized
  if (!client) {
    return <LoadingScreen />;
  }

  return (
    <Chat
      client={client}
      theme={
        theme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light"
      }
    >
      {children}
    </Chat>
  );
};
