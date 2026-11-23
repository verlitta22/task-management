package main

import (
	"backend/config"
	"backend/routes"
	"log"
	"os"
)

func main() {
	config.ConnectDB()

	r := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server berjalan di port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}