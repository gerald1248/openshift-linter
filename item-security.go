package main

func ItemSecurity(config *Config, params LinterParams) (ResultMap, error) {
	resultSecurity := make(ResultMap)
	problem := "privileged"
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.SecurityContext != nil {
					if container.SecurityContext.Privileged == true {
						var containerSet ContainerSet
						resultSecurity[problem] = containerSet
					}
					resultSecurity[problem] = append(resultSecurity[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultSecurity, nil
}
