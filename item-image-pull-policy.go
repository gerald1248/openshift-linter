package main

import "strings"

type ItemImagePullPolicy struct {
	name, description string
}

func (iipp *ItemImagePullPolicy) Name() string {
	return iipp.name
}

func (iipp *ItemImagePullPolicy) Description() string {
	return iipp.description
}

func (iipp *ItemImagePullPolicy) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultImagePullPolicy := make(ResultMap)
	var problem string
	for _, item := range config.Items {
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.ImagePullPolicy == "Always" {
					problem = "always"
					resultImagePullPolicy[problem] = append(resultImagePullPolicy[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
				if strings.HasSuffix(container.Image, ":latest") {
					problem = "latest"
					resultImagePullPolicy[problem] = append(resultImagePullPolicy[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultImagePullPolicy, nil
}
