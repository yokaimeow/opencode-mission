package models

import (
	"time"
)

type ProjectRole string

const (
	RoleAdmin  ProjectRole = "admin"
	RoleMember ProjectRole = "member"
	RoleAgent  ProjectRole = "agent"
	RoleGuest  ProjectRole = "guest"
)

type ProjectMember struct {
	ProjectID string      `json:"project_id" db:"project_id"`
	UserID    string      `json:"user_id" db:"user_id"`
	Role      ProjectRole `json:"role" db:"role"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`

	User    *User    `json:"user,omitempty"`
	Project *Project `json:"project,omitempty"`
}

type AddMemberRequest struct {
	UserID string      `json:"user_id" binding:"required,uuid"`
	Role   ProjectRole `json:"role" binding:"required,oneof=admin member agent guest"`
}

type UpdateMemberRoleRequest struct {
	Role ProjectRole `json:"role" binding:"required,oneof=admin member agent guest"`
}
