package repository

import (
	"backend/config"
	"backend/internal/model"
	"database/sql"
	"fmt"
)

type AdminRepository struct{}

func NewAdminRepository() *AdminRepository {
	return &AdminRepository{}
}

func (r *AdminRepository) CountUsers() (int, int, int, int, error) {
	var totalUsers, activeUsers, inactiveUsers, adminCount int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	if err != nil {
		return 0, 0, 0, 0, err
	}
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 1").Scan(&activeUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = 0").Scan(&inactiveUsers)
	config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'").Scan(&adminCount)
	return totalUsers, activeUsers, inactiveUsers, adminCount, nil
}

func (r *AdminRepository) CountTasks() (int, map[string]int, error) {
	var totalTasks int
	config.DB.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&totalTasks)

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
	return totalTasks, statusSummary, nil
}

func (r *AdminRepository) GetUsers(whereClause string, args []interface{}, limit, offset int) ([]model.User, int, error) {
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	config.DB.QueryRow(countQuery, args...).Scan(&total)

	query := fmt.Sprintf("SELECT id, name, email, role, is_active, created_at, updated_at FROM users %s ORDER BY created_at DESC LIMIT ? OFFSET ?", whereClause)
	queryArgs := append(args, limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			continue
		}
		u.Password = ""
		users = append(users, u)
	}
	return users, total, nil
}

func (r *AdminRepository) GetUserByID(userID string) (model.User, map[string]int, error) {
	var u model.User
	err := config.DB.QueryRow("SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?", userID).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return u, nil, err
	}
	u.Password = ""

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
	return u, statusSummary, nil
}

func (r *AdminRepository) CountActiveAdmins() (int, error) {
	var adminCount int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1").Scan(&adminCount)
	return adminCount, err
}

func (r *AdminRepository) UpdateUserRole(role string, targetID int) error {
	_, err := config.DB.Exec("UPDATE users SET role = ? WHERE id = ?", role, targetID)
	return err
}

func (r *AdminRepository) UpdateUserStatus(isActive bool, targetID int) error {
	_, err := config.DB.Exec("UPDATE users SET is_active = ? WHERE id = ?", isActive, targetID)
	return err
}

func (r *AdminRepository) GetUserRoleAndActive(targetID int) (string, bool, error) {
	var targetRole string
	var targetActive bool
	err := config.DB.QueryRow("SELECT role, is_active FROM users WHERE id = ?", targetID).Scan(&targetRole, &targetActive)
	return targetRole, targetActive, err
}

func (r *AdminRepository) GetTasks(whereClause string, args []interface{}, limit, offset int) ([]map[string]interface{}, int, error) {
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
		return nil, 0, err
	}
	defer rows.Close()

	var tasks []map[string]interface{}
	for rows.Next() {
		var id, userID int
		var userName, title string
		var desc, dueDate sql.NullString
		var priority, status, createdAt string

		if err := rows.Scan(&id, &userID, &userName, &title, &desc, &priority, &status, &dueDate, &createdAt); err != nil {
			continue
		}

		tasks = append(tasks, map[string]interface{}{
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
	return tasks, total, nil
}

func (r *AdminRepository) GetAdminTaskByID(taskID string) (map[string]interface{}, error) {
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
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":          id,
		"user_id":     userID,
		"user_name":   userName,
		"title":       title,
		"description": desc.String,
		"priority":    priority,
		"status":      status,
		"due_date":    dueDate.String,
		"created_at":  createdAt,
	}, nil
}

func (r *AdminRepository) DeleteTask(taskID string) error {
	_, err := config.DB.Exec("DELETE FROM tasks WHERE id = ?", taskID)
	return err
}

func (r *AdminRepository) TaskExists(taskID string) (bool, error) {
	var exists bool
	err := config.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM tasks WHERE id = ?)", taskID).Scan(&exists)
	return exists, err
}

func (r *AdminRepository) GetAllTasksForExport() (*sql.Rows, error) {
	return config.DB.Query(`
		SELECT t.id, u.name as user_name, t.title, t.priority, t.status, t.due_date, t.created_at 
		FROM tasks t 
		JOIN users u ON t.user_id = u.id 
		ORDER BY t.created_at DESC`)
}