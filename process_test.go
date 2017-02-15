package main

import (
	"testing"
)

func TestProcessFile(t *testing.T) {
	invalidPath := "/non/existent/file.yaml"
	params := LinterParams{"", "", "", "", "", "", "", "json"}
	_, err := processFile(invalidPath, params)

	if err == nil {
		t.Errorf("Must reject invalid path %s", invalidPath)
	}
}

func TestProcessBytes(t *testing.T) {
	//don't allow XML
	xmlBuffer := []byte(`<?xml version="1.0" encoding="UTF-8" standalone="true"?><root/>`)
	params := LinterParams{"", "", "", "", "", "", "", "xml"}
	_, err := processBytes(xmlBuffer, params)

	if err == nil {
		t.Errorf("Must reject XML input")
	}
}
