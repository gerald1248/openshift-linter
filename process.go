package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
)

func processBytes(bytes []byte, params LinterParams) (CombinedResultMap, error) {
	var config Config

	if err := json.Unmarshal(bytes, &config); err != nil {
		return nil, errors.New(fmt.Sprintf("can't unmarshal data: %v", err))
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

	//run items
	//TODO: livenessProbe, readinessProbe, privileged securityContext
	resultSimilarKey, err := ItemSimilarKey(&config, params)
	if err != nil {
		return nil, err
	}
	resultInvalidKey, err := ItemInvalidKey(&config, params)
	if err != nil {
		return nil, err
	}
	resultInvalidName, err := ItemInvalidName(&config, params)
	if err != nil {
		return nil, err
	}
	resultLimits, err := ItemLimits(&config, params)
	if err != nil {
		return nil, err
	}
	resultImagePullPolicy, err := ItemImagePullPolicy(&config, params)
	if err != nil {
		return nil, err
	}
	resultHealth, err := ItemHealth(&config, params)
	if err != nil {
		return nil, err
	}
	resultSecurity, err := ItemSecurity(&config, params)
	if err != nil {
		return nil, err
	}

	combined := make(CombinedResultMap)
	combined["similar key"] = resultSimilarKey
	combined["invalid key"] = resultInvalidKey
	combined["invalid name"] = resultInvalidName
	combined["limits"] = resultLimits
	combined["image pull policy"] = resultImagePullPolicy
	combined["health"] = resultHealth
	combined["security"] = resultSecurity

	return combined, nil
}

func processFile(path string, params LinterParams) (string, int) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return fmt.Sprintf("can't read %s", path), 1
	}

	//preflight with optional conversion from YAMLs
	err = preflightAsset(&bytes, path)
	if err != nil {
		return fmt.Sprintf("%s failed preflight check: %v", path, err), 1
	}

	combinedResultMap, err := processBytes(bytes, params)

	if err != nil {
		return fmt.Sprintf("can't process %s: %s", path, err), 1
	}

	json, err := json.MarshalIndent(combinedResultMap, "", "  ")

	if err != nil {
		return fmt.Sprintf("can't marshal JSON %v", combinedResultMap), 1
	}

	return string(json), 0
}
