package handler

import (
	"backend/config"
	"context"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAdminDashboard(c *gin.Context) {
	var totalUsers, activeUsers, inactiveUsers, totalAdmins int
	config.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 1").Scan(&activeUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 0").Scan(&inactiveUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'").Scan(&totalAdmins)

	var totalTasks int
	config.DB.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&totalTasks)

	rows, err := config.DB.Query("SELECT status, COUNT(*) FROM tasks GROUP BY status")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil statistik task"})
		return
	}
	defer rows.Close()

	taskStatusCounts := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err == nil {
			taskStatusCounts[status] = count
		}
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan membaca statistik task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": gin.H{
			"total":    totalUsers,
			"active":   activeUsers,
			"inactive": inactiveUsers,
			"admins":   totalAdmins,
		},
		"tasks": gin.H{
			"total":         totalTasks,
			"status_counts": taskStatusCounts,
		},
	})
}

func GetAdminUsers(c *gin.Context) {
	rows, err := config.DB.Query("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar user"})
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var name, email, role string
		var isActive bool
		var createdAt string
		if err := rows.Scan(&id, &name, &email, &role, &isActive, &createdAt); err != nil {
			continue
		}
		users = append(users, gin.H{
			"id":         id,
			"name":       name,
			"email":      email,
			"role":       role,
			"is_active":  isActive,
			"created_at": createdAt,
		})
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan membaca daftar user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func GetAdminUserByID(c *gin.Context) {
	targetID := c.Param("id")

	var id int
	var name, email, role, createdAt string
	var isActive bool

	err := config.DB.QueryRow("SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?", targetID).
		Scan(&id, &name, &email, &role, &isActive, &createdAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail user"})
		return
	}

	rows, err := config.DB.Query("SELECT status, COUNT(*) FROM tasks WHERE user_id = ? GROUP BY status", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung task user"})
		return
	}
	defer rows.Close()

	taskCounts := make(map[string]int)
	for rows.Next() {
		var st string
		var cnt int
		if err := rows.Scan(&st, &cnt); err == nil {
			taskCounts[st] = cnt
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":         id,
			"name":       name,
			"email":      email,
			"role":       role,
			"is_active":  isActive,
			"created_at": createdAt,
		},
		"task_summary": taskCounts,
	})
}

func UpdateUserRole(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetUserID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID user tidak valid"})
		return
	}

	if currentAdminID == targetUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin tidak boleh mengubah role dirinya sendiri"})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Role != "USER" && input.Role != "ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role harus USER atau ADMIN"})
		return
	}

	ctx := context.Background()
	tx, err := config.DB.BeginTx(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	if input.Role == "USER" {
		var adminCount int
		err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1 FOR UPDATE").Scan(&adminCount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa jumlah Admin"})
			return
		}
		if adminCount <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sistem harus selalu memiliki minimal satu Admin aktif"})
			return
		}
	}

	res, err := tx.ExecContext(ctx, "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?", input.Role, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui role user"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perubahan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role user berhasil diperbarui"})
}

func UpdateUserStatus(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetUserID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID user tidak valid"})
		return
	}

	if currentAdminID == targetUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin tidak boleh menonaktifkan dirinya sendiri"})
		return
	}

	var input struct {
		IsActive *bool `json:"is_active" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	tx, err := config.DB.BeginTx(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	if !*input.IsActive {
		var targetRole string
		err = tx.QueryRowContext(ctx, "SELECT role FROM users WHERE id = ?", targetUserID).Scan(&targetRole)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
			return
		}

		if targetRole == "ADMIN" {
			var adminCount int
			tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1 FOR UPDATE").Scan(&adminCount)
			if adminCount <= 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Sistem harus selalu memiliki minimal satu Admin aktif"})
				return
			}
		}
	}

	res, err := tx.ExecContext(ctx, "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?", *input.IsActive, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status user"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perubahan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status keaktifan user berhasil diperbarui"})
}

func GetAdminTasks(c *gin.Context) {
	query := `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, u.name AS owner_name 
	          FROM tasks t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`

	rows, err := config.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data monitoring tasks"})
		return
	}
	defer rows.Close()

	var tasks []map[string]interface{}
	for rows.Next() {
		var id int
		var title, status, priority, ownerName string
		var desc, dueDate sql.NullString
		var createdAt string
		if err := rows.Scan(&id, &title, &desc, &status, &priority, &dueDate, &createdAt, &ownerName); err != nil {
			continue
		}
		tasks = append(tasks, gin.H{
			"id":          id,
			"title":       title,
			"description": desc.String,
			"status":      status,
			"priority":    priority,
			"due_date":    dueDate.String,
			"owner_name":  ownerName,
			"created_at":  createdAt,
		})
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan saat membaca daftar monitoring tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func GetAdminTaskByID(c *gin.Context) {
	taskID := c.Param("id")

	query := `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, u.name AS owner_name, u.email AS owner_email
	          FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.id = ?`

	var id int
	var title, status, priority, ownerName, ownerEmail, createdAt string
	var desc, dueDate sql.NullString

	err := config.DB.QueryRow(query, taskID).Scan(&id, &title, &desc, &status, &priority, &dueDate, &createdAt, &ownerName, &ownerEmail)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":          id,
			"title":       title,
			"description": desc.String,
			"status":      status,
			"priority":    priority,
			"due_date":    dueDate.String,
			"owner_name":  ownerName,
			"owner_email": ownerEmail,
			"created_at":  createdAt,
		},
	})
}