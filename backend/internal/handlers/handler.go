package handlers

import (
	"context"
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
	projectService *services.ProjectService
	memberService  *services.ProjectMemberService
	agentService   *services.AgentService
	taskService    *services.TaskService
	jwtManager     *auth.JWTManager
	tokenBlacklist *services.TokenBlacklistService
	db             *pgxpool.Pool
	valkeyClient   *valkey.Client
}

func NewHandler(
	authService *services.AuthService,
	projectService *services.ProjectService,
	memberService *services.ProjectMemberService,
	agentService *services.AgentService,
	taskService *services.TaskService,
	jwtManager *auth.JWTManager,
	tokenBlacklist *services.TokenBlacklistService,
	db *pgxpool.Pool,
	valkeyClient *valkey.Client,
) *Handler {
	return &Handler{
		authService:    authService,
		projectService: projectService,
		memberService:  memberService,
		agentService:   agentService,
		taskService:    taskService,
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
	if utils.HandleServiceError(c, err, "register user") {
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
	if utils.HandleServiceError(c, err, "login") {
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

func (h *Handler) VerifyToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header")
		return
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format")
		return
	}

	tokenString := parts[1]

	claims, err := h.jwtManager.ValidateToken(tokenString)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
		return
	}

	isBlacklisted, err := h.tokenBlacklist.IsBlacklisted(c.Request.Context(), claims.TokenID)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to verify token", err.Error())
		return
	}

	if isBlacklisted {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token has been revoked")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"user_id": claims.UserID,
	})
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

func (h *Handler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	if utils.HandleServiceError(c, h.authService.ChangePassword(c.Request.Context(), userID.(string), &req), "change password") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
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
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projects, err := h.projectService.ListProjectsByOwner(c.Request.Context(), userID.(string))
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list projects", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, projects)
}

func (h *Handler) CreateProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	project, err := h.projectService.CreateProject(c.Request.Context(), userID.(string), &req)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create project", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, project)
}

func (h *Handler) GetProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	project, err := h.projectService.GetProject(c.Request.Context(), userID.(string), projectID)
	if utils.HandleServiceError(c, err, "get project") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, project)
}

func (h *Handler) UpdateProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	project, err := h.projectService.UpdateProject(c.Request.Context(), userID.(string), projectID, &req)
	if utils.HandleServiceError(c, err, "update project") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, project)
}

func (h *Handler) DeleteProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	if utils.HandleServiceError(c, h.projectService.DeleteProject(c.Request.Context(), userID.(string), projectID), "delete project") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}

func (h *Handler) ListTasks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	tasks, err := h.taskService.ListTasksByProject(c.Request.Context(), userID.(string), projectID)
	if utils.HandleServiceError(c, err, "list tasks") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tasks)
}

func (h *Handler) ListUserTasks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	tasks, err := h.taskService.ListTasksByUser(c.Request.Context(), userID.(string))
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list tasks", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tasks)
}

func (h *Handler) CreateTask(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	task, err := h.taskService.CreateTask(c.Request.Context(), userID.(string), projectID, &req)
	if utils.HandleServiceError(c, err, "create task") {
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, task)
}

func (h *Handler) GetTask(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Task ID is required")
		return
	}

	task, err := h.taskService.GetTask(c.Request.Context(), userID.(string), taskID)
	if utils.HandleServiceError(c, err, "get task") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, task)
}

func (h *Handler) UpdateTask(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Task ID is required")
		return
	}

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	task, err := h.taskService.UpdateTask(c.Request.Context(), userID.(string), taskID, &req)
	if utils.HandleServiceError(c, err, "update task") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, task)
}

func (h *Handler) DeleteTask(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Task ID is required")
		return
	}

	if utils.HandleServiceError(c, h.taskService.DeleteTask(c.Request.Context(), userID.(string), taskID), "delete task") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Task deleted successfully",
	})
}

func (h *Handler) ListMembers(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	members, err := h.memberService.GetMembers(c.Request.Context(), projectID)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list members", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, members)
}

func (h *Handler) AddMember(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	var req models.AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	member, err := h.memberService.AddMember(c.Request.Context(), projectID, req.UserID, req.Role)
	if utils.HandleServiceError(c, err, "add member") {
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, member)
}

func (h *Handler) UpdateMemberRole(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.Param("userId")
	if projectID == "" || userID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID and User ID are required")
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	member, err := h.memberService.UpdateMemberRole(c.Request.Context(), projectID, userID, req.Role)
	if utils.HandleServiceError(c, err, "update member role") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, member)
}

func (h *Handler) RemoveMember(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.Param("userId")
	if projectID == "" || userID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID and User ID are required")
		return
	}

	if utils.HandleServiceError(c, h.memberService.RemoveMember(c.Request.Context(), projectID, userID), "remove member") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Member removed successfully",
	})
}

func (h *Handler) ListAgents(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	agents, err := h.agentService.ListAgents(c.Request.Context(), userID.(string))
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list agents", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, agents)
}

func (h *Handler) CreateAgent(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req models.CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	agent, err := h.agentService.CreateAgent(c.Request.Context(), userID.(string), &req)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create agent", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, agent)
}

func (h *Handler) GetAgent(c *gin.Context) {
	agentID := c.Param("id")
	if agentID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Agent ID is required")
		return
	}

	agent, err := h.agentService.GetAgent(c.Request.Context(), agentID)
	if utils.HandleServiceError(c, err, "get agent") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, agent)
}

func (h *Handler) UpdateAgent(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	agentID := c.Param("id")
	if agentID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Agent ID is required")
		return
	}

	var req models.UpdateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	agent, err := h.agentService.UpdateAgent(c.Request.Context(), userID.(string), agentID, &req)
	if utils.HandleServiceError(c, err, "update agent") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, agent)
}

func (h *Handler) DeleteAgent(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	agentID := c.Param("id")
	if agentID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Agent ID is required")
		return
	}

	if utils.HandleServiceError(c, h.agentService.DeleteAgent(c.Request.Context(), userID.(string), agentID), "delete agent") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Agent deleted successfully",
	})
}

func (h *Handler) ListProjectAgents(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	agents, err := h.agentService.GetProjectAgents(c.Request.Context(), projectID)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list project agents", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, agents)
}

func (h *Handler) AddProjectAgent(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID is required")
		return
	}

	var req models.AddProjectAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUT", "Invalid request data", err.Error())
		return
	}

	agent, err := h.agentService.AddAgentToProject(c.Request.Context(), projectID, req.AgentID, userID.(string), &req)
	if utils.HandleServiceError(c, err, "add agent to project") {
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, agent)
}

func (h *Handler) RemoveProjectAgent(c *gin.Context) {
	projectID := c.Param("id")
	agentID := c.Param("agentId")
	if projectID == "" || agentID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "Project ID and Agent ID are required")
		return
	}

	if utils.HandleServiceError(c, h.agentService.RemoveAgentFromProject(c.Request.Context(), projectID, agentID), "remove agent from project") {
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Agent removed from project successfully",
	})
}

func (h *Handler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.SuccessResponse(c, http.StatusOK, []*models.User{})
		return
	}

	users, err := h.authService.SearchUsers(c.Request.Context(), query)
	if err != nil {
		utils.ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to search users", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, users)
}
