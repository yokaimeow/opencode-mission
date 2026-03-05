package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yokaimeow/opencode-mission/internal/config"
	"github.com/yokaimeow/opencode-mission/internal/handlers"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Warning: Failed to load config file: %v, using defaults", err)
		cfg = &config.Config{
			Server: config.ServerConfig{
				Port:         8080,
				Host:         "0.0.0.0",
				ReadTimeout:  10 * time.Second,
				WriteTimeout: 10 * time.Second,
			},
		}
	}

	log.Println("Starting OpenCode Mission Backend...")

	// Initialize Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Setup handlers
	h := handlers.NewHandler()

	// Health check routes
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", h.Register)
			auth.POST("/login", h.Login)
			auth.POST("/logout", h.Logout)
			auth.GET("/me", h.GetCurrentUser)
		}

		// Protected routes
		protected := v1.Group("/")
		// protected.Use(authMiddleware(cfg))  // TODO: Implement auth
		{
			// Projects
			protected.GET("/projects", h.ListProjects)
			protected.POST("/projects", h.CreateProject)
			protected.GET("/projects/:id", h.GetProject)
			protected.PATCH("/projects/:id", h.UpdateProject)
			protected.DELETE("/projects/:id", h.DeleteProject)

			// Tasks
			protected.GET("/projects/:id/tasks", h.ListTasks)
			protected.POST("/projects/:id/tasks", h.CreateTask)
			protected.GET("/tasks/:id", h.GetTask)
			protected.PATCH("/tasks/:id", h.UpdateTask)
			protected.DELETE("/tasks/:id", h.DeleteTask)
		}
	}

	// Start server
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("✅ Server started on http://%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("📖 API docs available at http://%s:%d/docs", cfg.Server.Host, cfg.Server.Port)
	log.Printf("💚 Health check at http://%s:%d/health", cfg.Server.Host, cfg.Server.Port)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("⚠️  Server forced to shutdown: %v", err)
	}

	log.Println("👋 Server exited")
}

func authMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Implement JWT authentication
		c.Next()
	}
}
