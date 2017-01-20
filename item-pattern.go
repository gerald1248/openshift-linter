package main

import (
	"errors"
	"fmt"
	"regexp"
)

type ItemInvalidName struct {
	name string
}

func (iin *ItemInvalidName) Name() string {
	return iin.name
}

func (iin *ItemInvalidName) Lint(config *Config, params LinterParams) (ResultMap, error) {

	//see item-env for these two getters
	resultEnv, _ := ResultEnv(config, params)
	keysEnv := KeysEnv(resultEnv)

	//name pattern
	resultInvalidName := make(ResultMap)

	reNamespace, err := regexp.Compile(params.NamespacePattern)
	checkNamespace := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	reName, err := regexp.Compile(params.NamePattern)
	checkName := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	reContainer, err := regexp.Compile(params.ContainerPattern)
	checkContainer := err == nil
	if err != nil {
		return nil, errors.New(fmt.Sprintf("%s", err))
	}

	for _, key := range keysEnv {
		item := resultEnv[key]
		for _, spec := range item {
			if checkNamespace == true {
				if reNamespace.FindStringIndex(spec.Namespace) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Namespace, params.NamespacePattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}

			if checkName == true {
				if reName.FindStringIndex(spec.Name) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Name, params.NamePattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}

			if checkContainer == true {
				if reContainer.FindStringIndex(spec.Container) == nil {
					display := fmt.Sprintf("%s !~ /%s/", spec.Container, params.ContainerPattern)
					resultInvalidName[display] = append(resultInvalidName[display], spec)
				}
			}
		}
	}

	return resultInvalidName, nil
}
