-- name: CreateProject :one
INSERT INTO projects (name, description, owner_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetProjectByID :one
SELECT 
    p.id, 
    p.name, 
    p.description, 
    p.owner_id, 
    p.created_at, 
    p.updated_at,
    u.id as user_id,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.id = $1
LIMIT 1;

-- name: ListProjectsByOwner :many
SELECT 
    p.id, 
    p.name, 
    p.description, 
    p.owner_id, 
    p.created_at, 
    p.updated_at,
    u.id as user_id,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.owner_id = $1
ORDER BY p.created_at DESC;

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
