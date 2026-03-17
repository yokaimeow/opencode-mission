package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type TaskRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewTaskRepository(pool *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *models.Task) error {
	projectID, err := uuid.Parse(task.ProjectID)
	if err != nil {
		return err
	}

	var description pgtype.Text
	if task.Description != "" {
		description = pgtype.Text{String: task.Description, Valid: true}
	}

	status := TaskStatus(task.Status)
	if status == "" {
		status = TaskStatusTodo
	}

	priority := TaskPriority(task.Priority)
	if priority == "" {
		priority = TaskPriorityMedium
	}

	var assigneeID pgtype.UUID
	if task.AssigneeID != nil && *task.AssigneeID != "" {
		aid, err := uuid.Parse(*task.AssigneeID)
		if err != nil {
			return err
		}
		assigneeID = pgtype.UUID{Bytes: aid, Valid: true}
	}

	var dueDate pgtype.Timestamptz
	if task.DueDate != nil {
		dueDate = pgtype.Timestamptz{Time: *task.DueDate, Valid: true}
	}

	params := CreateTaskParams{
		ProjectID:   projectID,
		Title:       task.Title,
		Description: description,
		Status:      status,
		Priority:    priority,
		AssigneeID:  assigneeID,
		DueDate:     dueDate,
	}

	createdTask, err := r.queries.CreateTask(ctx, params)
	if err != nil {
		return err
	}

	task.ID = createdTask.ID.String()
	task.CreatedAt = createdTask.CreatedAt
	task.UpdatedAt = createdTask.UpdatedAt

	return nil
}

func (r *TaskRepository) GetByID(ctx context.Context, id string) (*models.Task, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	task, err := r.queries.GetTaskByID(ctx, uid)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	result := &models.Task{
		ID:          task.ID.String(),
		ProjectID:   task.ProjectID.String(),
		Title:       task.Title,
		Description: task.Description.String,
		Status:      models.TaskStatus(task.Status),
		Priority:    models.TaskPriority(task.Priority),
		CreatedAt:   task.CreatedAt,
		UpdatedAt:   task.UpdatedAt,
	}

	if task.AssigneeID.Valid {
		assigneeID := uuid.UUID(task.AssigneeID.Bytes).String()
		result.AssigneeID = &assigneeID
	}

	if task.DueDate.Valid {
		result.DueDate = &task.DueDate.Time
	}

	if task.UserID.Valid {
		result.Assignee = &models.User{
			ID:       uuid.UUID(task.UserID.Bytes).String(),
			Email:    task.UserEmail.String,
			Username: task.UserUsername.String,
		}
		if task.UserAvatarUrl.Valid {
			result.Assignee.AvatarURL = task.UserAvatarUrl.String
		}
	}

	return result, nil
}

func (r *TaskRepository) ListByProject(ctx context.Context, projectID string) ([]*models.Task, error) {
	pid, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	tasks, err := r.queries.ListTasksByProject(ctx, pid)
	if err != nil {
		return nil, err
	}

	result := make([]*models.Task, 0, len(tasks))
	for _, t := range tasks {
		task := &models.Task{
			ID:          t.ID.String(),
			ProjectID:   t.ProjectID.String(),
			Title:       t.Title,
			Description: t.Description.String,
			Status:      models.TaskStatus(t.Status),
			Priority:    models.TaskPriority(t.Priority),
			CreatedAt:   t.CreatedAt,
			UpdatedAt:   t.UpdatedAt,
		}

		if t.AssigneeID.Valid {
			assigneeID := uuid.UUID(t.AssigneeID.Bytes).String()
			task.AssigneeID = &assigneeID
		}

		if t.DueDate.Valid {
			task.DueDate = &t.DueDate.Time
		}

		if t.UserID.Valid {
			task.Assignee = &models.User{
				ID:       uuid.UUID(t.UserID.Bytes).String(),
				Email:    t.UserEmail.String,
				Username: t.UserUsername.String,
			}
			if t.UserAvatarUrl.Valid {
				task.Assignee.AvatarURL = t.UserAvatarUrl.String
			}
		}

		result = append(result, task)
	}

	return result, nil
}

func (r *TaskRepository) Update(ctx context.Context, task *models.Task) error {
	id, err := uuid.Parse(task.ID)
	if err != nil {
		return err
	}

	var title pgtype.Text
	if task.Title != "" {
		title = pgtype.Text{String: task.Title, Valid: true}
	}

	var description pgtype.Text
	if task.Description != "" {
		description = pgtype.Text{String: task.Description, Valid: true}
	}

	var status NullTaskStatus
	if task.Status != "" {
		status = NullTaskStatus{TaskStatus: TaskStatus(task.Status), Valid: true}
	}

	var priority NullTaskPriority
	if task.Priority != "" {
		priority = NullTaskPriority{TaskPriority: TaskPriority(task.Priority), Valid: true}
	}

	var assigneeID pgtype.UUID
	if task.AssigneeID != nil && *task.AssigneeID != "" {
		aid, err := uuid.Parse(*task.AssigneeID)
		if err != nil {
			return err
		}
		assigneeID = pgtype.UUID{Bytes: aid, Valid: true}
	}

	var dueDate pgtype.Timestamptz
	if task.DueDate != nil {
		dueDate = pgtype.Timestamptz{Time: *task.DueDate, Valid: true}
	}

	params := UpdateTaskParams{
		ID:          id,
		Title:       title,
		Description: description,
		Status:      status,
		Priority:    priority,
		AssigneeID:  assigneeID,
		DueDate:     dueDate,
	}

	updatedTask, err := r.queries.UpdateTask(ctx, params)
	if err != nil {
		return err
	}

	task.Title = updatedTask.Title
	task.Description = updatedTask.Description.String
	task.Status = models.TaskStatus(updatedTask.Status)
	task.Priority = models.TaskPriority(updatedTask.Priority)
	task.UpdatedAt = updatedTask.UpdatedAt

	if updatedTask.AssigneeID.Valid {
		assigneeID := uuid.UUID(updatedTask.AssigneeID.Bytes).String()
		task.AssigneeID = &assigneeID
	} else {
		task.AssigneeID = nil
	}

	if updatedTask.DueDate.Valid {
		task.DueDate = &updatedTask.DueDate.Time
	} else {
		task.DueDate = nil
	}

	return nil
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	return r.queries.DeleteTask(ctx, uid)
}

func (r *TaskRepository) ListByUser(ctx context.Context, userID string) ([]*models.Task, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	tasks, err := r.queries.ListTasksByUser(ctx, uid)
	if err != nil {
		return nil, err
	}

	result := make([]*models.Task, 0, len(tasks))
	for _, t := range tasks {
		task := &models.Task{
			ID:          t.ID.String(),
			ProjectID:   t.ProjectID.String(),
			Title:       t.Title,
			Description: t.Description.String,
			Status:      models.TaskStatus(t.Status),
			Priority:    models.TaskPriority(t.Priority),
			CreatedAt:   t.CreatedAt,
			UpdatedAt:   t.UpdatedAt,
		}

		if t.AssigneeID.Valid {
			assigneeID := uuid.UUID(t.AssigneeID.Bytes).String()
			task.AssigneeID = &assigneeID
		}

		if t.DueDate.Valid {
			task.DueDate = &t.DueDate.Time
		}

		if t.UserID.Valid {
			task.Assignee = &models.User{
				ID:       uuid.UUID(t.UserID.Bytes).String(),
				Email:    t.UserEmail.String,
				Username: t.UserUsername.String,
			}
			if t.UserAvatarUrl.Valid {
				task.Assignee.AvatarURL = t.UserAvatarUrl.String
			}
		}

		result = append(result, task)
	}

	return result, nil
}
