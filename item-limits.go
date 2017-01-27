package main

import "fmt"

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
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
					continue
				}
				limits := container.Resources.Limits
				if limits == nil || limits.None() == true {
					problem = "no limits"
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if limits.Complete() == false {
					problem = "incomplete limits"
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if limits.Valid() == false {
					problem = fmt.Sprintf("invalid limits pair %s (CPU) and %s (Memory)", limits.CPU, limits.Memory)
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}

				requests := container.Resources.Requests
				if requests == nil || requests.None() == true {
					problem = "no requests"
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if requests.Complete() == false {
					problem = "incomplete requests"
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if requests.Valid() == false {
					problem = fmt.Sprintf("invalid requests pair %s (cpu) and %s (memory)", requests.CPU, requests.Memory)
					resultLimits[problem] = append(resultLimits[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultLimits, nil
}
