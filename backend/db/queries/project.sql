-- name: CreateProject :one
INSERT INTO projects (
    id,
    name,
    area_id,
    created_at,
    updated_at
) VALUES (
    ?, ?, ?, ?, ?
) RETURNING *;

-- name: GetProject :one
SELECT * FROM projects
WHERE id = ?;

-- name: ListProjects :many
SELECT * FROM projects
WHERE (sqlc.narg('area_id') IS NULL OR area_id = sqlc.narg('area_id'))
ORDER BY created_at DESC;

-- name: UpdateProject :one
UPDATE projects
SET
    name = COALESCE(sqlc.narg('name'), name),
    updated_at = sqlc.arg('updated_at')
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = ?;

-- name: ProjectExists :one
SELECT COUNT(*) > 0
FROM projects
WHERE id = ?;
