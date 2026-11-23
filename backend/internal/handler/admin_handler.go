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

// GetAdminDashboard - Statistik global sistem
func GetAdminDashboard(c *gin.Context) {
	var totalUsers, activeUsers, inactiveUsers, adminCount int
	var totalTasks int

	// Hitung statistik user
	config.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 1").Scan(&activeUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 0").Scan(&inactiveUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'").Scan(&adminCount)

	// Hitung total task keseluruhan
	config.DB.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&totalTasks)

	// Rincian task per status
	rows, err := config.DB.Query("SELECT status, COUNT(*) FROM tasks GROUP BY status")
	statusSummary := map[string]int{
		"TODO":        0,
		"IN_PROGRESS": 0,
		"DONE":        0,
	}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				statusSummary[status] = count
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": gin.H{
			"total_users":    totalUsers,
			"active_users":   activeUsers,
			"inactive_users": inactiveUsers,
			"admin_count":    adminCount,
			"total_tasks":    totalTasks,
			"status_summary": statusSummary,
		},
	})
}

// GetAdminUsers - Daftar user dengan pagination, search, filter
func GetAdminUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

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

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	config.DB.QueryRow(countQuery, args...).Scan(&total)

	query := fmt.Sprintf("SELECT id, name, email, role, is_active, created_at, updated_at FROM users %s ORDER BY created_at DESC LIMIT ? OFFSET ?", whereClause)
	queryArgs := append(args, limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar user"})
		return
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			continue
		}
		// Password hash tidak pernah dikirim ke klien (keamanan)
		u.Password = ""
		users = append(users, u)
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	c.JSON(http.StatusOK, gin.H{
		"data":        users,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

// GetAdminUserByID - Detail user dan jumlah task per status miliknya
func GetAdminUserByID(c *gin.Context) {
	userID := c.Param("id")

	var u model.User
	err := config.DB.QueryRow("SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?", userID).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail user"})
		return
	}
	u.Password = ""

	// Hitung task user tersebut
	rows, _ := config.DB.Query("SELECT status, COUNT(*) FROM tasks WHERE user_id = ? GROUP BY status", userID)
	statusSummary := map[string]int{"TODO": 0, "IN_PROGRESS": 0, "DONE": 0}
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				statusSummary[status] = count
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"user":           u,
		"status_summary": statusSummary,
	})
}

// UpdateUserRole - Mengubah role user (USER <-> ADMIN) dengan validasi aturan bisnis
func UpdateUserRole(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetID, _ := strconv.Atoi(c.Param("id"))

	if currentAdminID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin tidak boleh mengubah role dirinya sendiri"})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required,oneof=USER ADMIN"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Jika menurunkan Admin menjadi User, pastikan minimal sisa 1 Admin aktif
	if input.Role == "USER" {
		var adminCount int
		config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1").Scan(&adminCount)
		if adminCount <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sistem harus menyisakan minimal satu Admin aktif"})
			return
		}
	}

	_, err := config.DB.Exec("UPDATE users SET role = ? WHERE id = ?", input.Role, targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui role user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role user berhasil diperbarui"})
}

// UpdateUserStatus - Mengaktifkan / menonaktifkan akun user
func UpdateUserStatus(c *gin.Context) {
	currentAdminID := c.MustGet("user_id").(int)
	targetID, _ := strconv.Atoi(c.Param("id"))

	if currentAdminID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin tidak boleh menonaktifkan akun dirinya sendiri"})
		return
	}

	var input struct {
		IsActive *bool `json:"is_active" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Jika menonaktifkan admin, pastikan minimal sisa 1 admin aktif
	if !*input.IsActive {
		var targetRole string
		var targetActive bool
		config.DB.QueryRow("SELECT role, is_active FROM users WHERE id = ?", targetID).Scan(&targetRole, &targetActive)

		if targetRole == "ADMIN" && targetActive {
			var adminCount int
			config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1").Scan(&adminCount)
			if adminCount <= 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak dapat menonaktifkan satu-satunya Admin aktif yang tersisa"})
				return
			}
		}
	}

	_, err := config.DB.Exec("UPDATE users SET is_active = ? WHERE id = ?", *input.IsActive, targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status akun user berhasil diperbarui"})
}

// GetAdminTasks - Monitoring seluruh task lintas user secara read-only dengan pagination & search
func GetAdminTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	whereClause := "WHERE 1=1"
	var args []interface{}

	// Fitur Search berdasarkan judul task atau nama user
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

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks t JOIN users u ON t.user_id = u.id %s", whereClause)
	config.DB.QueryRow(countQuery, args...).Scan(&total)

	query := fmt.Sprintf(`
		SELECT t.id, t.user_id, u.name as user_name, t.title, t.description, t.priority, t.status, t.due_date, t.created_at 
		FROM tasks t 
		JOIN users u ON t.user_id = u.id 
		%s ORDER BY t.created_at DESC LIMIT ? OFFSET ?`, whereClause)
	queryArgs := append(args, limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil monitoring task"})
		return
	}
	defer rows.Close()

	var tasks []gin.H
	for rows.Next() {
		var id, userID int
		var userName, title string
		var desc, dueDate sql.NullString
		var priority, status, createdAt string

		if err := rows.Scan(&id, &userID, &userName, &title, &desc, &priority, &status, &dueDate, &createdAt); err != nil {
			continue
		}

		tasks = append(tasks, gin.H{
			"id":          id,
			"user_id":     userID,
			"user_name":   userName,
			"title":       title,
			"description": desc.String,
			"priority":    priority,
			"status":      status,
			"due_date":    dueDate.String,
			"created_at":  createdAt,
		})
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

// ExportAdminTasksCSV - Mengunduh laporan task dalam format CSV yang bersih dan rapi untuk Excel
func ExportAdminTasksCSV(c *gin.Context) {
	rows, err := config.DB.Query(`
		SELECT t.id, u.name as user_name, t.title, t.priority, t.status, t.due_date, t.created_at 
		FROM tasks t 
		JOIN users u ON t.user_id = u.id 
		ORDER BY t.created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data untuk ekspor"})
		return
	}
	defer rows.Close()

	// Tambahkan BOM (Byte Order Mark) UTF-8 agar Excel otomatis mengenali karakter khusus dan format teks dengan benar
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment;filename=laporan_tasks_admin.csv")
	c.Writer.Write([]byte("\xEF\xBB\xBF"))

	// Header Kolom
	c.Writer.Write([]byte("ID,Nama User,Judul Task,Prioritas,Status,Due Date,Dibuat Pada\n"))

	for rows.Next() {
		var id int
		var userName, title, priority, status string
		var dueDate, createdAt sql.NullString

		if err := rows.Scan(&id, &userName, &title, &priority, &status, &dueDate, &createdAt); err != nil {
			continue
		}

		// Ambil format tanggal YYYY-MM-DD saja agar tidak terlalu panjang dan menghindari tanda ######## di Excel
		dDate := "-"
		if dueDate.Valid && len(dueDate.String) >= 10 {
			dDate = dueDate.String[:10]
		}

		cDate := "-"
		if createdAt.Valid && len(createdAt.String) >= 10 {
			cDate = createdAt.String[:10]
		}

		// Bungkus setiap sel teks dengan kutip ganda untuk keamanan isi data
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

// GetAdminTaskByID - Detail task spesifik lintas user (Read-Only)
func GetAdminTaskByID(c *gin.Context) {
	taskID := c.Param("id")

	var id, userID int
	var userName, title string
	var desc, dueDate sql.NullString
	var priority, status, createdAt string

	query := `
		SELECT t.id, t.user_id, u.name as user_name, t.title, t.description, t.priority, t.status, t.due_date, t.created_at 
		FROM tasks t 
		JOIN users u ON t.user_id = u.id 
		WHERE t.id = ?`

	err := config.DB.QueryRow(query, taskID).Scan(&id, &userID, &userName, &title, &desc, &priority, &status, &dueDate, &createdAt)
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
			"user_id":     userID,
			"user_name":   userName,
			"title":       title,
			"description": desc.String,
			"priority":    priority,
			"status":      status,
			"due_date":    dueDate.String,
			"created_at":  createdAt,
		},
	})
}