-- name: CreateUser :one
INSERT INTO users (email, username, password_hash, avatar_url)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1
LIMIT 1;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET 
    email = COALESCE(sqlc.narg(email), email),
    username = COALESCE(sqlc.narg(username), username),
    password_hash = COALESCE(sqlc.narg(password_hash), password_hash),
    avatar_url = COALESCE(sqlc.narg(avatar_url), avatar_url)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;

-- name: SearchUsers :many
SELECT id, email, username, avatar_url, created_at, updated_at
FROM users
WHERE 
    email ILIKE '%' || sqlc.arg('query')::text || '%'
    OR username ILIKE '%' || sqlc.arg('query')::text || '%'
    OR id::text ILIKE '%' || sqlc.arg('query')::text || '%'
ORDER BY 
    CASE 
        WHEN email ILIKE sqlc.arg('query')::text || '%' THEN 1
        WHEN username ILIKE sqlc.arg('query')::text || '%' THEN 2
        ELSE 3
    END,
    username
LIMIT 10;
