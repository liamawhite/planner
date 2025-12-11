package config

import (
	"fmt"
	"os"
	"path/filepath"
)

// Config holds application configuration
type Config struct {
	// Mode determines if the server runs in-process or as a standalone service
	Mode Mode

	// Database configuration
	Database DatabaseConfig

	// Server configuration
	Server ServerConfig
}

// Mode represents the application mode
type Mode string

const (
	// ModeInProcess runs the gRPC server embedded in the Wails app
	ModeInProcess Mode = "in-process"

	// ModeStandalone connects to a remote gRPC server
	ModeStandalone Mode = "standalone"
)

// DatabaseConfig holds database-specific configuration
type DatabaseConfig struct {
	// Type specifies the database type (sqlite or postgres)
	Type string

	// Path is the file path for SQLite databases
	Path string

	// ConnectionString is used for PostgreSQL connections
	ConnectionString string
}

// ServerConfig holds gRPC server configuration
type ServerConfig struct {
	// Address is the gRPC server address
	Address string

	// Port is the gRPC server port
	Port int
}

// DefaultConfig returns a default configuration for in-process mode
func DefaultConfig() (*Config, error) {
	dataDir, err := userDataDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get user data directory: %w", err)
	}

	// Ensure the data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "planner.db")

	return &Config{
		Mode: ModeInProcess,
		Database: DatabaseConfig{
			Type: "sqlite",
			Path: dbPath,
		},
		Server: ServerConfig{
			Address: "localhost",
			Port:    50051,
		},
	}, nil
}

// StandaloneConfig returns a configuration for standalone server mode
func StandaloneConfig(serverAddress string, serverPort int) *Config {
	return &Config{
		Mode: ModeStandalone,
		Server: ServerConfig{
			Address: serverAddress,
			Port:    serverPort,
		},
	}
}

// ServerStandaloneConfig returns a configuration for running as a standalone server
func ServerStandaloneConfig(dbType, dbConfig string, port int) *Config {
	cfg := &Config{
		Mode: ModeStandalone,
		Database: DatabaseConfig{
			Type: dbType,
		},
		Server: ServerConfig{
			Address: "0.0.0.0",
			Port:    port,
		},
	}

	if dbType == "sqlite" {
		cfg.Database.Path = dbConfig
	} else {
		cfg.Database.ConnectionString = dbConfig
	}

	return cfg
}

// ServerAddress returns the full server address (host:port)
func (c *Config) ServerAddress() string {
	return fmt.Sprintf("%s:%d", c.Server.Address, c.Server.Port)
}

// userDataDir returns the appropriate user data directory for the platform
func userDataDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	// Use platform-specific data directory
	var dataDir string
	switch {
	case os.Getenv("XDG_DATA_HOME") != "":
		// Linux with XDG
		dataDir = filepath.Join(os.Getenv("XDG_DATA_HOME"), "planner")
	case fileExists(filepath.Join(homeDir, "Library")):
		// macOS
		dataDir = filepath.Join(homeDir, "Library", "Application Support", "planner")
	default:
		// Fallback for Linux and others
		dataDir = filepath.Join(homeDir, ".planner")
	}

	return dataDir, nil
}

// fileExists checks if a file or directory exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
