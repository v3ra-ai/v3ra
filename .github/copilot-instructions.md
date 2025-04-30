# Copilot Instructions

This project is a web application that allows users to create and manage tasks. The application is built using React 19, NextJS 15, Tailwind 4 and Node.js, and it uses Supabase Postrgres as the database and Prisma.

## Coding Standards

- Use lowercase and hyphenated names for files and directories (e.g., `my-component.js`, `my-page.js`).
- Use camelCase for React hooks.
- Use camelCase for variable and function names.
- Use PascalCase for component names.
- Use single quotes for strings.
- String literals if there are variables in them.
- Use semicolons at the end of statements.
- Use 2 spaces for indentation.
- Use arrow functions for callbacks.
- Use async/await for asynchronous code.
- Use const for constants and let for variables that will be reassigned.
- Use destructuring for objects and arrays.
- Use template literals for strings that contain variables.
- Use the latest JavaScript features (ES6+) where possible.

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