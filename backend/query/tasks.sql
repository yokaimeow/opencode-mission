-- name: CreateTask :one
INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetTaskByID :one
SELECT 
    t.id, 
    t.project_id, 
    t.title, 
    t.description, 
    t.status, 
    t.priority, 
    t.assignee_id, 
    t.due_date,
    t.created_at, 
    t.updated_at,
    u.id as user_id,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.id = $1
LIMIT 1;

-- name: ListTasksByProject :many
SELECT 
    t.id, 
    t.project_id, 
    t.title, 
    t.description, 
    t.status, 
    t.priority, 
    t.assignee_id, 
    t.due_date,
    t.created_at, 
    t.updated_at,
    u.id as user_id,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.project_id = $1
ORDER BY t.created_at DESC;

-- name: UpdateTask :one
UPDATE tasks
SET
    title = COALESCE(sqlc.narg(title), title),
    description = COALESCE(sqlc.narg(description), description),
    status = COALESCE(sqlc.narg(status), status),
    priority = COALESCE(sqlc.narg(priority), priority),
    assignee_id = COALESCE(sqlc.narg(assignee_id), assignee_id),
    due_date = COALESCE(sqlc.narg(due_date), due_date)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;

-- name: ListTasksByUser :many
SELECT 
    t.id, 
    t.project_id, 
    t.title, 
    t.description, 
    t.status, 
    t.priority, 
    t.assignee_id, 
    t.due_date,
    t.created_at, 
    t.updated_at,
    u.id as user_id,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
JOIN projects p ON t.project_id = p.id
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
WHERE p.owner_id = $1 OR pm.user_id = $1
ORDER BY t.created_at DESC;
