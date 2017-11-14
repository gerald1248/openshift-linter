package main

import (
	"testing"
)

func TestPreflightAsset(t *testing.T) {
	//byte slices
	invalidUtf8 := []byte{0xff, 0xfe, 0xfd}
	//xmlMarkup := []byte("<?xml version='1.0' encoding='UTF-8' standalone='yes'?><root/>")
	validJson := []byte("{ \"foo\": [\"bar\", \"barfoo\"] }")
	invalidJson := []byte("{ \"foo\": [\"bar\", \"barfoo\"] } foo")
	validYaml := []byte("\"foo\": \"bar\"")
	invalidYaml := []byte("\"foo\":foo:bar: \"bar\"")
	multilineYaml := []byte(`"foo":
- "bar"
- "foobar"
- "boofar"
- "roobar"
`)
	multilineYamlConverted := []byte("{\"foo\":[\"bar\",\"foobar\",\"boofar\",\"roobar\"]}")

	//expect error
	err := preflightAsset(&invalidUtf8)
	if err == nil {
		t.Error("Must reject invalid UTF8")
	}

	err = preflightAsset(&invalidJson)
	if err == nil {
		t.Error("Must reject invalid JSON")
	}

	err = preflightAsset(&invalidYaml)
	if err == nil {
		t.Error("Must reject invalid YAML")
	}

  /*
	err = preflightAsset(&xmlMarkup)
	if err == nil {
		t.Error("Must reject XML markup")
	}
  */

	//expect success
	err = preflightAsset(&validYaml)
	if err != nil {
		t.Errorf("Must accept valid YAML: %v", err)
	}

	err = preflightAsset(&validJson)
	if err != nil {
		t.Errorf("Must accept valid JSON: %v", err)
	}

	//in-place conversion must match predefined result
	err = preflightAsset(&multilineYaml)
	if err != nil {
		t.Errorf("Must accept valid multiline YAML: %v", err)
	}
	if string(multilineYaml) != string(multilineYamlConverted) {
		t.Errorf("Expected %s to match %s", multilineYaml, multilineYamlConverted)
	}
}
