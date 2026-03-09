package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type ProjectRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewProjectRepository(pool *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *ProjectRepository) Create(ctx context.Context, project *models.Project) error {
	var description pgtype.Text
	if project.Description != "" {
		description = pgtype.Text{String: project.Description, Valid: true}
	}

	ownerID, err := uuid.Parse(project.OwnerID)
	if err != nil {
		return err
	}

	params := CreateProjectParams{
		Name:        project.Name,
		Description: description,
		OwnerID:     ownerID,
	}

	createdProject, err := r.queries.CreateProject(ctx, params)
	if err != nil {
		return err
	}

	project.ID = createdProject.ID.String()
	project.CreatedAt = createdProject.CreatedAt
	project.UpdatedAt = createdProject.UpdatedAt

	return nil
}

func (r *ProjectRepository) GetByID(ctx context.Context, id string) (*models.Project, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	project, err := r.queries.GetProjectByID(ctx, uid)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &models.Project{
		ID:          project.ID.String(),
		Name:        project.Name,
		Description: project.Description.String,
		OwnerID:     project.OwnerID.String(),
		CreatedAt:   project.CreatedAt,
		UpdatedAt:   project.UpdatedAt,
	}, nil
}

func (r *ProjectRepository) ListByOwner(ctx context.Context, ownerID string) ([]*models.Project, error) {
	uid, err := uuid.Parse(ownerID)
	if err != nil {
		return nil, err
	}

	projects, err := r.queries.ListProjectsByOwner(ctx, uid)
	if err != nil {
		return nil, err
	}

	result := make([]*models.Project, 0, len(projects))
	for _, p := range projects {
		result = append(result, &models.Project{
			ID:          p.ID.String(),
			Name:        p.Name,
			Description: p.Description.String,
			OwnerID:     p.OwnerID.String(),
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		})
	}

	return result, nil
}

func (r *ProjectRepository) Update(ctx context.Context, project *models.Project) error {
	id, err := uuid.Parse(project.ID)
	if err != nil {
		return err
	}

	var name pgtype.Text
	if project.Name != "" {
		name = pgtype.Text{String: project.Name, Valid: true}
	}

	var description pgtype.Text
	if project.Description != "" {
		description = pgtype.Text{String: project.Description, Valid: true}
	}

	params := UpdateProjectParams{
		ID:          id,
		Name:        name,
		Description: description,
	}

	updatedProject, err := r.queries.UpdateProject(ctx, params)
	if err != nil {
		return err
	}

	project.Name = updatedProject.Name
	project.Description = updatedProject.Description.String
	project.UpdatedAt = updatedProject.UpdatedAt

	return nil
}

func (r *ProjectRepository) Delete(ctx context.Context, id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	return r.queries.DeleteProject(ctx, uid)
}
