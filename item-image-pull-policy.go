package main

type ItemImagePullPolicy struct {
	name string
}

func (iipp *ItemImagePullPolicy) Name() string {
	return iipp.name
}

func (iipp *ItemImagePullPolicy) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultImagePullPolicy := make(ResultMap)
	problem := "always"
	for _, item := range config.Items {
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.ImagePullPolicy == "Always" {
					if resultImagePullPolicy[problem] == nil {
						var containerSet ContainerSet
						resultImagePullPolicy[problem] = containerSet
					}
					resultImagePullPolicy[problem] = append(resultImagePullPolicy[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultImagePullPolicy, nil
}
