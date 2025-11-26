# Testing Guide

This document explains the testing infrastructure and how to write tests for the RBAC system.

## Test Types

### 1. Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual functions in isolation
- **Database**: Not required (uses mocks)
- **Speed**: Very fast (milliseconds)

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test interactions between components
- **Database**: Uses in-memory MongoDB
- **Speed**: Fast (seconds)

### 3. E2E Tests  
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user flows in browser
- **Database**: Requires running database
- **Speed**: Slower (minutes)

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui
```

## Writing Unit Tests

Unit tests don't require a database. They test pure logic.

### Example: Testing RBAC Utilities

```javascript
// tests/unit/lib/rbac.test.js
import { hasPermission } from '../../../src/lib/rbac.js';
import { PERMISSIONS } from '../../../src/config/permissions.js';

describe('hasPermission()', () => {
  test('should return true if user has permission', () => {
    const admin = createMockAdmin(); // Mock helper from tests/setup.js
    expect(hasPermission(admin, PERMISSIONS.VIEW_LOGS)).toBe(true);
  });

  test('should return false if user lacks permission', () => {
    const user = createMockUser();
    expect(hasPermission(user, PERMISSIONS.VIEW_LOGS)).toBe(false);
  });
});
```

### Available Mock Helpers

Defined in `tests/setup.js`:

```javascript
// Create mock users for testing
const user = createMockUser();
const moderator = createMockModerator();
const admin = createMockAdmin();

// Override properties
const customUser = createMockUser({ username: 'custom', email: 'custom@test.com' });
```

## Writing Integration Tests

Integration tests use an in-memory MongoDB instance for isolated testing.

### Setup Pattern

```javascript
// tests/integration/api/users.test.js
import { connectTestDB, closeTestDB, clearTestDB } from '../../test-db.js';
import User from '../../../src/model/users.js';

// Setup: Connect to in-memory DB before all tests
beforeAll(async () => {
  await connectTestDB();
});

// Cleanup: Clear data between tests
afterEach(async () => {
  await clearTestDB();
});

// Teardown: Close DB after all tests
afterAll(async () => {
  await closeTestDB();
});

describe('User Management API', () => {
  test('should create a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'user',
    };

    const user = new User(userData);
    await user.save();

    const found = await User.findOne({ username: 'testuser' });
    expect(found).toBeTruthy();
    expect(found.email).toBe('test@example.com');
  });
});
```

### Why In-Memory Database?

✅ **Isolated**: Each test run gets a fresh database  
✅ **Fast**: No network overhead, runs in RAM  
✅ **Safe**: Can't accidentally corrupt real data  
✅ **Portable**: Works on any machine without setup

## Writing E2E Tests

E2E tests use Playwright to test the application in a real browser.

### Example: Testing RBAC Flow

```javascript
// tests/e2e/rbac-flows.spec.js
import { test, expect } from '@playwright/test';

test('admin can access admin dashboard', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'AdminPassword123!');
  await page.click('button[type="submit"]');

  // Navigate to admin dashboard
  await page.goto('http://localhost:3000/admin');
  
  // Should see admin content
  await expect(page.locator('h1')).toContainText('Admin Dashboard');
});

test('regular user cannot access admin dashboard', async ({ page }) => {
  // Login as regular user
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'UserPassword123!');
  await page.click('button[type="submit"]');

  // Try to access admin dashboard
  await page.goto('http://localhost:3000/admin');
  
  // Should be redirected or see error
  await expect(page).not.toHaveURL(/.*admin.*/);
});
```

## Test Coverage

Check test coverage to ensure your code is well-tested:

```bash
npm test -- --coverage
```

This shows:
- % of lines covered
- % of functions covered
- % of branches covered

### Coverage Goals
- **Critical code** (auth, RBAC): 90%+
- **Business logic**: 80%+
- **UI components**: 70%+

## Best Practices

### ✅ Do
- Write tests before fixing bugs (TDD)
- Test edge cases (null, empty, invalid input)
- Use descriptive test names
- Keep tests independent (no shared state)
- Mock external dependencies (APIs, file system)

### ❌ Don't
- Test implementation details
- Write overly complex tests
- Share state between tests
- Skip cleanup in integration tests
- Test third-party library code

## Debugging Tests

### Run Single Test
```bash
npm test -- rbac.test.js
```

### Run Single Test Suite
```bash
npm test -- -t "hasPermission"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Troubleshooting

### "Cannot find module"
- Check import paths are correct (use `@/` alias)
- Ensure file extensions are included (`.js`)

### "Connection to DB failed"
- Integration tests: Check `mongodb-memory-server` is installed
- E2E tests: Ensure dev server is running (`npm run dev`)

### "Test timeout"
- Increase timeout in `jest.config.cjs`:
  ```javascript
  testTimeout: 10000 // 10 seconds
  ```

## Adding New Tests

When adding new features:

1. **Start with unit tests** - Test the logic
2. **Add integration tests** - Test DB interactions
3. **Add e2e tests** - Test critical user flows

Example workflow:
```bash
# 1. Create test file
touch tests/unit/lib/new-feature.test.js

# 2. Write tests (they'll fail - that's ok!)
# 3. Implement the feature
# 4. Tests should pass
npm test -- new-feature.test.js
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
