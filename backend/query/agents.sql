-- name: CreateAgent :one
INSERT INTO agents (name, type, config, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, name, type, config, created_by, created_at, updated_at;

-- name: GetAgent :one
SELECT 
    a.id,
    a.name,
    a.type,
    a.config,
    a.created_by,
    a.created_at,
    a.updated_at,
    u.id as creator_id,
    u.email as creator_email,
    u.username as creator_username,
    u.avatar_url as creator_avatar_url
FROM agents a
LEFT JOIN users u ON a.created_by = u.id
WHERE a.id = $1;

-- name: ListAgentsByCreator :many
SELECT 
    a.id,
    a.name,
    a.type,
    a.config,
    a.created_by,
    a.created_at,
    a.updated_at,
    u.id as creator_id,
    u.email as creator_email,
    u.username as creator_username,
    u.avatar_url as creator_avatar_url
FROM agents a
LEFT JOIN users u ON a.created_by = u.id
WHERE a.created_by = $1
ORDER BY a.created_at DESC;

-- name: UpdateAgent :exec
UPDATE agents
SET 
    name = COALESCE(sqlc.narg('name'), name),
    type = COALESCE(sqlc.narg('type'), type),
    config = COALESCE(sqlc.narg('config'), config),
    updated_at = NOW()
WHERE id = $1;

-- name: DeleteAgent :exec
DELETE FROM agents
WHERE id = $1;
