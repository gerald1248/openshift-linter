package main

import (
	"fmt"
	"sort"
)

func Items() []LinterItem {

	items := []LinterItem{&ItemInvalidKey{"env name invalid", "env name doesn't match predefined regex"},
		&ItemSimilarKey{"env name collision", "near-identical env names"},
		&ItemInvalidName{"name invalid", "namespace, name or container doesn't match predefined regex"},
		&ItemHealth{"health", "health check missing or incomplete"},
		&ItemImagePullPolicy{"image pull policy", "policy 'Always' or ':latest' image specified"},
		&ItemLimits{"limits", "resource limits missing, incomplete or invalid"},
		&ItemSecurity{"security", "privileged security context"}}

	return items
}

func ListLinterItems() {
	items := Items()
	itemNames := make([]string, len(items))
	m := make(map[string]string)
	for index, item := range items {
		name := item.Name()
		itemNames[index] = name
		m[name] = item.Description()
	}
	sort.Strings(itemNames)

	rows := make([][]string, len(itemNames)+1)
	rows[0] = []string{"Item", "Description"}

	for index, name := range itemNames {
		rows[index+1] = []string{name, m[name]}
	}

	fmt.Println(markdownTable(&rows))
}
