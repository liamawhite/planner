# Planner Application Architecture

## Overview

The Planner application is a desktop application built with Wails (Go + React) that uses a gRPC-based architecture for communication between the frontend and backend services. The architecture supports two deployment modes: in-process (embedded server) and standalone server.

## System Boundaries

### Components

```
┌─────────────────────────────────────────────────────────┐
│                  Wails Desktop App                      │
│                                                         │
│  ┌────────────────┐         ┌──────────────────────┐  │
│  │ React Frontend │────────>│   Wails Bindings     │  │
│  │  (TypeScript)  │         │   (Go Methods)       │  │
│  └────────────────┘         └──────────┬───────────┘  │
│                                         │               │
│                                         v               │
│                              ┌──────────────────────┐  │
│                              │   gRPC Client        │  │
│                              └──────────┬───────────┘  │
└─────────────────────────────────────────┼──────────────┘
                                          │
                                          │ gRPC
                                          │
                           ┌──────────────v───────────────┐
                           │                              │
                   In-Process Mode     OR    Standalone Mode
                           │                              │
                           v                              v
              ┌────────────────────────┐    ┌────────────────────────┐
              │   Embedded gRPC Server │    │  Standalone gRPC Server│
              │   (localhost:50051)    │    │  (remote:50051)        │
              └────────────┬───────────┘    └────────────┬───────────┘
                           │                              │
                           v                              v
              ┌────────────────────────┐    ┌────────────────────────┐
              │   SQLite Database      │    │  SQLite or PostgreSQL  │
              │   (~/.planner/)        │    │  (configurable)        │
              └────────────────────────┘    └────────────────────────┘
```

### Frontend Layer
- **Technology**: React + TypeScript
- **Responsibilities**:
  - User interface rendering
  - User interaction handling
  - Display of application state
- **Communication**: Calls Go methods via Wails bindings

### Wails Bindings Layer
- **Technology**: Go (Wails framework)
- **Responsibilities**:
  - Bridge between React frontend and backend services
  - Exposes Go methods to TypeScript
  - Manages gRPC client lifecycle
  - Optionally runs embedded gRPC server (in-process mode)

### gRPC Server Layer
- **Technology**: Go + gRPC
- **Responsibilities**:
  - Business logic implementation
  - Data validation
  - Database operations coordination
  - API endpoint exposure
- **Deployment**: Embedded in Wails app OR standalone process

### Database Layer
- **Technology**: SQLite (in-process) or PostgreSQL (standalone)
- **Responsibilities**:
  - Data persistence
  - Transaction management
  - Query execution
- **Implementation**: Type-safe queries via sqlc

## Data Flow

### Request Lifecycle

1. **User Interaction**: User interacts with React UI
2. **Frontend Call**: React component calls Wails-bound Go method
3. **gRPC Client**: Go method invokes gRPC client
4. **Network Transport**: Request sent via gRPC (localhost or remote)
5. **gRPC Server**: Server receives and validates request
6. **Database Query**: Server executes sqlc-generated query
7. **Response**: Data flows back through the stack to the UI

### Example: Creating an Area

```
User clicks "Create Area" button
    ↓
React calls: window.go.main.App.CreateArea(name, description)
    ↓
app.go CreateArea() method invokes gRPC client
    ↓
gRPC request: CreateAreaRequest{name, description}
    ↓
gRPC server receives request
    ↓
Validates input
    ↓
sqlc-generated INSERT query
    ↓
Database persists area
    ↓
Response: Area{id, name, description, created_at, updated_at}
    ↓
React UI updates with new area
```

## Deployment Modes

### In-Process Mode (Default)

**Characteristics**:
- Wails app starts embedded gRPC server on startup
- Server listens on localhost:50051
- gRPC client connects to localhost
- SQLite database in user data directory (~/.planner/planner.db)
- Single binary deployment
- No external services required

**Use Cases**:
- Personal use
- Offline operation
- Simple deployment
- Development and testing

### Standalone Server Mode

**Characteristics**:
- gRPC server runs as separate process
- Wails app connects to remote server address
- Supports SQLite or PostgreSQL
- Requires network connectivity
- Server can support multiple clients

**Use Cases**:
- Shared team planning
- Centralized data storage
- Production deployments
- Client-server architecture

## Database Abstraction

### Design Principles

1. **Type Safety**: All SQL queries defined in .sql files, code generated by sqlc
2. **Portability**: Common SQL subset used where possible
3. **Flexibility**: Runtime switching between SQLite and PostgreSQL
4. **Migration Management**: Automated schema versioning with golang-migrate

### Schema Management

- Migrations stored in `internal/db/migrations/`
- Versioned migration files (001_create_areas.sql, 002_add_tasks.sql, etc.)
- Migrations run automatically on server startup
- Embedded in binary for distribution

### Query Patterns

All database operations follow this pattern:

1. Define queries in `internal/db/queries/*.sql`
2. Run `sqlc generate` to create type-safe Go code
3. Use generated `Queries` struct in server handlers
4. Transactions handled explicitly where needed

## Component Interactions

### Configuration Flow

```
Application Start
    ↓
Load Configuration (env vars, flags, config file)
    ↓
Determine Mode (in-process vs standalone)
    ↓
Initialize Database Connection
    ↓
Run Migrations
    ↓
Start gRPC Server (if in-process mode)
    ↓
Create gRPC Client Connection
    ↓
Bind App Methods to Wails
    ↓
Start Frontend
```

### Error Handling

- gRPC status codes used for API errors
- Database errors mapped to appropriate gRPC codes
- Frontend receives structured error messages
- Logging at each layer for debugging

### State Management

- Database is single source of truth
- No application-level caching (initially)
- Frontend state derived from API responses
- Optimistic UI updates where appropriate

## Security Considerations

### In-Process Mode
- Server bound to localhost only
- No network exposure
- File system permissions control database access

### Standalone Mode
- TLS encryption for gRPC recommended (future)
- Authentication/authorization layer needed (future)
- Network firewall configuration important
- Database connection string security

## Future Extensibility

### New Domain Objects

The Area object establishes a repeatable pattern:

1. Define protobuf message and service in `proto/planner/v1/{object}.proto`
2. Create SQL schema in `internal/db/migrations/`
3. Define queries in `internal/db/queries/{object}.sql`
4. Implement service handlers in `internal/server/{object}.go`
5. Expose methods in `app.go`
6. Build React components

### Additional Features

Architecture supports:
- Real-time updates via gRPC streaming
- Background job processing
- File attachments
- Export/import functionality
- Multi-user collaboration
- Offline sync capabilities

## Technology Choices

### Why gRPC?
- Type-safe API contracts via protobuf
- Efficient binary serialization
- Supports streaming for future features
- Cross-platform compatibility
- Excellent tooling (buf, grpcurl, etc.)

### Why sqlc?
- Type safety without ORM complexity
- Control over exact SQL queries
- Performance optimization opportunities
- Multi-database support
- Minimal runtime dependencies

### Why Wails?
- Native desktop performance
- Single binary distribution
- Go backend + modern frontend
- Small application size
- Cross-platform support

## Development Workflow

1. **Design**: Define API in protobuf
2. **Generate**: Run `make gen` to generate code
3. **Implement**: Write server handlers using generated types
4. **Bind**: Expose methods in app.go
5. **UI**: Build React components using Wails bindings
6. **Test**: Verify both in-process and standalone modes

## Build System

### Code Generation
- `make gen`: Runs buf generate + sqlc generate
- Generates gRPC stubs and database access code
- Required before compilation

### Compilation
- `make build`: Builds Wails desktop app
- `make server`: Builds standalone server binary
- Both depend on `make gen`

### Database
- `make migrate`: Runs pending migrations
- Migrations embedded in binaries for production
