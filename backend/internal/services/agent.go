package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/repository"
)

var (
	ErrAgentNotFound         = errors.New("agent not found")
	ErrAgentAlreadyInProject = errors.New("agent already in project")
	ErrProjectAgentNotFound  = errors.New("project agent not found")
	ErrNotAgentOwner         = errors.New("not authorized to modify this agent")
)

type AgentService struct {
	agentRepo        *repository.AgentRepository
	projectAgentRepo *repository.ProjectAgentRepository
}

func NewAgentService(agentRepo *repository.AgentRepository, projectAgentRepo *repository.ProjectAgentRepository) *AgentService {
	return &AgentService{
		agentRepo:        agentRepo,
		projectAgentRepo: projectAgentRepo,
	}
}

func (s *AgentService) CreateAgent(ctx context.Context, userID string, req *models.CreateAgentRequest) (*models.Agent, error) {
	config := req.Config
	if config == nil {
		config = make(map[string]string)
	}

	return s.agentRepo.Create(ctx, req.Name, req.Type, config, userID)
}

func (s *AgentService) GetAgent(ctx context.Context, agentID string) (*models.Agent, error) {
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAgentNotFound
		}
		return nil, err
	}
	return agent, nil
}

func (s *AgentService) ListAgents(ctx context.Context, userID string) ([]*models.Agent, error) {
	return s.agentRepo.ListByCreator(ctx, userID)
}

func (s *AgentService) UpdateAgent(ctx context.Context, userID, agentID string, req *models.UpdateAgentRequest) (*models.Agent, error) {
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAgentNotFound
		}
		return nil, err
	}

	if agent.CreatedBy != userID {
		return nil, ErrNotAgentOwner
	}

	var name *string
	var agentType *models.AgentType
	var config map[string]string

	if req.Name != "" {
		name = &req.Name
	}
	if req.Type != "" {
		agentType = &req.Type
	}
	if req.Config != nil {
		config = req.Config
	}

	if err := s.agentRepo.Update(ctx, agentID, name, agentType, config); err != nil {
		return nil, err
	}

	return s.agentRepo.GetByID(ctx, agentID)
}

func (s *AgentService) DeleteAgent(ctx context.Context, userID, agentID string) error {
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAgentNotFound
		}
		return err
	}

	if agent.CreatedBy != userID {
		return ErrNotAgentOwner
	}

	return s.agentRepo.Delete(ctx, agentID)
}

func (s *AgentService) AddAgentToProject(ctx context.Context, projectID, agentID, userID string, req *models.AddProjectAgentRequest) (*models.ProjectAgent, error) {
	_, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAgentNotFound
		}
		return nil, err
	}

	_, err = s.projectAgentRepo.GetByProjectAndAgent(ctx, projectID, agentID)
	if err == nil {
		return nil, ErrAgentAlreadyInProject
	}

	role := req.Role
	if role == "" {
		role = models.RoleMember
	}

	if err := s.projectAgentRepo.Add(ctx, projectID, agentID, userID, role, req.ConfigOverride); err != nil {
		return nil, err
	}

	return s.projectAgentRepo.GetByProjectAndAgent(ctx, projectID, agentID)
}

func (s *AgentService) GetProjectAgents(ctx context.Context, projectID string) ([]*models.ProjectAgent, error) {
	return s.projectAgentRepo.GetByProject(ctx, projectID)
}

func (s *AgentService) RemoveAgentFromProject(ctx context.Context, projectID, agentID string) error {
	_, err := s.projectAgentRepo.GetByProjectAndAgent(ctx, projectID, agentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrProjectAgentNotFound
		}
		return err
	}

	return s.projectAgentRepo.Delete(ctx, projectID, agentID)
}
