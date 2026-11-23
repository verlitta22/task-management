package main

import (
	"backend/config"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, membaca dari environment system")
	}

	config.ConnectDB()

	adminName := os.Getenv("ADMIN_NAME")
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminName == "" || adminEmail == "" || adminPassword == "" {
		log.Fatal("Error: ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diatur di file .env")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Gagal melakukan hashing password: %v", err)
	}

	var existingID int
	err = config.DB.QueryRow("SELECT id FROM users WHERE email = ?", adminEmail).Scan(&existingID)
	if err == nil {
		log.Fatal("Admin dengan email tersebut sudah terdaftar di database.")
	}

	query := "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'ADMIN', 1)"
	_, err = config.DB.Exec(query, adminName, adminEmail, string(hashedPassword))
	if err != nil {
		log.Fatalf("Gagal membuat admin pertama: %v", err)
	}

	fmt.Println("Seeder Berhasil: Akun ADMIN pertama telah dibuat!")
}