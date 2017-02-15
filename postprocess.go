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
		for _, spec := range v {
			container := spec.Container
			if re.FindStringIndex(spec.Container) != nil {
				delete(*r, k)
				fmt.Printf("Skipping %s\n", container)
			}
		}
	}

	return nil
}
