package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type ProjectMemberRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewProjectMemberRepository(pool *pgxpool.Pool) *ProjectMemberRepository {
	return &ProjectMemberRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *ProjectMemberRepository) Add(ctx context.Context, projectID, userID string, role models.ProjectRole) error {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	return r.queries.AddProjectMember(ctx, AddProjectMemberParams{
		ProjectID: pid,
		UserID:    uid,
		Role:      ProjectRole(role),
	})
}

func (r *ProjectMemberRepository) GetByProject(ctx context.Context, projectID string) ([]*models.ProjectMember, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.GetProjectMembers(ctx, pid)
	if err != nil {
		return nil, err
	}

	members := make([]*models.ProjectMember, 0, len(rows))
	for _, row := range rows {
		member := &models.ProjectMember{
			ProjectID: row.ProjectID.String(),
			UserID:    row.UserID.String(),
			Role:      models.ProjectRole(row.Role),
			CreatedAt: row.CreatedAt,
		}
		if row.UserIDCol.Valid {
			member.User = &models.User{
				ID:       uuid.UUID(row.UserIDCol.Bytes).String(),
				Email:    row.UserEmail.String,
				Username: row.UserUsername.String,
			}
			if row.UserAvatarUrl.Valid {
				member.User.AvatarURL = row.UserAvatarUrl.String
			}
		}
		members = append(members, member)
	}

	return members, nil
}

func (r *ProjectMemberRepository) GetByProjectAndUser(ctx context.Context, projectID, userID string) (*models.ProjectMember, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	row, err := r.queries.GetProjectMember(ctx, GetProjectMemberParams{
		ProjectID: pid,
		UserID:    uid,
	})
	if err != nil {
		return nil, err
	}

	member := &models.ProjectMember{
		ProjectID: row.ProjectID.String(),
		UserID:    row.UserID.String(),
		Role:      models.ProjectRole(row.Role),
		CreatedAt: row.CreatedAt,
	}
	if row.UserIDCol.Valid {
		member.User = &models.User{
			ID:       uuid.UUID(row.UserIDCol.Bytes).String(),
			Email:    row.UserEmail.String,
			Username: row.UserUsername.String,
		}
		if row.UserAvatarUrl.Valid {
			member.User.AvatarURL = row.UserAvatarUrl.String
		}
	}

	return member, nil
}

func (r *ProjectMemberRepository) UpdateRole(ctx context.Context, projectID, userID string, role models.ProjectRole) error {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	return r.queries.UpdateProjectMemberRole(ctx, UpdateProjectMemberRoleParams{
		ProjectID: pid,
		UserID:    uid,
		Role:      ProjectRole(role),
	})
}

func (r *ProjectMemberRepository) Delete(ctx context.Context, projectID, userID string) error {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	return r.queries.DeleteProjectMember(ctx, DeleteProjectMemberParams{
		ProjectID: pid,
		UserID:    uid,
	})
}

func (r *ProjectMemberRepository) GetUserRole(ctx context.Context, projectID, userID string) (models.ProjectRole, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return "", err
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return "", err
	}

	role, err := r.queries.GetUserProjectRole(ctx, GetUserProjectRoleParams{
		ProjectID: pid,
		UserID:    uid,
	})
	if err != nil {
		return "", err
	}

	return models.ProjectRole(role), nil
}
