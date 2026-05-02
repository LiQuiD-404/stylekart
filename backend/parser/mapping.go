package parser

import "github.com/xuri/excelize/v2"

type MappingEntry struct {
	SKCode      string  `json:"skCode"`
	WHCode      *string `json:"whCode"`
	MyntraCode  *string `json:"myntraCode"`
	AjioCode    *string `json:"ajioCode"` // always nil in current data
	ProductName string  `json:"productName"`
	Status      string  `json:"status"`
}

func ParseMapping(xlsxPath string) ([]MappingEntry, error) {
	f, err := excelize.OpenFile(xlsxPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	rows, err := f.GetRows("SKU_Mapping")
	if err != nil {
		return nil, err
	}

	var entries []MappingEntry
	for i, row := range rows {
		if i == 0 || len(row) < 1 || safeGet(row, 0) == "" {
			continue
		}
		e := MappingEntry{
			SKCode:      safeGet(row, 0),
			ProductName: safeGet(row, 4),
			Status:      safeGet(row, 5),
		}
		if v := safeGet(row, 1); v != "" {
			e.WHCode = &v
		}
		if v := safeGet(row, 2); v != "" {
			e.MyntraCode = &v
		}
		if v := safeGet(row, 3); v != "" {
			e.AjioCode = &v
		}
		entries = append(entries, e)
	}
	return entries, nil
}
