package client

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/liamawhite/planner/backend/gen/planner/v1"
)

// Client wraps the gRPC client connection and provides a clean API
type Client struct {
	conn           *grpc.ClientConn
	areaService    pb.AreaServiceClient
	projectService pb.ProjectServiceClient
	taskService    pb.TaskServiceClient
}

// New creates a new client connected to the specified address
func New(address string) (*Client, error) {
	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to server: %w", err)
	}

	return &Client{
		conn:           conn,
		areaService:    pb.NewAreaServiceClient(conn),
		projectService: pb.NewProjectServiceClient(conn),
		taskService:    pb.NewTaskServiceClient(conn),
	}, nil
}

// Close closes the client connection
func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// CreateArea creates a new area
func (c *Client) CreateArea(ctx context.Context, name, description string) (*pb.Area, error) {
	resp, err := c.areaService.CreateArea(ctx, &pb.CreateAreaRequest{
		Name:        name,
		Description: description,
	})
	if err != nil {
		return nil, err
	}
	return resp.Area, nil
}

// GetArea retrieves an area by ID
func (c *Client) GetArea(ctx context.Context, id string) (*pb.Area, error) {
	resp, err := c.areaService.GetArea(ctx, &pb.GetAreaRequest{
		Id: id,
	})
	if err != nil {
		return nil, err
	}
	return resp.Area, nil
}

// ListAreas lists all areas
func (c *Client) ListAreas(ctx context.Context) ([]*pb.Area, error) {
	resp, err := c.areaService.ListAreas(ctx, &pb.ListAreasRequest{})
	if err != nil {
		return nil, err
	}
	return resp.Areas, nil
}

// UpdateArea updates an existing area
func (c *Client) UpdateArea(ctx context.Context, id string, name, description *string) (*pb.Area, error) {
	resp, err := c.areaService.UpdateArea(ctx, &pb.UpdateAreaRequest{
		Id:          id,
		Name:        name,
		Description: description,
	})
	if err != nil {
		return nil, err
	}
	return resp.Area, nil
}

// DeleteArea deletes an area
func (c *Client) DeleteArea(ctx context.Context, id string) error {
	_, err := c.areaService.DeleteArea(ctx, &pb.DeleteAreaRequest{
		Id: id,
	})
	return err
}

// CreateProject creates a new project
func (c *Client) CreateProject(ctx context.Context, name, areaID string) (*pb.Project, error) {
	resp, err := c.projectService.CreateProject(ctx, &pb.CreateProjectRequest{
		Name:   name,
		AreaId: areaID,
	})
	if err != nil {
		return nil, err
	}
	return resp.Project, nil
}

// GetProject retrieves a project by ID
func (c *Client) GetProject(ctx context.Context, id string) (*pb.Project, error) {
	resp, err := c.projectService.GetProject(ctx, &pb.GetProjectRequest{
		Id: id,
	})
	if err != nil {
		return nil, err
	}
	return resp.Project, nil
}

// ListProjects lists projects, optionally filtered by area
func (c *Client) ListProjects(ctx context.Context, areaID *string) ([]*pb.Project, error) {
	req := &pb.ListProjectsRequest{}
	if areaID != nil {
		req.AreaId = areaID
	}
	resp, err := c.projectService.ListProjects(ctx, req)
	if err != nil {
		return nil, err
	}
	return resp.Projects, nil
}

// UpdateProject updates an existing project
func (c *Client) UpdateProject(ctx context.Context, id string, name *string) (*pb.Project, error) {
	resp, err := c.projectService.UpdateProject(ctx, &pb.UpdateProjectRequest{
		Id:   id,
		Name: name,
	})
	if err != nil {
		return nil, err
	}
	return resp.Project, nil
}

// DeleteProject deletes a project
func (c *Client) DeleteProject(ctx context.Context, id string) error {
	_, err := c.projectService.DeleteProject(ctx, &pb.DeleteProjectRequest{
		Id: id,
	})
	return err
}

// CreateTask creates a new task
func (c *Client) CreateTask(ctx context.Context, name, description, projectID string) (*pb.Task, error) {
	resp, err := c.taskService.CreateTask(ctx, &pb.CreateTaskRequest{
		Name:        name,
		Description: description,
		ProjectId:   projectID,
	})
	if err != nil {
		return nil, err
	}
	return resp.Task, nil
}

// GetTask retrieves a task by ID
func (c *Client) GetTask(ctx context.Context, id string) (*pb.Task, error) {
	resp, err := c.taskService.GetTask(ctx, &pb.GetTaskRequest{
		Id: id,
	})
	if err != nil {
		return nil, err
	}
	return resp.Task, nil
}

// ListTasks lists tasks, optionally filtered by project
func (c *Client) ListTasks(ctx context.Context, projectID *string) ([]*pb.Task, error) {
	req := &pb.ListTasksRequest{}
	if projectID != nil {
		req.ProjectId = projectID
	}
	resp, err := c.taskService.ListTasks(ctx, req)
	if err != nil {
		return nil, err
	}
	return resp.Tasks, nil
}

// UpdateTask updates an existing task
func (c *Client) UpdateTask(ctx context.Context, id string, name, description *string) (*pb.Task, error) {
	resp, err := c.taskService.UpdateTask(ctx, &pb.UpdateTaskRequest{
		Id:          id,
		Name:        name,
		Description: description,
	})
	if err != nil {
		return nil, err
	}
	return resp.Task, nil
}

// DeleteTask deletes a task
func (c *Client) DeleteTask(ctx context.Context, id string) error {
	_, err := c.taskService.DeleteTask(ctx, &pb.DeleteTaskRequest{
		Id: id,
	})
	return err
}
