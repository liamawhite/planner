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
	conn        *grpc.ClientConn
	areaService pb.AreaServiceClient
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
		conn:        conn,
		areaService: pb.NewAreaServiceClient(conn),
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
