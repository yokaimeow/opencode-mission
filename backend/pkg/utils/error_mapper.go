package utils

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yokaimeow/opencode-mission/internal/services"
)

type ServiceErrorMapping struct {
	StatusCode int
	Code       string
	Message    string
}

var serviceErrorMap = map[error]ServiceErrorMapping{
	// Auth
	services.ErrEmailAlreadyRegistered: {http.StatusConflict, "CONFLICT", "Email already registered"},
	services.ErrUsernameAlreadyTaken:   {http.StatusConflict, "CONFLICT", "Username already taken"},
	services.ErrInvalidCredentials:     {http.StatusUnauthorized, "UNAUTHORIZED", "Invalid credentials"},
	services.ErrUserNotFound:           {http.StatusNotFound, "NOT_FOUND", "User not found"},
	// Project
	services.ErrProjectNotFound: {http.StatusNotFound, "NOT_FOUND", "Project not found"},
	services.ErrNotAuthorized:   {http.StatusForbidden, "FORBIDDEN", "Not authorized to access this project"},
	// Task
	services.ErrTaskNotFound: {http.StatusNotFound, "NOT_FOUND", "Task not found"},
	// Agent
	services.ErrAgentNotFound:         {http.StatusNotFound, "NOT_FOUND", "Agent not found"},
	services.ErrAgentAlreadyInProject: {http.StatusConflict, "CONFLICT", "Agent already in project"},
	services.ErrProjectAgentNotFound:  {http.StatusNotFound, "NOT_FOUND", "Agent not found in project"},
	services.ErrNotAgentOwner:         {http.StatusForbidden, "FORBIDDEN", "Not authorized to modify this agent"},
	// Member
	services.ErrMemberNotFound:      {http.StatusNotFound, "NOT_FOUND", "Member not found"},
	services.ErrMemberAlreadyExists: {http.StatusConflict, "CONFLICT", "Member already exists"},
	services.ErrCannotRemoveOwner:   {http.StatusBadRequest, "BAD_REQUEST", "Cannot remove project owner"},
}

func HandleServiceError(c *gin.Context, err error, operation string) bool {
	if err == nil {
		return false
	}
	for svcErr, mapping := range serviceErrorMap {
		if errors.Is(err, svcErr) {
			ErrorResponse(c, mapping.StatusCode, mapping.Code, mapping.Message)
			return true
		}
	}
	ErrorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR",
		"Failed to "+operation, err.Error())
	return true
}
