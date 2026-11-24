package service

import (
	"backend/internal/model"
	"backend/internal/repository"
	"database/sql"
	"errors"
)

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService(repo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) GetCategories(userID int) ([]model.Category, error) {
	cats, err := s.repo.GetCategoriesByUserID(userID)
	if err != nil {
		return nil, errors.New("gagal mengambil data kategori")
	}
	return cats, nil
}

func (s *CategoryService) GetCategoryByID(catID, userID int) (model.Category, error) {
	cat, err := s.repo.GetCategoryByIDAndUser(catID, userID)
	if err == sql.ErrNoRows {
		return cat, errors.New("kategori tidak ditemukan")
	} else if err != nil {
		return cat, errors.New("gagal mengambil detail kategori")
	}
	return cat, nil
}

func (s *CategoryService) CreateCategory(name string, userID int) error {
	err := s.repo.CreateCategory(name, userID)
	if err != nil {
		return errors.New("gagal membuat kategori baru")
	}
	return nil
}

func (s *CategoryService) UpdateCategory(name string, catID, userID int) error {
	rowsAffected, err := s.repo.UpdateCategory(name, catID, userID)
	if err != nil {
		return errors.New("gagal memperbarui kategori")
	}
	if rowsAffected == 0 {
		return errors.New("kategori tidak ditemukan")
	}
	return nil
}

func (s *CategoryService) DeleteCategory(catID, userID int) error {
	rowsAffected, err := s.repo.DeleteCategory(catID, userID)
	if err != nil {
		return errors.New("gagal menghapus kategori")
	}
	if rowsAffected == 0 {
		return errors.New("kategori tidak ditemukan")
	}
	return nil
}