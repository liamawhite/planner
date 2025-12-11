package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/liamawhite/planner/backend/config"
	"github.com/liamawhite/planner/backend/db"
	"github.com/liamawhite/planner/backend/server"
)

var (
	dbType   string
	dbConfig string
	port     int
)

var rootCmd = &cobra.Command{
	Use:   "planner-server",
	Short: "Planner gRPC server",
	Long:  `A standalone gRPC server for the Planner application supporting SQLite and PostgreSQL databases.`,
	Run:   runServer,
}

func init() {
	rootCmd.Flags().StringVar(&dbType, "db-type", "sqlite", "Database type (sqlite or postgres)")
	rootCmd.Flags().StringVar(&dbConfig, "db-config", "./planner.db", "Database configuration (path for sqlite, connection string for postgres)")
	rootCmd.Flags().IntVar(&port, "port", 50051, "gRPC server port")
}

func runServer(cmd *cobra.Command, args []string) {
	// Create configuration
	cfg := config.ServerStandaloneConfig(dbType, dbConfig, port)

	// Initialize database
	var store *db.Store
	var err error

	log.Printf("Initializing database (type: %s)...\n", cfg.Database.Type)
	switch cfg.Database.Type {
	case "sqlite":
		store, err = db.OpenSQLite(cfg.Database.Path)
		if err != nil {
			log.Fatalf("Failed to open SQLite database: %v", err)
		}
		log.Printf("SQLite database initialized at: %s\n", cfg.Database.Path)

	case "postgres":
		store, err = db.OpenPostgreSQL(cfg.Database.ConnectionString)
		if err != nil {
			log.Fatalf("Failed to open PostgreSQL database: %v", err)
		}
		log.Println("PostgreSQL database initialized")

	default:
		log.Fatalf("Unsupported database type: %s", cfg.Database.Type)
	}
	defer store.Close()

	// Create and start gRPC server
	srv := server.New(store)
	serverAddr := cfg.ServerAddress()

	log.Printf("Starting gRPC server on %s...\n", serverAddr)
	if err := srv.Start(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

	log.Printf("gRPC server listening on %s\n", srv.Address())
	log.Println("Press Ctrl+C to stop")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	fmt.Println("\nShutting down server...")
	srv.Stop()
	log.Println("Server stopped")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
