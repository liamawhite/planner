-- +goose Up
CREATE TABLE areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_areas_name ON areas(name);

-- +goose Down
DROP INDEX IF EXISTS idx_areas_name;
DROP TABLE IF EXISTS areas;
