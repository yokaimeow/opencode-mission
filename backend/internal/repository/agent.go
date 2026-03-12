package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type AgentRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewAgentRepository(pool *pgxpool.Pool) *AgentRepository {
	return &AgentRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *AgentRepository) Create(ctx context.Context, name string, agentType models.AgentType, config map[string]string, createdBy string) (*models.Agent, error) {
	uid, err := uuid.Parse(createdBy)
	if err != nil {
		return nil, err
	}

	configBytes, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}

	agent, err := r.queries.CreateAgent(ctx, CreateAgentParams{
		Name:      name,
		Type:      AgentType(agentType),
		Config:    configBytes,
		CreatedBy: uid,
	})
	if err != nil {
		return nil, err
	}

	return &models.Agent{
		ID:        agent.ID.String(),
		Name:      agent.Name,
		Type:      models.AgentType(agent.Type),
		CreatedBy: agent.CreatedBy.String(),
		CreatedAt: agent.CreatedAt,
		UpdatedAt: agent.UpdatedAt,
	}, nil
}

func (r *AgentRepository) GetByID(ctx context.Context, id string) (*models.Agent, error) {
	aid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.GetAgent(ctx, aid)
	if err != nil {
		return nil, err
	}

	agent := &models.Agent{
		ID:        row.ID.String(),
		Name:      row.Name,
		Type:      models.AgentType(row.Type),
		CreatedBy: row.CreatedBy.String(),
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}

	if row.CreatorID.Valid {
		agent.Creator = &models.User{
			ID:       uuid.UUID(row.CreatorID.Bytes).String(),
			Email:    row.CreatorEmail.String,
			Username: row.CreatorUsername.String,
		}
		if row.CreatorAvatarUrl.Valid {
			agent.Creator.AvatarURL = row.CreatorAvatarUrl.String
		}
	}

	return agent, nil
}

func (r *AgentRepository) ListByCreator(ctx context.Context, createdBy string) ([]*models.Agent, error) {
	uid, err := uuid.Parse(createdBy)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.ListAgentsByCreator(ctx, uid)
	if err != nil {
		return nil, err
	}

	agents := make([]*models.Agent, 0, len(rows))
	for _, row := range rows {
		agent := &models.Agent{
			ID:        row.ID.String(),
			Name:      row.Name,
			Type:      models.AgentType(row.Type),
			CreatedBy: row.CreatedBy.String(),
			CreatedAt: row.CreatedAt,
			UpdatedAt: row.UpdatedAt,
		}

		if row.CreatorID.Valid {
			agent.Creator = &models.User{
				ID:       uuid.UUID(row.CreatorID.Bytes).String(),
				Email:    row.CreatorEmail.String,
				Username: row.CreatorUsername.String,
			}
			if row.CreatorAvatarUrl.Valid {
				agent.Creator.AvatarURL = row.CreatorAvatarUrl.String
			}
		}

		agents = append(agents, agent)
	}

	return agents, nil
}

func (r *AgentRepository) Update(ctx context.Context, id string, name *string, agentType *models.AgentType, config map[string]string) error {
	aid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	params := UpdateAgentParams{
		ID: aid,
	}

	if name != nil {
		params.Name = pgtype.Text{String: *name, Valid: true}
	}
	if agentType != nil {
		params.Type = NullAgentType{AgentType: AgentType(*agentType), Valid: true}
	}
	if config != nil {
		configBytes, err := json.Marshal(config)
		if err != nil {
			return err
		}
		params.Config = configBytes
	}

	return r.queries.UpdateAgent(ctx, params)
}

func (r *AgentRepository) Delete(ctx context.Context, id string) error {
	aid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	return r.queries.DeleteAgent(ctx, aid)
}
