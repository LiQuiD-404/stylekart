package parser

import (
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ReturnItem struct {
	SKU              string         `json:"sku"`
	Name             string         `json:"name"`
	ReturnCount      int            `json:"returnCount"`
	SellableCount    int            `json:"sellableCount"`
	NonSellableCount int            `json:"nonSellableCount"`
	UnknownCount     int            `json:"unknownCount"`
	SellablePct      float64        `json:"sellablePct"`
	NonSellablePct   float64        `json:"nonSellablePct"`
	ReturnRate       float64        `json:"returnRate"`
	Band             string         `json:"band"`
	TopReason        string         `json:"topReason"`
	Platforms        map[string]int `json:"platforms"`
	RefundTotal      int            `json:"refundTotal"`
}

type returnAgg struct {
	name         string
	count        int
	sellable     int
	nonSellable  int
	reasons      map[string]int
	platforms    map[string]int
	refundTotal  float64
}

func ParseReturns(xlsxPath string, inventory []InventoryItem) ([]ReturnItem, error) {
	f, err := excelize.OpenFile(xlsxPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	rows, err := f.GetRows("Returns_Feb")
	if err != nil {
		return nil, err
	}

	whBySKU := map[string]int{}
	for _, item := range inventory {
		if item.Warehouse != nil {
			whBySKU[item.SKU] = *item.Warehouse
		}
	}

	agg := map[string]*returnAgg{}

	for i, row := range rows {
		if i == 0 || len(row) < 5 || strings.TrimSpace(safeGet(row, 0)) == "" {
			continue
		}
		platform    := safeGet(row, 1)
		skCode      := safeGet(row, 3)
		productName := safeGet(row, 4)
		reason      := safeGet(row, 5)
		refundStr   := safeGet(row, 9)
		condition   := strings.ToLower(strings.TrimSpace(safeGet(row, 10)))

		key := skCode
		if key == "" {
			key = "NSKU_" + productName
		}

		if _, ok := agg[key]; !ok {
			agg[key] = &returnAgg{
				name:      productName,
				reasons:   map[string]int{},
				platforms: map[string]int{},
			}
		}

		a := agg[key]
		a.count++

		switch {
		case strings.Contains(condition, "non"):
			a.nonSellable++
		case strings.Contains(condition, "sell"):
			a.sellable++
		// blank / unknown — counted but not classified
		}

		if reason != "" {
			a.reasons[reason]++
		}
		if platform != "" {
			a.platforms[platform]++
		}
		if fv, err := strconv.ParseFloat(refundStr, 64); err == nil {
			a.refundTotal += fv
		}
	}

	const defaultWarehouse = 25

	var items []ReturnItem
	for sku, a := range agg {
		wh, ok := whBySKU[sku]
		if !ok || wh == 0 {
			wh = defaultWarehouse
		}

		rate := math.Min((float64(a.count)/float64(wh))*100, 95.0)
		rate  = math.Round(rate*10) / 10

		band := "green"
		if rate > 30 {
			band = "red"
		} else if rate >= 15 {
			band = "amber"
		}

		unknown := a.count - a.sellable - a.nonSellable

		// Percentages of total returns (not of total dispatched)
		sellablePct    := 0.0
		nonSellablePct := 0.0
		if a.count > 0 {
			sellablePct    = math.Round((float64(a.sellable)/float64(a.count))*100*10) / 10
			nonSellablePct = math.Round((float64(a.nonSellable)/float64(a.count))*100*10) / 10
		}

		items = append(items, ReturnItem{
			SKU:              sku,
			Name:             a.name,
			ReturnCount:      a.count,
			SellableCount:    a.sellable,
			NonSellableCount: a.nonSellable,
			UnknownCount:     unknown,
			SellablePct:      sellablePct,
			NonSellablePct:   nonSellablePct,
			ReturnRate:       rate,
			Band:             band,
			TopReason:        topKey(a.reasons),
			Platforms:        a.platforms,
			RefundTotal:      int(math.Round(a.refundTotal)),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].ReturnRate > items[j].ReturnRate
	})
	return items, nil
}

func topKey(m map[string]int) string {
	best := ""
	bestVal := 0
	for k, v := range m {
		if v > bestVal {
			bestVal = v
			best = k
		}
	}
	return best
}
