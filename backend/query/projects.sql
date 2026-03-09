-- name: CreateProject :one
INSERT INTO projects (name, description, owner_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetProjectByID :one
SELECT * FROM projects
WHERE id = $1
LIMIT 1;

-- name: ListProjectsByOwner :many
SELECT * FROM projects
WHERE owner_id = $1
ORDER BY created_at DESC;

-- name: UpdateProject :one
UPDATE projects
SET
    name = COALESCE(sqlc.narg(name), name),
    description = COALESCE(sqlc.narg(description), description)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1;
