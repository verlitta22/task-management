package middleware

import (
	"backend/config"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan atau format tidak valid"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		secret := os.Getenv("JWT_SECRET")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sudah kedaluwarsa"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Gagal membaca klaim token"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Identitas token tidak valid"})
			c.Abort()
			return
		}

		userID := int(userIDFloat)

		// Cek ulang ke database: pastikan user ada, aktif, dan ambil role terbaru
		var dbRole string
		var isActive bool
		err = config.DB.QueryRow("SELECT role, is_active FROM users WHERE id = ?", userID).Scan(&dbRole, &isActive)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna tidak ditemukan"})
			c.Abort()
			return
		}

		if !isActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akun dinonaktifkan"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Set("role", dbRole)
		c.Next()
	}
}