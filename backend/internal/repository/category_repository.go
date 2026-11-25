package repository

import (
	"backend/config"
	"backend/internal/model"
)

type CategoryRepository struct{}

func NewCategoryRepository() *CategoryRepository {
	return &CategoryRepository{}
}

func (r *CategoryRepository) GetCategoriesByUserID(userID int) ([]model.Category, error) {
	// Diperbarui agar user_id ikut di-select dari database
	rows, err := config.DB.Query("SELECT id, user_id, name, created_at, updated_at FROM categories WHERE user_id = ? ORDER BY created_at DESC", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var cat model.Category
		if err := rows.Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.CreatedAt, &cat.UpdatedAt); err != nil {
			continue
		}
		categories = append(categories, cat)
	}
	return categories, rows.Err()
}

func (r *CategoryRepository) GetCategoryByIDAndUser(catID, userID int) (model.Category, error) {
	var cat model.Category
	err := config.DB.QueryRow("SELECT id, user_id, name, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?", catID, userID).
		Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.CreatedAt, &cat.UpdatedAt)
	if err != nil {
		return cat, err
	}
	return cat, nil
}

func (r *CategoryRepository) CreateCategory(name string, userID int) error {
	_, err := config.DB.Exec("INSERT INTO categories (name, user_id) VALUES (?, ?)", name, userID)
	return err
}

func (r *CategoryRepository) UpdateCategory(name string, catID, userID int) (int64, error) {
	res, err := config.DB.Exec("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?", name, catID, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *CategoryRepository) DeleteCategory(catID, userID int) (int64, error) {
	res, err := config.DB.Exec("DELETE FROM categories WHERE id = ? AND user_id = ?", catID, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}