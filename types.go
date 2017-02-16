package main

import (
	"encoding/json"
	"regexp"
	"strconv"
)

type LinterItem interface {
	Lint(*Config, LinterParams) (ResultMap, error)
	Name() string
	Description() string
	Kind() string
}

type Config struct {
	Kind                   string  `json:"kind"`
	Items                  []*Item `json:"items"`
	Objects                []*Item `json:"objects"`
	CustomNamespaceLabel   string  `json:"customNamespaceLabel"`
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
	Labels    map[string]string `json:"labels"`
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
}

type Spec struct {
	//DeploymentConfig
	Volumes    []interface{} `json:"volumes"`
	Containers []*Container  `json:"containers"`
	Template   *Item         `json:"template"` //nested item with its own Metadata and Spec sections

	//Route
	Host string `json:"host"`
	Port *Port  `json:"port"`
}

type Container struct {
	Image           string           `json:"image"`
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
	Privileged   bool  `json:"privileged"`
	RunAsNonRoot bool  `json:"runAsNonRoot"` //currently not verifiable: property not found in OSE3.1, so can't enforce `true`
	RunAsUser    int64 `json:"runAsUser"`    //currently not verifiable: property not found in OSE3.1, so can't enforce non-root (i.e. >0)
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

type Port struct {
	TargetPort CoerceString `json:"targetPort"`
}

func (r *ResourceConstraint) Complete() bool {
	return len(r.CPU) > 0 && len(r.Memory) > 0
}

func (r *ResourceConstraint) Valid() bool {
	//see Kubernetes pkg/api/validation/validation.go ll. 1300f.
	reCpu := regexp.MustCompile(`^[0-9]+m?$`)
	reMemory := regexp.MustCompile(`^[0-9]+(k|M|G|T|P|E|Ki|Mi|Gi|Ti|Pi|Ei)?$`)

	if len(r.CPU) > 0 && reCpu.FindStringIndex(r.CPU) == nil {
		return false
	}

	if len(r.Memory) > 0 && reMemory.FindStringIndex(r.Memory) == nil {
		return false
	}

	return true
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
	NamespaceLabel             string
	NamespacePattern           string
	NamePattern                string
	ContainerPattern           string
	EnvPattern                 string
	SkipContainerPattern       string
	WhitelistRegistriesPattern string
	Output                     string
}

type MinimalObject struct {
	Kind string
}

type Table struct {
	Row []string
}

type CoerceString struct {
	s string
}

func (cs *CoerceString) String() string {
	return cs.s
}

//see also: kubernetes/api/util.go for fuzzy alternative
func (cs *CoerceString) UnmarshalJSON(value []byte) error {
	//string
	if value[0] == '"' {
		return json.Unmarshal(value, &cs.s)
	}
	//int
	//TODO: validate (^[0-9]+$)
	var i int
	err := json.Unmarshal(value, &i)
	if err == nil {
		cs.s = strconv.Itoa(i)
		return nil
	}
	return err
}
