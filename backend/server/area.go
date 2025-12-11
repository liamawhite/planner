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

// AreaService implements the AreaService gRPC service
type AreaService struct {
	pb.UnimplementedAreaServiceServer
	store *db.Store
}

// NewAreaService creates a new AreaService
func NewAreaService(store *db.Store) *AreaService {
	return &AreaService{
		store: store,
	}
}

// CreateArea creates a new area
func (s *AreaService) CreateArea(ctx context.Context, req *pb.CreateAreaRequest) (*pb.CreateAreaResponse, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}

	now := time.Now()
	id := uuid.New().String()

	area, err := s.store.Queries.CreateArea(ctx, db.CreateAreaParams{
		ID:          id,
		Name:        req.Name,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
		CreatedAt:   now,
		UpdatedAt:   now,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create area: %v", err)
	}

	return &pb.CreateAreaResponse{
		Area: dbAreaToProto(area),
	}, nil
}

// GetArea retrieves an area by ID
func (s *AreaService) GetArea(ctx context.Context, req *pb.GetAreaRequest) (*pb.GetAreaResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	area, err := s.store.Queries.GetArea(ctx, req.Id)
	if err == sql.ErrNoRows {
		return nil, status.Errorf(codes.NotFound, "area not found: %s", req.Id)
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get area: %v", err)
	}

	return &pb.GetAreaResponse{
		Area: dbAreaToProto(area),
	}, nil
}

// ListAreas lists all areas
func (s *AreaService) ListAreas(ctx context.Context, req *pb.ListAreasRequest) (*pb.ListAreasResponse, error) {
	areas, err := s.store.Queries.ListAreas(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list areas: %v", err)
	}

	pbAreas := make([]*pb.Area, len(areas))
	for i, area := range areas {
		pbAreas[i] = dbAreaToProto(area)
	}

	return &pb.ListAreasResponse{
		Areas: pbAreas,
	}, nil
}

// UpdateArea updates an existing area
func (s *AreaService) UpdateArea(ctx context.Context, req *pb.UpdateAreaRequest) (*pb.UpdateAreaResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if area exists
	exists, err := s.store.Queries.AreaExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check area existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "area not found: %s", req.Id)
	}

	// Prepare update parameters
	var name sql.NullString
	if req.Name != nil {
		name = sql.NullString{String: *req.Name, Valid: true}
	}

	var description sql.NullString
	if req.Description != nil {
		description = sql.NullString{String: *req.Description, Valid: true}
	}

	area, err := s.store.Queries.UpdateArea(ctx, db.UpdateAreaParams{
		ID:          req.Id,
		Name:        name,
		Description: description,
		UpdatedAt:   time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update area: %v", err)
	}

	return &pb.UpdateAreaResponse{
		Area: dbAreaToProto(area),
	}, nil
}

// DeleteArea deletes an area
func (s *AreaService) DeleteArea(ctx context.Context, req *pb.DeleteAreaRequest) (*pb.DeleteAreaResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if area exists
	exists, err := s.store.Queries.AreaExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check area existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "area not found: %s", req.Id)
	}

	if err := s.store.Queries.DeleteArea(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete area: %v", err)
	}

	return &pb.DeleteAreaResponse{
		Success: true,
	}, nil
}

// dbAreaToProto converts a database area to a protobuf area
func dbAreaToProto(area db.Area) *pb.Area {
	return &pb.Area{
		Id:          area.ID,
		Name:        area.Name,
		Description: area.Description.String,
		CreatedAt:   timestamppb.New(area.CreatedAt),
		UpdatedAt:   timestamppb.New(area.UpdatedAt),
	}
}
