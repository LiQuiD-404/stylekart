// export generates static JSON files from the Excel workbook.
// Run from the backend/ directory: go run ./export
// Output goes to ../dashboard/public/data/
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"stylekart/backend/parser"
)

func main() {
	xlsxPath := os.Getenv("XLSX_PATH")
	if xlsxPath == "" {
		xlsxPath = "../data/StyleKart_Master_Data.xlsx"
	}

	outDir := "../dashboard/public/data"
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		log.Fatal(err)
	}

	inventory, err := parser.ParseInventory(xlsxPath)
	if err != nil {
		log.Fatalf("inventory: %v", err)
	}

	returns, err := parser.ParseReturns(xlsxPath, inventory)
	if err != nil {
		log.Fatalf("returns: %v", err)
	}

	mapping, err := parser.ParseMapping(xlsxPath)
	if err != nil {
		log.Fatalf("mapping: %v", err)
	}

	sales, err := parser.ParseSales(xlsxPath)
	if err != nil {
		log.Fatalf("sales: %v", err)
	}

	write := func(name string, data any) {
		b, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			log.Fatalf("marshal %s: %v", name, err)
		}
		path := fmt.Sprintf("%s/%s.json", outDir, name)
		if err := os.WriteFile(path, b, 0o644); err != nil {
			log.Fatalf("write %s: %v", name, err)
		}
		log.Printf("wrote %s (%d items, %d bytes)", path, countItems(data), len(b))
	}

	write("inventory", inventory)
	write("returns", returns)
	write("mapping", mapping)
	write("sales", sales)

	log.Println("export complete")
}

func countItems(data any) int {
	switch v := data.(type) {
	case []parser.InventoryItem:
		return len(v)
	case []parser.ReturnItem:
		return len(v)
	case []parser.MappingEntry:
		return len(v)
	case []parser.SalesPoint:
		return len(v)
	}
	return 0
}
