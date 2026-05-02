package parser

import (
	"math"

	"github.com/xuri/excelize/v2"
)

type SalesPoint struct {
	Month          string `json:"month"`
	ShopifyRevenue int    `json:"shopifyRevenue"`
	MyntraRevenue  int    `json:"myntraRevenue"`
	AjioRevenue    int    `json:"ajioRevenue"`
	TotalRevenue   int    `json:"totalRevenue"`
	ShopifyOrders  int    `json:"shopifyOrders"`
	MyntraOrders   int    `json:"myntraOrders"`
	AjioOrders     int    `json:"ajioOrders"`
	TotalOrders    int    `json:"totalOrders"`
	AvgOrderValue  int    `json:"avgOrderValue"`
}

func ParseSales(xlsxPath string) ([]SalesPoint, error) {
	f, err := excelize.OpenFile(xlsxPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	rows, err := f.GetRows("Sales_Dashboard")
	if err != nil {
		return nil, err
	}

	var points []SalesPoint
	for i, row := range rows {
		if i == 0 || len(row) < 9 || safeGet(row, 0) == "" {
			continue
		}

		totalRev := parseIntVal(safeGet(row, 4))
		totalOrders := parseIntVal(safeGet(row, 8))

		aov := 0
		if rawAOV := safeGet(row, 9); rawAOV != "" {
			aov = parseIntVal(rawAOV)
		} else if totalOrders > 0 {
			aov = int(math.Round(float64(totalRev) / float64(totalOrders)))
		}

		points = append(points, SalesPoint{
			Month:          safeGet(row, 0),
			ShopifyRevenue: parseIntVal(safeGet(row, 1)),
			MyntraRevenue:  parseIntVal(safeGet(row, 2)),
			AjioRevenue:    parseIntVal(safeGet(row, 3)),
			TotalRevenue:   totalRev,
			ShopifyOrders:  parseIntVal(safeGet(row, 5)),
			MyntraOrders:   parseIntVal(safeGet(row, 6)),
			AjioOrders:     parseIntVal(safeGet(row, 7)),
			TotalOrders:    totalOrders,
			AvgOrderValue:  aov,
		})
	}
	return points, nil
}

func parseIntVal(s string) int {
	if p := parseIntPtr(s); p != nil {
		return *p
	}
	return 0
}
