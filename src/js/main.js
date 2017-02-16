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

		$('#charts').css({'display': 'none'});
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

	//draw chart (summary)
	this.drawChartSummary = function(obj) {
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

	//draw chart (issue type)
	this.drawChartIssueType = function(obj) {
		var ctx = $('#canvas02');
		var labels = [], lengths = [], colors = [];
		var max = 0;
		keys = Object.getOwnPropertyNames(obj);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key === 'summary') {
				continue;
			}
			var len = this.countChildren(obj[key]);
			labels.push(key);
			lengths.push(len);
			if (len > max) {
				max = len;
			}
		}

		//max is known, so determine HSL colors
		for (i = 0; i < lengths.length; i++) {
			var len = lengths[i];
			if (len === 0 || max === 0) {
				colors.push('rgba(0, 255, 0, 1.0)');
			} else {
				//need to invert value as 0 == red and 120 == green
				//however, bars that are displayed are by definition not 0-issue-bars
				//so stop at 100
				var val = 100*len/max;
				var inv = Math.abs(val - 100);
				var rounded = Math.round(inv)
				colors.push('hsl(' + rounded + ',100%,50%)');
			}
		}

		var chart = new Chart(ctx, {
			type: 'bar',
			data: {
				"labels": labels,
				"datasets": [{
					label: 'occurrences',
					data: lengths,
					backgroundColor: colors,
					borderColor: colors,
					borderWidth: 0
				}]
			},
			options: {
				responsive: false,
				legend: {
					display: false
				}
			}
		});
	};

	this.countChildren = function(obj) {
		var i = 0;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (!obj[key]) {
					// null value after skipping containers
					continue
				}
				i += obj[key].length;
			}
		}
		return i;
	};

	//present report JSON in tabular form
	this.formatReport = function(obj) {
		var buffer = "";
		for (key in obj) {
			if (key === "summary" || !obj[key]) {
				continue;
			}
			for (subkey in obj[key]) {
				if (!obj[key][subkey]) {
					continue;
				}
				var list = obj[key][subkey];
				var len = list.length;
				if (len === 0) {
					continue;
				}
				plural = (len === 1) ? "" : "s"
				buffer += "<h3>" + key + ": " + subkey + " (" + len + " item" + plural + ")</h3>";
				
				//special case: skip table when only one blank container spec given
				if (len === 1 && list[0].Namespace === "" && list[0].Name === "" && list[0].Container === "") {
					continue;
				}
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

		$('#charts').css({'display': 'block'});
		this.drawChartSummary(obj);
		this.drawChartIssueType(obj);

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
		$('#modal-source').val(localStorage.getItem("report"));
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
		localStorage.setItem("report", $('#modal-source').val());
	};
};

function mainFunc() {
	var app = new App();
	app.init();
}

window.onload = mainFunc;
