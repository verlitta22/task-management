package service

import (
	"backend/internal/model"
	"backend/internal/repository"
	"database/sql"
	"errors"
	"math"
)

type TaskService struct {
	repo *repository.TaskRepository
}

func NewTaskService(repo *repository.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) GetUserDashboard(userID int) (int, map[string]int, error) {
	total, summary, err := s.repo.GetUserDashboardStats(userID)
	if err != nil {
		return 0, nil, errors.New("gagal memuat ringkasan dashboard")
	}
	return total, summary, nil
}

func (s *TaskService) GetTasks(whereClause string, args []interface{}, sortBy, sortOrder string, page, limit int) ([]model.Task, int, int, error) {
	offset := (page - 1) * limit
	tasks, total, err := s.repo.GetTasks(whereClause, args, sortBy, sortOrder, limit, offset)
	if err != nil {
		return nil, 0, 0, errors.New("gagal mengambil data tasks")
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	for i := range tasks {
		tasks[i].UserID = args[0].(int)
	}
	return tasks, total, totalPages, nil
}

func (s *TaskService) GetTaskByID(taskID, userID int) (model.Task, error) {
	t, err := s.repo.GetTaskByID(taskID, userID)
	if err == sql.ErrNoRows {
		return t, errors.New("task tidak ditemukan")
	} else if err != nil {
		return t, errors.New("gagal mengambil detail task")
	}
	t.UserID = userID
	return t, nil
}

func (s *TaskService) CreateTask(userID int, title, description, priority, status string, categoryID *int, dueDate *string) error {
	if priority == "" {
		priority = "MEDIUM"
	} else if priority != "LOW" && priority != "MEDIUM" && priority != "HIGH" {
		return errors.New("priority harus LOW, MEDIUM, atau HIGH")
	}

	if status == "" {
		status = "TODO"
	} else if status != "TODO" && status != "IN_PROGRESS" && status != "DONE" {
		return errors.New("status harus TODO, IN_PROGRESS, atau DONE")
	}

	if categoryID != nil {
		valid, err := s.repo.CheckCategoryOwnership(*categoryID, userID)
		if err != nil || !valid {
			return errors.New("kategori tidak valid atau bukan milik Anda")
		}
	}

	err := s.repo.CreateTask(userID, categoryID, title, description, priority, status, dueDate)
	if err != nil {
		return errors.New("gagal membuat task baru")
	}
	return nil
}

func (s *TaskService) UpdateTask(userID, taskID int, title, description, priority, status string, categoryID *int, dueDate *string) error {
	if priority != "" && priority != "LOW" && priority != "MEDIUM" && priority != "HIGH" {
		return errors.New("priority harus LOW, MEDIUM, atau HIGH")
	}

	if status != "" && status != "TODO" && status != "IN_PROGRESS" && status != "DONE" {
		return errors.New("status harus TODO, IN_PROGRESS, atau DONE")
	}

	if categoryID != nil {
		valid, err := s.repo.CheckCategoryOwnership(*categoryID, userID)
		if err != nil || !valid {
			return errors.New("kategori tidak valid atau bukan milik Anda")
		}
	}

	rowsAffected, err := s.repo.UpdateTask(userID, taskID, title, description, priority, status, categoryID, dueDate)
	if err != nil {
		return errors.New("gagal memperbarui task")
	}
	if rowsAffected == 0 {
		return errors.New("task tidak ditemukan")
	}
	return nil
}

func (s *TaskService) DeleteTask(taskID, userID int) error {
	rowsAffected, err := s.repo.DeleteTask(taskID, userID)
	if err != nil {
		return errors.New("gagal menghapus task")
	}
	if rowsAffected == 0 {
		return errors.New("task tidak ditemukan")
	}
	return nil
}