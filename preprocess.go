package main

func preprocessConfig(config *Config, params LinterParams) {
	for _, item := range config.Items {

		//populate namespace field if not set in original's metadata.namespace
		if item.Metadata.Namespace == "" {
			guess := item.Metadata.Labels[params.NamespaceLabel]
			if len(guess) > 0 {
				item.Metadata.Namespace = guess
			}
		}
	}
}
