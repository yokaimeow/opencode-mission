package valkey

import (
	"context"
	"fmt"

	"github.com/valkey-io/valkey-go"
)

// ErrNil is returned when a key doesn't exist
var ErrNil = fmt.Errorf("valkey: nil")

type Client struct {
	client valkey.Client
}

func NewClient(url string) (*Client, error) {
	opts, err := valkey.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Valkey URL: %w", err)
	}

	client, err := valkey.NewClient(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Valkey: %w", err)
	}

	ctx := context.Background()
	// Ping using the Do method
	resp := client.Do(ctx, client.B().Ping().Build())
	if err := resp.Error(); err != nil {
		client.Close()
		return nil, fmt.Errorf("failed to connect to Valkey: %w", err)
	}

	return &Client{client: client}, nil
}

func (c *Client) Close() error {
	c.client.Close()
	return nil
}

func (c *Client) HealthCheck(ctx context.Context) error {
	resp := c.client.Do(ctx, c.client.B().Ping().Build())
	return resp.Error()
}

// Set stores a key-value pair with TTL
func (c *Client) Set(ctx context.Context, key string, value interface{}, ttl interface{}) error {
	var ttlSeconds int64
	switch v := ttl.(type) {
	case int64:
		ttlSeconds = v
	case int:
		ttlSeconds = int64(v)
	default:
		ttlSeconds = 0
	}

	var cmd valkey.Completed
	if ttlSeconds > 0 {
		cmd = c.client.B().Set().Key(key).Value(fmt.Sprint(value)).ExSeconds(ttlSeconds).Build()
	} else {
		cmd = c.client.B().Set().Key(key).Value(fmt.Sprint(value)).Build()
	}

	return c.client.Do(ctx, cmd).Error()
}

// Get retrieves a value by key
func (c *Client) Get(ctx context.Context, key string) *StringResult {
	cmd := c.client.B().Get().Key(key).Build()
	resp := c.client.Do(ctx, cmd)

	if err := resp.Error(); err != nil {
		if valkey.IsValkeyNil(err) {
			return &StringResult{err: ErrNil}
		}
		return &StringResult{err: err}
	}

	val, err := resp.ToString()
	return &StringResult{val: val, err: err}
}

// Del deletes a key
func (c *Client) Del(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}

	cmd := c.client.B().Del().Key(keys...).Build()
	return c.client.Do(ctx, cmd).Error()
}

// StringResult represents the result of a Get operation
type StringResult struct {
	val string
	err error
}

func (r *StringResult) Result() (string, error) {
	return r.val, r.err
}

func (r *StringResult) Err() error {
	return r.err
}

// IsNil checks if the error is a Nil error (key not found)
func IsNil(err error) bool {
	return err == ErrNil
}
