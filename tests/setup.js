// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            pathname: '/',
            query: {},
            asPath: '/',
        };
    },
    usePathname() {
        return '/';
    },
    useSearchParams() {
        return new URLSearchParams();
    },
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession() {
        return {
            data: null,
            status: 'unauthenticated',
        };
    },
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

// Global test utilities
global.createMockUser = (overrides = {}) => ({
    _id: '123456789012345678901234',
    id: '123456789012345678901234',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    isActive: true,
    isLocked: false,
    ...overrides,
});

global.createMockAdmin = (overrides = {}) => ({
    ...global.createMockUser(),
    role: 'admin',
    username: 'admin',
    email: 'admin@example.com',
    ...overrides,
});

global.createMockModerator = (overrides = {}) => ({
    ...global.createMockUser(),
    role: 'moderator',
    username: 'moderator',
    email: 'moderator@example.com',
    ...overrides,
});
