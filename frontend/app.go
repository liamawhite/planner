package main

import (
	"context"
	"fmt"
	"log"

	"github.com/liamawhite/planner/backend/config"
	"github.com/liamawhite/planner/backend/db"
	"github.com/liamawhite/planner/backend/server"
	"github.com/liamawhite/planner/backend/pkg/client"
	pb "github.com/liamawhite/planner/backend/gen/planner/v1"
)

// App struct
type App struct {
	ctx    context.Context
	cfg    *config.Config
	store  *db.Store
	server *server.Server
	client *client.Client
}

// NewApp creates a new App application struct
func NewApp(cfg *config.Config, store *db.Store, srv *server.Server, cl *client.Client) *App {
	return &App{
		cfg:    cfg,
		store:  store,
		server: srv,
		client: cl,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("Planner application started successfully")
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(ctx context.Context) {
	log.Println("Shutting down Planner application...")

	if a.client != nil {
		a.client.Close()
	}

	if a.server != nil {
		a.server.Stop()
	}

	if a.store != nil {
		a.store.Close()
	}
}

// Greet returns a greeting for the given name (legacy method for demo)
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CreateArea creates a new area
func (a *App) CreateArea(name, description string) (*pb.Area, error) {
	return a.client.CreateArea(a.ctx, name, description)
}

// GetArea retrieves an area by ID
func (a *App) GetArea(id string) (*pb.Area, error) {
	return a.client.GetArea(a.ctx, id)
}

// ListAreas lists all areas
func (a *App) ListAreas() ([]*pb.Area, error) {
	return a.client.ListAreas(a.ctx)
}

// UpdateArea updates an existing area
func (a *App) UpdateArea(id string, name, description *string) (*pb.Area, error) {
	return a.client.UpdateArea(a.ctx, id, name, description)
}

// DeleteArea deletes an area
func (a *App) DeleteArea(id string) error {
	return a.client.DeleteArea(a.ctx, id)
}

// CreateProject creates a new project
func (a *App) CreateProject(name, areaID string) (*pb.Project, error) {
	return a.client.CreateProject(a.ctx, name, areaID)
}

// GetProject retrieves a project by ID
func (a *App) GetProject(id string) (*pb.Project, error) {
	return a.client.GetProject(a.ctx, id)
}

// ListProjects lists projects, optionally filtered by area
func (a *App) ListProjects(areaID *string) ([]*pb.Project, error) {
	return a.client.ListProjects(a.ctx, areaID)
}

// UpdateProject updates an existing project
func (a *App) UpdateProject(id string, name *string) (*pb.Project, error) {
	return a.client.UpdateProject(a.ctx, id, name)
}

// DeleteProject deletes a project
func (a *App) DeleteProject(id string) error {
	return a.client.DeleteProject(a.ctx, id)
}
