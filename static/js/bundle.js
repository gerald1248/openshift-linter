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

  //draw chart
  this.drawChart = function(obj) {
    var ctx = $('#canvas01');
    var summary = obj.summary;
    
    var values = [
      (summary.g) ? summary.g.length : 0,
      (summary.ga) ? summary.ga.length : 0,
      (summary.a) ? summary.a.length : 0,
      (summary.ar) ? summary.ar.length : 0,
      (summary.r) ? summary.r.length : 0,
    ];

    var chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ["No issues", "1 issue", "2 issues", "3 issues", "4 or more issues"],
        datasets: [
          {
            data: values,
            backgroundColor: [
              'rgba(0, 255, 0, 1.0)',
              'rgba(127, 255, 0, 1.0)',
              'rgba(255, 255, 0, 1.0)',
              'rgba(255, 127, 0, 1.0)',
              'rgba(255, 0, 0, 1.0)'
            ],
            borderColor: [
              'rgba(0, 255, 0, 1.0)',
              'rgba(127, 255, 0, 1.0)',
              'rgba(255, 255, 0, 1.0)',
              'rgba(255, 127, 0, 1.0)',
              'rgba(255, 0, 0, 1.0)'
            ],
            borderWidth: 1            
          }
        ]
      },
      options: { responsive: false }
    });
  };

  //present report JSON in tabular form
  this.formatReport = function(obj) {
    var buffer = "";
    for (key in obj) {
      if (key === "summary") {
        continue;
      }
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

    this.drawChart(obj);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJvYmoiLCJKU09OIiwicGFyc2UiLCJ2YWwiLCJ0ZXh0IiwiY3VzdG9tTmFtZXNwYWNlTGFiZWwiLCJjdXN0b21OYW1lc3BhY2VQYXR0ZXJuIiwiY3VzdG9tTmFtZVBhdHRlcm4iLCJjdXN0b21Db250YWluZXJQYXR0ZXJuIiwiY3VzdG9tRW52UGF0dGVybiIsImxlbmd0aCIsImFqYXgiLCJ1cmwiLCJ0eXBlIiwiZGF0YSIsInN0cmluZ2lmeSIsImRhdGFUeXBlIiwiY29udGVudFR5cGUiLCJzdWNjZXNzIiwiaW5uZXJIVE1MIiwiZm9ybWF0UmVwb3J0IiwiZXJyb3IiLCJlcnIiLCJkcmF3Q2hhcnQiLCJjdHgiLCJzdW1tYXJ5IiwidmFsdWVzIiwiZyIsImdhIiwiYSIsImFyIiwiciIsIkNoYXJ0IiwibGFiZWxzIiwiZGF0YXNldHMiLCJiYWNrZ3JvdW5kQ29sb3IiLCJib3JkZXJDb2xvciIsImJvcmRlcldpZHRoIiwib3B0aW9ucyIsInJlc3BvbnNpdmUiLCJidWZmZXIiLCJrZXkiLCJzdWJrZXkiLCJsaXN0IiwibGVuIiwicGx1cmFsIiwiaSIsIm5vbkJsYW5rIiwiTmFtZXNwYWNlIiwiTmFtZSIsIkNvbnRhaW5lciIsInMiLCJtYXN0ZXIiLCJwb3J0IiwidG9rZW4iLCJyZXF1ZXN0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJtc2ciLCJyZXNwb25zZUpTT04iLCJtZXNzYWdlIiwic3RhdHVzVGV4dCIsInZhbHVlIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJ3aW5kb3ciLCJvbmxvYWQiXSwibWFwcGluZ3MiOiJB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QUFBa0MsYUFBQXBCLElBSUFkLEtBQUFHLGNBQUEsV0FDQSxtQkFBQSxnQkFJQUMsRUFBQSxpQkFBQWEsSUFBQTRELGFBQUFDLFFBQUEsV0FDQTFFLEVBQUEsZUFBQWEsSUFBQTRELGFBQUFDLFFBQUEsU0FDQTFFLEVBQUEsZ0JBQUFhLElBQUE0RCxhQUFBQyxRQUFBLFVBQ0ExRSxFQUFBLGtCQUFBYSxJQUFBNEQsYUFBQUMsUUFBQSxZQUNBMUUsRUFBQSxzQkFBQWEsSUFBQTRELGFBQUFDLFFBQUEsc0JBQ0ExRSxFQUFBLGlCQUFBYSxJQUFBNEQsYUFBQUMsUUFBQSxpQkFDQTFFLEVBQUEsc0JBQUFhLElBQUE0RCxhQUFBQyxRQUFBLHNCQUNBMUUsRUFBQSxnQkFBQWEsSUFBQTRELGFBQUFDLFFBQUEsZ0JBQ0ExRSxFQUFBLFNBQUFhLElBQUE0RCxhQUFBQyxRQUFBLFdBR0E5RSxLQUFBTSxjQUFBLFdBQ0EsbUJBQUEsZ0JBSUF1RSxhQUFBRSxRQUFBLFNBQUEzRSxFQUFBLGlCQUFBYSxPQUNBNEQsYUFBQUUsUUFBQSxPQUFBM0UsRUFBQSxlQUFBYSxPQUNBNEQsYUFBQUUsUUFBQSxRQUFBM0UsRUFBQSxnQkFBQWEsT0FDQTRELGFBQUFFLFFBQUEsVUFBQTNFLEVBQUEsa0JBQUFhLE9BQ0E0RCxhQUFBRSxRQUFBLG9CQUFBM0UsRUFBQSxzQkFBQWEsT0FDQTRELGFBQUFFLFFBQUEsZUFBQTNFLEVBQUEsaUJBQUFhLE9BQ0E0RCxhQUFBRSxRQUFBLG9CQUFBM0UsRUFBQSxzQkFBQWEsT0FDQTRELGFBQUFFLFFBQUEsY0FBQTNFLEVBQUEsZ0JBQUFhLE9BQ0E0RCxhQUFBRSxRQUFBLE9BQUEzRSxFQUFBLFNBQUFhLFNBU0ErRCxRQUFBQyxPQUFBckYiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEFwcCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvdW50ZXIgPSAwO1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zdG9yYWdlR2V0dGVyKCk7XG4gICAgJCgnI3VwZGF0ZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5nZXQoKTtcbiAgICB9KTtcbiAgICAkKCcjY3JlYXRlLXJlcG9ydC1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5wb3N0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5jbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkKCcjY29weS1idXR0b24nKTtcbiAgICB0aGlzLmNsaXBib2FyZC5vbignZXJyb3InLCBmdW5jdGlvbihlKSB7XG4gICAgICAvL1RPRE86IEN0cmwrQyBtZXNzYWdlIGZhbGxiYWNrXG4gICAgfSk7XG5cbiAgICAvL21vZGFsIGFjdGlvblxuICAgICQoJyNtb2RhbC1hY3Rpb24tYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNpZGVsb2FkKCk7XG4gICAgfSk7XG5cbiAgICAvL2tleWJvYXJkIGZvY3VzIG9uIHRleHRhcmVhIGZvciBxdWljayBwYXN0ZSBhY3Rpb25cbiAgICAvL25vdCBhbGxvd2VkIHRvIHJlYWQgZnJvbSBjbGlwYm9hcmRcbiAgICAkKCcjc2lkZWxvYWQtbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNtb2RhbC1zb3VyY2UnKS5mb2N1cygpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vUE9TVCBjb25maWcgb2JqZWN0cywgcmV0cmlldmUgcmVwb3J0XG4gIHRoaXMucG9zdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UoJCgnI2RhdGEnKS52YWwoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgJCgnI3JlcG9ydCcpLnRleHQoXCJDYW4ndCBwYXJzZSBKU09OIGRhdGFcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGN1c3RvbU5hbWVzcGFjZUxhYmVsID0gJCgnI25hbWVzcGFjZS1sYWJlbCcpLnZhbCgpO1xuICAgIHZhciBjdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbU5hbWVQYXR0ZXJuID0gJCgnI25hbWUtcGF0dGVybicpLnZhbCgpO1xuICAgIHZhciBjdXN0b21Db250YWluZXJQYXR0ZXJuID0gJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbUVudlBhdHRlcm4gPSAkKCcjZW52LXBhdHRlcm4nKS52YWwoKTtcbiAgICBpZiAoY3VzdG9tTmFtZXNwYWNlTGFiZWwubGVuZ3RoID4gMCkge1xuICAgICAgb2JqLmN1c3RvbU5hbWVzcGFjZUxhYmVsID0gY3VzdG9tTmFtZXNwYWNlTGFiZWw7XG4gICAgfVxuICAgIGlmIChjdXN0b21OYW1lc3BhY2VQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gY3VzdG9tTmFtZXNwYWNlUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbU5hbWVQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lUGF0dGVybiA9IGN1c3RvbU5hbWVQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tQ29udGFpbmVyUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9IGN1c3RvbUNvbnRhaW5lclBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21FbnZQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21FbnZQYXR0ZXJuID0gY3VzdG9tRW52UGF0dGVybjtcbiAgICB9XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG4gICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vZHJhdyBjaGFydFxuICB0aGlzLmRyYXdDaGFydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjdHggPSAkKCcjY2FudmFzMDEnKTtcbiAgICB2YXIgc3VtbWFyeSA9IG9iai5zdW1tYXJ5O1xuICAgIFxuICAgIHZhciB2YWx1ZXMgPSBbXG4gICAgICAoc3VtbWFyeS5nKSA/IHN1bW1hcnkuZy5sZW5ndGggOiAwLFxuICAgICAgKHN1bW1hcnkuZ2EpID8gc3VtbWFyeS5nYS5sZW5ndGggOiAwLFxuICAgICAgKHN1bW1hcnkuYSkgPyBzdW1tYXJ5LmEubGVuZ3RoIDogMCxcbiAgICAgIChzdW1tYXJ5LmFyKSA/IHN1bW1hcnkuYXIubGVuZ3RoIDogMCxcbiAgICAgIChzdW1tYXJ5LnIpID8gc3VtbWFyeS5yLmxlbmd0aCA6IDAsXG4gICAgXTtcblxuICAgIHZhciBjaGFydCA9IG5ldyBDaGFydChjdHgsIHtcbiAgICAgIHR5cGU6ICdwaWUnLFxuICAgICAgZGF0YToge1xuICAgICAgICBsYWJlbHM6IFtcIk5vIGlzc3Vlc1wiLCBcIjEgaXNzdWVcIiwgXCIyIGlzc3Vlc1wiLCBcIjMgaXNzdWVzXCIsIFwiNCBvciBtb3JlIGlzc3Vlc1wiXSxcbiAgICAgICAgZGF0YXNldHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkYXRhOiB2YWx1ZXMsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFtcbiAgICAgICAgICAgICAgJ3JnYmEoMCwgMjU1LCAwLCAxLjApJyxcbiAgICAgICAgICAgICAgJ3JnYmEoMTI3LCAyNTUsIDAsIDEuMCknLFxuICAgICAgICAgICAgICAncmdiYSgyNTUsIDI1NSwgMCwgMS4wKScsXG4gICAgICAgICAgICAgICdyZ2JhKDI1NSwgMTI3LCAwLCAxLjApJyxcbiAgICAgICAgICAgICAgJ3JnYmEoMjU1LCAwLCAwLCAxLjApJ1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGJvcmRlckNvbG9yOiBbXG4gICAgICAgICAgICAgICdyZ2JhKDAsIDI1NSwgMCwgMS4wKScsXG4gICAgICAgICAgICAgICdyZ2JhKDEyNywgMjU1LCAwLCAxLjApJyxcbiAgICAgICAgICAgICAgJ3JnYmEoMjU1LCAyNTUsIDAsIDEuMCknLFxuICAgICAgICAgICAgICAncmdiYSgyNTUsIDEyNywgMCwgMS4wKScsXG4gICAgICAgICAgICAgICdyZ2JhKDI1NSwgMCwgMCwgMS4wKSdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogMSAgICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnM6IHsgcmVzcG9uc2l2ZTogZmFsc2UgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cbiAgdGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYnVmZmVyID0gXCJcIjtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChrZXkgPT09IFwic3VtbWFyeVwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZm9yIChzdWJrZXkgaW4gb2JqW2tleV0pIHtcbiAgICAgICAgdmFyIGxpc3QgPSBvYmpba2V5XVtzdWJrZXldO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBwbHVyYWwgPSAobGVuID09PSAxKSA/IFwiXCIgOiBcInNcIlxuICAgICAgICBidWZmZXIgKz0gXCI8aDM+XCIgKyBrZXkgKyBcIjogXCIgKyBzdWJrZXkgKyBcIiAoXCIgKyBsZW4gKyBcIiBpdGVtXCIgKyBwbHVyYWwgKyBcIik8L2gzPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGFibGUgY2xhc3M9J3RhYmxlIHRhYmxlLXN0cmlwZWQnPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGhlYWQgY2xhc3M9J3RoZWFkLWRlZmF1bHQnPjx0cj48dGg+TmFtZXNwYWNlPC90aD48dGg+TmFtZTwvdGg+PHRoPkNvbnRhaW5lcjwvdGg+PC90cj48L3RoZWFkPlwiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gXCI8dHI+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLk5hbWVzcGFjZSkgKyBcIjwvdGQ+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLk5hbWUpICsgXCI8L3RkPjx0ZD5cIiArIHRoaXMubm9uQmxhbmsobGlzdFtpXS5Db250YWluZXIpICsgXCI8L3RkPjwvdHI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPC90YWJsZT5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjsgXG4gIH07XG5cbiAgdGhpcy5ub25CbGFuayA9IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAocy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBcIiZuZGFzaDtcIjtcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH07XG5cbiAgLy9HRVQgcmVxdWVzdCB0byBmZXRjaCBsaXN0IG9mIGNvbmZpZyBvYmplY3RzXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hc3RlciA9ICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgcG9ydCA9ICQoJyNwb3J0LWlucHV0JykudmFsKCk7XG4gICAgdmFyIHRva2VuID0gJCgnI3Rva2VuLWlucHV0JykudmFsKCk7XG4gICAgdmFyIHJlcXVlc3QgPSAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciB1cmwgPSBtYXN0ZXIgKyBcIjpcIiArIHBvcnQgKyByZXF1ZXN0O1xuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IFwiQmVhcmVyIFwiICsgdG9rZW5cbiAgICAgIH0sXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICQoJyNkYXRhJykudmFsKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgJCgnI2Vycm9yJylbMF0uaW5uZXJIVE1MID0gXCJcIlxuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IChlcnIucmVzcG9uc2VKU09OKSA/XG4gICAgICAgICAgZXJyLnJlc3BvbnNlSlNPTi5tZXNzYWdlIDpcbiAgICAgICAgICBlcnIuc3RhdHVzVGV4dDtcbiAgICAgICAgJCgnI2Vycm9yJylbMF0uaW5uZXJIVE1MID0gbXNnO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHRoaXMuc2lkZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcyA9ICQoJyNtb2RhbC1zb3VyY2UnKVswXS52YWx1ZTtcbiAgICB0cnkge1xuICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2Uocyk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZS5tZXNzYWdlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChvYmogPT09IHt9IHx8IG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Yob2JqKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBcIk5vIGRhdGFcIjtcbiAgICB9XG5cbiAgICB0aGlzLmRyYXdDaGFydChvYmopO1xuICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSB0aGlzLmZvcm1hdFJlcG9ydChvYmopO1xuICB9O1xuXG5cbiAgdGhpcy5zdG9yYWdlR2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAkKCcjbWFzdGVyLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibWFzdGVyXCIpKTtcbiAgICAkKCcjcG9ydC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInBvcnRcIikpO1xuICAgICQoJyN0b2tlbi1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRva2VuXCIpKTtcbiAgICAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInJlcXVlc3RcIikpO1xuICAgICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZS1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJjb250YWluZXItcGF0dGVyblwiKSk7XG4gICAgJCgnI2Vudi1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZW52LXBhdHRlcm5cIikpO1xuICAgICQoJyNkYXRhJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGF0YVwiKSk7XG4gIH07XG5cbiAgdGhpcy5zdG9yYWdlU2V0dGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZihsb2NhbFN0b3JhZ2UpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm1hc3RlclwiLCAkKCcjbWFzdGVyLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicG9ydFwiLCAkKCcjcG9ydC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInRva2VuXCIsICQoJyN0b2tlbi1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInJlcXVlc3RcIiwgJCgnI3JlcXVlc3QtaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lc3BhY2UtcGF0dGVyblwiLCAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIiwgJCgnI25hbWUtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIsICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImVudi1wYXR0ZXJuXCIsICQoJyNlbnYtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRhdGFcIiwgJCgnI2RhdGEnKS52YWwoKSk7XG4gIH07XG59O1xuXG5mdW5jdGlvbiBtYWluRnVuYygpIHtcbiAgdmFyIGFwcCA9IG5ldyBBcHAoKTtcbiAgYXBwLmluaXQoKTtcbn1cblxud2luZG93Lm9ubG9hZCA9IG1haW5GdW5jO1xuIl19
