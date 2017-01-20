package main

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
