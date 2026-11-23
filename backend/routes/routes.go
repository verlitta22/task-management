package routes

import (
	"backend/internal/handler"
	"backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Konfigurasi CORS agar frontend (Port 5173 / 5174) bisa mengakses backend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api/v1")
	{
		// Public Routes
		api.POST("/auth/register", handler.Register)
		api.POST("/auth/login", handler.Login)

		// Protected Routes (Wajib Login)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/me", handler.Me)

			// USER Only Routes
			userGroup := protected.Group("")
			userGroup.Use(middleware.RequireRole("USER"))
			{
				userGroup.GET("/dashboard", handler.GetUserDashboard)
				userGroup.GET("/tasks", handler.GetTasks)
				userGroup.GET("/tasks/:id", handler.GetTaskByID)
				userGroup.POST("/tasks", handler.CreateTask)
				userGroup.PUT("/tasks/:id", handler.UpdateTask)
				userGroup.DELETE("/tasks/:id", handler.DeleteTask)
				userGroup.GET("/categories", handler.GetCategories)
				userGroup.GET("/categories/:id", handler.GetCategoryByID)
				userGroup.POST("/categories", handler.CreateCategory)
				userGroup.PUT("/categories/:id", handler.UpdateCategory)
				userGroup.DELETE("/categories/:id", handler.DeleteCategory)
			}

			// ADMIN Only Routes
			adminGroup := protected.Group("/admin")
			adminGroup.Use(middleware.RequireRole("ADMIN"))
			{
				adminGroup.GET("/dashboard", handler.GetAdminDashboard)
				adminGroup.GET("/users", handler.GetAdminUsers)
				adminGroup.GET("/users/:id", handler.GetAdminUserByID)
				adminGroup.PATCH("/users/:id/role", handler.UpdateUserRole)
				adminGroup.PATCH("/users/:id/status", handler.UpdateUserStatus)
				adminGroup.GET("/tasks", handler.GetAdminTasks)
				adminGroup.GET("/tasks/:id", handler.GetAdminTaskByID)
				adminGroup.GET("/tasks/export", handler.ExportAdminTasksCSV)
			}
		}
	}

	return r
}