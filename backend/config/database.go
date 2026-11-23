package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var DB *sql.DB

func ConnectDB() {
	// Muat file .env
	_ = godotenv.Load()

	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	if dbPort == "" {
		dbPort = "3306"
	}
	if dbUser == "" {
		dbUser = "root"
	}
	if dbName == "" {
		dbName = "task_management"
	}

	// 1. Hubungkan ke server MySQL dulu TANPA menyebutkan nama database
	dsnServer := fmt.Sprintf("%s:%s@tcp(%s:%s)/?parseTime=true&allowNativePasswords=true", dbUser, dbPass, dbHost, dbPort)
	tempDB, err := sql.Open("mysql", dsnServer)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi ke server MySQL: %v", err)
	}
	defer tempDB.Close()

	// 2. Buat database secara otomatis jika belum ada di server
	createQuery := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s`;", dbName)
	_, err = tempDB.Exec(createQuery)
	if err != nil {
		log.Fatalf("Gagal membuat database otomatis: %v", err)
	}

	// 3. Buka koneksi utama yang langsung terhubung ke database spesifik
	dsnDatabase := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&allowNativePasswords=true", dbUser, dbPass, dbHost, dbPort, dbName)
	DB, err = sql.Open("mysql", dsnDatabase)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi database: %v", err)
	}

	// 4. Tes ping koneksi
	if err = DB.Ping(); err != nil {
		log.Fatalf("Database tidak merespons: %v", err)
	}

	log.Println("Koneksi database MySQL dan inisialisasi berhasil!")
}