FROM scratch
ADD package/openshift-linter /
USER 1001
ENTRYPOINT ["/openshift-linter"]
CMD ["-p", "8443", "-n", ""]
EXPOSE 8443
