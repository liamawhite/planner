# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Planner Project Overview

## Architecture

This is a planner application with a **two-layer architecture**:

### Layers

1. **frontend/** - Wails desktop app + React UI
   - Contains both Wails application code (Go) and React UI (TypeScript)
   - Bridges UI and backend via gRPC
   - Manages embedded gRPC server (in-process mode)
   - Exposes backend methods to React UI via Wails bindings

2. **backend/** - gRPC server and business logic
   - Can run standalone or embedded
   - gRPC API defined in protobuf
   - Database layer with sqlc and migrations
   - Supports SQLite and PostgreSQL

## File Structure

```
planner/
├── frontend/            # Wails desktop app + React UI
│   ├── main.go         # Wails entry point
│   ├── app.go          # Wails app struct with gRPC client
│   ├── wails.json      # Wails configuration
│   ├── src/            # React source code
│   ├── wailsjs/        # Generated Wails bindings
│   ├── package.json
│   └── vite.config.ts
│
├── backend/            # gRPC server
│   ├── api/            # Proto definitions
│   ├── gen/            # Generated protobuf code
│   ├── cmd/server/     # Standalone server binary
│   ├── config/         # Configuration
│   ├── db/             # Database layer (sqlc, migrations)
│   ├── server/         # gRPC server implementation
│   ├── pkg/client/     # gRPC client library
│   ├── buf.yaml
│   └── buf.gen.yaml
│
├── build/              # All build artifacts
│   └── server/         # Standalone server binary
│
├── docs/               # Documentation
│   ├── architecture.md # System design
│   └── model.md        # Data models (user-facing)
│
├── go.mod              # Single root Go module
├── Makefile
├── flake.nix
└── CLAUDE.md           # This file (quick reference)
```

## Key Technologies

**Backend:**
- Go 1.24
- gRPC + Protocol Buffers
- Buf for proto tooling
- sqlc for type-safe SQL
- SQLite + PostgreSQL
- Goose for migrations
- Cobra for CLI

**Frontend:**
- React 18 + TypeScript
- Vite v3
- Tailwind CSS v4 (with `@tailwindcss/postcss`)
- shadcn/ui components

**Desktop:**
- Wails v2

## Common Commands

```bash
# Code generation
make gen              # Generate protobuf + sqlc code

# Development
make dev              # Run Wails app in dev mode
make install          # Install UI dependencies

# Building
make build            # Build desktop app
make server           # Build standalone server

# Cleanup
make clean            # Remove all build artifacts

# Testing
make test             # Run Go tests
```

## Development Workflow

### Adding a New Domain Object

1. **Define API**: Create proto in `backend/api/planner/v1/{object}.proto`
2. **Generate**: Run `make gen` to create Go code
3. **Database**:
   - Add migration in `backend/db/migrations/`
   - Add queries in `backend/db/queries/`
4. **Implement**: Create service handler in `backend/server/{object}.go`
5. **Expose**: Add methods to `frontend/app.go`
6. **UI**: Build React components in `frontend/src/` using generated Wails bindings

### Running Modes

**In-Process Mode** (default):
- Wails app starts embedded gRPC server
- SQLite at `~/.planner/planner.db`
- Everything in one process

**Standalone Server Mode**:
- Run server: `./build/server/planner-server --db-type=postgres --db-config="..."`
- Configure app to connect to remote server

## Important Files

### Configuration
- `backend/buf.yaml` - Protobuf module config
- `backend/buf.gen.yaml` - Code generation rules
- `backend/db/sqlc.yaml` - SQL code generation
- `frontend/wails.json` - Wails config
- `Makefile` - Build orchestration

### Documentation
- `docs/architecture.md` - Technical architecture (for developers)
- `docs/model.md` - Data models (for end users)
- `CLAUDE.md` - This file (quick reference)

### Entry Points
- `frontend/main.go` - Desktop app entry
- `backend/cmd/server/main.go` - Standalone server entry

## Database

**Migrations**: `backend/db/migrations/`
- Versioned SQL files
- Run automatically on server startup
- Managed by Goose

**Queries**: `backend/db/queries/`
- SQL query definitions
- Generated into type-safe Go code by sqlc

## Proto/API

**Source**: `backend/api/planner/v1/`
- Protocol buffer definitions
- Include protovalidate annotations for validation

**Generated**: `backend/gen/planner/v1/`
- `*.pb.go` - Message definitions
- `*_grpc.pb.go` - Service stubs

## Build Outputs

All build artifacts go to `build/`:
- `build/desktop/` - Wails desktop app
- `build/server/` - Standalone server binary
- `build/ui/` - UI production build (if separate)

## Git Strategy

**Committed**:
- Proto source files
- Generated protobuf `.pb.go` files (for easy review)
- Application code
- Documentation

**Ignored** (generated at build time):
- sqlc generated code
- Frontend node_modules, dist, and Wails bindings
- Build artifacts

## Frontend-Specific Details

### UI Technology
- **Tailwind CSS v4**: Use `@tailwindcss/postcss` plugin in `postcss.config.js` (NOT `tailwindcss`)
- **shadcn/ui**: Install components via CLI only: `npx shadcn@latest add <component>`
- **Dark mode**: Auto-detects system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
- **Import alias**: Use `@/` for imports (e.g., `import { Button } from "@/components/ui/button"`)

### Important Frontend Files
- `frontend/wails.json` - Wails configuration (includes `"frontend:dir": "."`)
- `frontend/src/App.css` - Tailwind directives + shadcn theme variables (auto-generated)
- `frontend/postcss.config.js` - Must use `'@tailwindcss/postcss': {}`
- `frontend/tailwind.config.js` - shadcn color system and dark mode config

## Database Layer Details

### File Organization
- `backend/db/sqlite.go` - SQLite connection + BackupSQLite() + helpers
- `backend/db/postgres.go` - PostgreSQL connection
- `backend/db/store.go` - Common Store struct + runMigrations()

### SQLite Backups
- Automatic backup on startup (if using SQLite)
- Keeps 7 most recent backups with timestamp format: `planner_2025-12-10_23-19-21.db`
- Location: `~/Library/Application Support/planner/backups/` (macOS)

## Common Gotchas

- **Port 50051 in use**: Multiple `make dev` instances running - kill with `pkill -f "wails dev"`
- **Tailwind not working**: Ensure `postcss.config.js` uses `'@tailwindcss/postcss'` not `tailwindcss`
- **shadcn components**: Always use CLI (`npx shadcn@latest add`), never manual creation
- **Missing wailsjs bindings**: Generated during `make dev` or `make build`
- **Frontend build fails**: If TypeScript compiler fails, remove `tsc &&` from package.json build script

## Notes

- Single `go.mod` at root - no workspace mode needed
- Proto files committed for IDE support and easier diffs
- Backend is independently usable as a Go module
- Frontend combines Wails (Go) and React (TypeScript) in one directory
- Nix flakes manage development environment (Wails, Go, Node.js)
- Makefile automatically uses Nix if available
