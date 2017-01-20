package main

func ItemImagePullPolicy(config *Config, params LinterParams) (ResultMap, error) {
	resultImagePullPolicy := make(ResultMap)
	problem := "image pull policy always"
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
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
