package models

import (
	"time"
)

type AgentType string

const (
	AgentTypeAssistant AgentType = "assistant"
	AgentTypeBot       AgentType = "bot"
	AgentTypeWebhook   AgentType = "webhook"
	AgentTypeCustom    AgentType = "custom"
)

type Agent struct {
	ID        string            `json:"id" db:"id"`
	Name      string            `json:"name" db:"name"`
	Type      AgentType         `json:"type" db:"type"`
	Config    map[string]string `json:"config,omitempty" db:"config"`
	CreatedBy string            `json:"created_by" db:"created_by"`
	CreatedAt time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt time.Time         `json:"updated_at" db:"updated_at"`

	Creator *User `json:"creator,omitempty"`
}

type ProjectAgent struct {
	ID             string            `json:"id" db:"id"`
	ProjectID      string            `json:"project_id" db:"project_id"`
	AgentID        string            `json:"agent_id" db:"agent_id"`
	Role           ProjectRole       `json:"role" db:"role"`
	ConfigOverride map[string]string `json:"config_override,omitempty" db:"config_override"`
	CreatedBy      string            `json:"created_by" db:"created_by"`
	CreatedAt      time.Time         `json:"created_at" db:"created_at"`

	Agent   *Agent   `json:"agent,omitempty"`
	Project *Project `json:"project,omitempty"`
}

type CreateAgentRequest struct {
	Name   string            `json:"name" binding:"required,min=1,max=255"`
	Type   AgentType         `json:"type" binding:"required,oneof=assistant bot webhook custom"`
	Config map[string]string `json:"config"`
}

type UpdateAgentRequest struct {
	Name   string            `json:"name" binding:"omitempty,min=1,max=255"`
	Type   AgentType         `json:"type" binding:"omitempty,oneof=assistant bot webhook custom"`
	Config map[string]string `json:"config"`
}

type AddProjectAgentRequest struct {
	AgentID        string            `json:"agent_id" binding:"required,uuid"`
	Role           ProjectRole       `json:"role" binding:"required,oneof=admin member agent guest"`
	ConfigOverride map[string]string `json:"config_override"`
}
