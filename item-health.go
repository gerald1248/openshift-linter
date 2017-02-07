package main

type ItemHealth struct {
	name, description, kind string
}

func (ih *ItemHealth) Name() string {
	return ih.name
}

func (ih *ItemHealth) Description() string {
	return ih.description
}

func (ih *ItemHealth) Kind() string {
	return ih.kind
}

func (is *ItemHealth) Lint(config *Config, params LinterParams) (ResultMap, error) {
	resultHealth := make(ResultMap)
	var problem string
	for _, item := range config.Items {
		if item.Kind != is.Kind() {
			continue
		}
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
	var count int

	//set the bar low to avoid OpenShift version hassle: one value will do
	var a = []int{probe.TimeoutSeconds, probe.PeriodSeconds, probe.SuccessThreshold, probe.InitialDelaySeconds, probe.FailureThreshold}
	for _, v := range a {
		if v > 0 {
			count++
		}
	}
	return count > 0
}
