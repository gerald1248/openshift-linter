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
        console.log(err);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInZhbCIsInRleHQiLCJjdXN0b21OYW1lc3BhY2VQYXR0ZXJuIiwiY3VzdG9tTmFtZVBhdHRlcm4iLCJjdXN0b21Db250YWluZXJQYXR0ZXJuIiwiY3VzdG9tRW52UGF0dGVybiIsImxlbmd0aCIsImFqYXgiLCJ1cmwiLCJ0eXBlIiwiZGF0YSIsInN0cmluZ2lmeSIsImRhdGFUeXBlIiwiY29udGVudFR5cGUiLCJzdWNjZXNzIiwiaW5uZXJIVE1MIiwiZm9ybWF0UmVwb3J0IiwiZXJyb3IiLCJlcnIiLCJidWZmZXIiLCJrZXkiLCJzdWJrZXkiLCJsaXN0IiwibGVuIiwiaSIsIk5hbWVzcGFjZSIsIk5hbWUiLCJDb250YWluZXIiLCJtYXN0ZXIiLCJwb3J0IiwidG9rZW4iLCJyZXF1ZXN0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJtc2ciLCJyZXNwb25zZUpTT04iLCJtZXNzYWdlIiwic3RhdHVzVGV4dCIsImNvbnNvbGUiLCJsb2ciLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIndpbmRvdyIsIm9ubG9hZCJdLCJtYXBwaW5ncyI6IkFBMEpBLFFBQUFBLFlBQ0EsR0FBQUMsR0FBQSxHQUFBQyxJQUNBRCxHQUFBRSxPQTVKQSxHQUFBRCxLQUFBLFdBQ0FFLEtBQUFDLFFBQUEsRUFDQUQsS0FBQUQsS0FBQSxXQUNBLEdBQUFHLEdBQUFGLElBQ0FBLE1BQUFHLGdCQUNBQyxFQUFBLGtCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFLLFFBRUFILEVBQUEseUJBQUFDLEdBQUEsUUFBQSxXQUNBSCxFQUFBSSxnQkFDQUosRUFBQU0sU0FFQVIsS0FBQVMsVUFBQSxHQUFBQyxXQUFBLGdCQUNBVixLQUFBUyxVQUFBSixHQUFBLFFBQUEsU0FBQU0sT0FPQVgsS0FBQVEsS0FBQSxXQUNBLEdBQUFOLEdBQUFGLEtBQ0FZLElBQ0EsS0FDQUEsRUFBQUMsS0FBQUMsTUFBQVYsRUFBQSxTQUFBVyxPQUNBLE1BQUFKLEdBRUEsV0FEQVAsR0FBQSxXQUFBWSxLQUFBLHlCQUlBLEdBQUFDLEdBQUFiLEVBQUEsc0JBQUFXLE1BQ0FHLEVBQUFkLEVBQUEsaUJBQUFXLE1BQ0FJLEVBQUFmLEVBQUEsc0JBQUFXLE1BQ0FLLEVBQUFoQixFQUFBLGdCQUFBVyxLQUNBRSxHQUFBSSxPQUFBLElBQ0FULEVBQUFLLHVCQUFBQSxHQUVBQyxFQUFBRyxPQUFBLElBQ0FULEVBQUFNLGtCQUFBQSxHQUVBQyxFQUFBRSxPQUFBLElBQ0FULEVBQUFPLHVCQUFBQSxHQUVBQyxFQUFBQyxPQUFBLElBQ0FULEVBQUFRLGlCQUFBQSxHQUdBaEIsRUFBQWtCLE1BQ0FDLElBQUEsb0JBQ0FDLEtBQUEsT0FDQUMsS0FBQVosS0FBQWEsVUFBQWQsR0FDQWUsU0FBQSxPQUNBQyxZQUFBLGtDQUNBQyxRQUFBLFNBQUFKLEdBRUEsTUFBQSxnQkFBQSxRQUNBckIsRUFBQSxXQUFBLEdBQUEwQixVQUFBTCxRQUdBckIsRUFBQSxXQUFBLEdBQUEwQixVQUFBNUIsRUFBQTZCLGFBQUFOLEtBRUFPLE1BQUEsU0FBQUMsR0FDQTdCLEVBQUEsV0FBQSxHQUFBMEIsVUFBQSwwQkFNQTlCLEtBQUErQixhQUFBLFNBQUFuQixHQUNBLEdBQUFzQixHQUFBLEVBQ0EsS0FBQUMsTUFBQXZCLEdBQ0EsSUFBQXdCLFNBQUF4QixHQUFBdUIsS0FBQSxDQUNBLEdBQUFFLEdBQUF6QixFQUFBdUIsS0FBQUMsUUFDQUUsRUFBQUQsRUFBQWhCLE1BQ0EsSUFBQSxJQUFBaUIsRUFBQSxDQUdBSixHQUFBLE9BQUFDLElBQUEsS0FBQUMsT0FBQSxRQUNBRixHQUFBLHNDQUNBQSxHQUFBLGlHQUNBLEtBQUEsR0FBQUssR0FBQSxFQUFBQSxFQUFBRCxFQUFBQyxJQUNBTCxHQUFBLFdBQUFHLEVBQUFFLEdBQUFDLFVBQUEsWUFBQUgsRUFBQUUsR0FBQUUsS0FBQSxZQUFBSixFQUFBRSxHQUFBRyxVQUFBLFlBRUFSLElBQUEsWUFHQSxNQUFBQSxJQUlBbEMsS0FBQU8sSUFBQSxXQUNBLEdBQUFvQyxHQUFBdkMsRUFBQSxpQkFBQVcsTUFDQTZCLEVBQUF4QyxFQUFBLGVBQUFXLE1BQ0E4QixFQUFBekMsRUFBQSxnQkFBQVcsTUFDQStCLEVBQUExQyxFQUFBLGtCQUFBVyxNQUNBUSxFQUFBb0IsRUFBQSxJQUFBQyxFQUFBRSxDQUVBMUMsR0FBQWtCLE1BQ0FDLElBQUFBLEVBQ0FDLEtBQUEsTUFDQUcsU0FBQSxPQUNBQyxZQUFBLGtDQUNBbUIsU0FDQUMsY0FBQSxVQUFBSCxHQUVBaEIsUUFBQSxTQUFBSixHQUNBckIsRUFBQSxTQUFBVyxJQUFBRixLQUFBYSxVQUFBRCxJQUNBckIsRUFBQSxVQUFBLEdBQUEwQixVQUFBLElBRUFFLE1BQUEsU0FBQUMsR0FDQSxHQUFBZ0IsR0FBQWhCLEVBQUEsYUFDQUEsRUFBQWlCLGFBQUFDLFFBQ0FsQixFQUFBbUIsVUFDQWhELEdBQUEsVUFBQSxHQUFBMEIsVUFBQW1CLEVBQ0FJLFFBQUFDLElBQUFyQixPQUtBakMsS0FBQUcsY0FBQSxXQUNBLG1CQUFBLGdCQUlBQyxFQUFBLGlCQUFBVyxJQUFBd0MsYUFBQUMsUUFBQSxXQUNBcEQsRUFBQSxlQUFBVyxJQUFBd0MsYUFBQUMsUUFBQSxTQUNBcEQsRUFBQSxnQkFBQVcsSUFBQXdDLGFBQUFDLFFBQUEsVUFDQXBELEVBQUEsa0JBQUFXLElBQUF3QyxhQUFBQyxRQUFBLFlBQ0FwRCxFQUFBLHNCQUFBVyxJQUFBd0MsYUFBQUMsUUFBQSxzQkFDQXBELEVBQUEsaUJBQUFXLElBQUF3QyxhQUFBQyxRQUFBLGlCQUNBcEQsRUFBQSxzQkFBQVcsSUFBQXdDLGFBQUFDLFFBQUEsc0JBQ0FwRCxFQUFBLGdCQUFBVyxJQUFBd0MsYUFBQUMsUUFBQSxnQkFDQXBELEVBQUEsU0FBQVcsSUFBQXdDLGFBQUFDLFFBQUEsV0FHQXhELEtBQUFNLGNBQUEsV0FDQSxtQkFBQSxnQkFJQWlELGFBQUFFLFFBQUEsU0FBQXJELEVBQUEsaUJBQUFXLE9BQ0F3QyxhQUFBRSxRQUFBLE9BQUFyRCxFQUFBLGVBQUFXLE9BQ0F3QyxhQUFBRSxRQUFBLFFBQUFyRCxFQUFBLGdCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxVQUFBckQsRUFBQSxrQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsb0JBQUFyRCxFQUFBLHNCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxlQUFBckQsRUFBQSxpQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsb0JBQUFyRCxFQUFBLHNCQUFBVyxPQUNBd0MsYUFBQUUsUUFBQSxjQUFBckQsRUFBQSxnQkFBQVcsT0FDQXdDLGFBQUFFLFFBQUEsT0FBQXJELEVBQUEsU0FBQVcsU0FVQTJDLFFBQUFDLE9BQUEvRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgQXBwID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY291bnRlciA9IDA7XG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnN0b3JhZ2VHZXR0ZXIoKTtcbiAgICAkKCcjdXBkYXRlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zdG9yYWdlU2V0dGVyKCk7XG4gICAgICBzZWxmLmdldCgpO1xuICAgIH0pO1xuICAgICQoJyNjcmVhdGUtcmVwb3J0LWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zdG9yYWdlU2V0dGVyKCk7XG4gICAgICBzZWxmLnBvc3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLmNsaXBib2FyZCA9IG5ldyBDbGlwYm9hcmQoJyNjb3B5LWJ1dHRvbicpO1xuICAgIHRoaXMuY2xpcGJvYXJkLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vVE9ETzogQ3RybCtDIG1lc3NhZ2UgZmFsbGJhY2tcbiAgICB9KTtcblxuICB9O1xuXG4gIC8vUE9TVCBjb25maWcgb2JqZWN0cywgcmV0cmlldmUgcmVwb3J0XG4gIHRoaXMucG9zdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UoJCgnI2RhdGEnKS52YWwoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgJCgnI3JlcG9ydCcpLnRleHQoXCJDYW4ndCBwYXJzZSBKU09OIGRhdGFcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tTmFtZVBhdHRlcm4gPSAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tRW52UGF0dGVybiA9ICQoJyNlbnYtcGF0dGVybicpLnZhbCgpO1xuICAgIGlmIChjdXN0b21OYW1lc3BhY2VQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gY3VzdG9tTmFtZXNwYWNlUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbU5hbWVQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lUGF0dGVybiA9IGN1c3RvbU5hbWVQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tQ29udGFpbmVyUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9IGN1c3RvbUNvbnRhaW5lclBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21FbnZQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21FbnZQYXR0ZXJuID0gY3VzdG9tRW52UGF0dGVybjtcbiAgICB9XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG4gICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cbiAgdGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYnVmZmVyID0gXCJcIjtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGZvciAoc3Via2V5IGluIG9ialtrZXldKSB7XG4gICAgICAgIHZhciBsaXN0ID0gb2JqW2tleV1bc3Via2V5XTtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPGgzPlwiICsga2V5ICsgXCI6IFwiICsgc3Via2V5ICsgXCI8L2gzPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGFibGUgY2xhc3M9J3RhYmxlIHRhYmxlLXN0cmlwZWQnPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGhlYWQgY2xhc3M9J3RoZWFkLWRlZmF1bHQnPjx0cj48dGg+TmFtZXNwYWNlPC90aD48dGg+TmFtZTwvdGg+PHRoPkNvbnRhaW5lcjwvdGg+PC90cj48L3RoZWFkPlwiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gXCI8dHI+PHRkPlwiICsgbGlzdFtpXS5OYW1lc3BhY2UgKyBcIjwvdGQ+PHRkPlwiICsgbGlzdFtpXS5OYW1lICsgXCI8L3RkPjx0ZD5cIiArIGxpc3RbaV0uQ29udGFpbmVyICsgXCI8L3RkPjwvdHI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPC90YWJsZT5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjsgXG4gIH1cblxuICAvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcbiAgICB2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG4gICAgdmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogXCJCZWFyZXIgXCIgKyB0b2tlblxuICAgICAgfSxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgJCgnI2RhdGEnKS52YWwoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICB2YXIgbXNnID0gKGVyci5yZXNwb25zZUpTT04pID9cbiAgICAgICAgICBlcnIucmVzcG9uc2VKU09OLm1lc3NhZ2UgOlxuICAgICAgICAgIGVyci5zdGF0dXNUZXh0O1xuICAgICAgICAkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBtc2c7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdGhpcy5zdG9yYWdlR2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAkKCcjbWFzdGVyLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibWFzdGVyXCIpKTtcbiAgICAkKCcjcG9ydC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInBvcnRcIikpO1xuICAgICQoJyN0b2tlbi1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRva2VuXCIpKTtcbiAgICAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInJlcXVlc3RcIikpO1xuICAgICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJjb250YWluZXItcGF0dGVyblwiKSk7XG4gICAgJCgnI2Vudi1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZW52LXBhdHRlcm5cIikpO1xuICAgICQoJyNkYXRhJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGF0YVwiKSk7XG4gIH07XG5cbiAgdGhpcy5zdG9yYWdlU2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm1hc3RlclwiLCAkKCcjbWFzdGVyLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicG9ydFwiLCAkKCcjcG9ydC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRva2VuXCIsICQoJyN0b2tlbi1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInJlcXVlc3RcIiwgJCgnI3JlcXVlc3QtaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lc3BhY2UtcGF0dGVyblwiLCAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIiwgJCgnI25hbWUtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIsICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImVudi1wYXR0ZXJuXCIsICQoJyNlbnYtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRhdGFcIiwgJCgnI2RhdGEnKS52YWwoKSk7XG5cbiAgfTtcbn07XG5cbmZ1bmN0aW9uIG1haW5GdW5jKCkge1xuICB2YXIgYXBwID0gbmV3IEFwcCgpO1xuICBhcHAuaW5pdCgpO1xufVxuXG53aW5kb3cub25sb2FkID0gbWFpbkZ1bmM7XG4iXX0=
