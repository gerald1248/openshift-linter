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
