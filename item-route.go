package main

import "fmt"

type ItemRouteConflict struct {
	name, description, kind string
}

func (irc *ItemRouteConflict) Name() string {
	return irc.name
}

func (irc *ItemRouteConflict) Description() string {
	return irc.description
}

func (irc *ItemRouteConflict) Kind() string {
	return irc.kind
}

func (irc *ItemRouteConflict) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultRouteConflict := make(ResultMap)

	//populate map with key spec.host and value metadata.name
	//only one route (metadata.name) should resolve to a given FQDN stored in spec.host
	routeMap := make(map[string]string)

	var key, value string
	for _, item := range config.Items {
		if item.Kind != irc.Kind() {
			continue
		}

		if item.Metadata != nil && item.Spec != nil {
			//skip if host or targetPort field not present
			if item.Spec.Host == "" {
				continue
			}

			namespace := item.Metadata.Namespace

			key = item.Spec.Host + item.Spec.Path
			value = item.Metadata.Name

			if len(routeMap[key]) > 0 && routeMap[key] != value {
				problem := fmt.Sprintf("Route to '%s' defined twice: '%s' and '%s'", key, routeMap[key], value)
				if len(namespace) > 0 {
					problem += fmt.Sprintf(" (namespace '%s')", namespace)
				}
				resultRouteConflict[problem] = append(resultRouteConflict[problem], ContainerSpec{"", "", ""})
			} else {
				routeMap[key] = value
			}
		}
	}
	return resultRouteConflict, nil
}
