.PHONY: install dev build build-darwin build-windows build-linux clean test test-e2e test-e2e-ui test-e2e-headed lint format gen server help

# Use nix develop shell if nix is available and we're not already in one
ifndef IN_NIX_SHELL
ifneq ($(shell command -v nix 2> /dev/null),)
SHELL := nix develop --command bash
endif
endif

install: ## Install frontend dependencies
	cd frontend && npm install

gen: ## Generate code (protobuf + sqlc)
	cd backend && buf generate
	cd backend/db && sqlc generate

dev: ## Run application in development mode
	@echo "Stopping any running instances..."
	@pkill -f "wails dev" 2>/dev/null || true
	@pkill -f "planner.app" 2>/dev/null || true
	@lsof -ti:50051 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd frontend && wails dev

build: gen install ## Build application for production
	cd frontend && wails build

build-darwin: ## Build for macOS
	cd frontend && wails build -platform darwin/universal

build-windows: ## Build for Windows
	cd frontend && wails build -platform windows/amd64

build-linux: ## Build for Linux
	cd frontend && wails build -platform linux/amd64

server: gen ## Build standalone gRPC server
	cd backend && go build -o ../build/server/planner-server ./cmd/server

clean: ## Clean build artifacts and generated code
	rm -rf build/
	rm -rf frontend/dist frontend/node_modules frontend/wailsjs
	rm -rf backend/gen/planner
	rm -rf backend/db/*.sql.go backend/db/db.go backend/db/models.go backend/db/querier.go

test: ## Run Go tests
	go test ./...

test-e2e: ## Run Playwright E2E tests
	cd frontend && npm run test

test-e2e-ui: ## Run Playwright E2E tests with UI
	cd frontend && npm run test:ui

test-e2e-headed: ## Run Playwright E2E tests in headed mode
	cd frontend && npm run test:headed

lint: ## Run linters
	cd frontend && npm run lint

format: ## Format code
	go fmt ./...
	cd frontend && npm run format

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@if [ -n "$$(command -v nix 2> /dev/null)" ] && [ -z "$$IN_NIX_SHELL" ]; then \
		echo 'Nix detected - all commands will run in nix develop environment'; \
		echo ''; \
	fi
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help
