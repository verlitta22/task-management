package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		if roleVal.(string) != requiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Role tidak diizinkan"})
			c.Abort()
			return
		}

		c.Next()
	}
}