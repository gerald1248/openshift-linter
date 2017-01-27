package main

import "testing"

func TestMetadata(t *testing.T) {
	nameValue := "name"
	namespaceValue := "namespace"
	metadata := Metadata{nil, nameValue, namespaceValue} //set labels map[string]string to nil
	if metadata.Name != nameValue || metadata.Namespace != namespaceValue {
		t.Errorf("faulty struct metadata: %v", metadata)
	}
}

func TestResourceConstraint(t *testing.T) {
	validConstraint := &ResourceConstraint{"200m", "1000Mi"}
	invalidConstraint := &ResourceConstraint{"1000Mi", "200m"}
	incompleteConstraint := &ResourceConstraint{"1000Mi", ""}

	if validConstraint.Valid() == false {
		t.Errorf("must accept valid constraint: %v", validConstraint)
	}

	if invalidConstraint.Valid() == true {
		t.Errorf("must reject invalid constraint: %v", invalidConstraint)
	}

	if incompleteConstraint.Complete() == true {
		t.Errorf("must not accept incomplete constraint: %v", incompleteConstraint)
	}
}
