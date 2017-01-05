OpenShift Linter
================

This is a utility for OpenShift users/admins who want to know if certain (very basic) rules have been followed. You can also specify naming conventions for namespaces (i.e. projects), names, containers and environment variables.

As it's very early days the focus is on `deploymentConfig` objects.

Usage
-----
```
Usage: ./openshift-linter [<JSON file> [<JSON file>]]
  -container string
      pattern for containers (default "^[a-z0-9_-]+$")
  -env string
      pattern for environment variables (default "^[A-Z0-9_-]+$")
  -n string
      hostname (default "localhost")
  -name string
      pattern for names (default "^[a-z0-9_-]+$")
  -namespace string
      pattern for namespaces/projects (default "^[a-z0-9_-]*$")
  -p int
      listen on port (default 8000)
```

The two main use cases are:

* You already have a bunch of configuration files (the output of `oc export dc --all-namespaces`, say, assuming you're lucky enough to be `cluster-admin`)
```
$ ./openshift-linter i-contain-multitudes.json
```

* Run `./openshift-linter` and open the GUI at `http://localhost:8000/openshift-linter/report` (configure hostname and port using the -n and -p switches, respectively)

When setting naming conventions for namespaces, names, containers and environment variables, be sure to use anchors to describe the string as a whole. Conversely, if all namespaces specify a member of the 00 Section, but the rest doesn't matter, `00[0-9]` is fine, though Fleming enthusiasts will no doubt insist on `OO[0-9]`.

Build
-----
Install Go using one of the installers available from `https://golang.org/dl/` and set up your `$GOPATH` and `$GOBIN` as you see fit (exporting `GOPATH=~/golang` and `GOBIN=$GOPATH/bin` in your `.bash_profile` will do).

Then clone `github.com/gerald1248/openshift-linter`. The folder structure below `$GOPATH` should look roughly as follows:
```
src
└── github.com
    └── gerald1248
        └── openshift-linter
            ├── README.md
            ├── gulpfile.js
            ├── openshift-linter.go
            ├── package.json
            ├── process.go
            └── server.go
```

Next, install Node.js with npm using your package manager. `cd` into the working directory `openshift-linter` and enter:

```
$ sudo npm install -g gulp-cli
$ npm install
```

Note for Ubuntu users: as `gulp-cli` currently expects `node`, but Ubuntu installs `nodejs`, `gulp` has to be triggered as follows:

```
$ nodejs node_modules/gulp/bin/gulp.js
```

In other words, it's very nearly the invocation to use when installing `gulp-cli` globally is not possible or desirable:

```
$ node node_modules/gulp/bin/gulp.js
```

Before running `gulp` (which builds and tests the program), fetch and install the dependencies (`go get` also runs at build time, albeit without the -u switch):

```
$ go get -u github.com/jteeuwen/go-bindata/...
$ go get -u
```

With that, the workspace is ready. The default task (triggered by `gulp`) compiles `openshift-linter` from source, runs (minimal for now) tests, checks the source format, generates a binary in `package` and writes out a distributable zip for your operating system.

You can also run `gulp build`, `gulp test`, `gulp watch`, etc. individually if you wish.
