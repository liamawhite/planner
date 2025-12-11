package server

import (
	"fmt"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"github.com/liamawhite/planner/backend/db"
	pb "github.com/liamawhite/planner/backend/gen/planner/v1"
)

// Server represents the gRPC server
type Server struct {
	store      *db.Store
	grpcServer *grpc.Server
	listener   net.Listener
}

// New creates a new gRPC server
func New(store *db.Store) *Server {
	grpcServer := grpc.NewServer()

	// Register services
	areaService := NewAreaService(store)
	pb.RegisterAreaServiceServer(grpcServer, areaService)

	projectService := NewProjectService(store)
	pb.RegisterProjectServiceServer(grpcServer, projectService)

	taskService := NewTaskService(store)
	pb.RegisterTaskServiceServer(grpcServer, taskService)

	// Register reflection service for debugging
	reflection.Register(grpcServer)

	return &Server{
		store:      store,
		grpcServer: grpcServer,
	}
}

// Start starts the gRPC server on the specified address
func (s *Server) Start(address string) error {
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", address, err)
	}

	s.listener = listener

	// Start serving in a goroutine
	go func() {
		if err := s.grpcServer.Serve(listener); err != nil {
			// Log error but don't panic - might be a graceful shutdown
			fmt.Printf("gRPC server error: %v\n", err)
		}
	}()

	return nil
}

// Stop gracefully stops the gRPC server
func (s *Server) Stop() {
	if s.grpcServer != nil {
		s.grpcServer.GracefulStop()
	}
}

// Address returns the address the server is listening on
func (s *Server) Address() string {
	if s.listener == nil {
		return ""
	}
	return s.listener.Addr().String()
}
