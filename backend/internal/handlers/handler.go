package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yokaimeow/opencode-mission/internal/models"
	"github.com/yokaimeow/opencode-mission/internal/services"
	"github.com/yokaimeow/opencode-mission/internal/valkey"
	"github.com/yokaimeow/opencode-mission/pkg/auth"
	"github.com/yokaimeow/opencode-mission/pkg/utils"
)

type Handler struct {
	authService    *services.AuthService
	jwtManager     *auth.JWTManager
	tokenBlacklist *services.TokenBlacklistService
	db             *pgxpool.Pool
	valkeyClient   *valkey.Client
}

func NewHandler(
	authService *services.AuthService,
	jwtManager *auth.JWTManager,
	tokenBlacklist *services.TokenBlacklistService,
	db *pgxpool.Pool,
	valkeyClient *valkey.Client,
) *Handler {
	return &Handler{
		authService:    authService,
		jwtManager:     jwtManager,
		tokenBlacklist: tokenBlacklist,
		db:             db,
		valkeyClient:   valkeyClient,
	}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handler) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	checks := make(map[string]string)
	allHealthy := true

	// Check database
	if h.db != nil {
		if err := h.db.Ping(ctx); err != nil {
			checks["database"] = "error: " + err.Error()
			allHealthy = false
		} else {
			checks["database"] = "ok"
		}
	} else {
		checks["database"] = "not configured"
		allHealthy = false
	}

	// Check Valkey
	if h.valkeyClient != nil {
		if err := h.valkeyClient.HealthCheck(ctx); err != nil {
			checks["valkey"] = "error: " + err.Error()
			allHealthy = false
		} else {
			checks["valkey"] = "ok"
		}
	} else {
		checks["valkey"] = "not configured"
		allHealthy = false
	}

	status := "ready"
	statusCode := http.StatusOK
	if !allHealthy {
		status = "not ready"
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, gin.H{
		"status": status,
		"checks": checks,
	})
}

func (h *Handler) Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	authResp, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, services.ErrEmailAlreadyRegistered) || errors.Is(err, services.ErrUsernameAlreadyTaken) {
			utils.ErrorResponse(c, http.StatusConflict, "CONFLICT", err.Error())
			return
		}
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to register user", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, authResp)
}

func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	authResp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid credentials")
			return
		}
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to login", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, authResp)
}

func (h *Handler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString := parts[1]

			// Optional: Accept refresh token from request body to revoke it
			var req struct {
				RefreshToken string `json:"refresh_token"`
			}
			// Try to bind, but don't fail if it's not provided
			_ = c.ShouldBindJSON(&req)

			if err := h.authService.Logout(c.Request.Context(), tokenString, req.RefreshToken); err != nil {
				utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to logout", err.Error())
				return
			}
		}
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Successfully logged out",
	})
}

func (h *Handler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	authResp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired refresh token")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, authResp)
}

func (h *Handler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	user, err := h.authService.GetCurrentUser(c.Request.Context(), userID.(string))
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get user", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := h.jwtManager.ValidateToken(tokenString)
		if err != nil {
			utils.ErrorResponseWithDetails(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token", err.Error())
			c.Abort()
			return
		}

		isBlacklisted, err := h.tokenBlacklist.IsBlacklisted(c.Request.Context(), claims.TokenID)
		if err != nil {
			utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to check token status", err.Error())
			c.Abort()
			return
		}

		if isBlacklisted {
			utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token has been revoked")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("username", claims.Username)

		c.Next()
	}
}

func (h *Handler) ListProjects(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) CreateProject(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) GetProject(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) UpdateProject(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) DeleteProject(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) ListTasks(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) CreateTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) GetTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) UpdateTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (h *Handler) DeleteTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
