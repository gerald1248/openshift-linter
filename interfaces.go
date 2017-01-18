package main

//TODO
type LinterItem interface {
	parseConfig(a []byte, params LinterParams) ResultMap
}
