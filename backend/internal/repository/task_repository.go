package repository

import (
	"backend/config"
	"backend/internal/model"
	"database/sql"
)

type TaskRepository struct{}

func NewTaskRepository() *TaskRepository {
	return &TaskRepository{}
}

func (r *TaskRepository) GetUserDashboardStats(userID int) (int, map[string]int, error) {
	var totalTasks int
	config.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE user_id = ?", userID).Scan(&totalTasks)

	rows, err := config.DB.Query("SELECT status, COUNT(*) FROM tasks WHERE user_id = ? GROUP BY status", userID)
	if err != nil {
		return 0, nil, err
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

	return totalTasks, statusSummary, rows.Err()
}

func (r *TaskRepository) GetTasks(whereClause string, args []interface{}, sortBy, sortOrder string, limit, offset int) ([]model.Task, int, error) {
	var total int
	countQuery := "SELECT COUNT(*) FROM tasks " + whereClause
	if err := config.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := "SELECT id, title, description, priority, status, category_id, due_date, created_at, updated_at FROM tasks " + whereClause + " ORDER BY " + sortBy + " " + sortOrder + " LIMIT ? OFFSET ?"
	queryArgs := append(args, limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
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

	return tasks, total, rows.Err()
}

func (r *TaskRepository) GetTaskByID(taskID, userID int) (model.Task, error) {
	var t model.Task
	var desc, dueDate sql.NullString
	var catID sql.NullInt64

	query := "SELECT id, title, description, priority, status, category_id, due_date, created_at, updated_at FROM tasks WHERE id = ? AND user_id = ?"
	err := config.DB.QueryRow(query, taskID, userID).Scan(&t.ID, &t.Title, &desc, &t.Priority, &t.Status, &catID, &dueDate, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return t, err
	}

	t.Description = desc.String
	if catID.Valid {
		idInt := int(catID.Int64)
		t.CategoryID = &idInt
	}
	if dueDate.Valid {
		dStr := dueDate.String
		t.DueDate = &dStr
	}
	return t, nil
}

func (r *TaskRepository) CheckCategoryOwnership(categoryID, userID int) (bool, error) {
	var count int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE id = ? AND user_id = ?", categoryID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *TaskRepository) CreateTask(userID int, categoryID *int, title, description, priority, status string, dueDate *string) error {
	query := "INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
	_, err := config.DB.Exec(query, userID, categoryID, title, description, priority, status, dueDate)
	return err
}

func (r *TaskRepository) UpdateTask(userID, taskID int, title, description, priority, status string, categoryID *int, dueDate *string) (int64, error) {
	query := `UPDATE tasks SET 
		title = COALESCE(NULLIF(?, ''), title), 
		description = COALESCE(NULLIF(?, ''), description), 
		priority = COALESCE(NULLIF(?, ''), priority),
		status = COALESCE(NULLIF(?, ''), status), 
		category_id = COALESCE(?, category_id),
		due_date = COALESCE(?, due_date)
		WHERE id = ? AND user_id = ?`

	res, err := config.DB.Exec(query, title, description, priority, status, categoryID, dueDate, taskID, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *TaskRepository) DeleteTask(taskID, userID int) (int64, error) {
	res, err := config.DB.Exec("DELETE FROM tasks WHERE id = ? AND user_id = ?", taskID, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}