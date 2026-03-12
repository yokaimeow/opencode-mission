-- name: AddProjectAgent :exec
INSERT INTO project_agents (project_id, agent_id, role, config_override, created_by)
VALUES ($1, $2, $3, $4, $5);

-- name: GetProjectAgents :many
SELECT 
    pa.id,
    pa.project_id,
    pa.agent_id,
    pa.role,
    pa.config_override,
    pa.created_by,
    pa.created_at,
    a.id as agent_id_col,
    a.name as agent_name,
    a.type as agent_type,
    a.config as agent_config
FROM project_agents pa
LEFT JOIN agents a ON pa.agent_id = a.id
WHERE pa.project_id = $1
ORDER BY 
    CASE pa.role 
        WHEN 'admin' THEN 1 
        WHEN 'member' THEN 2 
        WHEN 'agent' THEN 3 
        WHEN 'guest' THEN 4 
    END,
    a.name;

-- name: GetProjectAgent :one
SELECT 
    pa.id,
    pa.project_id,
    pa.agent_id,
    pa.role,
    pa.config_override,
    pa.created_by,
    pa.created_at,
    a.id as agent_id_col,
    a.name as agent_name,
    a.type as agent_type,
    a.config as agent_config
FROM project_agents pa
LEFT JOIN agents a ON pa.agent_id = a.id
WHERE pa.project_id = $1 AND pa.agent_id = $2;

-- name: DeleteProjectAgent :exec
DELETE FROM project_agents
WHERE project_id = $1 AND agent_id = $2;

-- name: GetProjectAgentByID :one
SELECT 
    pa.id,
    pa.project_id,
    pa.agent_id,
    pa.role,
    pa.config_override,
    pa.created_by,
    pa.created_at
FROM project_agents pa
WHERE pa.id = $1;
