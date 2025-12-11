package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/liamawhite/planner/backend/config"
	"github.com/liamawhite/planner/backend/db"
	"github.com/liamawhite/planner/backend/server"
	"github.com/liamawhite/planner/backend/pkg/client"
)

//go:embed all:dist
var assets embed.FS

func main() {
	// Initialize configuration
	cfg, err := config.DefaultConfig()
	if err != nil {
		log.Fatalf("Failed to initialize configuration: %v", err)
	}

	log.Printf("Starting Planner in %s mode", cfg.Mode)
	log.Printf("Database: %s at %s", cfg.Database.Type, cfg.Database.Path)

	// Initialize database
	var store *db.Store
	switch cfg.Database.Type {
	case "sqlite":
		// Backup existing database before opening
		if err := db.BackupSQLite(cfg.Database.Path, 7); err != nil {
			log.Printf("Warning: Failed to backup database: %v", err)
		} else {
			log.Printf("Database backup created successfully")
		}

		store, err = db.OpenSQLite(cfg.Database.Path)
		if err != nil {
			log.Fatalf("Failed to open database: %v", err)
		}
		log.Printf("SQLite database initialized successfully")

	case "postgres":
		store, err = db.OpenPostgreSQL(cfg.Database.ConnectionString)
		if err != nil {
			log.Fatalf("Failed to open database: %v", err)
		}
		log.Println("PostgreSQL database initialized successfully")

	default:
		log.Fatalf("Unsupported database type: %s", cfg.Database.Type)
	}

	// Start gRPC server for in-process mode
	var srv *server.Server
	if cfg.Mode == config.ModeInProcess {
		srv = server.New(store)
		serverAddr := cfg.ServerAddress()

		if err := srv.Start(serverAddr); err != nil {
			log.Fatalf("Failed to start gRPC server: %v", err)
		}
		log.Printf("gRPC server started on %s", srv.Address())
	}

	// Create gRPC client
	cl, err := client.New(cfg.ServerAddress())
	if err != nil {
		log.Fatalf("Failed to create gRPC client: %v", err)
	}
	log.Printf("gRPC client connected to %s", cfg.ServerAddress())

	// Create an instance of the app structure
	app := NewApp(cfg, store, srv, cl)

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "planner",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatalf("Failed to start application: %v", err)
	}
}
