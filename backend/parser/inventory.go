package parser

import (
	"math"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

const oversellBuffer = 0.10 // 10% safety buffer applied to warehouse stock

type InventoryItem struct {
	SKU               string         `json:"sku"`
	Name              string         `json:"name"`
	Warehouse         *int           `json:"warehouse"`          // actual physical stock
	EffectiveWarehouse *int          `json:"effectiveWarehouse"` // warehouse × (1 - buffer)
	Shopify           *int           `json:"shopify"`
	Myntra            *int           `json:"myntra"`
	Ajio              *int           `json:"ajio"`
	Delta             int            `json:"delta"`
	WorstPlatform     *string        `json:"worstPlatform"`
	WorstDelta        int            `json:"worstDelta"`
	PlatformDeltas    map[string]int `json:"platformDeltas"`
	Risk              string         `json:"risk"`
	LastSync          *string        `json:"lastSync"`
	MappingStatus     string         `json:"mappingStatus"` // "Mapped" | "Partial" | "Unmapped" | "Unknown"
	WHCode            *string        `json:"whCode"`
	MyntraCode        *string        `json:"myntraCode"`
	Discontinued      bool           `json:"discontinued"`
}

type skuMapping struct {
	status     string
	whCode     string
	myntraCode string
}

func loadProductMaster(f *excelize.File) map[string]bool {
	rows, err := f.GetRows("Product_Master")
	if err != nil {
		return nil
	}
	m := make(map[string]bool, len(rows))
	for i, row := range rows {
		if i == 0 || len(row) < 10 {
			continue
		}
		sku := strings.TrimSpace(row[0])
		if sku == "" {
			continue
		}
		m[sku] = strings.EqualFold(strings.TrimSpace(row[9]), "discontinued")
	}
	return m
}

func loadSKUMapping(f *excelize.File) map[string]skuMapping {
	rows, err := f.GetRows("SKU_Mapping")
	if err != nil {
		return nil
	}
	m := make(map[string]skuMapping, len(rows))
	for i, row := range rows {
		if i == 0 || len(row) < 1 || strings.TrimSpace(row[0]) == "" {
			continue
		}
		sk := strings.TrimSpace(row[0])
		m[sk] = skuMapping{
			whCode:     safeGet(row, 1),
			myntraCode: safeGet(row, 2),
			// row[3] = Ajio code — always empty per data audit
			status: safeGet(row, 5),
		}
	}
	return m
}

func ParseInventory(xlsxPath string) ([]InventoryItem, error) {
	f, err := excelize.OpenFile(xlsxPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	skuMap := loadSKUMapping(f)
	productMaster := loadProductMaster(f)

	rows, err := f.GetRows("Inventory_Live")
	if err != nil {
		return nil, err
	}

	var items []InventoryItem
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 6 || strings.TrimSpace(row[0]) == "" {
			continue
		}

		sku := strings.TrimSpace(row[0])
		item := InventoryItem{
			SKU:            sku,
			Name:           safeGet(row, 1),
			Warehouse:      parseIntPtr(safeGet(row, 2)),
			Shopify:        parseIntPtr(safeGet(row, 3)),
			Myntra:         parseIntPtr(safeGet(row, 4)),
			Ajio:           parseIntPtr(safeGet(row, 5)),
			PlatformDeltas: map[string]int{},
			MappingStatus:  "Unknown",
		}

		// Attach discontinued status from Product_Master
		if productMaster != nil {
			item.Discontinued = productMaster[sku]
		}

		// Attach SKU mapping metadata
		if mapping, ok := skuMap[sku]; ok {
			item.MappingStatus = mapping.status
			if mapping.whCode != "" {
				item.WHCode = &mapping.whCode
			}
			if mapping.myntraCode != "" {
				item.MyntraCode = &mapping.myntraCode
			}
		}

		// Last sync: column 7 (index 7)
		if ls := safeGet(row, 7); ls != "" {
			formatted := formatExcelDate(ls)
			item.LastSync = &formatted
		}

		// Compute warehouse-relative deltas using buffered stock
		// effectiveWH = warehouse × (1 - oversellBuffer) — deltas exceeding 0 mean
		// the platform is already selling into the safety cushion
		if item.Warehouse != nil {
			wh := *item.Warehouse
			effectiveWH := int(math.Round(float64(wh) * (1 - oversellBuffer)))
			item.EffectiveWarehouse = &effectiveWH

			platforms := []struct {
				name string
				val  *int
			}{
				{"Shopify", item.Shopify},
				{"Myntra", item.Myntra},
				{"Ajio", item.Ajio},
			}
			for _, p := range platforms {
				if p.val != nil {
					item.PlatformDeltas[p.name] = *p.val - effectiveWH
				}
			}
		}

		// Surface worst offender: oversell takes priority over undersell
		worstDelta, worstPlatform := worstOffender(item.PlatformDeltas)
		item.WorstDelta = worstDelta
		if worstPlatform != "" {
			item.WorstPlatform = &worstPlatform
		}
		item.Delta = abs(worstDelta)

		// Risk driven only by oversell (platform > warehouse)
		oversellDelta := 0
		if worstDelta > 0 {
			oversellDelta = worstDelta
		}
		item.Risk = riskLevel(oversellDelta)

		items = append(items, item)
	}
	return items, nil
}

// worstOffender returns the signed delta and platform name.
// Oversell (positive delta) takes priority over undersell.
func worstOffender(deltas map[string]int) (int, string) {
	var bestOverPlatform string
	bestOverDelta := 0
	var bestUnderPlatform string
	bestUnderDelta := 0

	for platform, d := range deltas {
		if d > bestOverDelta {
			bestOverDelta = d
			bestOverPlatform = platform
		}
		if d < bestUnderDelta {
			bestUnderDelta = d
			bestUnderPlatform = platform
		}
	}

	if bestOverPlatform != "" {
		return bestOverDelta, bestOverPlatform
	}
	if bestUnderPlatform != "" {
		return bestUnderDelta, bestUnderPlatform
	}
	return 0, ""
}

func riskLevel(oversellDelta int) string {
	switch {
	case oversellDelta > 10:
		return "red"
	case oversellDelta > 2:
		return "amber"
	default:
		return "green"
	}
}

func parseIntPtr(s string) *int {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	// excelize may return floats for numeric cells
	if f, err := strconv.ParseFloat(s, 64); err == nil {
		v := int(math.Round(f))
		return &v
	}
	return nil
}

func safeGet(row []string, idx int) string {
	if idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// formatExcelDate converts an Excel serial date string or ISO string to "DD Mon YYYY".
func formatExcelDate(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// Try parsing as Excel serial number
	if serial, err := strconv.ParseFloat(s, 64); err == nil {
		t, err := excelize.ExcelDateToTime(serial, false)
		if err == nil {
			return t.Format("02 Jan 2006")
		}
	}
	// Already a formatted string — return as-is
	return s
}
