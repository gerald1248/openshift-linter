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

    var customNamespaceLabel = $('#namespace-label').val();
    var customNamespacePattern = $('#namespace-pattern').val();
    var customNamePattern = $('#name-pattern').val();
    var customContainerPattern = $('#container-pattern').val();
    var customEnvPattern = $('#env-pattern').val();
    if (customNamespaceLabel.length > 0) {
      obj.customNamespaceLabel = customNamespaceLabel;
    }
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
            buffer += "<tr><td>" + this.nonBlank(list[i].Namespace) + "</td><td>" + this.nonBlank(list[i].Name) + "</td><td>" + this.nonBlank(list[i].Container) + "</td></tr>";
        }
        buffer += "</table>";
      }
    }
    return buffer; 
  };

  this.nonBlank = function(s) {
    if (s.length === 0) {
      return "&ndash;";
    }
    return s;
  };

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJvYmoiLCJKU09OIiwicGFyc2UiLCJ2YWwiLCJ0ZXh0IiwiY3VzdG9tTmFtZXNwYWNlTGFiZWwiLCJjdXN0b21OYW1lc3BhY2VQYXR0ZXJuIiwiY3VzdG9tTmFtZVBhdHRlcm4iLCJjdXN0b21Db250YWluZXJQYXR0ZXJuIiwiY3VzdG9tRW52UGF0dGVybiIsImxlbmd0aCIsImFqYXgiLCJ1cmwiLCJ0eXBlIiwiZGF0YSIsInN0cmluZ2lmeSIsImRhdGFUeXBlIiwiY29udGVudFR5cGUiLCJzdWNjZXNzIiwiaW5uZXJIVE1MIiwiZm9ybWF0UmVwb3J0IiwiZXJyb3IiLCJlcnIiLCJidWZmZXIiLCJrZXkiLCJzdWJrZXkiLCJsaXN0IiwibGVuIiwicGx1cmFsIiwiaSIsIm5vbkJsYW5rIiwiTmFtZXNwYWNlIiwiTmFtZSIsIkNvbnRhaW5lciIsInMiLCJtYXN0ZXIiLCJwb3J0IiwidG9rZW4iLCJyZXF1ZXN0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJtc2ciLCJyZXNwb25zZUpTT04iLCJtZXNzYWdlIiwic3RhdHVzVGV4dCIsInZhbHVlIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJ3aW5kb3ciLCJvbmxvYWQiXSwibWFwcGluZ3MiOiJBQStMQSxRQUFBQSxZQUNBLEdBQUFDLEdBQUEsR0FBQUMsSUFDQUQsR0FBQUUsT0FqTUEsR0FBQUQsS0FBQSxXQUNBRSxLQUFBQyxRQUFBLEVBQ0FELEtBQUFELEtBQUEsV0FDQSxHQUFBRyxHQUFBRixJQUNBQSxNQUFBRyxnQkFDQUMsRUFBQSxrQkFBQUMsR0FBQSxRQUFBLFdB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MkMsYUFBQUUsUUFBQSxvQkFBQTFELEVBQUEsc0JBQUFhLE9BQ0EyQyxhQUFBRSxRQUFBLGNBQUExRCxFQUFBLGdCQUFBYSxPQUNBMkMsYUFBQUUsUUFBQSxPQUFBMUQsRUFBQSxTQUFBYSxTQVNBOEMsUUFBQUMsT0FBQXBFIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHAgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb3VudGVyID0gMDtcbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuc3RvcmFnZUdldHRlcigpO1xuICAgICQoJyN1cGRhdGUtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcbiAgICAgIHNlbGYuZ2V0KCk7XG4gICAgfSk7XG4gICAgJCgnI2NyZWF0ZS1yZXBvcnQtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcbiAgICAgIHNlbGYucG9zdCgpO1xuICAgIH0pO1xuICAgIHRoaXMuY2xpcGJvYXJkID0gbmV3IENsaXBib2FyZCgnI2NvcHktYnV0dG9uJyk7XG4gICAgdGhpcy5jbGlwYm9hcmQub24oJ2Vycm9yJywgZnVuY3Rpb24oZSkge1xuICAgICAgLy9UT0RPOiBDdHJsK0MgbWVzc2FnZSBmYWxsYmFja1xuICAgIH0pO1xuXG4gICAgLy9tb2RhbCBhY3Rpb25cbiAgICAkKCcjbW9kYWwtYWN0aW9uLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zaWRlbG9hZCgpO1xuICAgIH0pO1xuXG4gICAgLy9rZXlib2FyZCBmb2N1cyBvbiB0ZXh0YXJlYSBmb3IgcXVpY2sgcGFzdGUgYWN0aW9uXG4gICAgLy9ub3QgYWxsb3dlZCB0byByZWFkIGZyb20gY2xpcGJvYXJkXG4gICAgJCgnI3NpZGVsb2FkLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjbW9kYWwtc291cmNlJykuZm9jdXMoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvL1BPU1QgY29uZmlnIG9iamVjdHMsIHJldHJpZXZlIHJlcG9ydFxuICB0aGlzLnBvc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKCQoJyNkYXRhJykudmFsKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICQoJyNyZXBvcnQnKS50ZXh0KFwiQ2FuJ3QgcGFyc2UgSlNPTiBkYXRhXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjdXN0b21OYW1lc3BhY2VMYWJlbCA9ICQoJyNuYW1lc3BhY2UtbGFiZWwnKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tTmFtZXNwYWNlUGF0dGVybiA9ICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbCgpO1xuICAgIHZhciBjdXN0b21OYW1lUGF0dGVybiA9ICQoJyNuYW1lLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9ICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbCgpO1xuICAgIHZhciBjdXN0b21FbnZQYXR0ZXJuID0gJCgnI2Vudi1wYXR0ZXJuJykudmFsKCk7XG4gICAgaWYgKGN1c3RvbU5hbWVzcGFjZUxhYmVsLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lc3BhY2VMYWJlbCA9IGN1c3RvbU5hbWVzcGFjZUxhYmVsO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tTmFtZXNwYWNlUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tTmFtZXNwYWNlUGF0dGVybiA9IGN1c3RvbU5hbWVzcGFjZVBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21OYW1lUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tTmFtZVBhdHRlcm4gPSBjdXN0b21OYW1lUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbUNvbnRhaW5lclBhdHRlcm4ubGVuZ3RoID4gMCkge1xuICAgICAgb2JqLmN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSBjdXN0b21Db250YWluZXJQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tRW52UGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tRW52UGF0dGVybiA9IGN1c3RvbUVudlBhdHRlcm47XG4gICAgfVxuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogXCIvb3BlbnNoaWZ0LWxpbnRlclwiLFxuICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShvYmopLFxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvL1RPRE86IGVycm9yIG1lc3NhZ2VzIHNob3VsZCBiZSBKU09OIHRvb1xuICAgICAgICBpZiAodHlwZW9mKGRhdGEpICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBzZWxmLmZvcm1hdFJlcG9ydChkYXRhKTtcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBcIlBPU1QgcmVxdWVzdCBmYWlsZWRcIjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvL3ByZXNlbnQgcmVwb3J0IEpTT04gaW4gdGFidWxhciBmb3JtXG4gIHRoaXMuZm9ybWF0UmVwb3J0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGJ1ZmZlciA9IFwiXCI7XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICBmb3IgKHN1YmtleSBpbiBvYmpba2V5XSkge1xuICAgICAgICB2YXIgbGlzdCA9IG9ialtrZXldW3N1YmtleV07XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHBsdXJhbCA9IChsZW4gPT09IDEpID8gXCJcIiA6IFwic1wiXG4gICAgICAgIGJ1ZmZlciArPSBcIjxoMz5cIiArIGtleSArIFwiOiBcIiArIHN1YmtleSArIFwiIChcIiArIGxlbiArIFwiIGl0ZW1cIiArIHBsdXJhbCArIFwiKTwvaDM+XCI7XG4gICAgICAgIGJ1ZmZlciArPSBcIjx0YWJsZSBjbGFzcz0ndGFibGUgdGFibGUtc3RyaXBlZCc+XCI7XG4gICAgICAgIGJ1ZmZlciArPSBcIjx0aGVhZCBjbGFzcz0ndGhlYWQtZGVmYXVsdCc+PHRyPjx0aD5OYW1lc3BhY2U8L3RoPjx0aD5OYW1lPC90aD48dGg+Q29udGFpbmVyPC90aD48L3RyPjwvdGhlYWQ+XCI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGJ1ZmZlciArPSBcIjx0cj48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZXNwYWNlKSArIFwiPC90ZD48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZSkgKyBcIjwvdGQ+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLkNvbnRhaW5lcikgKyBcIjwvdGQ+PC90cj5cIjtcbiAgICAgICAgfVxuICAgICAgICBidWZmZXIgKz0gXCI8L3RhYmxlPlwiO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyOyBcbiAgfTtcblxuICB0aGlzLm5vbkJsYW5rID0gZnVuY3Rpb24ocykge1xuICAgIGlmIChzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFwiJm5kYXNoO1wiO1xuICAgIH1cbiAgICByZXR1cm4gcztcbiAgfTtcblxuICAvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcbiAgICB2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG4gICAgdmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogXCJCZWFyZXIgXCIgKyB0b2tlblxuICAgICAgfSxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgJCgnI2RhdGEnKS52YWwoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICB2YXIgbXNnID0gKGVyci5yZXNwb25zZUpTT04pID9cbiAgICAgICAgICBlcnIucmVzcG9uc2VKU09OLm1lc3NhZ2UgOlxuICAgICAgICAgIGVyci5zdGF0dXNUZXh0O1xuICAgICAgICAkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBtc2c7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdGhpcy5zaWRlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzID0gJCgnI21vZGFsLXNvdXJjZScpWzBdLnZhbHVlO1xuICAgIHRyeSB7XG4gICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZShzKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBlLm1lc3NhZ2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iaiA9PT0ge30gfHwgb2JqID09PSBudWxsIHx8IHR5cGVvZihvYmopID09PSAndW5kZWZpbmVkJykge1xuICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiTm8gZGF0YVwiO1xuICAgIH1cblxuICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSB0aGlzLmZvcm1hdFJlcG9ydChvYmopO1xuICB9O1xuXG5cbiAgdGhpcy5zdG9yYWdlR2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAkKCcjbWFzdGVyLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibWFzdGVyXCIpKTtcbiAgICAkKCcjcG9ydC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInBvcnRcIikpO1xuICAgICQoJyN0b2tlbi1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRva2VuXCIpKTtcbiAgICAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInJlcXVlc3RcIikpO1xuICAgICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJjb250YWluZXItcGF0dGVyblwiKSk7XG4gICAgJCgnI2Vudi1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZW52LXBhdHRlcm5cIikpO1xuICAgICQoJyNkYXRhJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGF0YVwiKSk7XG4gIH07XG5cbiAgdGhpcy5zdG9yYWdlU2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm1hc3RlclwiLCAkKCcjbWFzdGVyLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicG9ydFwiLCAkKCcjcG9ydC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRva2VuXCIsICQoJyN0b2tlbi1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInJlcXVlc3RcIiwgJCgnI3JlcXVlc3QtaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lc3BhY2UtcGF0dGVyblwiLCAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIiwgJCgnI25hbWUtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIsICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImVudi1wYXR0ZXJuXCIsICQoJyNlbnYtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRhdGFcIiwgJCgnI2RhdGEnKS52YWwoKSk7XG4gIH07XG59O1xuXG5mdW5jdGlvbiBtYWluRnVuYygpIHtcbiAgdmFyIGFwcCA9IG5ldyBBcHAoKTtcbiAgYXBwLmluaXQoKTtcbn1cblxud2luZG93Lm9ubG9hZCA9IG1haW5GdW5jO1xuIl19
