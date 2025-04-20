As of April 20 2025

--- Project Directory Structure ---
.
├── README.md
├── README_GIT.md
├── app
│   ├── actions.ts
│   ├── api
│   │   ├── admin
│   │   │   ├── diagnose-keys
│   │   │   │   └── route.ts
│   │   │   ├── health-check
│   │   │   │   └── route.ts
│   │   │   ├── keys
│   │   │   │   └── route.ts
│   │   │   ├── repair-keys
│   │   │   │   └── route.ts
│   │   │   └── validators
│   │   │       ├── add
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── broadcast
│   │   │   └── route.ts
│   │   ├── credits
│   │   │   ├── assign
│   │   │   │   └── route.ts
│   │   │   └── balance
│   │   │       └── route.ts
│   │   ├── cron
│   │   │   └── route.ts
│   │   ├── network
│   │   │   ├── broadcast
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── payment
│   │   │   └── route.ts
│   │   ├── replies
│   │   │   └── [replyId]
│   │   │       └── upvote
│   │   │           └── route.ts
│   │   ├── test-validators
│   │   │   └── route.ts
│   │   ├── threads
│   │   │   └── [threadId]
│   │   │       ├── downvote
│   │   │       │   └── route.ts
│   │   │       ├── replies
│   │   │       │   └── route.ts
│   │   │       ├── route.ts
│   │   │       └── upvote
│   │   │           └── route.ts
│   │   ├── validate
│   │   │   └── route.ts
│   │   ├── validators
│   │   │   ├── [id]
│   │   │   │   └── toggle
│   │   │   │       └── route.ts
│   │   │   ├── active
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── vote-history
│   │   │   └── route.ts
│   │   └── vote-sessions
│   │       └── [voteSessionId]
│   │           ├── route.ts
│   │           └── threads
│   │               └── route.ts
│   ├── ask
│   │   └── page.tsx
│   ├── ask-wire
│   │   ├── ask-form.tsx
│   │   ├── page.tsx
│   │   ├── payment-controls.tsx
│   │   ├── query-store.tsx
│   │   └── wallet-toggle.tsx
│   ├── credits
│   │   └── page.tsx
│   ├── explorer
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── backup_db
├── components
│   ├── ask
│   │   ├── ask-results-standard.tsx
│   │   ├── consensus
│   │   │   ├── current-query.tsx
│   │   │   ├── network-status.tsx
│   │   │   ├── network-visualization.tsx
│   │   │   ├── staking-deep-dive.tsx
│   │   │   ├── staking.tsx
│   │   │   ├── vote-history-empty.tsx
│   │   │   ├── vote-history-error.tsx
│   │   │   ├── vote-history-header.tsx
│   │   │   ├── vote-history-loading.tsx
│   │   │   ├── vote-history-table-row.tsx
│   │   │   ├── vote-history-table.tsx
│   │   │   └── vote-history.tsx
│   │   ├── consensus-status.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── navbar.tsx
│   │   ├── payment-controls.tsx
│   │   ├── query-form.tsx
│   │   ├── query-interface.tsx
│   │   ├── query-results.tsx
│   │   ├── query-stats.tsx
│   │   └── wallet-toggle.tsx
│   ├── credits
│   │   ├── credit-slider-ui.tsx
│   │   ├── credit-slider.tsx
│   │   └── stake-slider.tsx
│   ├── error-display.tsx
│   ├── explorer
│   │   ├── consensus-visualization.tsx
│   │   ├── custom-query-form.tsx
│   │   ├── explorer-header.tsx
│   │   ├── network-visualization.tsx
│   │   ├── payment-controls.tsx
│   │   ├── query-input.tsx
│   │   ├── submit-button.tsx
│   │   ├── toggle-header.tsx
│   │   ├── validator-admin.tsx
│   │   ├── validator-detail.tsx
│   │   ├── validator-list.tsx
│   │   ├── vote-history.tsx
│   │   └── vote-results.tsx
│   ├── key-manager.tsx
│   ├── loading-spinner.tsx
│   ├── network-stats.tsx
│   ├── solana-provider.tsx
│   ├── theme-provider.tsx
│   ├── top-nav.tsx
│   ├── ui
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hover-card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   └── tabs.tsx
│   ├── validator-health-check.tsx
│   ├── validator-initializer.tsx
│   └── validator-profile.tsx
├── components.json
├── eslint.config.mjs
├── get_code-snapshot.js
├── hooks
│   ├── useAutoRefresh.tsx
│   ├── useBroadcastQuery.ts
│   ├── useCreditAssignment.tsx
│   ├── useCreditBalance.tsx
│   ├── useNetworkState.ts
│   ├── useQueryLogic.tsx
│   ├── useSolanaTransaction.tsx
│   ├── useSolanaWallet.tsx
│   └── useVoteHistory.ts
├── lib
│   ├── constants.ts
│   ├── crypto.ts
│   ├── database.ts
│   ├── db
│   │   ├── apiKeys.ts
│   │   ├── client.ts
│   │   ├── schema-adapter.ts
│   │   ├── setup.ts
│   │   ├── validators.ts
│   │   └── voteSessions.ts
│   ├── keyManager.ts
│   ├── llmIntegration.ts
│   ├── mock-store.ts
│   ├── mocks.ts
│   ├── query-utils.tsx
│   ├── redis.ts
│   ├── services
│   │   ├── keyService.ts
│   │   └── validatorService.ts
│   ├── solana-constants.ts
│   ├── store.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── validators
│   │   ├── client-data.ts
│   │   ├── init.ts
│   │   ├── providers
│   │   │   ├── anthropic.ts
│   │   │   ├── gemini.ts
│   │   │   ├── grok.ts
│   │   │   ├── index.ts
│   │   │   └── openai.ts
│   │   ├── registry.ts
│   │   └── types.ts
│   └── validators.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── prisma
│   ├── archived
│   │   ├── migrate
│   │   └── schema-sqlite.prisma
│   ├── dev.db
│   ├── migrations
│   ├── schema.prisma
│   └── test-prisma.ts
├── prisma_migrations_backup
│   ├── 20250324161635_initial_setup
│   │   └── migration.sql
│   ├── 20250328131012_add_thread_reply_models
│   │   └── migration.sql
│   ├── 20250328174829_add_downvotes_to_thread
│   │   └── migration.sql
│   ├── 20250401221213_add_default_model_name
│   │   └── migration.sql
│   └── migration_lock.toml
├── public
│   ├── bg_home_black.jpg
│   ├── bg_home_white.jpg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── verafy-logo.png
│   ├── verafy_logo_black.svg
│   ├── verafy_logo_white.svg
│   ├── vercel.svg
│   └── window.svg
├── remote_supabase_backup.dump
├── store
│   └── query-store.ts
├── styles
│   └── _old_tw3_globals.css
├── test
│   ├── inspect-transaction.js
│   ├── send-transaction-devnet.js
│   ├── test-qa.ts
│   ├── test-transaction.mjs
│   └── test-wallet-bas64-output.js
├── tsconfig.json
├── tsconfig.scripts.json
├── tsconfig.services.json
└── tsconfig.tsbuildinfo

64 directories, 195 files