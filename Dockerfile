FROM scratch
ADD package/openshift-linter /
USER 1001
EXPOSE 8443
ENTRYPOINT ["/openshift-linter"]
