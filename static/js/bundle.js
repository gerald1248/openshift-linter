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

    //modal action
    $('#modal-action-button').on('click', function() {
      self.sideload();
    });

    //keyboard focus on textarea for quick paste action
    //not allowed to read from clipboard
    $('#sideload-modal').on('shown.bs.modal', function() {
      $('#modal-source').focus();
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
          $('#report')[0].innerHTML = data;
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
        plural = (len === 1) ? "" : "s"
        buffer += "<h3>" + key + ": " + subkey + " (" + len + " item" + plural + ")</h3>";
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

  this.sideload = function() {
    var s = $('#modal-source')[0].value;
    try {
      var obj = JSON.parse(s);
    } catch(e) {
      $('#report')[0].innerHTML = e.message;
      return;
    }

    if (obj === {} || obj === null || typeof(obj) === 'undefined') {
      $('#report')[0].innerHTML = "No data";
    }

    $('#report')[0].innerHTML = this.formatReport(obj);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJvYmoiLCJKU09OIiwicGFyc2UiLCJ2YWwiLCJ0ZXh0IiwiY3VzdG9tTmFtZXNwYWNlUGF0dGVybiIsImN1c3RvbU5hbWVQYXR0ZXJuIiwiY3VzdG9tQ29udGFpbmVyUGF0dGVybiIsImN1c3RvbUVudlBhdHRlcm4iLCJsZW5ndGgiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiYnVmZmVyIiwia2V5Iiwic3Via2V5IiwibGlzdCIsImxlbiIsInBsdXJhbCIsImkiLCJOYW1lc3BhY2UiLCJOYW1lIiwiQ29udGFpbmVyIiwibWFzdGVyIiwicG9ydCIsInRva2VuIiwicmVxdWVzdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwibXNnIiwicmVzcG9uc2VKU09OIiwibWVzc2FnZSIsInN0YXR1c1RleHQiLCJzIiwidmFsdWUiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIndpbmRvdyIsIm9ubG9hZCJdLCJtYXBwaW5ncyI6IkFBb0xBLFFBQUFBLFlBQ0EsR0FBQUMsR0FBQSxHQUFBQyxJQUNBRCxHQUFBRSxPQXRMQSxHQUFBRCxLQUFBLFdBQ0FFLEtBQUFDLFFBQUEsRUFDQUQsS0FBQUQsS0FBQSxXQUNBLEdBQUFHLEdBQUFGLElBQ0FBLE1BQUFHLGdCQUNBQyxFQUFBLGtCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFLLFFBRUFILEVBQUEs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QUFBLG1CQUFBLEtBQ0FWLEVBQUEsV0FBQSxHQUFBNEIsVUFBQSxXQUdBNUIsRUFBQSxXQUFBLEdBQUE0QixVQUFBaEMsS0FBQWlDLGFBQUFuQixJQUlBZCxLQUFBRyxjQUFBLFdBQ0EsbUJBQUEsZ0JBSUFDLEVBQUEsaUJBQUFhLElBQUF5QyxhQUFBQyxRQUFBLFdBQ0F2RCxFQUFBLGVBQUFhLElBQUF5QyxhQUFBQyxRQUFBLFNBQ0F2RCxFQUFBLGdCQUFBYSxJQUFBeUMsYUFBQUMsUUFBQSxVQUNBdkQsRUFBQSxrQkFBQWEsSUFBQXlDLGFBQUFDLFFBQUEsWUFDQXZELEVBQUEsc0JBQUFhLElBQUF5QyxhQUFBQyxRQUFBLHNCQUNBdkQsRUFBQSxpQkFBQWEsSUFBQXlDLGFBQUFDLFFBQUEsaUJBQ0F2RCxFQUFBLHNCQUFBYSxJQUFBeUMsYUFBQUMsUUFBQSxzQkFDQXZELEVBQUEsZ0JBQUFhLElBQUF5QyxhQUFBQyxRQUFBLGdCQUNBdkQsRUFBQSxTQUFBYSxJQUFBeUMsYUFBQUMsUUFBQSxXQUdBM0QsS0FBQU0sY0FBQSxXQUNBLG1CQUFBLGdCQUlBb0QsYUFBQUUsUUFBQSxTQUFBeEQsRUFBQSxpQkFBQWEsT0FDQXlDLGFBQUFFLFFBQUEsT0FBQXhELEVBQUEsZUFBQWEsT0FDQXlDLGFBQUFFLFFBQUEsUUFBQXhELEVBQUEsZ0JBQUFhLE9BQ0F5QyxhQUFBRSxRQUFBLFVBQUF4RCxFQUFBLGtCQUFBYSxPQUNBeUMsYUFBQUUsUUFBQSxvQkFBQXhELEVBQUEsc0JBQUFhLE9BQ0F5QyxhQUFBRSxRQUFBLGVBQUF4RCxFQUFBLGlCQUFBYSxPQUNBeUMsYUFBQUUsUUFBQSxvQkFBQXhELEVBQUEsc0JBQUFhLE9BQ0F5QyxhQUFBRSxRQUFBLGNBQUF4RCxFQUFBLGdCQUFBYSxPQUNBeUMsYUFBQUUsUUFBQSxPQUFBeEQsRUFBQSxTQUFBYSxTQVNBNEMsUUFBQUMsT0FBQWxFIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHAgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb3VudGVyID0gMDtcbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuc3RvcmFnZUdldHRlcigpO1xuICAgICQoJyN1cGRhdGUtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcbiAgICAgIHNlbGYuZ2V0KCk7XG4gICAgfSk7XG4gICAgJCgnI2NyZWF0ZS1yZXBvcnQtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcbiAgICAgIHNlbGYucG9zdCgpO1xuICAgIH0pO1xuICAgIHRoaXMuY2xpcGJvYXJkID0gbmV3IENsaXBib2FyZCgnI2NvcHktYnV0dG9uJyk7XG4gICAgdGhpcy5jbGlwYm9hcmQub24oJ2Vycm9yJywgZnVuY3Rpb24oZSkge1xuICAgICAgLy9UT0RPOiBDdHJsK0MgbWVzc2FnZSBmYWxsYmFja1xuICAgIH0pO1xuXG4gICAgLy9tb2RhbCBhY3Rpb25cbiAgICAkKCcjbW9kYWwtYWN0aW9uLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zaWRlbG9hZCgpO1xuICAgIH0pO1xuXG4gICAgLy9rZXlib2FyZCBmb2N1cyBvbiB0ZXh0YXJlYSBmb3IgcXVpY2sgcGFzdGUgYWN0aW9uXG4gICAgLy9ub3QgYWxsb3dlZCB0byByZWFkIGZyb20gY2xpcGJvYXJkXG4gICAgJCgnI3NpZGVsb2FkLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjbW9kYWwtc291cmNlJykuZm9jdXMoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvL1BPU1QgY29uZmlnIG9iamVjdHMsIHJldHJpZXZlIHJlcG9ydFxuICB0aGlzLnBvc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKCQoJyNkYXRhJykudmFsKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICQoJyNyZXBvcnQnKS50ZXh0KFwiQ2FuJ3QgcGFyc2UgSlNPTiBkYXRhXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbU5hbWVQYXR0ZXJuID0gJCgnI25hbWUtcGF0dGVybicpLnZhbCgpO1xuICAgIHZhciBjdXN0b21Db250YWluZXJQYXR0ZXJuID0gJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbUVudlBhdHRlcm4gPSAkKCcjZW52LXBhdHRlcm4nKS52YWwoKTtcbiAgICBpZiAoY3VzdG9tTmFtZXNwYWNlUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tTmFtZXNwYWNlUGF0dGVybiA9IGN1c3RvbU5hbWVzcGFjZVBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21OYW1lUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tTmFtZVBhdHRlcm4gPSBjdXN0b21OYW1lUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbUNvbnRhaW5lclBhdHRlcm4ubGVuZ3RoID4gMCkge1xuICAgICAgb2JqLmN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSBjdXN0b21Db250YWluZXJQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tRW52UGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tRW52UGF0dGVybiA9IGN1c3RvbUVudlBhdHRlcm47XG4gICAgfVxuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogXCIvb3BlbnNoaWZ0LWxpbnRlclwiLFxuICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShvYmopLFxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvL1RPRE86IGVycm9yIG1lc3NhZ2VzIHNob3VsZCBiZSBKU09OIHRvb1xuICAgICAgICBpZiAodHlwZW9mKGRhdGEpICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBzZWxmLmZvcm1hdFJlcG9ydChkYXRhKTtcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBcIlBPU1QgcmVxdWVzdCBmYWlsZWRcIjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvL3ByZXNlbnQgcmVwb3J0IEpTT04gaW4gdGFidWxhciBmb3JtXG4gIHRoaXMuZm9ybWF0UmVwb3J0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGJ1ZmZlciA9IFwiXCI7XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICBmb3IgKHN1YmtleSBpbiBvYmpba2V5XSkge1xuICAgICAgICB2YXIgbGlzdCA9IG9ialtrZXldW3N1YmtleV07XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHBsdXJhbCA9IChsZW4gPT09IDEpID8gXCJcIiA6IFwic1wiXG4gICAgICAgIGJ1ZmZlciArPSBcIjxoMz5cIiArIGtleSArIFwiOiBcIiArIHN1YmtleSArIFwiIChcIiArIGxlbiArIFwiIGl0ZW1cIiArIHBsdXJhbCArIFwiKTwvaDM+XCI7XG4gICAgICAgIGJ1ZmZlciArPSBcIjx0YWJsZSBjbGFzcz0ndGFibGUgdGFibGUtc3RyaXBlZCc+XCI7XG4gICAgICAgIGJ1ZmZlciArPSBcIjx0aGVhZCBjbGFzcz0ndGhlYWQtZGVmYXVsdCc+PHRyPjx0aD5OYW1lc3BhY2U8L3RoPjx0aD5OYW1lPC90aD48dGg+Q29udGFpbmVyPC90aD48L3RyPjwvdGhlYWQ+XCI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGJ1ZmZlciArPSBcIjx0cj48dGQ+XCIgKyBsaXN0W2ldLk5hbWVzcGFjZSArIFwiPC90ZD48dGQ+XCIgKyBsaXN0W2ldLk5hbWUgKyBcIjwvdGQ+PHRkPlwiICsgbGlzdFtpXS5Db250YWluZXIgKyBcIjwvdGQ+PC90cj5cIjtcbiAgICAgICAgfVxuICAgICAgICBidWZmZXIgKz0gXCI8L3RhYmxlPlwiO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyOyBcbiAgfVxuXG4gIC8vR0VUIHJlcXVlc3QgdG8gZmV0Y2ggbGlzdCBvZiBjb25maWcgb2JqZWN0c1xuICB0aGlzLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXN0ZXIgPSAkKCcjbWFzdGVyLWlucHV0JykudmFsKCk7XG4gICAgdmFyIHBvcnQgPSAkKCcjcG9ydC1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciB0b2tlbiA9ICQoJyN0b2tlbi1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciByZXF1ZXN0ID0gJCgnI3JlcXVlc3QtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdXJsID0gbWFzdGVyICsgXCI6XCIgKyBwb3J0ICsgcmVxdWVzdDtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBcIkJlYXJlciBcIiArIHRva2VuXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkKCcjZGF0YScpLnZhbChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IFwiXCJcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSAoZXJyLnJlc3BvbnNlSlNPTikgP1xuICAgICAgICAgIGVyci5yZXNwb25zZUpTT04ubWVzc2FnZSA6XG4gICAgICAgICAgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IG1zZztcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB0aGlzLnNpZGVsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHMgPSAkKCcjbW9kYWwtc291cmNlJylbMF0udmFsdWU7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IGUubWVzc2FnZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2JqID09PSB7fSB8fCBvYmogPT09IG51bGwgfHwgdHlwZW9mKG9iaikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gXCJObyBkYXRhXCI7XG4gICAgfVxuXG4gICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHRoaXMuZm9ybWF0UmVwb3J0KG9iaik7XG4gIH07XG5cblxuICB0aGlzLnN0b3JhZ2VHZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgICQoJyNtYXN0ZXItaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJtYXN0ZXJcIikpO1xuICAgICQoJyNwb3J0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicG9ydFwiKSk7XG4gICAgJCgnI3Rva2VuLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidG9rZW5cIikpO1xuICAgICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVxdWVzdFwiKSk7XG4gICAgJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIikpO1xuICAgICQoJyNuYW1lLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIikpO1xuICAgICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjZW52LXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJlbnYtcGF0dGVyblwiKSk7XG4gICAgJCgnI2RhdGEnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkYXRhXCIpKTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VTZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibWFzdGVyXCIsICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwb3J0XCIsICQoJyNwb3J0LWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgJCgnI3Rva2VuLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVxdWVzdFwiLCAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIsICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWUtcGF0dGVyblwiLCAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIiwgJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZW52LXBhdHRlcm5cIiwgJCgnI2Vudi1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZGF0YVwiLCAkKCcjZGF0YScpLnZhbCgpKTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIG1haW5GdW5jKCkge1xuICB2YXIgYXBwID0gbmV3IEFwcCgpO1xuICBhcHAuaW5pdCgpO1xufVxuXG53aW5kb3cub25sb2FkID0gbWFpbkZ1bmM7XG4iXX0=
