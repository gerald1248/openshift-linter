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
