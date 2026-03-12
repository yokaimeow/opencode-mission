-- name: AddProjectMember :exec
INSERT INTO project_members (project_id, user_id, role)
VALUES ($1, $2, $3);

-- name: GetProjectMembers :many
SELECT 
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.created_at,
    u.id as user_id_col,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
WHERE pm.project_id = $1
ORDER BY 
    CASE pm.role 
        WHEN 'admin' THEN 1 
        WHEN 'member' THEN 2 
        WHEN 'agent' THEN 3 
        WHEN 'guest' THEN 4 
    END,
    u.username;

-- name: GetProjectMember :one
SELECT 
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.created_at,
    u.id as user_id_col,
    u.email as user_email,
    u.username as user_username,
    u.avatar_url as user_avatar_url
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
WHERE pm.project_id = $1 AND pm.user_id = $2;

-- name: UpdateProjectMemberRole :exec
UPDATE project_members
SET role = $3
WHERE project_id = $1 AND user_id = $2;

-- name: DeleteProjectMember :exec
DELETE FROM project_members
WHERE project_id = $1 AND user_id = $2;

-- name: GetUserProjectRole :one
SELECT role FROM project_members
WHERE project_id = $1 AND user_id = $2;
