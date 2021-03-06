package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/ghodss/yaml"
	"io/ioutil"
)

func processBytes(bytes []byte, params LinterParams) (CombinedResultMap, error) {

	//preflight with optional conversion from YAMLs
	err := preflightAsset(&bytes)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("input failed preflight check: %v", err))
	}

	//make sure config objects are presented as a list
	err = makeList(&bytes)
	if err != nil {
		return nil, err
	}

	var config Config

	if err = json.Unmarshal(bytes, &config); err != nil {
		return nil, errors.New(fmt.Sprintf("can't unmarshal data: %v", err))
	}

	//objects of type "Template" have "objects" not "items"
	//standardize on "items"
	if len(config.Objects) > 0 && len(config.Items) == 0 {
		config.Items = config.Objects //copy pointer
	}

	//for POST req access, pick up custom settings from JSON obj
	if config.CustomNamespacePattern != "" {
		params.NamespacePattern = config.CustomNamespacePattern
	}

	if config.CustomNamePattern != "" {
		params.NamePattern = config.CustomNamePattern
	}

	if config.CustomContainerPattern != "" {
		params.ContainerPattern = config.CustomContainerPattern
	}

	if config.CustomEnvPattern != "" {
		params.EnvPattern = config.CustomEnvPattern
	}

	combined := make(CombinedResultMap)

	items := ItemsFiltered(params.CheckPattern)
	if items == nil {
		return nil, errors.New("no checks selected")
	}

	for _, item := range items {
		result, err := item.Lint(&config, params)
		if err != nil {
			return nil, err
		}

		err = postprocessResult(&result, params)
		if err != nil {
			return nil, err
		}

		combined[item.Name()] = result
	}

	combined["summary"] = summary(&config, &combined, params)

	return combined, nil
}

func processFile(path string, params LinterParams) (string, error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return "", errors.New(fmt.Sprintf("can't read %s: %v", path, err))
	}

	combinedResultMap, err := processBytes(bytes, params)

	if err != nil {
		return "", errors.New(fmt.Sprintf("can't process %s: %s", path, err))
	}

	return assembleOutput(combinedResultMap, params.Output)
}

func assembleOutput(combinedResultMap CombinedResultMap, output string) (string, error) {
	switch output {
	case "json":
		json, err := json.MarshalIndent(combinedResultMap, "", "  ")

		if err != nil {
			return "", errors.New(fmt.Sprintf("can't marshal JSON %v", combinedResultMap))
		}

		return string(json), nil
	case "yaml":
		yaml, err := yaml.Marshal(combinedResultMap)

		if err != nil {
			return "", errors.New(fmt.Sprintf("can't marshal YAML %v", combinedResultMap))
		}

		return string(yaml), nil
	case "md":
		return markdown(&combinedResultMap)
	}
	return "", errors.New(fmt.Sprintf("unsupported output format %s", output))
}
