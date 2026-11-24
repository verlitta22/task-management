package handler

import (
	"backend/internal/repository"
	"backend/internal/service"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var adminService = service.NewAdminService(repository.NewAdminRepository())

func GetAdminDashboard(c *gin.Context) {
	stats, err := adminService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data statistik admin"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

func GetAdminUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	whereClause := "WHERE 1=1"
	var args []interface{}

	if search := c.Query("search"); search != "" {
		whereClause += " AND (name LIKE ? OR email LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	if role := c.Query("role"); role != "" {
		whereClause += " AND role = ?"
		args = append(args, role)
	}
	if isActive := c.Query("is_active"); isActive != "" {
		whereClause += " AND is_active = ?"
		args = append(args, isActive)
	}

	users, total, totalPages, err := adminService.GetUsersList(whereClause, args, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        users,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

func GetAdminUserByID(c *gin.Context) {
	userID := c.Param("id")
	u, statusSummary, err := adminService.GetUserDetail(userID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "user tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":           u,
		"status_summary": statusSummary,
	})
}

func UpdateUserRole(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetID, _ := strconv.Atoi(c.Param("id"))

	var input struct {
		Role string `json:"role" binding:"required,oneof=USER ADMIN"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := adminService.UpdateRole(currentAdminID, targetID, input.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role user berhasil diperbarui"})
}

func UpdateUserStatus(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetID, _ := strconv.Atoi(c.Param("id"))

	var input struct {
		IsActive *bool `json:"is_active" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := adminService.UpdateStatus(currentAdminID, targetID, *input.IsActive)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status akun user berhasil diperbarui"})
}

func GetAdminTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	whereClause := "WHERE 1=1"
	var args []interface{}

	if search := c.Query("search"); search != "" {
		whereClause += " AND (t.title LIKE ? OR u.name LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	if userID := c.Query("user_id"); userID != "" {
		whereClause += " AND t.user_id = ?"
		args = append(args, userID)
	}
	if status := c.Query("status"); status != "" {
		whereClause += " AND t.status = ?"
		args = append(args, status)
	}
	if priority := c.Query("priority"); priority != "" {
		whereClause += " AND t.priority = ?"
		args = append(args, priority)
	}

	tasks, total, totalPages, err := adminService.GetTasksList(whereClause, args, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil monitoring task"})
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

func GetAdminTaskByID(c *gin.Context) {
	taskID := c.Param("id")

	task, err := adminService.GetAdminTaskByID(taskID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "task tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": task})
}

func AdminDeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	err := adminService.DeleteTask(taskID)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "task tidak ditemukan" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task berhasil dihapus oleh admin"})
}

func ExportAdminTasksCSV(c *gin.Context) {
	rows, err := adminService.GetExportRows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data untuk ekspor"})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment;filename=laporan_tasks_admin.csv")
	c.Writer.Write([]byte("\xEF\xBB\xBF"))
	c.Writer.Write([]byte("ID,Nama User,Judul Task,Prioritas,Status,Due Date,Dibuat Pada\n"))

	for rows.Next() {
		var id int
		var userName, title, priority, status string
		var dueDate, createdAt sql.NullString

		if err := rows.Scan(&id, &userName, &title, &priority, &status, &dueDate, &createdAt); err != nil {
			continue
		}

		dDate := "-"
		if dueDate.Valid && len(dueDate.String) >= 10 {
			dDate = dueDate.String[:10]
		}

		cDate := "-"
		if createdAt.Valid && len(createdAt.String) >= 10 {
			cDate = createdAt.String[:10]
		}

		line := fmt.Sprintf("%d,%s,%s,%s,%s,%s,%s\n",
			id,
			escapeCSVCell(userName),
			escapeCSVCell(title),
			priority,
			status,
			dDate,
			cDate,
		)
		c.Writer.Write([]byte(line))
	}
}

func escapeCSVCell(s string) string {
	return fmt.Sprintf(`"%s"`, s)
}