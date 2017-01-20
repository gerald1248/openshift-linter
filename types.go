package main

//TODO: refactor item-* functions to match interface
type LinterItem interface {
	Lint(*Config, *LinterParams) (ResultMap, error)
	Name() string
}

type Config struct {
	Kind                   string  `json:"kind"`
	Items                  []*Item `json:"items"`
	CustomNamespacePattern string  `json:"customNamespacePattern"`
	CustomNamePattern      string  `json:"customNamePattern"`
	CustomContainerPattern string  `json:"customContainerPattern"`
	CustomEnvPattern       string  `json:"customEnvPattern"`
}

type Item struct {
	Kind     string                 `json:"kind"`
	Metadata *Metadata              `json:"metadata"`
	Spec     *Spec                  `json:"spec"`
	Status   map[string]interface{} `json:"status"`
}

type Metadata struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

type Spec struct {
	Volumes    []interface{} `json:"volumes"`
	Containers []*Container  `json:"containers"`
	Template   *Item         `json:"template"` //nested item with its own Metadata and Spec sections
}

type Container struct {
	Name            string           `json:"name"`
	ImagePullPolicy string           `json:"imagePullPolicy"`
	Env             []*EnvItem       `json:"env"`
	Resources       *Resources       `json:"resources"`
	LivenessProbe   *Probe           `json:"livenessProbe"`
	ReadinessProbe  *Probe           `json:"readinessProbe"`
	SecurityContext *SecurityContext `json:"securityContext"`
}

type Probe struct {
	TimeoutSeconds      int `json:"timeoutSeconds"`
	PeriodSeconds       int `json:"periodSeconds"`
	SuccessThreshold    int `json:"successThreshold"`
	InitialDelaySeconds int `json:"initialDelaySeconds"`
	FailureThreshold    int `json:"failureThreshold"`
}

type SecurityContext struct {
	Privileged bool `json:"privileged"`
}

type EnvItem struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type ContainerSet []ContainerSpec

type ContainerSpec struct {
	Namespace string
	Name      string
	Container string
}

type Resources struct {
	Limits   *ResourceConstraint `json:"limits"`
	Requests *ResourceConstraint `json:"requests"`
}

type ResourceConstraint struct {
	CPU    string `json:"cpu"`
	Memory string `json:"memory"`
}

func (r *ResourceConstraint) Complete() bool {
	return len(r.CPU) > 0 && len(r.Memory) > 0
}

func (r *ResourceConstraint) None() bool {
	return len(r.CPU) == 0 && len(r.Memory) == 0
}

type ResultList []ResultItem

type ResultMap map[string]ContainerSet

type ResultItem struct {
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Container string `json:"container"`
}

type CombinedResultMap map[string]ResultMap

type LinterParams struct {
	NamespacePattern string
	NamePattern      string
	ContainerPattern string
	EnvPattern       string
}
