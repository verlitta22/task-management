package repository

import (
	"backend/config"
)

type AuthRepository struct{}

func NewAuthRepository() *AuthRepository {
	return &AuthRepository{}
}

func (r *AuthRepository) CheckEmailExists(email string) (bool, error) {
	var exists int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", email).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

func (r *AuthRepository) CreateUser(name, email, hashedPassword string) (int64, error) {
	query := "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'USER', 1)"
	result, err := config.DB.Exec(query, name, email, hashedPassword)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *AuthRepository) CreateDefaultCategories(userID int64, categories []string) {
	for _, catName := range categories {
		config.DB.Exec("INSERT INTO categories (name, user_id) VALUES (?, ?)", catName, userID)
	}
}

func (r *AuthRepository) GetUserByEmail(email string) (int, string, string, string, string, bool, error) {
	var id int
	var name, userEmail, hashedPassword, role string
	var isActive bool

	query := "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?"
	err := config.DB.QueryRow(query, email).Scan(&id, &name, &userEmail, &hashedPassword, &role, &isActive)
	if err != nil {
		return 0, "", "", "", "", false, err
	}
	return id, name, userEmail, hashedPassword, role, isActive, nil
}

func (r *AuthRepository) GetUserByID(userID int) (int, string, string, string, bool, error) {
	var id int
	var name, email, role string
	var isActive bool
	err := config.DB.QueryRow("SELECT id, name, email, role, is_active FROM users WHERE id = ?", userID).
		Scan(&id, &name, &email, &role, &isActive)
	if err != nil {
		return 0, "", "", "", false, err
	}
	return id, name, email, role, isActive, nil
}