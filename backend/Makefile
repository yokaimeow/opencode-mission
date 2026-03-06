DATABASE_URL=postgres://postgres:password@localhost:5432/opencode-mission?sslmode=disable

.PHONY: help install-migrate migrate-up migrate-down migrate-create migrate-version migrate-force run test build clean

help:
	@echo "Available commands:"
	@echo "  make install-migrate  - Install golang-migrate tool"
	@echo "  make migrate-up       - Run database migrations"
	@echo "  make migrate-down     - Rollback last migration"
	@echo "  make migrate-create   - Create new migration (usage: make migrate-create name=your_migration_name)"
	@echo "  make migrate-version  - Show current migration version"
	@echo "  make migrate-force    - Force migration version (usage: make migrate-force version=1)"
	@echo "  make run              - Start the server"
	@echo "  make test             - Run tests"
	@echo "  make build            - Build binary file"
	@echo "  make clean            - Remove binary file"

install-migrate:
	@echo "Installing golang-migrate..."
	@go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "✅ golang-migrate installed successfully"
	@migrate --version

migrate-up:
	@echo "Running database migrations..."
	@migrate -path migrations -database "${DATABASE_URL}" up
	@echo "✅ Migrations completed"

migrate-down:
	@echo "Rolling back last migration..."
	@migrate -path migrations -database "${DATABASE_URL}" down 1
	@echo "✅ Rollback completed"

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "❌ Error: Migration name is required. Usage: make migrate-create name=your_migration_name"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)..."
	@migrate create -ext sql -dir migrations -seq $(name)
	@echo "✅ Migration created"

migrate-version:
	@echo "Checking migration version..."
	@migrate -path migrations -database "${DATABASE_URL}" version

migrate-force:
	@if [ -z "$(version)" ]; then \
		echo "❌ Error: Version is required. Usage: make migrate-force version=1"; \
		exit 1; \
	fi
	@echo "Forcing migration version to $(version)..."
	@migrate -path migrations -database "${DATABASE_URL}" force $(version)
	@echo "✅ Migration version forced"

run:
	@echo "Starting server..."
	@go run cmd/server/main.go

test:
	@echo "Running tests..."
	@go test -v ./...

build:
	@echo "Building server..."
	@go build -o bin/server cmd/server/main.go
	@echo "✅ Server built successfully"

clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@echo "✅ Cleaned"
