-- name: CreateTask :one
INSERT INTO tasks (
    id,
    name,
    description,
    project_id,
    created_at,
    updated_at
) VALUES (
    ?, ?, ?, ?, ?, ?
) RETURNING *;

-- name: GetTask :one
SELECT * FROM tasks
WHERE id = ?;

-- name: ListTasks :many
SELECT * FROM tasks
WHERE (sqlc.narg('project_id') IS NULL OR project_id = sqlc.narg('project_id'))
ORDER BY created_at DESC;

-- name: UpdateTask :one
UPDATE tasks
SET
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    updated_at = sqlc.arg('updated_at')
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = ?;

-- name: TaskExists :one
SELECT COUNT(*) > 0
FROM tasks
WHERE id = ?;
