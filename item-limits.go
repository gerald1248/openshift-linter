package main

type ItemLimits struct {
	name string
}

func (il *ItemLimits) Name() string {
	return il.name
}

func (il *ItemLimits) Lint(config *Config, params LinterParams) (ResultMap, error) {
	//deployment config without/with incomplete limits
	resultLimits := make(ResultMap)
	var problem string
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.Resources == nil {
					problem = "no resources"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
					continue
				}
				if container.Resources.Limits == nil || container.Resources.Limits.None() == true {
					problem = "no limits"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if container.Resources.Limits.Complete() == false {
					problem = "incomplete limits"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
				if container.Resources.Requests == nil || container.Resources.Requests.None() == true {
					problem = "no requests"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if container.Resources.Requests.Complete() == false {
					problem = "incomplete requests"
					if resultLimits[problem] == nil {
						var containerSet ContainerSet
						resultLimits[problem] = containerSet
					}
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultLimits, nil
}
