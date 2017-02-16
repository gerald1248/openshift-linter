package main

import (
	"fmt"
	"regexp"
)

func postprocessResult(r *ResultMap, params LinterParams) error {
	pattern := params.SkipContainerPattern
	if len(pattern) == 0 {
		return nil
	}

	re, err := regexp.Compile(pattern)
	if err != nil {
		return err
	}

	//iterate over map keys
	for k, v := range *r {
		//iterate over values
		replace := false
		s := []ContainerSpec{} //zero-length slice, _not_ nil, so JSON encoder writes []
		for _, spec := range v {
			container := spec.Container
			if len(container) == 0 {
				continue
			}

			if re.FindStringIndex(spec.Container) != nil {
				replace = true
				fmt.Printf("Skipping %s\n", container)
			} else {
				s = append(s, spec)
			}
		}
		if replace {
			(*r)[k] = s
		}
	}

	return nil
}
