DROP TRIGGER IF EXISTS trigger_add_project_owner_as_admin ON projects;
DROP FUNCTION IF EXISTS add_project_owner_as_admin();
DROP TABLE IF EXISTS project_members;
DROP TYPE IF EXISTS project_role;
