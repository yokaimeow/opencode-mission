package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type ProjectAgentRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewProjectAgentRepository(pool *pgxpool.Pool) *ProjectAgentRepository {
	return &ProjectAgentRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *ProjectAgentRepository) Add(ctx context.Context, projectID, agentID, createdBy string, role models.ProjectRole, configOverride map[string]string) error {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}
	aid, err := uuid.Parse(agentID)
	if err != nil {
		return err
	}
	cid, err := uuid.Parse(createdBy)
	if err != nil {
		return err
	}

	var configBytes []byte
	if configOverride != nil {
		configBytes, err = json.Marshal(configOverride)
		if err != nil {
			return err
		}
	}

	return r.queries.AddProjectAgent(ctx, AddProjectAgentParams{
		ProjectID:      pid,
		AgentID:        aid,
		Role:           ProjectRole(role),
		ConfigOverride: configBytes,
		CreatedBy:      cid,
	})
}

func (r *ProjectAgentRepository) GetByProject(ctx context.Context, projectID string) ([]*models.ProjectAgent, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.GetProjectAgents(ctx, pid)
	if err != nil {
		return nil, err
	}

	agents := make([]*models.ProjectAgent, 0, len(rows))
	for _, row := range rows {
		pa := &models.ProjectAgent{
			ID:        row.ID.String(),
			ProjectID: row.ProjectID.String(),
			AgentID:   row.AgentID.String(),
			Role:      models.ProjectRole(row.Role),
			CreatedBy: row.CreatedBy.String(),
			CreatedAt: row.CreatedAt,
		}

		if len(row.ConfigOverride) > 0 {
			var config map[string]string
			if err := json.Unmarshal(row.ConfigOverride, &config); err == nil && len(config) > 0 {
				pa.ConfigOverride = config
			}
		}

		if row.AgentIDCol.Valid {
			pa.Agent = &models.Agent{
				ID:   uuid.UUID(row.AgentIDCol.Bytes).String(),
				Name: row.AgentName.String,
				Type: models.AgentType(row.AgentType.AgentType),
			}
			if len(row.AgentConfig) > 0 {
				var config map[string]string
				if err := json.Unmarshal(row.AgentConfig, &config); err == nil && len(config) > 0 {
					pa.Agent.Config = config
				}
			}
		}

		agents = append(agents, pa)
	}

	return agents, nil
}

func (r *ProjectAgentRepository) GetByProjectAndAgent(ctx context.Context, projectID, agentID string) (*models.ProjectAgent, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}
	aid, err := uuid.Parse(agentID)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.GetProjectAgent(ctx, GetProjectAgentParams{
		ProjectID: pid,
		AgentID:   aid,
	})
	if err != nil {
		return nil, err
	}

	pa := &models.ProjectAgent{
		ID:        row.ID.String(),
		ProjectID: row.ProjectID.String(),
		AgentID:   row.AgentID.String(),
		Role:      models.ProjectRole(row.Role),
		CreatedBy: row.CreatedBy.String(),
		CreatedAt: row.CreatedAt,
	}

	if len(row.ConfigOverride) > 0 {
		var config map[string]string
		if err := json.Unmarshal(row.ConfigOverride, &config); err == nil && len(config) > 0 {
			pa.ConfigOverride = config
		}
	}

	if row.AgentIDCol.Valid {
		pa.Agent = &models.Agent{
			ID:   uuid.UUID(row.AgentIDCol.Bytes).String(),
			Name: row.AgentName.String,
			Type: models.AgentType(row.AgentType.AgentType),
		}
		if len(row.AgentConfig) > 0 {
			var config map[string]string
			if err := json.Unmarshal(row.AgentConfig, &config); err == nil && len(config) > 0 {
				pa.Agent.Config = config
			}
		}
	}

	return pa, nil
}

func (r *ProjectAgentRepository) Delete(ctx context.Context, projectID, agentID string) error {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}
	aid, err := uuid.Parse(agentID)
	if err != nil {
		return err
	}

	return r.queries.DeleteProjectAgent(ctx, DeleteProjectAgentParams{
		ProjectID: pid,
		AgentID:   aid,
	})
}
