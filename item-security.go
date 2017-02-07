package main

type ItemSecurity struct {
	name, description, kind string
}

func (is *ItemSecurity) Name() string {
	return is.name
}

func (is *ItemSecurity) Description() string {
	return is.description
}

func (is *ItemSecurity) Kind() string {
	return is.kind
}

func (is *ItemSecurity) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultSecurity := make(ResultMap)
	problem := "privileged"
	for _, item := range config.Items {
		if item.Kind != is.Kind() {
			continue
		}

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
