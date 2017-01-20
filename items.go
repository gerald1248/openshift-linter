package main

import (
	"fmt"
	"sort"
)

func Items() []LinterItem {

	items := []LinterItem{&ItemInvalidKey{"invalid key"},
		&ItemSimilarKey{"similar key"},
		&ItemInvalidName{"invalid name"},
		&ItemHealth{"health"},
		&ItemImagePullPolicy{"image pull policy"},
		&ItemLimits{"limits"},
		&ItemSecurity{"security"}}

	return items
}

func ListLinterItems() {
	items := Items()
	itemNames := make([]string, len(items))
	for index, item := range items {
		itemNames[index] = item.Name()
	}
	sort.Strings(itemNames)
	for _, name := range itemNames {
		fmt.Println(name)
	}
}
