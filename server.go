package main

import (
	"encoding/json"
	"fmt"
	"github.com/elazarl/go-bindata-assetfs"
	"github.com/kabukky/httpscerts"
	"io/ioutil"
	"log"
	"net/http"
)

type PostStruct struct {
	Buffer string
}

func serve(certificate, key, hostname string, port int) {
	virtual_fs := &assetfs.AssetFS{
		Asset:     Asset,
		AssetDir:  AssetDir,
		AssetInfo: AssetInfo}

	err := httpscerts.Check(certificate, key)
	if err != nil {
		err = httpscerts.Generate(certificate, key, fmt.Sprintf("%s:%d", hostname, port))
		if err != nil {
			log.Fatal("Can't create https certs")
		}
		fmt.Printf("Created %s and %s\n", certificate, key)
	}

	http.Handle("/static/", http.FileServer(virtual_fs))
	http.HandleFunc("/openshift-linter/report", guiHandler)
	http.HandleFunc("/openshift-linter", handler)

	fmt.Printf("Listening on port %d\n"+
		"POST JSON sources to https://%s:%d/openshift-linter\n"+
		"Generate report at https://%s:%d/openshift-linter/report\n", port, hostname, port, hostname, port)
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf("%s:%d", hostname, port), certificate, key, nil))
}

func guiHandler(w http.ResponseWriter, r *http.Request) {
	//show GUI from static resources
	bytes, _ := Asset("static/index.html")
	fmt.Fprintf(w, "%s\n", string(bytes))
}

func handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		handlePost(&w, r)
	case "GET":
		handleGet(&w, r)
	}
}

func handleGet(w *http.ResponseWriter, r *http.Request) {
	//fetch configuration list
	fmt.Fprintf(*w, "GET request\nRequest struct = %v\n", r)
}

func handlePost(w *http.ResponseWriter, r *http.Request) {
	//process configuration list
	body, err := ioutil.ReadAll(r.Body)

	if err != nil {
		fmt.Fprintf(*w, "Can't read POST request body: %s", err)
		return
	}

	any := ".*" //for POST requests, patterns are specified within config body
	combinedResultMap, err := processBytes(body, LinterParams{"env", any, any, any, any, "", any, "json"})
	if err != nil {
		fmt.Fprintf(*w, "Can't process POST request body: %s\n%s\n", err, body)
		return
	}

	json, err := json.Marshal(combinedResultMap)
	if err != nil {
		fmt.Fprintf(*w, "Can't encode result: %s", err)
		return
	}

	fmt.Fprintf(*w, string(json))
}
