

# Testing Strategy for Next.js Application

Goal: set up a testing suite within a week, focusing on
* Jest for unit tests,
* React Testing Library for snapshot tests, and
* Playwrightfor E2E testing due to its better integration with Next.js and modern ecosystem support.

## Timeline: 5 Days

### Testing Strategy Summary (general points)

- **Day 1: Unit Testing**
  - Set up Jest for unit tests.
  - Write 10-15 tests for utilities, hooks, and server logic.
  - Mock Supabase/OpenRouter APIs.

- **Day 2: Snapshot Testing**
  - Implement snapshot tests for 5-7 key React components.
  - Cover client and server components using React Testing Library.

- **Day 3: End-to-End Testing**
  - Set up Playwright for E2E testing.
  - Write 3-5 tests for critical user flows (e.g., login, data fetching).
  - Mock external services.

- **Day 4: Integration and CI/CD**
  - Write 3-5 integration tests for API routes.
  - Configure GitHub Actions for automated testing.

- **Day 5: Review and Polish**
  - Achieve 80%+ test coverage.
  - Optimize tests and document process in `TESTING.md`.


-----------------------------------------

Example Testing Strategy for Next.js Application

Filetree (example):

```
test/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── ValidatorListClient.test.tsx
│   │   └── QueryForm.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useQueryLogic.test.ts
│   ├── utils/
│   │   ├── date-utils.test.ts
│   │   └── text-utils.test.ts
│   ├── api/
│   │   ├── data.test.ts
│   │   └── validators.test.ts
│   └── setup.ts
├── e2e/
│   ├── login.spec.ts
│   ├── data-fetching.spec.ts
│   └── form-submission.spec.ts
```

### Day 1: Setup and Unit Testing Framework
**Objective**: Configure Jest and write unit tests for utilities, hooks, and server-side logic.

- **Setup Jest**:
  - Install dependencies:
    ```bash
    npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest @types/jest
    ```
  - Create `jest.config.ts`:
    ```typescript
    export default {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    };
    ```
  - Create `jest.setup.ts`:
    ```typescript
    import '@testing-library/jest-dom';
    ```
  - Update `package.json`:
    ```json
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch"
    }
    ```

- **Write Unit Tests**:
  - Target: Utility functions, custom hooks, and server-side logic (e.g., API route handlers).
  - Example for a utility function:
    ```typescript
    // src/utils/formatDate.ts
    export const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // src/utils/__tests__/formatDate.test.ts
    import { formatDate } from '@/utils/formatDate';

    describe('formatDate', () => {
      it('formats date correctly', () => {
        const date = new Date('2025-05-07');
        expect(formatDate(date)).toBe('2025-05-07');
      });
    });
    ```
  - For hooks, use `@testing-library/react-hooks`:
    ```typescript
    // src/hooks/__tests__/useAuth.test.ts
    import { renderHook } from '@testing-library/react-hooks';
    import { useAuth } from '@/hooks/useAuth';

    describe('useAuth', () => {
      it('returns user data', async () => {
        const { result, waitFor } = renderHook(() => useAuth());
        await waitFor(() => result.current.user !== null);
        expect(result.current.user).toBeDefined();
      });
    });
    ```
  - Test Supabase client methods by mocking `@supabase/supabase-js`:
    ```typescript
    jest.mock('@supabase/supabase-js');
    ```

- **Tasks**:
  - Write 10-15 unit tests covering critical utilities and hooks.
  - Mock Supabase and OpenRouter API calls using Jest mocks.
  - Run tests and ensure 100% pass rate.

---

### Day 2: Snapshot Testing for React Components
**Objective**: Implement snapshot tests for client and server components using React Testing Library.

- **Setup Snapshot Testing**:
  - Ensure Jest is configured with `jsdom` (from Day 1).
  - Use React Testing Library for rendering components.

- **Write Snapshot Tests**:
  - Target: Key UI components (e.g., Shadcn UI components, Radix UI primitives).
  - Example for a component:
    ```typescript
    // src/components/__tests__/Button.test.tsx
    import { render } from '@testing-library/react';
    import Button from '@/components/Button';

    describe('Button', () => {
      it('matches snapshot', () => {
        const { asFragment } = render(<Button>Click me</Button>);
        expect(asFragment()).toMatchSnapshot();
      });
    });
    ```
  - For server components, use `render` with async support:
    ```typescript
    // src/components/__tests__/ServerComponent.test.tsx
    import { render } from '@testing-library/react';
    import ServerComponent from '@/components/ServerComponent';

    describe('ServerComponent', () => {
      it('matches snapshot', async () => {
        const { asFragment } = await render(<ServerComponent />);
        expect(asFragment()).toMatchSnapshot();
      });
    });
    ```

- **Tasks**:
  - Write snapshot tests for 5-7 key components.
  - Update snapshots if UI changes (`jest -u`).
  - Validate snapshots cover both client and server components.

---

### Day 3: End-to-End Testing Setup with Playwright
**Objective**: Set up Playwright and write E2E tests for critical user flows.

- **Why Playwright?**:
  - Better Next.js integration, auto-waiting, and modern browser support compared to TestCafe.
  - Active community and Vercel compatibility.

- **Setup Playwright**:
  - Install dependencies:
    ```bash
    npm install --save-dev @playwright/test
    npx playwright install
    ```
  - Create `playwright.config.ts`:
    ```typescript
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      testDir: './tests/e2e',
      use: {
        baseURL: 'http://localhost:3000',
        browserName: 'chromium',
      },
      webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
    });
    ```

- **Write E2E Tests**:
  - Target: Key user flows (e.g., login, data fetching, form submission).
  - Example for login flow:
    ```typescript
    // tests/e2e/login.spec.ts
    import { test, expect } from '@playwright/test';

    test('user can log in', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome');
    });
    ```
  - Mock Supabase and OpenRouter in E2E tests using Playwright’s network interception:
    ```typescript
    await page.route('**/supabase.co/**', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: { user: { id: '123' } } }),
      })
    );
    ```

- **Tasks**:
  - Write 3-5 E2E tests covering login, data fetching, and form submission.
  - Test on local dev server (`npm run dev`).
  - Validate tests in CI (e.g., GitHub Actions).

---

### Day 4: Integration and CI/CD
**Objective**: Add integration tests and configure CI for automated testing.

- **Write Integration Tests**:
  - Test API routes and Supabase/OpenRouter interactions.
  - Example for an API route:
    ```typescript
    // src/pages/api/__tests__/data.test.ts
    import { createMocks } from 'node-mocks-http';
    import handler from '@/pages/api/data';

    describe('Data API', () => {
      it('returns data', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toHaveProperty('data');
      });
    });
    ```

- **Setup CI with GitHub Actions**:
  - Create `.github/workflows/test.yml`:
    ```yaml
    name: Test Suite
    on: [push, pull_request]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: '20'
          - run: npm ci
          - run: npm test
          - run: npx playwright test
    ```

- **Tasks**:
  - Write 3-5 integration tests for API routes.
  - Configure CI to run unit, snapshot, and E2E tests.
  - Fix any test failures.

---

### Day 5: Review and Polish
**Objective**: Ensure test coverage, optimize, and document.

- **Check Coverage**:
  - Add coverage to Jest:
    ```json
    "jest": {
      "collectCoverage": true,
      "coverageThreshold": {
        "global": {
          "lines": 80
        }
      }
    }
    ```
  - Run `npm test -- --coverage` and address gaps.

- **Optimize Tests**:
  - Refactor flaky tests.
  - Mock external services consistently (Supabase, OpenRouter).

- **Document**:
  - Add `TESTING.md`:
    ```markdown
    # Testing Guide
    ## Running Tests
    - Unit/Snapshot: `npm test`
    - E2E: `npx playwright test`
    ## Adding Tests
    - Unit: Add to `src/__tests__`
    - E2E: Add to `tests/e2e`
    ```

- **Tasks**:
  - Achieve 80%+ test coverage.
  - Document testing process.
  - Run full test suite and confirm stability.

---

## Tools and Justifications
- **Jest**: Industry-standard for unit and snapshot tests, great TypeScript support.
- **React Testing Library**: Best for testing React components, aligns with Next.js.
- **Playwright**: Modern E2E testing tool, better than TestCafe for Next.js due to auto-waiting and Vercel integration.
- **Supabase/OpenRouter Mocks**: Essential to avoid hitting real APIs during tests.

## Success Criteria
- 20+ unit tests, 5+ snapshot tests, 3+ E2E tests.
- CI pipeline running all tests on push/PR.
- 80%+ test coverage.
- Clear documentation for team to maintain tests.

