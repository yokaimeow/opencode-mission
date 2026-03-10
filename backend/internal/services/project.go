package services

import (
	"context"
	"errors"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/repository"
)

var (
	ErrProjectNotFound = errors.New("project not found")
	ErrNotAuthorized   = errors.New("not authorized to access this project")
)

type ProjectService struct {
	projectRepo *repository.ProjectRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository) *ProjectService {
	return &ProjectService{
		projectRepo: projectRepo,
	}
}

func (s *ProjectService) CreateProject(ctx context.Context, ownerID string, req *models.CreateProjectRequest) (*models.Project, error) {
	project := &models.Project{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     ownerID,
	}

	if err := s.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}

	return s.projectRepo.GetByID(ctx, project.ID)
}

func (s *ProjectService) GetProject(ctx context.Context, userID, projectID string) (*models.Project, error) {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}
	if project.OwnerID != userID {
		return nil, ErrNotAuthorized
	}
	return project, nil
}

func (s *ProjectService) ListProjectsByOwner(ctx context.Context, ownerID string) ([]*models.Project, error) {
	return s.projectRepo.ListByOwner(ctx, ownerID)
}

func (s *ProjectService) UpdateProject(ctx context.Context, userID, projectID string, req *models.UpdateProjectRequest) (*models.Project, error) {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}
	if project.OwnerID != userID {
		return nil, ErrNotAuthorized
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}

	if err := s.projectRepo.Update(ctx, project); err != nil {
		return nil, err
	}

	return s.projectRepo.GetByID(ctx, project.ID)
}

func (s *ProjectService) DeleteProject(ctx context.Context, userID, projectID string) error {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return ErrProjectNotFound
	}
	if project.OwnerID != userID {
		return ErrNotAuthorized
	}

	return s.projectRepo.Delete(ctx, projectID)
}
