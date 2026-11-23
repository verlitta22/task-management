package handler

import (
	"backend/config"
	"backend/internal/model"
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetUserDashboard(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	var totalTasks int
	config.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE user_id = ?", userID).Scan(&totalTasks)

	rows, err := config.DB.Query("SELECT status, COUNT(*) FROM tasks WHERE user_id = ? GROUP BY status", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat ringkasan dashboard"})
		return
	}
	defer rows.Close()

	statusSummary := map[string]int{
		"TODO":        0,
		"IN_PROGRESS": 0,
		"DONE":        0,
	}

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err == nil {
			statusSummary[status] = count
		}
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan membaca data ringkasan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_tasks":    totalTasks,
		"status_summary": statusSummary,
	})
}

func GetTasks(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Dynamic WHERE clause
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

	// Hitung total records
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", whereClause)
	if err := config.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total tugas"})
		return
	}

	// Sorting whitelist
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "DESC")

	allowedSortCols := map[string]bool{"created_at": true, "due_date": true, "title": true}
	if !allowedSortCols[sortBy] {
		sortBy = "created_at"
	}
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	query := fmt.Sprintf("SELECT id, title, description, priority, status, category_id, due_date, created_at, updated_at FROM tasks %s ORDER BY %s %s LIMIT ? OFFSET ?", whereClause, sortBy, sortOrder)
	queryArgs := append(args, limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tasks"})
		return
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		var desc, dueDate sql.NullString
		var catID sql.NullInt64

		if err := rows.Scan(&t.ID, &t.Title, &desc, &t.Priority, &t.Status, &catID, &dueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
			continue
		}
		t.UserID = userID
		t.Description = desc.String
		if catID.Valid {
			idInt := int(catID.Int64)
			t.CategoryID = &idInt
		}
		if dueDate.Valid {
			dStr := dueDate.String
			t.DueDate = &dStr
		}
		tasks = append(tasks, t)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan saat membaca daftar tasks"})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

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
	taskID := c.Param("id")

	var t model.Task
	var desc, dueDate sql.NullString
	var catID sql.NullInt64

	query := "SELECT id, title, description, priority, status, category_id, due_date, created_at, updated_at FROM tasks WHERE id = ? AND user_id = ?"
	err := config.DB.QueryRow(query, taskID, userID).Scan(&t.ID, &t.Title, &desc, &t.Priority, &t.Status, &catID, &dueDate, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail task"})
		return
	}

	t.UserID = userID
	t.Description = desc.String
	if catID.Valid {
		idInt := int(catID.Int64)
		t.CategoryID = &idInt
	}
	if dueDate.Valid {
		dStr := dueDate.String
		t.DueDate = &dStr
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

	if input.Priority == "" {
		input.Priority = "MEDIUM"
	} else if input.Priority != "LOW" && input.Priority != "MEDIUM" && input.Priority != "HIGH" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Priority harus LOW, MEDIUM, atau HIGH"})
		return
	}

	if input.Status == "" {
		input.Status = "TODO"
	} else if input.Status != "TODO" && input.Status != "IN_PROGRESS" && input.Status != "DONE" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status harus TODO, IN_PROGRESS, atau DONE"})
		return
	}

	if input.CategoryID != nil {
		var count int
		err := config.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE id = ? AND user_id = ?", *input.CategoryID, userID).Scan(&count)
		if err != nil || count == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid atau bukan milik Anda"})
			return
		}
	}

	query := "INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
	_, err := config.DB.Exec(query, userID, input.CategoryID, input.Title, input.Description, input.Priority, input.Status, input.DueDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat task baru"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Task berhasil dibuat"})
}

func UpdateTask(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	taskID := c.Param("id")

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

	if input.Priority != "" && input.Priority != "LOW" && input.Priority != "MEDIUM" && input.Priority != "HIGH" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Priority harus LOW, MEDIUM, atau HIGH"})
		return
	}

	if input.Status != "" && input.Status != "TODO" && input.Status != "IN_PROGRESS" && input.Status != "DONE" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status harus TODO, IN_PROGRESS, atau DONE"})
		return
	}

	if input.CategoryID != nil {
		var count int
		err := config.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE id = ? AND user_id = ?", *input.CategoryID, userID).Scan(&count)
		if err != nil || count == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid atau bukan milik Anda"})
			return
		}
	}

	query := `UPDATE tasks SET 
		title = COALESCE(NULLIF(?, ''), title), 
		description = COALESCE(NULLIF(?, ''), description), 
		priority = COALESCE(NULLIF(?, ''), priority),
		status = COALESCE(NULLIF(?, ''), status), 
		category_id = COALESCE(?, category_id),
		due_date = COALESCE(?, due_date)
		WHERE id = ? AND user_id = ?`

	res, err := config.DB.Exec(query, input.Title, input.Description, input.Priority, input.Status, input.CategoryID, input.DueDate, taskID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui task"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task berhasil diperbarui"})
}

func DeleteTask(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	taskID := c.Param("id")

	res, err := config.DB.Exec("DELETE FROM tasks WHERE id = ? AND user_id = ?", taskID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus task"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task berhasil dihapus"})
}