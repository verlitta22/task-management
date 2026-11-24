package handler

import (
	"backend/internal/repository"
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

var authService = service.NewAuthService(repository.NewAuthRepository())

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

	err := authService.Register(input.Name, input.Email, input.Password)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "email sudah digunakan" {
			code = http.StatusConflict
		}
		c.JSON(code, gin.H{"error": err.Error()})
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

	token, user, err := authService.Login(input.Email, input.Password)
	if err != nil {
		code := http.StatusUnauthorized
		if err.Error() == "akun Anda dinonaktifkan. Hubungi Admin" {
			code = http.StatusForbidden
		} else if err.Error() == "kesalahan internal server" || err.Error() == "gagal membuat token" {
			code = http.StatusInternalServerError
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func Me(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	user, err := authService.GetMe(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}