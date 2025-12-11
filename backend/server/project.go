package server

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/liamawhite/planner/backend/db"
	pb "github.com/liamawhite/planner/backend/gen/planner/v1"
)

// ProjectService implements the ProjectService gRPC service
type ProjectService struct {
	pb.UnimplementedProjectServiceServer
	store *db.Store
}

// NewProjectService creates a new ProjectService
func NewProjectService(store *db.Store) *ProjectService {
	return &ProjectService{
		store: store,
	}
}

// CreateProject creates a new project
func (s *ProjectService) CreateProject(ctx context.Context, req *pb.CreateProjectRequest) (*pb.CreateProjectResponse, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.AreaId == "" {
		return nil, status.Error(codes.InvalidArgument, "area_id is required")
	}

	// Validate that the area exists
	areaExists, err := s.store.Queries.AreaExists(ctx, req.AreaId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check area existence: %v", err)
	}
	if !areaExists {
		return nil, status.Errorf(codes.NotFound, "area not found: %s", req.AreaId)
	}

	now := time.Now()
	id := uuid.New().String()

	project, err := s.store.Queries.CreateProject(ctx, db.CreateProjectParams{
		ID:        id,
		Name:      req.Name,
		AreaID:    req.AreaId,
		CreatedAt: now,
		UpdatedAt: now,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create project: %v", err)
	}

	return &pb.CreateProjectResponse{
		Project: dbProjectToProto(project),
	}, nil
}

// GetProject retrieves a project by ID
func (s *ProjectService) GetProject(ctx context.Context, req *pb.GetProjectRequest) (*pb.GetProjectResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	project, err := s.store.Queries.GetProject(ctx, req.Id)
	if err == sql.ErrNoRows {
		return nil, status.Errorf(codes.NotFound, "project not found: %s", req.Id)
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get project: %v", err)
	}

	return &pb.GetProjectResponse{
		Project: dbProjectToProto(project),
	}, nil
}

// ListProjects lists projects, optionally filtered by area
func (s *ProjectService) ListProjects(ctx context.Context, req *pb.ListProjectsRequest) (*pb.ListProjectsResponse, error) {
	var areaID sql.NullString
	if req.AreaId != nil && *req.AreaId != "" {
		areaID = sql.NullString{String: *req.AreaId, Valid: true}
	}

	projects, err := s.store.Queries.ListProjects(ctx, areaID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list projects: %v", err)
	}

	pbProjects := make([]*pb.Project, len(projects))
	for i, project := range projects {
		pbProjects[i] = dbProjectToProto(project)
	}

	return &pb.ListProjectsResponse{
		Projects: pbProjects,
	}, nil
}

// UpdateProject updates an existing project
func (s *ProjectService) UpdateProject(ctx context.Context, req *pb.UpdateProjectRequest) (*pb.UpdateProjectResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if project exists
	exists, err := s.store.Queries.ProjectExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check project existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "project not found: %s", req.Id)
	}

	// Prepare update parameters
	var name sql.NullString
	if req.Name != nil {
		name = sql.NullString{String: *req.Name, Valid: true}
	}

	project, err := s.store.Queries.UpdateProject(ctx, db.UpdateProjectParams{
		ID:        req.Id,
		Name:      name,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update project: %v", err)
	}

	return &pb.UpdateProjectResponse{
		Project: dbProjectToProto(project),
	}, nil
}

// DeleteProject deletes a project
func (s *ProjectService) DeleteProject(ctx context.Context, req *pb.DeleteProjectRequest) (*pb.DeleteProjectResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if project exists
	exists, err := s.store.Queries.ProjectExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check project existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "project not found: %s", req.Id)
	}

	if err := s.store.Queries.DeleteProject(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete project: %v", err)
	}

	return &pb.DeleteProjectResponse{
		Success: true,
	}, nil
}

// dbProjectToProto converts a database project to a protobuf project
func dbProjectToProto(project db.Project) *pb.Project {
	return &pb.Project{
		Id:        project.ID,
		Name:      project.Name,
		AreaId:    project.AreaID,
		CreatedAt: timestamppb.New(project.CreatedAt),
		UpdatedAt: timestamppb.New(project.UpdatedAt),
	}
}
