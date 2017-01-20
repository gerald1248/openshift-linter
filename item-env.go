package main

import (
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
)

//similar key linter
type ItemSimilarKey struct {
	name string
}

func (isk *ItemSimilarKey) Name() string {
	return isk.name
}

func (isk *ItemSimilarKey) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultEnv, _ := ResultEnv(config, params)

	keysEnv := KeysEnv(resultEnv)

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
	return resultSimilarKey, nil
}

//invalid key linter
type ItemInvalidKey struct {
	name string
}

func (iik *ItemInvalidKey) Name() string {
	return iik.name
}

func (iik *ItemInvalidKey) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultEnv, _ := ResultEnv(config, params)

	keysEnv := KeysEnv(resultEnv)

	resultInvalidKey := make(ResultMap)
	reEnv, err := regexp.Compile(params.EnvPattern)
	if err == nil {
		for _, key := range keysEnv {
			if reEnv.FindStringIndex(key) == nil {
				item := resultEnv[key]
				displayKey := fmt.Sprintf("%s !~ /%s/", key, params.EnvPattern)
				for _, spec := range item {
					resultInvalidKey[displayKey] = append(resultInvalidKey[displayKey], spec)
				}
			}
		}
	} else {
		return nil, errors.New(fmt.Sprintf("can't compile regex %s: %s", params.EnvPattern, err))
	}
	return resultInvalidKey, nil
}

//util
func ResultEnv(config *Config, params LinterParams) (ResultMap, error) {
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
	return resultEnv, nil
}

func KeysEnv(resultEnv ResultMap) []string {
	var keysEnv []string
	for k, _ := range resultEnv {
		keysEnv = append(keysEnv, k)
	}
	sort.Strings(keysEnv)

	return keysEnv
}
