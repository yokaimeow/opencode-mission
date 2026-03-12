package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
)

type UserRepository struct {
	queries *Queries
	pool    *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{
		queries: New(pool),
		pool:    pool,
	}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	var avatarUrl pgtype.Text
	if user.AvatarURL != "" {
		avatarUrl = pgtype.Text{String: user.AvatarURL, Valid: true}
	}

	params := CreateUserParams{
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		AvatarUrl:    avatarUrl,
	}

	createdUser, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return err
	}

	user.ID = createdUser.ID.String()
	user.AvatarURL = createdUser.AvatarUrl.String
	user.CreatedAt = createdUser.CreatedAt
	user.UpdatedAt = createdUser.UpdatedAt

	return nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &models.User{
		ID:           user.ID.String(),
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		AvatarURL:    user.AvatarUrl.String,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	user, err := r.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &models.User{
		ID:           user.ID.String(),
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		AvatarURL:    user.AvatarUrl.String,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	user, err := r.queries.GetUserByID(ctx, uid)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &models.User{
		ID:           user.ID.String(),
		Email:        user.Email,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		AvatarURL:    user.AvatarUrl.String,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id string, passwordHash string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	params := UpdateUserParams{
		ID:           uid,
		PasswordHash: pgtype.Text{String: passwordHash, Valid: true},
	}

	_, err = r.queries.UpdateUser(ctx, params)
	return err
}

func (r *UserRepository) Search(ctx context.Context, query string) ([]*models.User, error) {
	if query == "" {
		return []*models.User{}, nil
	}

	rows, err := r.queries.SearchUsers(ctx, query)
	if err != nil {
		return nil, err
	}

	users := make([]*models.User, 0, len(rows))
	for _, row := range rows {
		users = append(users, &models.User{
			ID:        row.ID.String(),
			Email:     row.Email,
			Username:  row.Username,
			AvatarURL: row.AvatarUrl.String,
			CreatedAt: row.CreatedAt,
			UpdatedAt: row.UpdatedAt,
		})
	}

	return users, nil
}
