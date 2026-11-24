package service

import (
	"backend/internal/model"
	"backend/internal/repository"
	"database/sql"
	"errors"
	"math"
)

type AdminService struct {
	repo *repository.AdminRepository
}

func NewAdminService(repo *repository.AdminRepository) *AdminService {
	return &AdminService{repo: repo}
}

func (s *AdminService) GetDashboardStats() (map[string]interface{}, error) {
	totalUsers, activeUsers, inactiveUsers, adminCount, err := s.repo.CountUsers()
	if err != nil {
		return nil, err
	}

	totalTasks, statusSummary, err := s.repo.CountTasks()
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_users":    totalUsers,
		"active_users":   activeUsers,
		"inactive_users": inactiveUsers,
		"admin_count":    adminCount,
		"total_tasks":    totalTasks,
		"status_summary": statusSummary,
	}, nil
}

func (s *AdminService) GetUsersList(whereClause string, args []interface{}, page, limit int) ([]model.User, int, int, error) {
	offset := (page - 1) * limit
	users, total, err := s.repo.GetUsers(whereClause, args, limit, offset)
	if err != nil {
		return nil, 0, 0, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	return users, total, totalPages, nil
}

func (s *AdminService) GetUserDetail(userID string) (model.User, map[string]int, error) {
	u, summary, err := s.repo.GetUserByID(userID)
	if err == sql.ErrNoRows {
		return u, nil, errors.New("user tidak ditemukan")
	}
	return u, summary, err
}

func (s *AdminService) UpdateRole(currentAdminID, targetID int, newRole string) error {
	if currentAdminID == targetID {
		return errors.New("admin tidak boleh mengubah role dirinya sendiri")
	}

	if newRole == "USER" {
		adminCount, err := s.repo.CountActiveAdmins()
		if err != nil {
			return err
		}
		if adminCount <= 1 {
			return errors.New("sistem harus menyisakan minimal satu Admin aktif")
		}
	}

	return s.repo.UpdateUserRole(newRole, targetID)
}

func (s *AdminService) UpdateStatus(currentAdminID, targetID int, isActive bool) error {
	if currentAdminID == targetID {
		return errors.New("admin tidak boleh menonaktifkan akun dirinya sendiri")
	}

	if !isActive {
		targetRole, targetActive, err := s.repo.GetUserRoleAndActive(targetID)
		if err != nil {
			return err
		}

		if targetRole == "ADMIN" && targetActive {
			adminCount, err := s.repo.CountActiveAdmins()
			if err != nil {
				return err
			}
			if adminCount <= 1 {
				return errors.New("tidak dapat menonaktifkan satu-satunya Admin aktif yang tersisa")
			}
		}
	}

	return s.repo.UpdateUserStatus(isActive, targetID)
}

func (s *AdminService) GetTasksList(whereClause string, args []interface{}, page, limit int) ([]map[string]interface{}, int, int, error) {
	offset := (page - 1) * limit
	tasks, total, err := s.repo.GetTasks(whereClause, args, limit, offset)
	if err != nil {
		return nil, 0, 0, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	return tasks, total, totalPages, nil
}

func (s *AdminService) GetAdminTaskByID(taskID string) (map[string]interface{}, error) {
	task, err := s.repo.GetAdminTaskByID(taskID)
	if err == sql.ErrNoRows {
		return nil, errors.New("task tidak ditemukan")
	} else if err != nil {
		return nil, errors.New("gagal mengambil detail task")
	}
	return task, nil
}

func (s *AdminService) DeleteTask(taskID string) error {
	exists, err := s.repo.TaskExists(taskID)
	if err != nil || !exists {
		return errors.New("task tidak ditemukan")
	}
	return s.repo.DeleteTask(taskID)
}

func (s *AdminService) GetExportRows() (*sql.Rows, error) {
	return s.repo.GetAllTasksForExport()
}