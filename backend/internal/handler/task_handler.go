package handler

import (
	"backend/internal/repository"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var taskService = service.NewTaskService(repository.NewTaskRepository())

func GetUserDashboard(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	totalTasks, statusSummary, err := taskService.GetUserDashboard(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_tasks":    totalTasks,
		"status_summary": statusSummary,
	})
}

func GetTasks(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	whereClause := "WHERE user_id = ?"
	args := []interface{}{userID}

	if search := c.Query("search"); search != "" {
		whereClause += " AND title LIKE ?"
		args = append(args, "%"+search+"%")
	}
	if status := c.Query("status"); status != "" {
		whereClause += " AND status = ?"
		args = append(args, status)
	}
	if priority := c.Query("priority"); priority != "" {
		whereClause += " AND priority = ?"
		args = append(args, priority)
	}
	if catID := c.Query("category_id"); catID != "" {
		whereClause += " AND category_id = ?"
		args = append(args, catID)
	}

	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "DESC")

	allowedSortCols := map[string]bool{"created_at": true, "due_date": true, "title": true}
	if !allowedSortCols[sortBy] {
		sortBy = "created_at"
	}
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	tasks, total, totalPages, err := taskService.GetTasks(whereClause, args, sortBy, sortOrder, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        tasks,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

func GetTaskByID(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	taskID, _ := strconv.Atoi(c.Param("id"))

	t, err := taskService.GetTaskByID(taskID, userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "task tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": t})
}

func CreateTask(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	var input struct {
		Title       string  `json:"title" binding:"required,max=200"`
		Description string  `json:"description"`
		CategoryID  *int    `json:"category_id"`
		Priority    string  `json:"priority"`
		Status      string  `json:"status"`
		DueDate     *string `json:"due_date"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := taskService.CreateTask(userID, input.Title, input.Description, input.Priority, input.Status, input.CategoryID, input.DueDate)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "kategori tidak valid atau bukan milik Anda" ||
			err.Error() == "priority harus LOW, MEDIUM, atau HIGH" ||
			err.Error() == "status harus TODO, IN_PROGRESS, atau DONE" {
			code = http.StatusBadRequest
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Task berhasil dibuat"})
}

func UpdateTask(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	taskID, _ := strconv.Atoi(c.Param("id"))

	var input struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		CategoryID  *int    `json:"category_id"`
		Priority    string  `json:"priority"`
		Status      string  `json:"status"`
		DueDate     *string `json:"due_date"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := taskService.UpdateTask(userID, taskID, input.Title, input.Description, input.Priority, input.Status, input.CategoryID, input.DueDate)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "task tidak ditemukan" {
			code = http.StatusNotFound
		} else if err.Error() == "kategori tidak valid atau bukan milik Anda" ||
			err.Error() == "priority harus LOW, MEDIUM, atau HIGH" ||
			err.Error() == "status harus TODO, IN_PROGRESS, atau DONE" {
			code = http.StatusBadRequest
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task berhasil diperbarui"})
}

func DeleteTask(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	taskID, _ := strconv.Atoi(c.Param("id"))

	err := taskService.DeleteTask(taskID, userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "task tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task berhasil dihapus"})
}