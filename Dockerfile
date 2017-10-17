FROM scratch
ADD package/openshift-linter /
USER 1001
ENTRYPOINT ["/openshift-linter"]
CMD ["-p", "8443", "-n", "0.0.0.0"]
EXPOSE 8443
