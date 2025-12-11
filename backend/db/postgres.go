package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// OpenPostgreSQL opens a PostgreSQL database connection
func OpenPostgreSQL(connString string) (*Store, error) {
	db, err := sql.Open("postgres", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run migrations
	if err := runMigrations(db, "postgres"); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return NewStore(db), nil
}
