# Copilot Instructions

This project is a web application called the Verafy Testnet. It is a modular system where the UI (Next.js) serves as the entry point, sending queries to the broadcaster service. The broadcaster uses distributes queries to validators, which vote using their AI models. The leader validator calculates consensus, stores results in PostgreSQL, and rotates leadership. The UI retrieves and displays these results via API endpoints.This flow ensures a scalable, verifiable AI validation network.

There are standard and expert views. Standard views are for general users, while expert views are for experienced users and validators that need very detailed history, queries and metrics. The expert view includes additional features like a leaderboard and a voting history.

The application is designed to be user-friendly and visually appealing, with a focus on performance and responsiveness.It is important to ensure that the application is accessible to all users, including those with disabilities. This includes using semantic HTML, providing alternative text for images, and ensuring that the application can be navigated using a keyboard.
The application is designed to be modular and scalable, allowing for easy integration of new features and services. The architecture is based on APIs/microservices, with each service responsible for a specific task. This allows for better maintainability and easier deployment of new features.

 The application is built using React 19, NextJS 15, Tailwind 4 and Node.js, and it uses Supabase Postrgres as the database and Prisma.

## Coding Standards

- Tailwind CSS is used for styling should always use light and dark themes.
- Use Tailwind CSS for styling and avoid inline styles.
- Use TypeScript for all new code to enforce type safety.
- Use ESLint and Prettier for code formatting and linting.
- Use Git for version control and follow a branching strategy (e.g., Git Flow).
- Use lowercase and hyphenated names for files and directories (e.g., `my-component.js`, `my-page.js`).
- Use camelCase for React hooks.
- Use camelCase for variable and function names.
- Use PascalCase for component names.
- Use single quotes for strings.
- Use semicolons at the end of statements.
- Use 2 spaces for indentation.
- Use arrow functions for callbacks.
- Use async/await for asynchronous code.
- Use const for constants and let for variables that will be reassigned.
- Use destructuring for objects and arrays.
- Use template literals for strings that contain variables.
- Use the latest JavaScript features (ES6+) where possible.

Key files and directories:
* UI Entry: app/api/broadcast/route.ts
* Core Logic: app/actions.ts
* Broadcaster: services/broadcaster/broadcaster.ts
* Validator: services/validator/validator.ts
* Validator Providers: lib/validators/providers/*.ts (e.g., openai.ts, grok.ts)
* Network State: app/api/network/route.ts
* Database: Prisma interactions in app/actions.ts and services/validator/validator.ts


Also for React 19, NextJS 15, Tailwind 4, Node.js, Supabase Postgres, and Prisma stack:

## Additional Coding Standards

### General
- **File Organization**: Group related files (e.g., components, hooks, utilities) in dedicated directories (e.g., `/components`, `/hooks`, `/utils`). Use index files (`index.js`) for cleaner imports.
- **Error Handling**: Implement consistent error handling with `try/catch` for async operations and provide meaningful error messages to users.
- **Comments**: Use JSDoc for functions and complex logic. Avoid excessive comments for self-explanatory code.
- **Line Length**: Keep lines under 80-100 characters for readability. Break long lines logically.
- **Type Safety**: Use TypeScript for all new code to enforce type safety. Define interfaces or types for props, state, and API responses.

### React/NextJS
- **Component Structure**: Keep components small and focused. Split large components into smaller, reusable ones.
- **Props Naming**: Use descriptive prop names (e.g., `userId` instead of `id`). Avoid passing unnecessary props.
- **Hooks**: Prefix custom hooks with `use` (e.g., `useFetchData`). Keep hooks reusable and avoid side effects in non-effect hooks.
- **NextJS Routing**: Use dynamic routes (`/pages/[id].js`) for dynamic content and leverage `getStaticProps` or `getServerSideProps` for data fetching.
- **Performance**: Use React’s `useMemo` and `useCallback` for expensive computations or functions passed as props to prevent unnecessary re-renders.
- **SEO**: Ensure all pages have proper meta tags using NextJS’s `<Head>` component for better search engine indexing.

### Tailwind CSS
- **Class Order**: Follow a consistent class order (e.g., layout, spacing, typography, colors) to improve readability (e.g., `flex p-4 text-lg text-blue-500`).
- **Utility-First**: Favor Tailwind utility classes over custom CSS. Use `@apply` in custom components sparingly.
- **PurgeCSS**: Enable Tailwind’s purge option in production to remove unused styles and reduce bundle size.
- **Responsive Design**: Use Tailwind’s responsive prefixes (e.g., `md:`, `lg:`) for breakpoints and test across common screen sizes.

### Node.js/Backend
- **Environment Variables**: Store sensitive data (e.g., Supabase keys, API secrets) in `.env` files and use `dotenv` for loading them.
- **Modular Code**: Organize backend logic into modules (e.g., controllers, services, models) for better maintainability.
- **Logging**: Implement structured logging (e.g., using `winston` or `pino`) for debugging and monitoring.
- **API Standards**: Follow RESTful conventions for endpoints (e.g., `/tasks/:id` for specific resources). Use HTTP status codes appropriately (e.g., 201 for created resources).