-- Create agent type enum
CREATE TYPE agent_type AS ENUM ('assistant', 'bot', 'webhook', 'custom');

-- Create agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type agent_type NOT NULL DEFAULT 'custom',
    config JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_agents_created_by ON agents(created_by);
CREATE INDEX idx_agents_type ON agents(type);

-- Add comments
COMMENT ON TABLE agents IS 'Global agents (AI assistants, bots, webhooks)';
COMMENT ON COLUMN agents.config IS 'Agent configuration (API key, endpoint, model, etc.)';

-- Create project_agents table (association between projects and agents)
CREATE TABLE project_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'member',
    config_override JSONB,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, agent_id)
);

-- Create indexes for project_agents
CREATE INDEX idx_project_agents_project_id ON project_agents(project_id);
CREATE INDEX idx_project_agents_agent_id ON project_agents(agent_id);
CREATE INDEX idx_project_agents_role ON project_agents(role);

-- Add comments for project_agents
COMMENT ON TABLE project_agents IS 'Project-agent associations';
COMMENT ON COLUMN project_agents.config_override IS 'Project-level config override for agent';
