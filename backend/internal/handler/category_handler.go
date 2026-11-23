package handler

import (
	"backend/config"
	"backend/internal/model"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	rows, err := config.DB.Query("SELECT id, name, created_at, updated_at FROM categories WHERE user_id = ? ORDER BY created_at DESC", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kategori"})
		return
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var cat model.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt, &cat.UpdatedAt); err != nil {
			continue
		}
		cat.UserID = userID
		categories = append(categories, cat)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan saat membaca daftar kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func GetCategoryByID(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID := c.Param("id")

	var cat model.Category
	err := config.DB.QueryRow("SELECT id, name, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?", catID, userID).
		Scan(&cat.ID, &cat.Name, &cat.CreatedAt, &cat.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail kategori"})
		return
	}

	cat.UserID = userID
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

	_, err := config.DB.Exec("INSERT INTO categories (name, user_id) VALUES (?, ?)", input.Name, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat kategori baru"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Kategori berhasil dibuat"})
}

func UpdateCategory(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID := c.Param("id")

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := config.DB.Exec("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?", input.Name, catID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kategori"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil diperbarui"})
}

func DeleteCategory(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	catID := c.Param("id")

	res, err := config.DB.Exec("DELETE FROM categories WHERE id = ? AND user_id = ?", catID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}