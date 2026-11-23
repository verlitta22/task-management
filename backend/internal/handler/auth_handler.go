package handler

import (
	"backend/config"
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", input.Email).Scan(&exists)
	if err == nil && exists > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah digunakan"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	// Role selalu USER dan is_active = 1 ditetapkan oleh backend
	query := "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'USER', 1)"
	_, err = config.DB.Exec(query, input.Name, input.Email, string(hashedPassword))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan pengguna"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Registrasi berhasil"})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id int
	var name, email, hashedPassword, role string
	var isActive bool

	query := "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?"
	err := config.DB.QueryRow(query, input.Email).Scan(&id, &name, &email, &hashedPassword, &role, &isActive)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan internal server"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	if !isActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akun Anda dinonaktifkan. Hubungi Admin."})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	claims := jwt.MapClaims{
		"user_id": id,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": signedToken,
		"user": gin.H{
			"id":    id,
			"name":  name,
			"email": email,
			"role":  role,
		},
	})
}

func Me(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	var id int
	var name, email, role string
	var isActive bool
	err := config.DB.QueryRow("SELECT id, name, email, role, is_active FROM users WHERE id = ?", userID).Scan(&id, &name, &email, &role, &isActive)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data pengguna tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        id,
		"name":      name,
		"email":     email,
		"role":      role,
		"is_active": isActive,
	})
}