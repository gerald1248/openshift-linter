package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
)

func processBytes(bytes []byte, namespacePattern, namePattern, containerPattern, envPattern string) (CombinedResultMap, error) {
	var config Config

	if err := json.Unmarshal(bytes, &config); err != nil {
		return nil, errors.New(fmt.Sprintf("can't unmarshal data: %v", err))
	}

	//for POST req access, pick up custom settings from JSON obj
	if config.CustomNamespacePattern != "" {
		namespacePattern = config.CustomNamespacePattern
	}

	if config.CustomNamePattern != "" {
		namePattern = config.CustomNamePattern
	}

	if config.CustomContainerPattern != "" {
		containerPattern = config.CustomContainerPattern
	}

	if config.CustomEnvPattern != "" {
		envPattern = config.CustomEnvPattern
	}

	//environment variables
	resultEnv := make(ResultMap)
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				for _, envItem := range container.Env {

					//key doesn't exist: create array
					if resultEnv[envItem.Name] == nil {
						var containerSet ContainerSet
						resultEnv[envItem.Name] = containerSet
					}

					resultEnv[envItem.Name] = append(resultEnv[envItem.Name], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}

	//TODO: near match
	var keysEnv []string
	for k, _ := range resultEnv {
		keysEnv = append(keysEnv, k)
	}
	sort.Strings(keysEnv)
	reverseLookup := make(map[string]string)
	resultSimilarKey := make(ResultMap)

	problem := ""
	previous := ""
	current := ""
	for _, item := range keysEnv {
		re := regexp.MustCompile("[_-]")
		simplified := strings.ToLower(re.ReplaceAllString(item, ""))

		if reverseLookup[simplified] != "" {
			previous = reverseLookup[simplified]
			current = item
			problem = fmt.Sprintf("%s ~ %s", current, previous)
			previousItem := resultEnv[previous]
			for _, spec := range previousItem {
				resultSimilarKey[problem] = append(resultSimilarKey[problem], spec)
			}
		} else {
			reverseLookup[simplified] = item
		}
	}

	//name pattern
	resultInvalidName := make(ResultMap)

	reNamespace, err := regexp.Compile(namespacePattern)
	checkNamespace := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	reName, err := regexp.Compile(namePattern)
	checkName := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	reContainer, err := regexp.Compile(containerPattern)
	checkContainer := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	for _, key := range keysEnv {
		item := resultEnv[key]
		for _, spec := range item {
			if checkNamespace == true {
				if reNamespace.FindStringIndex(spec.Namespace) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Namespace, namespacePattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}

			if checkName == true {
				if reName.FindStringIndex(spec.Name) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Name, namePattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}

			if checkContainer == true {
				if reContainer.FindStringIndex(spec.Container) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Container, containerPattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}
		}
	}

	//env pattern
	resultInvalidKey := make(ResultMap)
	reEnv, err := regexp.Compile(envPattern)
	if err == nil {
		for _, key := range keysEnv {
			if reEnv.FindStringIndex(key) == nil {
				item := resultEnv[key]
				displayKey := fmt.Sprintf("%s !~ /%s/", key, envPattern)
				for _, spec := range item {
					resultInvalidKey[displayKey] = append(resultInvalidKey[displayKey], spec)
				}
			}
		}
	} else {
		return nil, errors.New(fmt.Sprintf("can't compile regex %s: %s", envPattern, err))
	}

	//deployment config without/with incomplete limits
	resultLimits := make(ResultMap)
	problem = "" //reset
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.Resources == nil {
					problem = "no_resources"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
					continue
				}
				if container.Resources.Limits == nil || container.Resources.Limits.None() == true {
					problem = "no_limits"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if container.Resources.Limits.Complete() == false {
					problem = "incomplete_limits"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
				if container.Resources.Requests == nil || container.Resources.Requests.None() == true {
					problem = "no_requests"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if container.Resources.Requests.Complete() == false {
					problem = "incomplete_requests"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}

	combined := make(CombinedResultMap)
	combined["similar_key"] = resultSimilarKey
	combined["invalid_key"] = resultInvalidKey
	combined["invalid_name"] = resultInvalidName
	combined["limits"] = resultLimits
	return combined, nil
}
