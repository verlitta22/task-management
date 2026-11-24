package handler

import (
	"backend/internal/repository"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var categoryService = service.NewCategoryService(repository.NewCategoryRepository())

func GetCategories(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	categories, err := categoryService.GetCategories(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func GetCategoryByID(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID, _ := strconv.Atoi(c.Param("id"))

	cat, err := categoryService.GetCategoryByID(catID, userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "kategori tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cat})
}

func CreateCategory(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := categoryService.CreateCategory(input.Name, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Kategori berhasil dibuat"})
}

func UpdateCategory(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID, _ := strconv.Atoi(c.Param("id"))

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := categoryService.UpdateCategory(input.Name, catID, userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "kategori tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil diperbarui"})
}

func DeleteCategory(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID, _ := strconv.Atoi(c.Param("id"))

	err := categoryService.DeleteCategory(catID, userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "kategori tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}