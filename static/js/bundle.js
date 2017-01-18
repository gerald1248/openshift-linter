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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJvYmoiLCJKU09OIiwicGFyc2UiLCJ2YWwiLCJ0ZXh0IiwiY3VzdG9tTmFtZXNwYWNlUGF0dGVybiIsImN1c3RvbU5hbWVQYXR0ZXJuIiwiY3VzdG9tQ29udGFpbmVyUGF0dGVybiIsImN1c3RvbUVudlBhdHRlcm4iLCJsZW5ndGgiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiYnVmZmVyIiwia2V5Iiwic3Via2V5IiwibGlzdCIsImxlbiIsInBsdXJhbCIsImkiLCJub25CbGFuayIsIk5hbWVzcGFjZSIsIk5hbWUiLCJDb250YWluZXIiLCJzIiwibWFzdGVyIiwicG9ydCIsInRva2VuIiwicmVxdWVzdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwibXNnIiwicmVzcG9uc2VKU09OIiwibWVzc2FnZSIsInN0YXR1c1RleHQiLCJ2YWx1ZSIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzZXRJdGVtIiwid2luZG93Iiwib25sb2FkIl0sIm1hcHBpbmdzIjoiQUEyTEEsUUFBQUEsWUFDQSxHQUFBQyxHQUFBLEdBQUFDLElBQ0FELEdBQUFFLE9BN0xBLEdBQUFELEtBQUEsV0FDQUUsS0FBQUMsUUFBQSxFQUNBRCxLQUFBRCxLQUFBLFdBQ0EsR0FBQUcsR0FBQUYsSUFDQUEsTUFBQUcsZ0JBQ0FDLEVBQUEsa0JBQUFDLEdBQUEsUUFBQSxXQUNBSCxFQUFBSSxnQkFDQUosRUFBQUss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QUFBLE9BQUF6RCxFQUFBLFNBQUFhLFNBU0E2QyxRQUFBQyxPQUFBbkUiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEFwcCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvdW50ZXIgPSAwO1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zdG9yYWdlR2V0dGVyKCk7XG4gICAgJCgnI3VwZGF0ZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5nZXQoKTtcbiAgICB9KTtcbiAgICAkKCcjY3JlYXRlLXJlcG9ydC1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5wb3N0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5jbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkKCcjY29weS1idXR0b24nKTtcbiAgICB0aGlzLmNsaXBib2FyZC5vbignZXJyb3InLCBmdW5jdGlvbihlKSB7XG4gICAgICAvL1RPRE86IEN0cmwrQyBtZXNzYWdlIGZhbGxiYWNrXG4gICAgfSk7XG5cbiAgICAvL21vZGFsIGFjdGlvblxuICAgICQoJyNtb2RhbC1hY3Rpb24tYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNpZGVsb2FkKCk7XG4gICAgfSk7XG5cbiAgICAvL2tleWJvYXJkIGZvY3VzIG9uIHRleHRhcmVhIGZvciBxdWljayBwYXN0ZSBhY3Rpb25cbiAgICAvL25vdCBhbGxvd2VkIHRvIHJlYWQgZnJvbSBjbGlwYm9hcmRcbiAgICAkKCcjc2lkZWxvYWQtbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNtb2RhbC1zb3VyY2UnKS5mb2N1cygpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vUE9TVCBjb25maWcgb2JqZWN0cywgcmV0cmlldmUgcmVwb3J0XG4gIHRoaXMucG9zdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgb2JqID0ge307XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UoJCgnI2RhdGEnKS52YWwoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgJCgnI3JlcG9ydCcpLnRleHQoXCJDYW4ndCBwYXJzZSBKU09OIGRhdGFcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tTmFtZVBhdHRlcm4gPSAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCk7XG4gICAgdmFyIGN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKTtcbiAgICB2YXIgY3VzdG9tRW52UGF0dGVybiA9ICQoJyNlbnYtcGF0dGVybicpLnZhbCgpO1xuICAgIGlmIChjdXN0b21OYW1lc3BhY2VQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gY3VzdG9tTmFtZXNwYWNlUGF0dGVybjtcbiAgICB9XG4gICAgaWYgKGN1c3RvbU5hbWVQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21OYW1lUGF0dGVybiA9IGN1c3RvbU5hbWVQYXR0ZXJuO1xuICAgIH1cbiAgICBpZiAoY3VzdG9tQ29udGFpbmVyUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICBvYmouY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9IGN1c3RvbUNvbnRhaW5lclBhdHRlcm47XG4gICAgfVxuICAgIGlmIChjdXN0b21FbnZQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iai5jdXN0b21FbnZQYXR0ZXJuID0gY3VzdG9tRW52UGF0dGVybjtcbiAgICB9XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG4gICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cbiAgdGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYnVmZmVyID0gXCJcIjtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGZvciAoc3Via2V5IGluIG9ialtrZXldKSB7XG4gICAgICAgIHZhciBsaXN0ID0gb2JqW2tleV1bc3Via2V5XTtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgcGx1cmFsID0gKGxlbiA9PT0gMSkgPyBcIlwiIDogXCJzXCJcbiAgICAgICAgYnVmZmVyICs9IFwiPGgzPlwiICsga2V5ICsgXCI6IFwiICsgc3Via2V5ICsgXCIgKFwiICsgbGVuICsgXCIgaXRlbVwiICsgcGx1cmFsICsgXCIpPC9oMz5cIjtcbiAgICAgICAgYnVmZmVyICs9IFwiPHRhYmxlIGNsYXNzPSd0YWJsZSB0YWJsZS1zdHJpcGVkJz5cIjtcbiAgICAgICAgYnVmZmVyICs9IFwiPHRoZWFkIGNsYXNzPSd0aGVhZC1kZWZhdWx0Jz48dHI+PHRoPk5hbWVzcGFjZTwvdGg+PHRoPk5hbWU8L3RoPjx0aD5Db250YWluZXI8L3RoPjwvdHI+PC90aGVhZD5cIjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgYnVmZmVyICs9IFwiPHRyPjx0ZD5cIiArIHRoaXMubm9uQmxhbmsobGlzdFtpXS5OYW1lc3BhY2UpICsgXCI8L3RkPjx0ZD5cIiArIHRoaXMubm9uQmxhbmsobGlzdFtpXS5OYW1lKSArIFwiPC90ZD48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uQ29udGFpbmVyKSArIFwiPC90ZD48L3RyPlwiO1xuICAgICAgICB9XG4gICAgICAgIGJ1ZmZlciArPSBcIjwvdGFibGU+XCI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidWZmZXI7IFxuICB9O1xuXG4gIHRoaXMubm9uQmxhbmsgPSBmdW5jdGlvbihzKSB7XG4gICAgaWYgKHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gXCImbmRhc2g7XCI7XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9O1xuXG4gIC8vR0VUIHJlcXVlc3QgdG8gZmV0Y2ggbGlzdCBvZiBjb25maWcgb2JqZWN0c1xuICB0aGlzLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXN0ZXIgPSAkKCcjbWFzdGVyLWlucHV0JykudmFsKCk7XG4gICAgdmFyIHBvcnQgPSAkKCcjcG9ydC1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciB0b2tlbiA9ICQoJyN0b2tlbi1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciByZXF1ZXN0ID0gJCgnI3JlcXVlc3QtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdXJsID0gbWFzdGVyICsgXCI6XCIgKyBwb3J0ICsgcmVxdWVzdDtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBcIkJlYXJlciBcIiArIHRva2VuXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkKCcjZGF0YScpLnZhbChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IFwiXCJcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSAoZXJyLnJlc3BvbnNlSlNPTikgP1xuICAgICAgICAgIGVyci5yZXNwb25zZUpTT04ubWVzc2FnZSA6XG4gICAgICAgICAgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IG1zZztcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB0aGlzLnNpZGVsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHMgPSAkKCcjbW9kYWwtc291cmNlJylbMF0udmFsdWU7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IGUubWVzc2FnZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2JqID09PSB7fSB8fCBvYmogPT09IG51bGwgfHwgdHlwZW9mKG9iaikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gXCJObyBkYXRhXCI7XG4gICAgfVxuXG4gICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHRoaXMuZm9ybWF0UmVwb3J0KG9iaik7XG4gIH07XG5cblxuICB0aGlzLnN0b3JhZ2VHZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgICQoJyNtYXN0ZXItaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJtYXN0ZXJcIikpO1xuICAgICQoJyNwb3J0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicG9ydFwiKSk7XG4gICAgJCgnI3Rva2VuLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidG9rZW5cIikpO1xuICAgICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVxdWVzdFwiKSk7XG4gICAgJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIikpO1xuICAgICQoJyNuYW1lLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIikpO1xuICAgICQoJyNjb250YWluZXItcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIpKTtcbiAgICAkKCcjZW52LXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJlbnYtcGF0dGVyblwiKSk7XG4gICAgJCgnI2RhdGEnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkYXRhXCIpKTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VTZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibWFzdGVyXCIsICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwb3J0XCIsICQoJyNwb3J0LWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgJCgnI3Rva2VuLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVxdWVzdFwiLCAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIsICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWUtcGF0dGVyblwiLCAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIiwgJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZW52LXBhdHRlcm5cIiwgJCgnI2Vudi1wYXR0ZXJuJykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZGF0YVwiLCAkKCcjZGF0YScpLnZhbCgpKTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIG1haW5GdW5jKCkge1xuICB2YXIgYXBwID0gbmV3IEFwcCgpO1xuICBhcHAuaW5pdCgpO1xufVxuXG53aW5kb3cub25sb2FkID0gbWFpbkZ1bmM7XG4iXX0=
