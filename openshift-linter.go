package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func main() {
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: ./%s [<JSON file> [<JSON file>]]\n", filepath.Base(os.Args[0]))
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "Commands:\n  list\tPrint list of available checks\n")
		os.Exit(0)
	}

	host := flag.String("n", "localhost", "hostname")
	port := flag.Int("p", 8000, "listen on port")
	namespaceLabel := flag.String("namespace-label", "env", "metadata.labels key denoting namespace")
	namespacePattern := flag.String("namespace", "^[a-z0-9_-]*$", "pattern for namespaces/projects")
	namePattern := flag.String("name", "^[a-z0-9_-]+$", "pattern for names")
	containerPattern := flag.String("container", "^[a-z0-9_-]+$", "pattern for containers")
	envPattern := flag.String("env", "^[A-Z0-9_-]+$", "pattern for environment variables")

	flag.Parse()
	args := flag.Args()

	//patterns are ignored in server mode - specify as follows:
	//{ customNamespacePattern="...", customNamePattern="..."", ... }
	if len(args) == 0 {
		serve(*host, *port)
		return
	}

	if len(args) == 1 {
		switch args[0] {
		case "list":
			ListLinterItems()
			os.Exit(0)
		default:
			break
		}
	}

	for _, arg := range args {
		start := time.Now()
		msg, code := processFile(arg, LinterParams{*namespaceLabel, *namespacePattern, *namePattern, *containerPattern, *envPattern})
		secs := time.Since(start).Seconds()

		if code > 0 {
			fmt.Printf("%s: %s (%.2fs)\n", arg, msg, secs)
			return
		}
		fmt.Printf("%s\n", msg)
	}
}
