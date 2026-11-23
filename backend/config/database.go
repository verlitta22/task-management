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
	_ = godotenv.Load()

	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	if dbPort == "" {
		dbPort = "3306"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", dbUser, dbPass, dbHost, dbPort, dbName)
	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Database tidak merespons: %v", err)
	}

	log.Println("Koneksi database MySQL berhasil!")
}