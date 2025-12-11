-- name: CreateArea :one
INSERT INTO areas (
    id,
    name,
    description,
    created_at,
    updated_at
) VALUES (
    ?, ?, ?, ?, ?
) RETURNING *;

-- name: GetArea :one
SELECT * FROM areas
WHERE id = ?;

-- name: ListAreas :many
SELECT * FROM areas
ORDER BY created_at DESC;

-- name: UpdateArea :one
UPDATE areas
SET
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    updated_at = sqlc.arg('updated_at')
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteArea :exec
DELETE FROM areas
WHERE id = ?;

-- name: AreaExists :one
SELECT COUNT(*) > 0
FROM areas
WHERE id = ?;
