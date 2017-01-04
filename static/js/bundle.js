var App = function() {
  this.counter = 0;
  this.init = function() {
    var self = this;
    this.storageGetter();
    $('#update-button').on('click', function() {
      self.storageSetter();
      self.get();
    });
    $('#create-report-button').on('click', function() {
      self.storageSetter();
      self.post();
    });
    this.clipboard = new Clipboard('#copy-button');
    this.clipboard.on('error', function(e) {
      //TODO: Ctrl+C message fallback
    });

  };

  //POST config objects, retrieve report
  this.post = function() {
    var self = this;
    var obj = {};
    try {
      obj = JSON.parse($('#data').val());
    } catch (e) {
      $('#report').text("Can't parse JSON data");
      return;
    }

    var customNamespacePattern = $('#namespace-pattern').val();
    var customNamePattern = $('#name-pattern').val();
    var customContainerPattern = $('#container-pattern').val();
    var customEnvPattern = $('#env-pattern').val();
    if (customNamespacePattern.length > 0) {
      obj.customNamespacePattern = customNamespacePattern;
    }
    if (customNamePattern.length > 0) {
      obj.customNamePattern = customNamePattern;
    }
    if (customContainerPattern.length > 0) {
      obj.customContainerPattern = customContainerPattern;
    }
    if (customEnvPattern.length > 0) {
      obj.customEnvPattern = customEnvPattern;
    }

    $.ajax({
      url: "/openshift-linter",
      type: "POST",
      data: JSON.stringify(obj),
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: function(data) {
        //TODO: error messages should be JSON too
        if (typeof(data) !== "object") {
          console.log("NOTANOBJECT");
          $('#report')[0].innerHTML = JSON.stringify(data);
          return;
        }
        $('#report')[0].innerHTML = self.formatReport(data);
      },
      error: function(err) {
        $('#report')[0].innerHTML = "POST request failed";
      }
    });
  };

  //present report JSON in tabular form
  this.formatReport = function(obj) {
    var buffer = "";
    for (key in obj) {
      for (subkey in obj[key]) {
        var list = obj[key][subkey];
        var len = list.length;
        if (len === 0) {
          continue;
        }
        buffer += "<h3>" + key + ": " + subkey + "</h3>";
        buffer += "<table class='table table-striped'>";
        buffer += "<thead class='thead-default'><tr><th>Namespace</th><th>Name</th><th>Container</th></tr></thead>";
        for (var i = 0; i < len; i++) {
            buffer += "<tr><td>" + list[i].Namespace + "</td><td>" + list[i].Name + "</td><td>" + list[i].Container + "</td></tr>";
        }
        buffer += "</table>";
      }
    }
    return buffer; 
  }

  //GET request to fetch list of config objects
  this.get = function() {
    var master = $('#master-input').val();
    var port = $('#port-input').val();
    var token = $('#token-input').val();
    var request = $('#request-input').val();
    var url = master + ":" + port + request;
    console.log("GET", url);

    $.ajax({
      url: url,
      type: "GET",
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      headers: {
        "Authorization": "Bearer " + token
      },
      success: function(data) {
        $('#data').val(JSON.stringify(data));
        $('#error')[0].innerHTML = ""
      },
      error: function(err) {
        var msg = (err.responseJSON) ?
          err.responseJSON.message :
          err.statusText;
        $('#error')[0].innerHTML = msg;
      }
    });
  };

  this.storageGetter = function() {
    if (typeof(localStorage) === "undefined") {
      return
    }

    $('#master-input').val(localStorage.getItem("master"));
    $('#port-input').val(localStorage.getItem("port"));
    $('#token-input').val(localStorage.getItem("token"));
    $('#request-input').val(localStorage.getItem("request"));
    $('#namespace-pattern').val(localStorage.getItem("namespace-pattern"));
    $('#name-pattern').val(localStorage.getItem("name-pattern"));
    $('#container-pattern').val(localStorage.getItem("container-pattern"));
    $('#env-pattern').val(localStorage.getItem("env-pattern"));
    $('#data').val(localStorage.getItem("data"));
  };

  this.storageSetter = function() {
    if (typeof(localStorage) === "undefined") {
      return
    }

    localStorage.setItem("master", $('#master-input').val());
    localStorage.setItem("port", $('#port-input').val());
    localStorage.setItem("token", $('#token-input').val());
    localStorage.setItem("request", $('#request-input').val());
    localStorage.setItem("namespace-pattern", $('#namespace-pattern').val());
    localStorage.setItem("name-pattern", $('#name-pattern').val());
    localStorage.setItem("container-pattern", $('#container-pattern').val());
    localStorage.setItem("env-pattern", $('#env-pattern').val());
    localStorage.setItem("data", $('#data').val());

  };
};

function mainFunc() {
  var app = new App();
  app.init();
}

window.onload = mainFunc;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInZhbCIsInRleHQiLCJjdXN0b21OYW1lc3BhY2VQYXR0ZXJuIiwiY3VzdG9tTmFtZVBhdHRlcm4iLCJjdXN0b21Db250YWluZXJQYXR0ZXJuIiwiY3VzdG9tRW52UGF0dGVybiIsImxlbmd0aCIsImFqYXgiLCJ1cmwiLCJ0eXBlIiwiZGF0YSIsInN0cmluZ2lmeSIsImRhdGFUeXBlIiwiY29udGVudFR5cGUiLCJzdWNjZXNzIiwiY29uc29sZSIsImxvZyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiYnVmZmVyIiwia2V5Iiwic3Via2V5IiwibGlzdCIsImxlbiIsImkiLCJOYW1lc3BhY2UiLCJOYW1lIiwiQ29udGFpbmVyIiwibWFzdGVyIiwicG9ydCIsInRva2VuIiwicmVxdWVzdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwibXNnIiwicmVzcG9uc2VKU09OIiwibWVzc2FnZSIsInN0YXR1c1RleHQiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIndpbmRvdyIsIm9ubG9hZCJdLCJtYXBwaW5ncyI6IkFBMkpBLFFBQUFBLFlBQ0EsR0FBQUMsR0FBQSxHQUFBQyxJQUNBRCxHQUFBRSxPQTdKQSxHQUFBRCxLQUFBLFdBQ0FFLEtBQUFDLFFBQUEsRUFDQUQsS0FBQUQsS0FBQSxXQUNBLEdBQUFHLEdBQUFGLElBQ0FBLE1BQUFHLGdCQUNBQyxFQUFBLGtCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFLLFFBRUFILEVBQUEseUJBQUFDLEdBQUEsUUFBQSxXQUNBSCxF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SUFBQXdDLGFBQUFDLFFBQUEsc0JBQ0FwRCxFQUFBLGdCQUFBVyxJQUFBd0MsYUFBQUMsUUFBQSxnQkFDQXBELEVBQUEsU0FBQVcsSUFBQXdDLGFBQUFDLFFBQUEsV0FHQXhELEtBQUFNLGNBQUEsV0FDQSxtQkFBQSxnQkFJQWlELGFBQUFFLFFBQUEsU0FBQXJELEVBQUEsaUJBQUFXLE9BQ0F3QyxhQUFBRSxRQUFBLE9BQUFyRCxFQUFBLGVBQUFXLE9BQ0F3QyxhQUFBRSxRQUFBLFFBQUFyRCxFQUFBLGdCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxVQUFBckQsRUFBQSxrQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsb0JBQUFyRCxFQUFBLHNCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxlQUFBckQsRUFBQSxpQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsb0JBQUFyRCxFQUFBLHNCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxjQUFBckQsRUFBQSxnQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsT0FBQXJELEVBQUEsU0FBQVcsU0FVQTJDLFFBQUFDLE9BQUEvRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgQXBwID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY291bnRlciA9IDA7XG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnN0b3JhZ2VHZXR0ZXIoKTtcbiAgICAkKCcjdXBkYXRlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zdG9yYWdlU2V0dGVyKCk7XG4gICAgICBzZWxmLmdldCgpO1xuICAgIH0pO1xuICAgICQoJyNjcmVhdGUtcmVwb3J0LWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zdG9yYWdlU2V0dGVyKCk7XG4gICAgICBzZWxmLnBvc3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLmNsaXBib2FyZCA9IG5ldyBDbGlwYm9hcmQoJyNjb3B5LWJ1dHRvbicpO1xuICAgIHRoaXMuY2xpcGJvYXJkLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vVE9ETzogQ3RybCtDIG1lc3NhZ2UgZmFsbGJhY2tcbiAgICB9KTtcblxuICB9O1xuXG4gIC8vUE9TVCBjb25maWcgb2JqZWN0cywgcmV0cmlldmUgcmVwb3J0XG4gIHRoaXMucG9zdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UoJCgnI2RhdGEnKS52YWwoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgJCgnI3JlcG9ydCcpLnRleHQoXCJDYW4ndCBwYXJzZSBKU09OIGRhdGFcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tTmFtZVBhdHRlcm4gPSAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tRW52UGF0dGVybiA9ICQoJyNlbnYtcGF0dGVybicpLnZhbCgpO1xuICAgIGlmIChjdXN0b21OYW1lc3BhY2VQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gY3VzdG9tTmFtZXNwYWNlUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbU5hbWVQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lUGF0dGVybiA9IGN1c3RvbU5hbWVQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tQ29udGFpbmVyUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9IGN1c3RvbUNvbnRhaW5lclBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21FbnZQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21FbnZQYXR0ZXJuID0gY3VzdG9tRW52UGF0dGVybjtcbiAgICB9XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG4gICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIk5PVEFOT0JKRUNUXCIpO1xuICAgICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cbiAgdGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYnVmZmVyID0gXCJcIjtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGZvciAoc3Via2V5IGluIG9ialtrZXldKSB7XG4gICAgICAgIHZhciBsaXN0ID0gb2JqW2tleV1bc3Via2V5XTtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPGgzPlwiICsga2V5ICsgXCI6IFwiICsgc3Via2V5ICsgXCI8L2gzPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGFibGUgY2xhc3M9J3RhYmxlIHRhYmxlLXN0cmlwZWQnPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGhlYWQgY2xhc3M9J3RoZWFkLWRlZmF1bHQnPjx0cj48dGg+TmFtZXNwYWNlPC90aD48dGg+TmFtZTwvdGg+PHRoPkNvbnRhaW5lcjwvdGg+PC90cj48L3RoZWFkPlwiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gXCI8dHI+PHRkPlwiICsgbGlzdFtpXS5OYW1lc3BhY2UgKyBcIjwvdGQ+PHRkPlwiICsgbGlzdFtpXS5OYW1lICsgXCI8L3RkPjx0ZD5cIiArIGxpc3RbaV0uQ29udGFpbmVyICsgXCI8L3RkPjwvdHI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPC90YWJsZT5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjsgXG4gIH1cblxuICAvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcbiAgICB2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG4gICAgdmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG4gICAgY29uc29sZS5sb2coXCJHRVRcIiwgdXJsKTtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBcIkJlYXJlciBcIiArIHRva2VuXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkKCcjZGF0YScpLnZhbChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IFwiXCJcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSAoZXJyLnJlc3BvbnNlSlNPTikgP1xuICAgICAgICAgIGVyci5yZXNwb25zZUpTT04ubWVzc2FnZSA6XG4gICAgICAgICAgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IG1zZztcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VHZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgICQoJyNtYXN0ZXItaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJtYXN0ZXJcIikpO1xuICAgICQoJyNwb3J0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicG9ydFwiKSk7XG4gICAgJCgnI3Rva2VuLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidG9rZW5cIikpO1xuICAgICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVxdWVzdFwiKSk7XG4gICAgJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIikpO1xuICAgICQoJyNuYW1lLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIikpO1xuICAgICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjZW52LXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJlbnYtcGF0dGVyblwiKSk7XG4gICAgJCgnI2RhdGEnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkYXRhXCIpKTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VTZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibWFzdGVyXCIsICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwb3J0XCIsICQoJyNwb3J0LWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgJCgnI3Rva2VuLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVxdWVzdFwiLCAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIsICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWUtcGF0dGVyblwiLCAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIiwgJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZW52LXBhdHRlcm5cIiwgJCgnI2Vudi1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZGF0YVwiLCAkKCcjZGF0YScpLnZhbCgpKTtcblxuICB9O1xufTtcblxuZnVuY3Rpb24gbWFpbkZ1bmMoKSB7XG4gIHZhciBhcHAgPSBuZXcgQXBwKCk7XG4gIGFwcC5pbml0KCk7XG59XG5cbndpbmRvdy5vbmxvYWQgPSBtYWluRnVuYztcbiJdfQ==
