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

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/yokaimeow/opencode-mission/internal/config"
	"github.com/yokaimeow/opencode-mission/internal/database"
	"github.com/yokaimeow/opencode-mission/internal/handlers"
	"github.com/yokaimeow/opencode-mission/internal/repository"
	"github.com/yokaimeow/opencode-mission/internal/services"
	"github.com/yokaimeow/opencode-mission/internal/valkey"
	"github.com/yokaimeow/opencode-mission/pkg/auth"
)

func main() {
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
			Database: config.DatabaseConfig{
				URL:             "postgres://postgres:password@localhost:5432/opencode-mission?sslmode=disable",
				MaxOpenConns:    25,
				MaxIdleConns:    5,
				ConnMaxLifetime: 5 * time.Minute,
			},
			Valkey: config.ValkeyConfig{
				URL: "redis://localhost:6379/0",
			},
			JWT: config.JWTConfig{
				AccessTokenSecret:  "dev-access-secret-key-change-in-production",
				RefreshTokenSecret: "dev-refresh-secret-key-change-in-production",
				AccessTokenExpire:  15 * time.Minute,
				RefreshTokenExpire: 168 * time.Hour,
			},
		}
	}

	log.Println("Starting OpenCode Mission Backend...")

	pool, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("✅ Database connected (using pgx/v5)")

	if err := database.RunMigrations(cfg.Database.URL); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	valkeyClient, err := valkey.NewClient(cfg.Valkey.URL)
	if err != nil {
		log.Fatalf("Failed to connect to Valkey: %v", err)
	}
	defer valkeyClient.Close()
	log.Println("✅ Valkey connected")

	userRepo := repository.NewUserRepository(pool)
	jwtManager := auth.NewJWTManager(
		cfg.JWT.AccessTokenSecret,
		cfg.JWT.RefreshTokenSecret,
		cfg.JWT.AccessTokenExpire,
		cfg.JWT.RefreshTokenExpire,
	)
	tokenBlacklist := services.NewTokenBlacklistService(valkeyClient)
	authService := services.NewAuthService(userRepo, jwtManager, tokenBlacklist)

	h := handlers.NewHandler(authService, jwtManager, tokenBlacklist, pool, valkeyClient)

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)

	v1 := router.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", h.Register)
			authGroup.POST("/login", h.Login)
			authGroup.POST("/logout", h.Logout)
			authGroup.POST("/refresh", h.RefreshToken)
			authGroup.GET("/me", h.AuthMiddleware(), h.GetCurrentUser)
		}

		protected := v1.Group("/")
		protected.Use(h.AuthMiddleware())
		{
			protected.GET("/projects", h.ListProjects)
			protected.POST("/projects", h.CreateProject)
			protected.GET("/projects/:id", h.GetProject)
			protected.PATCH("/projects/:id", h.UpdateProject)
			protected.DELETE("/projects/:id", h.DeleteProject)

			protected.GET("/projects/:id/tasks", h.ListTasks)
			protected.POST("/projects/:id/tasks", h.CreateTask)
			protected.GET("/tasks/:id", h.GetTask)
			protected.PATCH("/tasks/:id", h.UpdateTask)
			protected.DELETE("/tasks/:id", h.DeleteTask)
		}
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("✅ Server started on http://%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("📖 API docs available at http://%s:%d/docs", cfg.Server.Host, cfg.Server.Port)
	log.Printf("💚 Health check at http://%s:%d/health", cfg.Server.Host, cfg.Server.Port)

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
