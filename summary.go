package main

func summary(config *Config, combined *CombinedResultMap) ResultMap {
	all := make(ResultMap)
	var allKeys []string
	for _, item := range config.Items {
		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name

				var key string
				key = item.Metadata.Namespace + item.Metadata.Name + name
				all[key] = append(all[key], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				allKeys = append(allKeys, key)
			}
		}
	}

	err := make(map[string]int)
	for _, result := range *combined {
		for _, set := range result {
			for _, spec := range set {
				key := spec.Namespace + spec.Name + spec.Container
				err[key]++
			}
		}
	}

	//now populate summary map
	summary := make(ResultMap)
	for _, key := range allKeys {
		switch err[key] {
		case 0:
			summary["g"] = append(summary["g"], all[key]...)
		case 1:
			summary["ga"] = append(summary["ga"], all[key]...)
		case 2:
			summary["a"] = append(summary["a"], all[key]...)
		case 3:
			summary["ar"] = append(summary["ar"], all[key]...)
		default:
			summary["r"] = append(summary["r"], all[key]...)
		}
	}

	return summary
}
