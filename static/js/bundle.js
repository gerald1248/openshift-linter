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
    localStorage.setItem("data", $('#data').val());
  };
};

function mainFunc() {
  var app = new App();
  app.init();
}

window.onload = mainFunc;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInZhbCIsInRleHQiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImNvbnNvbGUiLCJsb2ciLCJpbm5lckhUTUwiLCJmb3JtYXRSZXBvcnQiLCJlcnJvciIsImVyciIsImJ1ZmZlciIsImtleSIsInN1YmtleSIsImxpc3QiLCJsZW4iLCJsZW5ndGgiLCJpIiwiTmFtZXNwYWNlIiwiTmFtZSIsIkNvbnRhaW5lciIsIm1hc3RlciIsInBvcnQiLCJ0b2tlbiIsInJlcXVlc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsIm1zZyIsInJlc3BvbnNlSlNPTiIsIm1lc3NhZ2UiLCJzdGF0dXNUZXh0IiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJ3aW5kb3ciLCJvbmxvYWQiXSwibWFwcGluZ3MiOiJBQWdJQSxRQUFBQSxZQUNBLEdBQUFDLEdBQUEsR0FBQUMsSUFDQUQsR0FBQUUsT0FsSUEsR0FBQUQsS0FBQSxXQUNBRSxLQUFBQyxRQUFBLEVBQ0FELEtBQUFELEtBQUEsV0FDQSxHQUFBRyxHQUFBRixJQUNBQSxNQUFBRyxnQkFDQUMsRUFBQSxrQkFBQUMsR0FBQSxRQUFBLFdBQ0FILEVBQUFJLGdCQUNBSixFQUFBSyxRQUVBSCxFQUFBLHlCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFNLFNBRUFSLEtBQUFTLFVBQUEsR0FBQUMsV0FBQSxnQkFDQVYsS0FBQVMsVUFBQUosR0FBQSxRQUFBLFNBQUFNLE9BT0FYLEtBQUFRLEtBQUEsV0FDQSxHQUFBTixHQUFBRixLQUNBWSxJQUNBLEtBQ0FBLEVBQUFDLEtBQUFDLE1BQUFWLEVBQUEsU0FBQVcsT0FDQSxNQUFBSixHQUVBLFdBREFQLEdBQUEsV0FBQVksS0FBQSx5QkFHQVosRUFBQWEsTUFDQUMsSUFBQSxvQkFDQUMsS0FBQSxPQUNBQyxLQUFBUCxLQUFBUSxVQUFBVCxHQUNBVSxTQUFBLE9BQ0FDLFlBQUEsa0NBQ0FDLFFBQUEsU0FBQUosR0FFQSxNQUFBLGdCQUFBLElBQ0FLLFFBQUFDLElBQUEsb0JBQ0F0QixFQUFBLFdBQUEsR0FBQXVCLFVBQUFkLEtBQUFRLFVBQUFELFVBR0FoQixFQUFBLFdBQUEsR0FBQXVCLFVBQUF6QixFQUFBMEIsYUFBQVIsS0FFQVMsTUFBQSxTQUFBQyxHQUNBMUIsRUFBQSxXQUFBLEdBQUF1QixVQUFBLDBCQU1BM0IsS0FBQTRCLGFBQUEsU0FBQWhCLEdBQ0EsR0FBQW1CLEdBQUEsRUFDQSxLQUFBQyxNQUFBcEIsR0FDQSxJQUFBcUIsU0FBQXJCLEdBQUFvQixLQUFBLENBQ0EsR0FBQUUsR0FBQXRCLEVBQUFvQixLQUFBQyxRQUNBRSxFQUFBRCxFQUFBRSxNQUNBLElBQUEsSUFBQUQsRUFBQSxDQUdBSixHQUFBLE9BQUFDLElBQUEsS0FBQUMsT0FBQSxRQUNBRixHQUFBLHNDQUNBQSxHQUFBLGlHQUNBLEtBQUEsR0FBQU0sR0FBQSxFQUFBQSxFQUFBRixFQUFBRSxJQUNBTixHQUFBLFdBQUFHLEVBQUFHLEdBQUFDLFVBQUEsWUFBQUosRUFBQUcsR0FBQUUsS0FBQSxZQUFBTCxFQUFBRyxHQUFBRyxVQUFBLFlBRUFULElBQUEsWUFHQSxNQUFBQSxJQUlBL0IsS0FBQU8sSUFBQSxXQUNBLEdBQUFrQyxHQUFBckMsRUFBQSxpQkFBQVcsTUFDQTJCLEVBQUF0QyxFQUFBLGVBQUFXLE1BQ0E0QixFQUFBdkMsRUFBQSxnQkFBQVcsTUFDQTZCLEVBQUF4QyxFQUFBLGtCQUFBVyxNQUNBRyxFQUFBdUIsRUFBQSxJQUFBQyxFQUFBRSxDQUNBbkIsU0FBQUMsSUFBQSxNQUFBUixHQUVBZCxFQUFBYSxNQUNBQyxJQUFBQSxFQUNBQyxLQUFBLE1BQ0FHLFNBQUEsT0FDQUMsWUFBQSxrQ0FDQXNCLFNBQ0FDLGNBQUEsVUFBQUgsR0FFQW5CLFFBQUEsU0FBQUosR0FDQWhCLEVBQUEsU0FBQVcsSUFBQUYsS0FBQVEsVUFBQUQsSUFDQWhCLEVBQUEsVUFBQSxHQUFBdUIsVUFBQSxJQUVBRSxNQUFBLFNBQUFDLEdBQ0EsR0FBQWlCLEdBQUFqQixFQUFBLGFBQ0FBLEVBQUFrQixhQUFBQyxRQUNBbkIsRUFBQW9CLFVBQ0E5QyxHQUFBLFVBQUEsR0FBQXVCLFVBQUFvQixNQUtBL0MsS0FBQUcsY0FBQSxXQUNBLG1CQUFBLGdCQUlBQyxFQUFBLGlCQUFBVyxJQUFBb0MsYUFBQUMsUUFBQSxXQUNBaEQsRUFBQSxlQUFBVyxJQUFBb0MsYUFBQUMsUUFBQSxTQUNBaEQsRUFBQSxnQkFBQVcsSUFBQW9DLGFBQUFDLFFBQUEsVUFDQWhELEVBQUEsa0JBQUFXLElBQUFvQyxhQUFBQyxRQUFBLFlBQ0FoRCxFQUFBLFNBQUFXLElBQUFvQyxhQUFBQyxRQUFBLFdBR0FwRCxLQUFBTSxjQUFBLFdBQ0EsbUJBQUEsZ0JBSUE2QyxhQUFBRSxRQUFBLFNBQUFqRCxFQUFBLGlCQUFBVyxPQUNBb0MsYUFBQUUsUUFBQSxPQUFBakQsRUFBQSxlQUFBVyxPQUNBb0MsYUFBQUUsUUFBQSxRQUFBakQsRUFBQSxnQkFBQVcsT0FDQW9DLGFBQUFFLFFBQUEsVUFBQWpELEVBQUEsa0JBQUFXLE9BQ0FvQyxhQUFBRSxRQUFBLE9BQUFqRCxFQUFBLFNBQUFXLFNBU0F1QyxRQUFBQyxPQUFBM0QiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEFwcCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvdW50ZXIgPSAwO1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zdG9yYWdlR2V0dGVyKCk7XG4gICAgJCgnI3VwZGF0ZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5nZXQoKTtcbiAgICB9KTtcbiAgICAkKCcjY3JlYXRlLXJlcG9ydC1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc3RvcmFnZVNldHRlcigpO1xuICAgICAgc2VsZi5wb3N0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5jbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkKCcjY29weS1idXR0b24nKTtcbiAgICB0aGlzLmNsaXBib2FyZC5vbignZXJyb3InLCBmdW5jdGlvbihlKSB7XG4gICAgICAvL1RPRE86IEN0cmwrQyBtZXNzYWdlIGZhbGxiYWNrXG4gICAgfSk7XG5cbiAgfTtcblxuICAvL1BPU1QgY29uZmlnIG9iamVjdHMsIHJldHJpZXZlIHJlcG9ydFxuICB0aGlzLnBvc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKCQoJyNkYXRhJykudmFsKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICQoJyNyZXBvcnQnKS50ZXh0KFwiQ2FuJ3QgcGFyc2UgSlNPTiBkYXRhXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG4gICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIk5PVEFOT0JKRUNUXCIpO1xuICAgICAgICAgICQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cbiAgdGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgYnVmZmVyID0gXCJcIjtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGZvciAoc3Via2V5IGluIG9ialtrZXldKSB7XG4gICAgICAgIHZhciBsaXN0ID0gb2JqW2tleV1bc3Via2V5XTtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPGgzPlwiICsga2V5ICsgXCI6IFwiICsgc3Via2V5ICsgXCI8L2gzPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGFibGUgY2xhc3M9J3RhYmxlIHRhYmxlLXN0cmlwZWQnPlwiO1xuICAgICAgICBidWZmZXIgKz0gXCI8dGhlYWQgY2xhc3M9J3RoZWFkLWRlZmF1bHQnPjx0cj48dGg+TmFtZXNwYWNlPC90aD48dGg+TmFtZTwvdGg+PHRoPkNvbnRhaW5lcjwvdGg+PC90cj48L3RoZWFkPlwiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gXCI8dHI+PHRkPlwiICsgbGlzdFtpXS5OYW1lc3BhY2UgKyBcIjwvdGQ+PHRkPlwiICsgbGlzdFtpXS5OYW1lICsgXCI8L3RkPjx0ZD5cIiArIGxpc3RbaV0uQ29udGFpbmVyICsgXCI8L3RkPjwvdHI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyICs9IFwiPC90YWJsZT5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjsgXG4gIH1cblxuICAvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuICAgIHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcbiAgICB2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcbiAgICB2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG4gICAgdmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG4gICAgY29uc29sZS5sb2coXCJHRVRcIiwgdXJsKTtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBcIkJlYXJlciBcIiArIHRva2VuXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkKCcjZGF0YScpLnZhbChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IFwiXCJcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSAoZXJyLnJlc3BvbnNlSlNPTikgP1xuICAgICAgICAgIGVyci5yZXNwb25zZUpTT04ubWVzc2FnZSA6XG4gICAgICAgICAgZXJyLnN0YXR1c1RleHQ7XG4gICAgICAgICQoJyNlcnJvcicpWzBdLmlubmVySFRNTCA9IG1zZztcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VHZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgICQoJyNtYXN0ZXItaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJtYXN0ZXJcIikpO1xuICAgICQoJyNwb3J0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicG9ydFwiKSk7XG4gICAgJCgnI3Rva2VuLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidG9rZW5cIikpO1xuICAgICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVxdWVzdFwiKSk7XG4gICAgJCgnI2RhdGEnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkYXRhXCIpKTtcbiAgfTtcblxuICB0aGlzLnN0b3JhZ2VTZXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibWFzdGVyXCIsICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwb3J0XCIsICQoJyNwb3J0LWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgJCgnI3Rva2VuLWlucHV0JykudmFsKCkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVxdWVzdFwiLCAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRhdGFcIiwgJCgnI2RhdGEnKS52YWwoKSk7XG4gIH07XG59O1xuXG5mdW5jdGlvbiBtYWluRnVuYygpIHtcbiAgdmFyIGFwcCA9IG5ldyBBcHAoKTtcbiAgYXBwLmluaXQoKTtcbn1cblxud2luZG93Lm9ubG9hZCA9IG1haW5GdW5jO1xuIl19
