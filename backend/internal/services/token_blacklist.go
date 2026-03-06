package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yokaimeow/opencode-mission/internal/valkey"
)

type TokenBlacklistService struct {
	client *valkey.Client
}

func NewTokenBlacklistService(client *valkey.Client) *TokenBlacklistService {
	return &TokenBlacklistService{
		client: client,
	}
}

func (s *TokenBlacklistService) AddToBlacklist(ctx context.Context, tokenID string, expiresAt time.Time) error {
	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		return nil
	}

	key := fmt.Sprintf("blacklist:%s", tokenID)
	return s.client.Set(ctx, key, "1", ttl)
}

func (s *TokenBlacklistService) IsBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	key := fmt.Sprintf("blacklist:%s", tokenID)
	result, err := s.client.Get(ctx, key).Result()
	if err != nil {
		if valkey.IsNil(err) {
			return false, nil
		}
		return false, err
	}
	return result != "", nil
}

func (s *TokenBlacklistService) StoreRefreshToken(ctx context.Context, userID, tokenID string, expiresAt time.Time) error {
	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		return fmt.Errorf("token already expired")
	}

	key := fmt.Sprintf("refresh_token:%s", tokenID)
	data := fmt.Sprintf("%s:%s", userID, uuid.New().String())
	return s.client.Set(ctx, key, data, ttl)
}

func (s *TokenBlacklistService) ValidateRefreshToken(ctx context.Context, tokenID, userID string) (bool, error) {
	key := fmt.Sprintf("refresh_token:%s", tokenID)
	result, err := s.client.Get(ctx, key).Result()
	if err != nil {
		if valkey.IsNil(err) {
			return false, nil
		}
		return false, err
	}

	expectedPrefix := userID + ":"
	return len(result) > len(expectedPrefix) && result[:len(expectedPrefix)] == expectedPrefix, nil
}

func (s *TokenBlacklistService) RevokeRefreshToken(ctx context.Context, tokenID string) error {
	key := fmt.Sprintf("refresh_token:%s", tokenID)
	return s.client.Del(ctx, key)
}
