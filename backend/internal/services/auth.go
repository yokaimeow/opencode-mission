package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/repository"
	"github.com/yokaimeow/opencode-mission/pkg/auth"
)

// Sentinel errors for auth operations
var (
	ErrEmailAlreadyRegistered = errors.New("email already registered")
	ErrUsernameAlreadyTaken   = errors.New("username already taken")
	ErrInvalidCredentials     = errors.New("invalid email or password")
	ErrUserNotFound           = errors.New("user not found")
)

type AuthService struct {
	userRepo       *repository.UserRepository
	jwtManager     *auth.JWTManager
	tokenBlacklist *TokenBlacklistService
}

func NewAuthService(userRepo *repository.UserRepository, jwtManager *auth.JWTManager, tokenBlacklist *TokenBlacklistService) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		jwtManager:     jwtManager,
		tokenBlacklist: tokenBlacklist,
	}
}

func (s *AuthService) Register(ctx context.Context, req *models.CreateUserRequest) (*models.AuthResponse, error) {
	existingUser, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingUser != nil {
		return nil, ErrEmailAlreadyRegistered
	}

	existingUser, err = s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing username: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUsernameAlreadyTaken
	}

	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: passwordHash,
		Role:         "developer",
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	accessToken, refreshToken, err := s.jwtManager.GenerateToken(user.ID, user.Email, user.Username, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	claims, err := s.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate refresh token: %w", err)
	}

	if err := s.tokenBlacklist.StoreRefreshToken(ctx, user.ID, claims.TokenID, time.Now().Add(s.jwtManager.GetRefreshTokenExpire())); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &models.AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpire().Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	accessToken, refreshToken, err := s.jwtManager.GenerateToken(user.ID, user.Email, user.Username, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	claims, err := s.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate refresh token: %w", err)
	}

	if err := s.tokenBlacklist.StoreRefreshToken(ctx, user.ID, claims.TokenID, time.Now().Add(s.jwtManager.GetRefreshTokenExpire())); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &models.AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpire().Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) GetCurrentUser(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*models.AuthResponse, error) {
	claims, err := s.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	valid, err := s.tokenBlacklist.ValidateRefreshToken(ctx, claims.TokenID, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to validate refresh token: %w", err)
	}
	if !valid {
		return nil, fmt.Errorf("refresh token not found or revoked")
	}

	if err := s.tokenBlacklist.RevokeRefreshToken(ctx, claims.TokenID); err != nil {
		return nil, fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	accessToken, newRefreshToken, err := s.jwtManager.GenerateToken(user.ID, user.Email, user.Username, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	newClaims, err := s.jwtManager.ValidateRefreshToken(newRefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate new refresh token: %w", err)
	}

	if err := s.tokenBlacklist.StoreRefreshToken(ctx, user.ID, newClaims.TokenID, time.Now().Add(s.jwtManager.GetRefreshTokenExpire())); err != nil {
		return nil, fmt.Errorf("failed to store new refresh token: %w", err)
	}

	return &models.AuthResponse{
		Token:        accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpire().Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, accessToken, refreshToken string) error {
	claims, err := s.jwtManager.ValidateToken(accessToken)
	if err != nil {
		return fmt.Errorf("invalid access token: %w", err)
	}

	if err := s.tokenBlacklist.AddToBlacklist(ctx, claims.TokenID, time.Now().Add(s.jwtManager.GetAccessTokenExpire())); err != nil {
		return fmt.Errorf("failed to blacklist token: %w", err)
	}

	// Revoke refresh token if provided
	if refreshToken != "" {
		refreshClaims, err := s.jwtManager.ValidateRefreshToken(refreshToken)
		if err == nil {
			// Best effort: try to revoke, but don't fail if it doesn't work
			_ = s.tokenBlacklist.RevokeRefreshToken(ctx, refreshClaims.TokenID)
		}
	}

	return nil
}
