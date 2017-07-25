FROM scratch
ADD certs/ca-certificates.crt /etc/ssl/certs/
ADD package/openshift-linter /
USER 1001
EXPOSE 8443
ENTRYPOINT ["/openshift-linter"]
