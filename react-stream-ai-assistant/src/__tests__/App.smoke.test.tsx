import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import App from '../App';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock the components that may have complex dependencies
vi.mock('@/components/login', () => ({
    Login: ({ onLogin }: { onLogin: (user: any) => void }) => (
        <div data-testid="login-component">
            <h1>AI Chat Login</h1>
            <button
                onClick={() => onLogin({ id: 'test-user', name: 'Test User' })}
                data-testid="login-button"
            >
                Login
            </button>
        </div>
    ),
}));

vi.mock('@/components/authenticated-app', () => ({
    AuthenticatedApp: ({ user, onLogout }: { user: any; onLogout: () => void }) => (
        <div data-testid="authenticated-app">
            <h1>AI Chat App</h1>
            <p data-testid="user-name">Welcome, {user.name}</p>
            <button onClick={onLogout} data-testid="logout-button">
                Logout
            </button>
        </div>
    ),
}));

vi.mock('@/components/ui/toaster', () => ({
    Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

vi.mock('@/providers/theme-provider', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="theme-provider">{children}</div>
    ),
}));

describe('App Smoke Test', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
    });

    test('should render login component when no user is stored', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<App />);

        expect(screen.getByTestId('login-component')).toBeInTheDocument();
        expect(screen.getByText('AI Chat Login')).toBeInTheDocument();
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    test('should render authenticated app when user is stored', () => {
        const mockUser = { id: 'stored-user', name: 'Stored User' };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

        render(<App />);

        expect(screen.getByTestId('authenticated-app')).toBeInTheDocument();
        expect(screen.getByText('AI Chat App')).toBeInTheDocument();
        expect(screen.getByText('Welcome, Stored User')).toBeInTheDocument();
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    test('should always render theme provider and toaster', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<App />);

        expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
        expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    test('should have proper app structure with background styling', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<App />);

        const appContainer = screen.getByTestId('theme-provider').firstChild as HTMLElement;
        expect(appContainer).toHaveClass('h-screen', 'bg-background');
    });

    test('should handle invalid JSON in localStorage gracefully', () => {
        localStorageMock.getItem.mockReturnValue('invalid-json');

        // Should not throw and should render login
        expect(() => render(<App />)).not.toThrow();
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
    });
});