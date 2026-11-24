package model

import "time"

type Task struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	CategoryID  *int      `json:"category_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	DueDate     *string   `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}