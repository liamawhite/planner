package db

import (
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// OpenSQLite opens a SQLite database connection
func OpenSQLite(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run migrations
	if err := runMigrations(db, "sqlite3"); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return NewStore(db), nil
}

// BackupSQLite creates a backup of the SQLite database file
func BackupSQLite(dbPath string, maxBackups int) error {
	// Check if database file exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		// No database file to backup yet
		return nil
	}

	// Create backup directory
	backupDir := filepath.Join(filepath.Dir(dbPath), "backups")
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Create timestamped backup filename
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	backupPath := filepath.Join(backupDir, fmt.Sprintf("planner_%s.db", timestamp))

	// Copy database file to backup
	if err := copyFile(dbPath, backupPath); err != nil {
		return fmt.Errorf("failed to copy database to backup: %w", err)
	}

	// Clean up old backups (keep only maxBackups most recent)
	if err := cleanupOldBackups(backupDir, maxBackups); err != nil {
		return fmt.Errorf("failed to cleanup old backups: %w", err)
	}

	return nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return err
	}

	return destFile.Sync()
}

// cleanupOldBackups removes old backup files, keeping only the most recent maxBackups
func cleanupOldBackups(backupDir string, maxBackups int) error {
	files, err := os.ReadDir(backupDir)
	if err != nil {
		return err
	}

	// Filter for .db files
	var backupFiles []os.DirEntry
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".db" {
			backupFiles = append(backupFiles, file)
		}
	}

	// If we have fewer backups than the max, nothing to clean up
	if len(backupFiles) <= maxBackups {
		return nil
	}

	// Sort by modification time (oldest first)
	sort.Slice(backupFiles, func(i, j int) bool {
		infoI, _ := backupFiles[i].Info()
		infoJ, _ := backupFiles[j].Info()
		return infoI.ModTime().Before(infoJ.ModTime())
	})

	// Remove oldest backups
	toRemove := len(backupFiles) - maxBackups
	for i := 0; i < toRemove; i++ {
		backupPath := filepath.Join(backupDir, backupFiles[i].Name())
		if err := os.Remove(backupPath); err != nil {
			return fmt.Errorf("failed to remove old backup %s: %w", backupFiles[i].Name(), err)
		}
	}

	return nil
}
