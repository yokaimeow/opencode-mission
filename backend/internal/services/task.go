package services

import (
	"context"
	"errors"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/repository"
)

var (
	ErrTaskNotFound = errors.New("task not found")
)

type TaskService struct {
	taskRepo    *repository.TaskRepository
	projectRepo *repository.ProjectRepository
	memberRepo  *repository.ProjectMemberRepository
}

func NewTaskService(
	taskRepo *repository.TaskRepository,
	projectRepo *repository.ProjectRepository,
	memberRepo *repository.ProjectMemberRepository,
) *TaskService {
	return &TaskService{
		taskRepo:    taskRepo,
		projectRepo: projectRepo,
		memberRepo:  memberRepo,
	}
}

func (s *TaskService) CreateTask(ctx context.Context, userID, projectID string, req *models.CreateTaskRequest) (*models.Task, error) {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}

	if project.OwnerID != userID {
		isMember, err := s.memberRepo.IsMember(ctx, projectID, userID)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, ErrNotAuthorized
		}
	}

	task := &models.Task{
		ProjectID:   projectID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		AssigneeID:  req.AssigneeID,
		DueDate:     req.DueDate,
	}

	if task.Status == "" {
		task.Status = models.TaskStatusTodo
	}
	if task.Priority == "" {
		task.Priority = models.TaskPriorityMedium
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}

	return s.taskRepo.GetByID(ctx, task.ID)
}

func (s *TaskService) GetTask(ctx context.Context, userID, taskID string) (*models.Task, error) {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrTaskNotFound
	}

	project, err := s.projectRepo.GetByID(ctx, task.ProjectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}

	if project.OwnerID != userID {
		isMember, err := s.memberRepo.IsMember(ctx, task.ProjectID, userID)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, ErrNotAuthorized
		}
	}

	return task, nil
}

func (s *TaskService) ListTasksByProject(ctx context.Context, userID, projectID string) ([]*models.Task, error) {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}

	if project.OwnerID != userID {
		isMember, err := s.memberRepo.IsMember(ctx, projectID, userID)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, ErrNotAuthorized
		}
	}

	return s.taskRepo.ListByProject(ctx, projectID)
}

func (s *TaskService) UpdateTask(ctx context.Context, userID, taskID string, req *models.UpdateTaskRequest) (*models.Task, error) {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrTaskNotFound
	}

	project, err := s.projectRepo.GetByID(ctx, task.ProjectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, ErrProjectNotFound
	}

	if project.OwnerID != userID {
		isMember, err := s.memberRepo.IsMember(ctx, task.ProjectID, userID)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, ErrNotAuthorized
		}
	}

	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Status != "" {
		task.Status = req.Status
	}
	if req.Priority != "" {
		task.Priority = req.Priority
	}
	if req.AssigneeID != nil {
		task.AssigneeID = req.AssigneeID
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}

	return s.taskRepo.GetByID(ctx, task.ID)
}

func (s *TaskService) DeleteTask(ctx context.Context, userID, taskID string) error {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return ErrTaskNotFound
	}

	project, err := s.projectRepo.GetByID(ctx, task.ProjectID)
	if err != nil {
		return err
	}
	if project == nil {
		return ErrProjectNotFound
	}

	if project.OwnerID != userID {
		isMember, err := s.memberRepo.IsMember(ctx, task.ProjectID, userID)
		if err != nil {
			return err
		}
		if !isMember {
			return ErrNotAuthorized
		}
	}

	return s.taskRepo.Delete(ctx, taskID)
}

func (s *TaskService) ListTasksByUser(ctx context.Context, userID string) ([]*models.Task, error) {
	return s.taskRepo.ListByUser(ctx, userID)
}
