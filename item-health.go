package main

type ItemHealth struct {
	name string
}

func (ih *ItemHealth) Name() string {
	return ih.name
}

func (is *ItemHealth) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultHealth := make(ResultMap)
	var problem string
	for _, item := range config.Items {

		//nested template with its own `metadata` and `spec` properties?
		if item.Spec != nil && item.Spec.Template != nil {
			for _, container := range item.Spec.Template.Spec.Containers {
				name := container.Name
				if container.LivenessProbe == nil {
					problem = "no liveness probe"
					resultHealth[problem] = append(resultHealth[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if ProbeComplete(container.LivenessProbe) == false {
					problem = "incomplete liveness probe"
					resultHealth[problem] = append(resultHealth[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
				if container.ReadinessProbe == nil {
					problem = "no readiness probe"
					resultHealth[problem] = append(resultHealth[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				} else if ProbeComplete(container.ReadinessProbe) == false {
					problem = "incomplete readiness probe"
					resultHealth[problem] = append(resultHealth[problem], ContainerSpec{item.Metadata.Namespace, item.Metadata.Name, name})
				}
			}
		}
	}
	return resultHealth, nil
}

func ProbeComplete(probe *Probe) bool {
	return probe.TimeoutSeconds > 0 &&
		probe.PeriodSeconds > 0 &&
		probe.SuccessThreshold > 0 &&
		probe.InitialDelaySeconds > 0 &&
		probe.FailureThreshold > 0
}
