package service

import (
	"backend/internal/repository"
	"database/sql"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo *repository.AuthRepository
}

func NewAuthService(repo *repository.AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

func (s *AuthService) Register(name, email, password string) error {
	exists, err := s.repo.CheckEmailExists(email)
	if err != nil {
		return errors.New("kesalahan internal server")
	}
	if exists {
		return errors.New("email sudah digunakan")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("gagal memproses password")
	}

	userID, err := s.repo.CreateUser(name, email, string(hashedPassword))
	if err != nil {
		return errors.New("gagal mendaftarkan pengguna")
	}

	defaultCategories := []string{"Pekerjaan", "Pribadi", "Belajar"}
	s.repo.CreateDefaultCategories(userID, defaultCategories)

	return nil
}

func (s *AuthService) Login(email, password string) (string, map[string]interface{}, error) {
	id, name, userEmail, hashedPassword, role, isActive, err := s.repo.GetUserByEmail(email)
	if err == sql.ErrNoRows {
		return "", nil, errors.New("email atau password salah")
	} else if err != nil {
		return "", nil, errors.New("kesalahan internal server")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)); err != nil {
		return "", nil, errors.New("email atau password salah")
	}

	if !isActive {
		return "", nil, errors.New("akun Anda dinonaktifkan. Hubungi Admin")
	}

	secret := os.Getenv("JWT_SECRET")
	claims := jwt.MapClaims{
		"user_id": id,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", nil, errors.New("gagal membuat token")
	}

	userData := map[string]interface{}{
		"id":    id,
		"name":  name,
		"email": userEmail,
		"role":  role,
	}

	return signedToken, userData, nil
}

func (s *AuthService) GetMe(userID int) (map[string]interface{}, error) {
	id, name, email, role, isActive, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("data pengguna tidak ditemukan")
	}

	return map[string]interface{}{
		"id":        id,
		"name":      name,
		"email":     email,
		"role":      role,
		"is_active": isActive,
	}, nil
}