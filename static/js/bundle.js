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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJjc3MiLCJkaXNwbGF5Iiwib2JqIiwiSlNPTiIsInBhcnNlIiwidmFsIiwidGV4dCIsImN1c3RvbU5hbWVzcGFjZUxhYmVsIiwiY3VzdG9tTmFtZXNwYWNlUGF0dGVybiIsImN1c3RvbU5hbWVQYXR0ZXJuIiwiY3VzdG9tQ29udGFpbmVyUGF0dGVybiIsImN1c3RvbUVudlBhdHRlcm4iLCJsZW5ndGgiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiZHJhd0NoYXJ0U3VtbWFyeSIsImN0eCIsInN1bW1hcnkiLCJ2YWx1ZXMiLCJnIiwiZ2EiLCJhIiwiYXIiLCJyIiwiQ2hhcnQiLCJsYWJlbHMiLCJkYXRhc2V0cyIsImJhY2tncm91bmRDb2xvciIsImJvcmRlckNvbG9yIiwiYm9yZGVyV2lkdGgiLCJvcHRpb25zIiwicmVzcG9uc2l2ZSIsImRyYXdDaGFydElzc3VlVHlwZSIsImxlbmd0aHMiLCJjb2xvcnMiLCJtYXgiLCJrZXlzIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsImkiLCJrZXkiLCJsZW4iLCJjb3VudENoaWxkcmVuIiwicHVzaCIsImludiIsIk1hdGgiLCJhYnMiLCJyb3VuZGVkIiwicm91bmQiLCJsYWJlbCIsImxlZ2VuZCIsImhhc093blByb3BlcnR5IiwiYnVmZmVyIiwic3Via2V5IiwibGlzdCIsInBsdXJhbCIsIk5hbWVzcGFjZSIsIk5hbWUiLCJDb250YWluZXIiLCJub25CbGFuayIsInMiLCJtYXN0ZXIiLCJwb3J0IiwidG9rZW4iLCJyZXF1ZXN0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJtc2ciLCJyZXNwb25zZUpTT04iLCJtZXNzYWdlIiwic3RhdHVzVGV4dCIsInZhbHVlIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJ3aW5kb3ciLCJvbmxvYWQiXSwibWFwcGluZ3MiOiJBQWtVQSxRQUFBQSxhQUNBLEdBQUFDLE1BQ0FDLE9BcFVBLEdBQUFELEtBQUEsV0FDQUUsS0FBQUMsUUFBQSxFQUNBRCxLQUFBRCxLQUFBLFdBQ0EsR0FBQUcsR0FBQUYsSUFDQUEsTUFBQUcsZ0JBQ0FDLEVBQUEsa0JBQUFDLEdBQUEsUUFBQSxXQUNBSCxFQUFBSSxnQkFDQUosRUFBQUssUUFFQUgsRUFBQSx5QkFBQUMsR0FBQSxRQUFBLFdBQ0FILEVBQUFJLGdCQUNBSixFQUFBTSxTQUVBUixLQUFBUyxVQUFBLEdBQUFDLFdBQUEsZ0JBQ0FWLEtBQUFTLFVBQUFKLEdBQUEsUUFBQSxTQUFBTSxNQUtBUCxFQUFBLHdCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQVUsYUFLQVIsRUFBQSxtQkFBQUMsR0FBQSxpQkFBQSxXQUNBRCxFQUFBLGlCQUFBUyxVQUdBVCxFQUFBLFdBQUFVLEtBQUFDLFFBQUEsVUFJQWYsS0FBQVEsS0FBQSxXQUNBLEdBQUFOLEdBQUFGLEtBQ0FnQixJQUNBLEtBQ0FBLEVBQUFDLEtBQUFDLE1BQUFkLEVBQUEsU0FBQWUsT0FDQSxNQUFBUixHQUVBLFdBREFQLEdBQUEsV0FBQWdCLEtBQUEseUJBSUEsR0FBQUMsR0FBQWpCLEVBQUEsb0JBQUFlLE1BQ0FHLEVBQUFsQixFQUFBLHNCQUFBZSxNQUNBSSxFQUFBbkIsRUFBQSxpQkFBQWUsTUFDQUssRUFBQXBCLEVBQUEsc0JBQUFlLE1BQ0FNLEVBQUFyQixFQUFBLGdCQUFBZSxLQUNBRSxHQUFBSyxPQUFBLElBQ0FWLEVBQUFLLHFCQUFBQSxHQUVBQyxFQUFBSSxPQUFBLElBQ0FWLEVB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QTlGLEVBQUEsa0JBQUFlLE9BQ0E2RSxhQUFBRSxRQUFBLG9CQUFBOUYsRUFBQSxzQkFBQWUsT0FDQTZFLGFBQUFFLFFBQUEsZUFBQTlGLEVBQUEsaUJBQUFlLE9BQ0E2RSxhQUFBRSxRQUFBLG9CQUFBOUYsRUFBQSxzQkFBQWUsT0FDQTZFLGFBQUFFLFFBQUEsY0FBQTlGLEVBQUEsZ0JBQUFlLE9BQ0E2RSxhQUFBRSxRQUFBLE9BQUE5RixFQUFBLFNBQUFlLE9BQ0E2RSxhQUFBRSxRQUFBLFNBQUE5RixFQUFBLGlCQUFBZSxTQVNBZ0YsUUFBQUMsT0FBQXZHIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHAgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5jb3VudGVyID0gMDtcblx0dGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHRoaXMuc3RvcmFnZUdldHRlcigpO1xuXHRcdCQoJyN1cGRhdGUtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcblx0XHRcdHNlbGYuZ2V0KCk7XG5cdFx0fSk7XG5cdFx0JCgnI2NyZWF0ZS1yZXBvcnQtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcblx0XHRcdHNlbGYucG9zdCgpO1xuXHRcdH0pO1xuXHRcdHRoaXMuY2xpcGJvYXJkID0gbmV3IENsaXBib2FyZCgnI2NvcHktYnV0dG9uJyk7XG5cdFx0dGhpcy5jbGlwYm9hcmQub24oJ2Vycm9yJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0Ly9UT0RPOiBDdHJsK0MgbWVzc2FnZSBmYWxsYmFja1xuXHRcdH0pO1xuXG5cdFx0Ly9tb2RhbCBhY3Rpb25cblx0XHQkKCcjbW9kYWwtYWN0aW9uLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zaWRlbG9hZCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly9rZXlib2FyZCBmb2N1cyBvbiB0ZXh0YXJlYSBmb3IgcXVpY2sgcGFzdGUgYWN0aW9uXG5cdFx0Ly9ub3QgYWxsb3dlZCB0byByZWFkIGZyb20gY2xpcGJvYXJkXG5cdFx0JCgnI3NpZGVsb2FkLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkKCcjbW9kYWwtc291cmNlJykuZm9jdXMoKTtcblx0XHR9KTtcblxuXHRcdCQoJyNjaGFydHMnKS5jc3MoeydkaXNwbGF5JzogJ25vbmUnfSk7XG5cdH07XG5cblx0Ly9QT1NUIGNvbmZpZyBvYmplY3RzLCByZXRyaWV2ZSByZXBvcnRcblx0dGhpcy5wb3N0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBvYmogPSB7fTtcblx0XHR0cnkge1xuXHRcdFx0b2JqID0gSlNPTi5wYXJzZSgkKCcjZGF0YScpLnZhbCgpKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQkKCcjcmVwb3J0JykudGV4dChcIkNhbid0IHBhcnNlIEpTT04gZGF0YVwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgY3VzdG9tTmFtZXNwYWNlTGFiZWwgPSAkKCcjbmFtZXNwYWNlLWxhYmVsJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKTtcblx0XHR2YXIgY3VzdG9tTmFtZVBhdHRlcm4gPSAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKTtcblx0XHR2YXIgY3VzdG9tRW52UGF0dGVybiA9ICQoJyNlbnYtcGF0dGVybicpLnZhbCgpO1xuXHRcdGlmIChjdXN0b21OYW1lc3BhY2VMYWJlbC5sZW5ndGggPiAwKSB7XG5cdFx0XHRvYmouY3VzdG9tTmFtZXNwYWNlTGFiZWwgPSBjdXN0b21OYW1lc3BhY2VMYWJlbDtcblx0XHR9XG5cdFx0aWYgKGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSBjdXN0b21OYW1lc3BhY2VQYXR0ZXJuO1xuXHRcdH1cblx0XHRpZiAoY3VzdG9tTmFtZVBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbU5hbWVQYXR0ZXJuID0gY3VzdG9tTmFtZVBhdHRlcm47XG5cdFx0fVxuXHRcdGlmIChjdXN0b21Db250YWluZXJQYXR0ZXJuLmxlbmd0aCA+IDApIHtcblx0XHRcdG9iai5jdXN0b21Db250YWluZXJQYXR0ZXJuID0gY3VzdG9tQ29udGFpbmVyUGF0dGVybjtcblx0XHR9XG5cdFx0aWYgKGN1c3RvbUVudlBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbUVudlBhdHRlcm4gPSBjdXN0b21FbnZQYXR0ZXJuO1xuXHRcdH1cblxuXHRcdCQuYWpheCh7XG5cdFx0XHR1cmw6IFwiL29wZW5zaGlmdC1saW50ZXJcIixcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkob2JqKSxcblx0XHRcdGRhdGFUeXBlOiBcImpzb25cIixcblx0XHRcdGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0Ly9UT0RPOiBlcnJvciBtZXNzYWdlcyBzaG91bGQgYmUgSlNPTiB0b29cblx0XHRcdFx0aWYgKHR5cGVvZihkYXRhKSAhPT0gXCJvYmplY3RcIikge1xuXHRcdFx0XHRcdCQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBkYXRhO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gc2VsZi5mb3JtYXRSZXBvcnQoZGF0YSk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gXCJQT1NUIHJlcXVlc3QgZmFpbGVkXCI7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly9kcmF3IGNoYXJ0IChzdW1tYXJ5KVxuXHR0aGlzLmRyYXdDaGFydFN1bW1hcnkgPSBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgY3R4ID0gJCgnI2NhbnZhczAxJyk7XG5cdFx0dmFyIHN1bW1hcnkgPSBvYmouc3VtbWFyeTtcblxuXHRcdHZhciB2YWx1ZXMgPSBbXG5cdFx0XHQoc3VtbWFyeS5nKSA/IHN1bW1hcnkuZy5sZW5ndGggOiAwLFxuXHRcdFx0KHN1bW1hcnkuZ2EpID8gc3VtbWFyeS5nYS5sZW5ndGggOiAwLFxuXHRcdFx0KHN1bW1hcnkuYSkgPyBzdW1tYXJ5LmEubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LmFyKSA/IHN1bW1hcnkuYXIubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LnIpID8gc3VtbWFyeS5yLmxlbmd0aCA6IDAsXG5cdFx0XTtcblxuXHRcdHZhciBjaGFydCA9IG5ldyBDaGFydChjdHgsIHtcblx0XHRcdHR5cGU6ICdwaWUnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRsYWJlbHM6IFtcIk5vIGlzc3Vlc1wiLCBcIjEgaXNzdWVcIiwgXCIyIGlzc3Vlc1wiLCBcIjMgaXNzdWVzXCIsIFwiNCBvciBtb3JlIGlzc3Vlc1wiXSxcblx0XHRcdFx0ZGF0YXNldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRhdGE6IHZhbHVlcyxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IFtcblx0XHRcdFx0XHRcdCdyZ2JhKDAsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgxMjcsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDEyNywgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDAsIDAsIDEuMCknXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRib3JkZXJDb2xvcjogW1xuXHRcdFx0XHRcdFx0J3JnYmEoMCwgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDEyNywgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMTI3LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMCwgMCwgMS4wKSdcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGJvcmRlcldpZHRoOiAxICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IHsgcmVzcG9uc2l2ZTogZmFsc2UgfVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8vZHJhdyBjaGFydCAoaXNzdWUgdHlwZSlcblx0dGhpcy5kcmF3Q2hhcnRJc3N1ZVR5cGUgPSBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgY3R4ID0gJCgnI2NhbnZhczAyJyk7XG5cdFx0dmFyIGxhYmVscyA9IFtdLCBsZW5ndGhzID0gW10sIGNvbG9ycyA9IFtdO1xuXHRcdHZhciBtYXggPSAwO1xuXHRcdGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGtleSA9IGtleXNbaV07XG5cdFx0XHRpZiAoa2V5ID09PSAnc3VtbWFyeScpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHR2YXIgbGVuID0gdGhpcy5jb3VudENoaWxkcmVuKG9ialtrZXldKTtcblx0XHRcdGxhYmVscy5wdXNoKGtleSk7XG5cdFx0XHRsZW5ndGhzLnB1c2gobGVuKTtcblx0XHRcdGlmIChsZW4gPiBtYXgpIHtcblx0XHRcdFx0bWF4ID0gbGVuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vbWF4IGlzIGtub3duLCBzbyBkZXRlcm1pbmUgSFNMIGNvbG9yc1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGhzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbGVuID0gbGVuZ3Roc1tpXTtcblx0XHRcdGlmIChsZW4gPT09IDAgfHwgbWF4ID09PSAwKSB7XG5cdFx0XHRcdGNvbG9ycy5wdXNoKCdyZ2JhKDAsIDI1NSwgMCwgMS4wKScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly9uZWVkIHRvIGludmVydCB2YWx1ZSBhcyAwID09IHJlZCBhbmQgMTIwID09IGdyZWVuXG5cdFx0XHRcdC8vaG93ZXZlciwgYmFycyB0aGF0IGFyZSBkaXNwbGF5ZWQgYXJlIGJ5IGRlZmluaXRpb24gbm90IDAtaXNzdWUtYmFyc1xuXHRcdFx0XHQvL3NvIHN0b3AgYXQgMTAwXG5cdFx0XHRcdHZhciB2YWwgPSAxMDAqbGVuL21heDtcblx0XHRcdFx0dmFyIGludiA9IE1hdGguYWJzKHZhbCAtIDEwMCk7XG5cdFx0XHRcdHZhciByb3VuZGVkID0gTWF0aC5yb3VuZChpbnYpXG5cdFx0XHRcdGNvbG9ycy5wdXNoKCdoc2woJyArIHJvdW5kZWQgKyAnLDEwMCUsNTAlKScpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBjaGFydCA9IG5ldyBDaGFydChjdHgsIHtcblx0XHRcdHR5cGU6ICdiYXInLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcImxhYmVsc1wiOiBsYWJlbHMsXG5cdFx0XHRcdFwiZGF0YXNldHNcIjogW3tcblx0XHRcdFx0XHRsYWJlbDogJ29jY3VycmVuY2VzJyxcblx0XHRcdFx0XHRkYXRhOiBsZW5ndGhzLFxuXHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogY29sb3JzLFxuXHRcdFx0XHRcdGJvcmRlckNvbG9yOiBjb2xvcnMsXG5cdFx0XHRcdFx0Ym9yZGVyV2lkdGg6IDBcblx0XHRcdFx0fV1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdHJlc3BvbnNpdmU6IGZhbHNlLFxuXHRcdFx0XHRsZWdlbmQ6IHtcblx0XHRcdFx0XHRkaXNwbGF5OiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5jb3VudENoaWxkcmVuID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGZvciAoa2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGlmICghb2JqW2tleV0pIHtcblx0XHRcdFx0XHQvLyBudWxsIHZhbHVlIGFmdGVyIHNraXBwaW5nIGNvbnRhaW5lcnNcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGkgKz0gb2JqW2tleV0ubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaTtcblx0fTtcblxuXHQvL3ByZXNlbnQgcmVwb3J0IEpTT04gaW4gdGFidWxhciBmb3JtXG5cdHRoaXMuZm9ybWF0UmVwb3J0ID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dmFyIGJ1ZmZlciA9IFwiXCI7XG5cdFx0Zm9yIChrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAoa2V5ID09PSBcInN1bW1hcnlcIiB8fCAhb2JqW2tleV0pIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKHN1YmtleSBpbiBvYmpba2V5XSkge1xuXHRcdFx0XHRpZiAoIW9ialtrZXldW3N1YmtleV0pIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgbGlzdCA9IG9ialtrZXldW3N1YmtleV07XG5cdFx0XHRcdHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcblx0XHRcdFx0aWYgKGxlbiA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHBsdXJhbCA9IChsZW4gPT09IDEpID8gXCJcIiA6IFwic1wiXG5cdFx0XHRcdGJ1ZmZlciArPSBcIjxoMz5cIiArIGtleSArIFwiOiBcIiArIHN1YmtleSArIFwiIChcIiArIGxlbiArIFwiIGl0ZW1cIiArIHBsdXJhbCArIFwiKTwvaDM+XCI7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3NwZWNpYWwgY2FzZTogc2tpcCB0YWJsZSB3aGVuIG9ubHkgb25lIGJsYW5rIGNvbnRhaW5lciBzcGVjIGdpdmVuXG5cdFx0XHRcdGlmIChsZW4gPT09IDEgJiYgbGlzdFswXS5OYW1lc3BhY2UgPT09IFwiXCIgJiYgbGlzdFswXS5OYW1lID09PSBcIlwiICYmIGxpc3RbMF0uQ29udGFpbmVyID09PSBcIlwiKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnVmZmVyICs9IFwiPHRhYmxlIGNsYXNzPSd0YWJsZSB0YWJsZS1zdHJpcGVkJz5cIjtcblx0XHRcdFx0YnVmZmVyICs9IFwiPHRoZWFkIGNsYXNzPSd0aGVhZC1kZWZhdWx0Jz48dHI+PHRoPk5hbWVzcGFjZTwvdGg+PHRoPk5hbWU8L3RoPjx0aD5Db250YWluZXI8L3RoPjwvdHI+PC90aGVhZD5cIjtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdGJ1ZmZlciArPSBcIjx0cj48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZXNwYWNlKSArIFwiPC90ZD48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZSkgKyBcIjwvdGQ+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLkNvbnRhaW5lcikgKyBcIjwvdGQ+PC90cj5cIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRidWZmZXIgKz0gXCI8L3RhYmxlPlwiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYnVmZmVyOyBcblx0fTtcblxuXHR0aGlzLm5vbkJsYW5rID0gZnVuY3Rpb24ocykge1xuXHRcdGlmIChzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFwiJm5kYXNoO1wiO1xuXHRcdH1cblx0XHRyZXR1cm4gcztcblx0fTtcblxuXHQvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcblx0dGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuXHRcdHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcblx0XHR2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcblx0XHR2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG5cdFx0dmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG5cblx0XHQkLmFqYXgoe1xuXHRcdFx0dXJsOiB1cmwsXG5cdFx0XHR0eXBlOiBcIkdFVFwiLFxuXHRcdFx0ZGF0YVR5cGU6IFwianNvblwiLFxuXHRcdFx0Y29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcIkF1dGhvcml6YXRpb25cIjogXCJCZWFyZXIgXCIgKyB0b2tlblxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0JCgnI2RhdGEnKS52YWwoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXHRcdFx0XHQkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBcIlwiXG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHR2YXIgbXNnID0gKGVyci5yZXNwb25zZUpTT04pID9cblx0XHRcdFx0XHRlcnIucmVzcG9uc2VKU09OLm1lc3NhZ2UgOlxuXHRcdFx0XHRcdGVyci5zdGF0dXNUZXh0O1xuXHRcdFx0XHQkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBtc2c7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5zaWRlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzID0gJCgnI21vZGFsLXNvdXJjZScpWzBdLnZhbHVlO1xuXHRcdHRyeSB7XG5cdFx0XHR2YXIgb2JqID0gSlNPTi5wYXJzZShzKTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdCQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBlLm1lc3NhZ2U7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG9iaiA9PT0ge30gfHwgb2JqID09PSBudWxsIHx8IHR5cGVvZihvYmopID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0JCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiTm8gZGF0YVwiO1xuXHRcdH1cblxuXHRcdCQoJyNjaGFydHMnKS5jc3MoeydkaXNwbGF5JzogJ2Jsb2NrJ30pO1xuXHRcdHRoaXMuZHJhd0NoYXJ0U3VtbWFyeShvYmopO1xuXHRcdHRoaXMuZHJhd0NoYXJ0SXNzdWVUeXBlKG9iaik7XG5cblx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gdGhpcy5mb3JtYXRSZXBvcnQob2JqKTtcblx0fTtcblxuXG5cdHRoaXMuc3RvcmFnZUdldHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2YobG9jYWxTdG9yYWdlKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0JCgnI21hc3Rlci1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm1hc3RlclwiKSk7XG5cdFx0JCgnI3BvcnQtaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJwb3J0XCIpKTtcblx0XHQkKCcjdG9rZW4taW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ0b2tlblwiKSk7XG5cdFx0JCgnI3JlcXVlc3QtaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJyZXF1ZXN0XCIpKTtcblx0XHQkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lc3BhY2UtcGF0dGVyblwiKSk7XG5cdFx0JCgnI25hbWUtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5hbWUtcGF0dGVyblwiKSk7XG5cdFx0JCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIikpO1xuXHRcdCQoJyNlbnYtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImVudi1wYXR0ZXJuXCIpKTtcblx0XHQkKCcjZGF0YScpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImRhdGFcIikpO1xuXHRcdCQoJyNtb2RhbC1zb3VyY2UnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJyZXBvcnRcIikpO1xuXHR9O1xuXG5cdHRoaXMuc3RvcmFnZVNldHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2YobG9jYWxTdG9yYWdlKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJtYXN0ZXJcIiwgJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInBvcnRcIiwgJCgnI3BvcnQtaW5wdXQnKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0b2tlblwiLCAkKCcjdG9rZW4taW5wdXQnKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJyZXF1ZXN0XCIsICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIiwgJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibmFtZS1wYXR0ZXJuXCIsICQoJyNuYW1lLXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJjb250YWluZXItcGF0dGVyblwiLCAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJlbnYtcGF0dGVyblwiLCAkKCcjZW52LXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJkYXRhXCIsICQoJyNkYXRhJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVwb3J0XCIsICQoJyNtb2RhbC1zb3VyY2UnKS52YWwoKSk7XG5cdH07XG59O1xuXG5mdW5jdGlvbiBtYWluRnVuYygpIHtcblx0dmFyIGFwcCA9IG5ldyBBcHAoKTtcblx0YXBwLmluaXQoKTtcbn1cblxud2luZG93Lm9ubG9hZCA9IG1haW5GdW5jO1xuIl19
