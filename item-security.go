package main

type ItemSecurity struct {
	name string
}

func (is *ItemSecurity) Name() string {
	return is.name
}

func (is *ItemSecurity) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultSecurity := make(ResultMap)
	problem := "privileged"
	for _, item := range config.Items {
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.SecurityContext != nil {
					if container.SecurityContext.Privileged == true {
						resultSecurity[problem] = append(resultSecurity[problem],
							ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
					}
				}
			}
		}
	}
	return resultSecurity, nil
}
