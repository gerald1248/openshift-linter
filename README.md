OpenShift Linter
================

This is a utility for OpenShift admins who want to know if certain (very basic) rules have been followed. Admins can also specify naming conventions for namespaces and projects.

As it's very early days the focus is on `deploymentConfig` objects.

Usage
-----
Usage: ./openshift-linter [<JSON file> [<JSON file>]]
  -env string
      pattern for environment variables (default "^[A-Z0-9_-]+$")
  -n string
      hostname (default "localhost")
  -name string
      pattern for names (default "^[a-z0-9\\._-]+$")
  -namespace string
      pattern for namespaces/projects (default "^[a-z0-9\\._-]+$")
  -p int
      listen on port (default 8000)

Build
-----
Install Go using one of the installers available from `https://golang.org/dl/` and set up your `$GOPATH` and `$GOBIN` as you see fit (exporting `~/golang` and `$GOPATH/bin` in your `.bash_profile` will do).

Now it's time to clone `github.com/gerald1248/openshift-linter`. The folder structure below `$GOPATH` should look as follows:
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

Next, install Node.js with npm using your package manager. `cd` into the working directory `timeline` and enter:

```
$ npm install -g gulp-cli
$ npm install
```

Note for Ubuntu users: as `gulp-cli` currently expects `node`, but Ubuntu installs `nodejs`, `gulp` currently has to be triggered as follows:

```
$ nodejs node_modules/gulp/bin/gulp.js
```

In other words, it's very nearly the invocation to use when installing `gulp-cli` globally is not possible or desirable:

```
$ node node_modules/gulp/bin/gulp.js
```

Before running `gulp` (which builds and tests the program), fetch and install the dependencies:

```
$ go get -u github.com/jteeuwen/go-bindata/...
$ go get -u
```

With that, the workspace is ready. The default task (triggered by `gulp`) compiles `openshift-linter` from source, runs (minimal for now) tests, checks the source format, generates a binary in `package` and writes out a distributable zip for your operating system.

You can also run `gulp build`, `gulp test`, `gulp watch`, etc. individually if you wish.
