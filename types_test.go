package main

import "testing"

func TestMetadata(t *testing.T) {
	nameValue := "name"
	namespaceValue := "namespace"
	metadata := Metadata{nameValue, namespaceValue}
	if metadata.Name != nameValue || metadata.Namespace != namespaceValue {
		t.Errorf("faulty struct metadata: %v", metadata)
	}
}
