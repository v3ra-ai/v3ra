# V3RA Quick Reference

## Project Structure
```
/app/ask         → Ask mode page
/app/refine      → Refine mode page  
/components/ask  → Ask mode components
/components/truth-arena → Refine mode components
/store/token-store.ts → Token management
```

## Key Commands
```bash
npm run dev      # Start development
npm run build    # Build for production
npm run lint     # Check code style
npm run typecheck # Check TypeScript
```

## Environment Variables
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# LLM Keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

## Token System
- Start: 50 tokens
- Fast: 2 tokens (2 models)
- Balanced: 5 tokens (4 models)  
- Maximum: 10 tokens (6+ models)
- Earn: 1-3 tokens per refinement

## Git Workflow
```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: your feature"
git push -u origin feature/your-feature
# Create PR on GitHub
```

## Component Locations
- Token Display: `/components/ask/navbar/navbar-sitelinks.tsx`
- Query Presets: `/components/ask/query/query-preset-selector.tsx`
- Truth Arena: `/components/truth-arena/refined-truth-arena.tsx`
- Token Store: `/store/token-store.ts`

## Debugging
- Check console for errors
- Verify env variables are set
- Run `npm run typecheck` for type errors
- Check Network tab for API failures