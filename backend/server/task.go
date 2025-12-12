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

// TaskService implements the TaskService gRPC service
type TaskService struct {
	pb.UnimplementedTaskServiceServer
	store *db.Store
}

// NewTaskService creates a new TaskService
func NewTaskService(store *db.Store) *TaskService {
	return &TaskService{
		store: store,
	}
}

// CreateTask creates a new task
func (s *TaskService) CreateTask(ctx context.Context, req *pb.CreateTaskRequest) (*pb.CreateTaskResponse, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.ProjectId == "" {
		return nil, status.Error(codes.InvalidArgument, "project_id is required")
	}

	// Validate that the project exists
	projectExists, err := s.store.Queries.ProjectExists(ctx, req.ProjectId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check project existence: %v", err)
	}
	if !projectExists {
		return nil, status.Errorf(codes.NotFound, "project not found: %s", req.ProjectId)
	}

	now := time.Now()
	id := uuid.New().String()

	task, err := s.store.Queries.CreateTask(ctx, db.CreateTaskParams{
		ID:        id,
		Name:      req.Name,
		Notes:     req.Notes,
		ProjectID: req.ProjectId,
		CreatedAt: now,
		UpdatedAt: now,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create task: %v", err)
	}

	return &pb.CreateTaskResponse{
		Task: dbTaskToProto(task),
	}, nil
}

// GetTask retrieves a task by ID
func (s *TaskService) GetTask(ctx context.Context, req *pb.GetTaskRequest) (*pb.GetTaskResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	task, err := s.store.Queries.GetTask(ctx, req.Id)
	if err == sql.ErrNoRows {
		return nil, status.Errorf(codes.NotFound, "task not found: %s", req.Id)
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get task: %v", err)
	}

	return &pb.GetTaskResponse{
		Task: dbTaskToProto(task),
	}, nil
}

// ListTasks lists tasks, optionally filtered by project
func (s *TaskService) ListTasks(ctx context.Context, req *pb.ListTasksRequest) (*pb.ListTasksResponse, error) {
	var projectID sql.NullString
	if req.ProjectId != nil && *req.ProjectId != "" {
		projectID = sql.NullString{String: *req.ProjectId, Valid: true}
	}

	tasks, err := s.store.Queries.ListTasks(ctx, projectID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list tasks: %v", err)
	}

	pbTasks := make([]*pb.Task, len(tasks))
	for i, task := range tasks {
		pbTasks[i] = dbTaskToProto(task)
	}

	return &pb.ListTasksResponse{
		Tasks: pbTasks,
	}, nil
}

// UpdateTask updates an existing task
func (s *TaskService) UpdateTask(ctx context.Context, req *pb.UpdateTaskRequest) (*pb.UpdateTaskResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if task exists
	exists, err := s.store.Queries.TaskExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check task existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "task not found: %s", req.Id)
	}

	// Prepare update parameters
	var name sql.NullString
	if req.Name != nil {
		name = sql.NullString{String: *req.Name, Valid: true}
	}

	var notes sql.NullString
	if req.Notes != nil {
		notes = sql.NullString{String: *req.Notes, Valid: true}
	}

	task, err := s.store.Queries.UpdateTask(ctx, db.UpdateTaskParams{
		ID:        req.Id,
		Name:      name,
		Notes:     notes,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update task: %v", err)
	}

	return &pb.UpdateTaskResponse{
		Task: dbTaskToProto(task),
	}, nil
}

// DeleteTask deletes a task
func (s *TaskService) DeleteTask(ctx context.Context, req *pb.DeleteTaskRequest) (*pb.DeleteTaskResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	// Check if task exists
	exists, err := s.store.Queries.TaskExists(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check task existence: %v", err)
	}
	if !exists {
		return nil, status.Errorf(codes.NotFound, "task not found: %s", req.Id)
	}

	if err := s.store.Queries.DeleteTask(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete task: %v", err)
	}

	return &pb.DeleteTaskResponse{
		Success: true,
	}, nil
}

// dbTaskToProto converts a database task to a protobuf task
func dbTaskToProto(task db.Task) *pb.Task {
	return &pb.Task{
		Id:        task.ID,
		Name:      task.Name,
		Notes:     task.Notes,
		ProjectId: task.ProjectID,
		CreatedAt: timestamppb.New(task.CreatedAt),
		UpdatedAt: timestamppb.New(task.UpdatedAt),
	}
}
