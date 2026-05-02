package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"stylekart/backend/parser"
)

func main() {
	xlsxPath := os.Getenv("XLSX_PATH")
	if xlsxPath == "" {
		xlsxPath = "../context/StyleKart_Master_Data.xlsx"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4444"
	}

	inventory, err := parser.ParseInventory(xlsxPath)
	if err != nil {
		log.Fatalf("failed to parse inventory: %v", err)
	}

	returns, err := parser.ParseReturns(xlsxPath, inventory)
	if err != nil {
		log.Fatalf("failed to parse returns: %v", err)
	}

	mapping, err := parser.ParseMapping(xlsxPath)
	if err != nil {
		log.Fatalf("failed to parse mapping: %v", err)
	}

	sales, err := parser.ParseSales(xlsxPath)
	if err != nil {
		log.Fatalf("failed to parse sales: %v", err)
	}

	log.Printf("Loaded %d inventory SKUs, %d return products, %d mapping entries, %d sales months", len(inventory), len(returns), len(mapping), len(sales))

	mux := http.NewServeMux()
	mux.HandleFunc("/api/inventory", withCORS(jsonHandler(inventory)))
	mux.HandleFunc("/api/returns", withCORS(jsonHandler(returns)))
	mux.HandleFunc("/api/mapping", withCORS(jsonHandler(mapping)))
	mux.HandleFunc("/api/sales", withCORS(jsonHandler(sales)))
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	log.Printf("StyleKart backend listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func jsonHandler(data any) http.HandlerFunc {
	payload, err := json.Marshal(data)
	if err != nil {
		log.Fatalf("failed to marshal data: %v", err)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(payload)
	}
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}
