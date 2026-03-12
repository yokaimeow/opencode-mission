package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/repository"
)

var (
	ErrMemberNotFound      = errors.New("member not found")
	ErrMemberAlreadyExists = errors.New("member already exists")
	ErrCannotRemoveOwner   = errors.New("cannot remove project owner")
)

type ProjectMemberService struct {
	memberRepo  *repository.ProjectMemberRepository
	projectRepo *repository.ProjectRepository
}

func NewProjectMemberService(memberRepo *repository.ProjectMemberRepository, projectRepo *repository.ProjectRepository) *ProjectMemberService {
	return &ProjectMemberService{
		memberRepo:  memberRepo,
		projectRepo: projectRepo,
	}
}

func (s *ProjectMemberService) AddMember(ctx context.Context, projectID, userID string, role models.ProjectRole) (*models.ProjectMember, error) {
	if role == "" {
		role = models.RoleMember
	}

	err := s.memberRepo.Add(ctx, projectID, userID, role)
	if err != nil {
		return nil, err
	}

	return s.memberRepo.GetByProjectAndUser(ctx, projectID, userID)
}

func (s *ProjectMemberService) GetMembers(ctx context.Context, projectID string) ([]*models.ProjectMember, error) {
	return s.memberRepo.GetByProject(ctx, projectID)
}

func (s *ProjectMemberService) GetMember(ctx context.Context, projectID, userID string) (*models.ProjectMember, error) {
	member, err := s.memberRepo.GetByProjectAndUser(ctx, projectID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMemberNotFound
		}
		return nil, err
	}
	return member, nil
}

func (s *ProjectMemberService) UpdateMemberRole(ctx context.Context, projectID, userID string, role models.ProjectRole) (*models.ProjectMember, error) {
	_, err := s.memberRepo.GetByProjectAndUser(ctx, projectID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMemberNotFound
		}
		return nil, err
	}

	if err := s.memberRepo.UpdateRole(ctx, projectID, userID, role); err != nil {
		return nil, err
	}

	return s.memberRepo.GetByProjectAndUser(ctx, projectID, userID)
}

func (s *ProjectMemberService) RemoveMember(ctx context.Context, projectID, userID string) error {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return ErrProjectNotFound
	}

	if project.OwnerID == userID {
		return ErrCannotRemoveOwner
	}

	err = s.memberRepo.Delete(ctx, projectID, userID)
	if err != nil {
		return err
	}

	return nil
}

func (s *ProjectMemberService) GetUserRole(ctx context.Context, projectID, userID string) (models.ProjectRole, error) {
	role, err := s.memberRepo.GetUserRole(ctx, projectID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrMemberNotFound
		}
		return "", err
	}
	return role, nil
}
