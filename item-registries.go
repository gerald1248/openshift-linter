package main

import (
	"regexp"
)

type ItemRegistries struct {
	name, description, kind string
}

func (ir *ItemRegistries) Name() string {
	return ir.name
}

func (ir *ItemRegistries) Description() string {
	return ir.description
}

func (ir *ItemRegistries) Kind() string {
	return ir.kind
}

func (ir *ItemRegistries) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultRegistries := make(ResultMap)
	problem := "not whitelisted"
	re := regexp.MustCompile(params.WhitelistRegistriesPattern)

	for _, item := range config.Items {
		if item.Kind != ir.Kind() {
			continue
		}
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if re.FindStringIndex(container.Image) == nil {
					resultRegistries[problem] = append(resultRegistries[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultRegistries, nil
}
