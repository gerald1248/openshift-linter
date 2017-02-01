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
				i += obj[key].length;
			}
		}
		return i;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJjc3MiLCJkaXNwbGF5Iiwib2JqIiwiSlNPTiIsInBhcnNlIiwidmFsIiwidGV4dCIsImN1c3RvbU5hbWVzcGFjZUxhYmVsIiwiY3VzdG9tTmFtZXNwYWNlUGF0dGVybiIsImN1c3RvbU5hbWVQYXR0ZXJuIiwiY3VzdG9tQ29udGFpbmVyUGF0dGVybiIsImN1c3RvbUVudlBhdHRlcm4iLCJsZW5ndGgiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiZHJhd0NoYXJ0U3VtbWFyeSIsImN0eCIsInN1bW1hcnkiLCJ2YWx1ZXMiLCJnIiwiZ2EiLCJhIiwiYXIiLCJyIiwiQ2hhcnQiLCJsYWJlbHMiLCJkYXRhc2V0cyIsImJhY2tncm91bmRDb2xvciIsImJvcmRlckNvbG9yIiwiYm9yZGVyV2lkdGgiLCJvcHRpb25zIiwicmVzcG9uc2l2ZSIsImRyYXdDaGFydElzc3VlVHlwZSIsImxlbmd0aHMiLCJjb2xvcnMiLCJtYXgiLCJrZXlzIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsImkiLCJrZXkiLCJsZW4iLCJjb3VudENoaWxkcmVuIiwicHVzaCIsImludiIsIk1hdGgiLCJhYnMiLCJyb3VuZGVkIiwicm91bmQiLCJsYWJlbCIsImxlZ2VuZCIsImhhc093blByb3BlcnR5IiwiYnVmZmVyIiwic3Via2V5IiwibGlzdCIsInBsdXJhbCIsIm5vbkJsYW5rIiwiTmFtZXNwYWNlIiwiTmFtZSIsIkNvbnRhaW5lciIsInMiLCJtYXN0ZXIiLCJwb3J0IiwidG9rZW4iLCJyZXF1ZXN0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJtc2ciLCJyZXNwb25zZUpTT04iLCJtZXNzYWdlIiwic3RhdHVzVGV4dCIsInZhbHVlIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJ3aW5kb3ciLCJvbmxvYWQiXSwibWFwcGluZ3MiOiJBQXNUQSxRQUFBQSxZQUNBLEdBQUFDLEdBQUEsR0FBQUMsSUFDQUQsR0FBQUUsT0F4VEEsR0FBQUQsS0FBQSxXQUNBRSxLQUFBQyxRQUFBLEVBQ0FELEtBQUFELEtBQUEsV0FDQSxHQUFBRyxHQUFBRixJQUNBQSxNQUFBRyxnQkFDQUMsRUFBQSxrQkFBQUMsR0FBQSxRQUFBLFdBQ0FILEVBQUFJLGdCQUNBSixFQUFBSyxRQUVBSCxFQUFBLHlCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFNLFNBRUFSLEtBQUFTLFVBQUEsR0FBQUMsV0FBQSxnQkFDQVYsS0FBQVMsVUFBQUosR0FBQSxRQUFBLFNBQUFNLE1BS0FQLEVBQUEsd0JBQUFDLEdBQUEsUUFBQSxXQUNBSCxFQUFBVSxhQUtBUixFQUFBLG1CQUFBQyxHQUFBLGlCQUFBLFdBQ0FELEVBQUEsaUJBQUFTLFVBR0FULEVBQUEsV0FBQVUsS0FBQUMsUUFBQSxVQUlBZixLQUFBUSxLQUFBLFdBQ0EsR0FBQU4sR0FBQUYsS0FDQWdCLElBQ0EsS0FDQUEsRUFBQUMsS0FBQUMsTUFBQWQsRUFBQSxTQUFBZSxPQUNBLE1BQUFSLEdBRUEsV0FEQVAsR0FBQSxXQUFBZ0IsS0FBQSx5QkFJQSxHQUFBQyxHQUFBakIsRUFBQSxvQkFBQWUsTUFDQUcsRUFBQWxCLEVBQUEsc0JBQUFlLE1BQ0FJLEVBQUFuQixFQUFBLGlCQUFBZSxNQUNBSyxFQUFBcEIsRUFBQSxzQkFBQWUsTUFDQU0sRUFBQXJCLEVBQUEsZ0JBQUFlLEtBQ0FFLEdBQUFLLE9BQUEsSUFDQVYsRUFBQUsscUJBQUFBLEdB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Q0E2RSxhQUFBRSxRQUFBLGNBQUE5RixFQUFBLGdCQUFBZSxPQUNBNkUsYUFBQUUsUUFBQSxPQUFBOUYsRUFBQSxTQUFBZSxPQUNBNkUsYUFBQUUsUUFBQSxTQUFBOUYsRUFBQSxpQkFBQWUsU0FTQWdGLFFBQUFDLE9BQUF4RyIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgQXBwID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuY291bnRlciA9IDA7XG5cdHRoaXMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLnN0b3JhZ2VHZXR0ZXIoKTtcblx0XHQkKCcjdXBkYXRlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zdG9yYWdlU2V0dGVyKCk7XG5cdFx0XHRzZWxmLmdldCgpO1xuXHRcdH0pO1xuXHRcdCQoJyNjcmVhdGUtcmVwb3J0LWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zdG9yYWdlU2V0dGVyKCk7XG5cdFx0XHRzZWxmLnBvc3QoKTtcblx0XHR9KTtcblx0XHR0aGlzLmNsaXBib2FyZCA9IG5ldyBDbGlwYm9hcmQoJyNjb3B5LWJ1dHRvbicpO1xuXHRcdHRoaXMuY2xpcGJvYXJkLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdC8vVE9ETzogQ3RybCtDIG1lc3NhZ2UgZmFsbGJhY2tcblx0XHR9KTtcblxuXHRcdC8vbW9kYWwgYWN0aW9uXG5cdFx0JCgnI21vZGFsLWFjdGlvbi1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNlbGYuc2lkZWxvYWQoKTtcblx0XHR9KTtcblxuXHRcdC8va2V5Ym9hcmQgZm9jdXMgb24gdGV4dGFyZWEgZm9yIHF1aWNrIHBhc3RlIGFjdGlvblxuXHRcdC8vbm90IGFsbG93ZWQgdG8gcmVhZCBmcm9tIGNsaXBib2FyZFxuXHRcdCQoJyNzaWRlbG9hZC1tb2RhbCcpLm9uKCdzaG93bi5icy5tb2RhbCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0JCgnI21vZGFsLXNvdXJjZScpLmZvY3VzKCk7XG5cdFx0fSk7XG5cblx0XHQkKCcjY2hhcnRzJykuY3NzKHsnZGlzcGxheSc6ICdub25lJ30pO1xuXHR9O1xuXG5cdC8vUE9TVCBjb25maWcgb2JqZWN0cywgcmV0cmlldmUgcmVwb3J0XG5cdHRoaXMucG9zdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgb2JqID0ge307XG5cdFx0dHJ5IHtcblx0XHRcdG9iaiA9IEpTT04ucGFyc2UoJCgnI2RhdGEnKS52YWwoKSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0JCgnI3JlcG9ydCcpLnRleHQoXCJDYW4ndCBwYXJzZSBKU09OIGRhdGFcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGN1c3RvbU5hbWVzcGFjZUxhYmVsID0gJCgnI25hbWVzcGFjZS1sYWJlbCcpLnZhbCgpO1xuXHRcdHZhciBjdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbU5hbWVQYXR0ZXJuID0gJCgnI25hbWUtcGF0dGVybicpLnZhbCgpO1xuXHRcdHZhciBjdXN0b21Db250YWluZXJQYXR0ZXJuID0gJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbUVudlBhdHRlcm4gPSAkKCcjZW52LXBhdHRlcm4nKS52YWwoKTtcblx0XHRpZiAoY3VzdG9tTmFtZXNwYWNlTGFiZWwubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbU5hbWVzcGFjZUxhYmVsID0gY3VzdG9tTmFtZXNwYWNlTGFiZWw7XG5cdFx0fVxuXHRcdGlmIChjdXN0b21OYW1lc3BhY2VQYXR0ZXJuLmxlbmd0aCA+IDApIHtcblx0XHRcdG9iai5jdXN0b21OYW1lc3BhY2VQYXR0ZXJuID0gY3VzdG9tTmFtZXNwYWNlUGF0dGVybjtcblx0XHR9XG5cdFx0aWYgKGN1c3RvbU5hbWVQYXR0ZXJuLmxlbmd0aCA+IDApIHtcblx0XHRcdG9iai5jdXN0b21OYW1lUGF0dGVybiA9IGN1c3RvbU5hbWVQYXR0ZXJuO1xuXHRcdH1cblx0XHRpZiAoY3VzdG9tQ29udGFpbmVyUGF0dGVybi5sZW5ndGggPiAwKSB7XG5cdFx0XHRvYmouY3VzdG9tQ29udGFpbmVyUGF0dGVybiA9IGN1c3RvbUNvbnRhaW5lclBhdHRlcm47XG5cdFx0fVxuXHRcdGlmIChjdXN0b21FbnZQYXR0ZXJuLmxlbmd0aCA+IDApIHtcblx0XHRcdG9iai5jdXN0b21FbnZQYXR0ZXJuID0gY3VzdG9tRW52UGF0dGVybjtcblx0XHR9XG5cblx0XHQkLmFqYXgoe1xuXHRcdFx0dXJsOiBcIi9vcGVuc2hpZnQtbGludGVyXCIsXG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG5cdFx0XHRkYXRhVHlwZTogXCJqc29uXCIsXG5cdFx0XHRjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdC8vVE9ETzogZXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIEpTT04gdG9vXG5cdFx0XHRcdGlmICh0eXBlb2YoZGF0YSkgIT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZGF0YTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHNlbGYuZm9ybWF0UmVwb3J0KGRhdGEpO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0JCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiUE9TVCByZXF1ZXN0IGZhaWxlZFwiO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8vZHJhdyBjaGFydCAoc3VtbWFyeSlcblx0dGhpcy5kcmF3Q2hhcnRTdW1tYXJ5ID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dmFyIGN0eCA9ICQoJyNjYW52YXMwMScpO1xuXHRcdHZhciBzdW1tYXJ5ID0gb2JqLnN1bW1hcnk7XG5cblx0XHR2YXIgdmFsdWVzID0gW1xuXHRcdFx0KHN1bW1hcnkuZykgPyBzdW1tYXJ5LmcubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LmdhKSA/IHN1bW1hcnkuZ2EubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LmEpID8gc3VtbWFyeS5hLmxlbmd0aCA6IDAsXG5cdFx0XHQoc3VtbWFyeS5hcikgPyBzdW1tYXJ5LmFyLmxlbmd0aCA6IDAsXG5cdFx0XHQoc3VtbWFyeS5yKSA/IHN1bW1hcnkuci5sZW5ndGggOiAwLFxuXHRcdF07XG5cblx0XHR2YXIgY2hhcnQgPSBuZXcgQ2hhcnQoY3R4LCB7XG5cdFx0XHR0eXBlOiAncGllJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0bGFiZWxzOiBbXCJObyBpc3N1ZXNcIiwgXCIxIGlzc3VlXCIsIFwiMiBpc3N1ZXNcIiwgXCIzIGlzc3Vlc1wiLCBcIjQgb3IgbW9yZSBpc3N1ZXNcIl0sXG5cdFx0XHRcdGRhdGFzZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkYXRhOiB2YWx1ZXMsXG5cdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiBbXG5cdFx0XHRcdFx0XHQncmdiYSgwLCAyNTUsIDAsIDEuMCknLFxuXHRcdFx0XHRcdFx0J3JnYmEoMTI3LCAyNTUsIDAsIDEuMCknLFxuXHRcdFx0XHRcdFx0J3JnYmEoMjU1LCAyNTUsIDAsIDEuMCknLFxuXHRcdFx0XHRcdFx0J3JnYmEoMjU1LCAxMjcsIDAsIDEuMCknLFxuXHRcdFx0XHRcdFx0J3JnYmEoMjU1LCAwLCAwLCAxLjApJ1xuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0Ym9yZGVyQ29sb3I6IFtcblx0XHRcdFx0XHRcdCdyZ2JhKDAsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgxMjcsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDEyNywgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDAsIDAsIDEuMCknXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRib3JkZXJXaWR0aDogMSAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiB7IHJlc3BvbnNpdmU6IGZhbHNlIH1cblx0XHR9KTtcblx0fTtcblxuXHQvL2RyYXcgY2hhcnQgKGlzc3VlIHR5cGUpXG5cdHRoaXMuZHJhd0NoYXJ0SXNzdWVUeXBlID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dmFyIGN0eCA9ICQoJyNjYW52YXMwMicpO1xuXHRcdHZhciBsYWJlbHMgPSBbXSwgbGVuZ3RocyA9IFtdLCBjb2xvcnMgPSBbXTtcblx0XHR2YXIgbWF4ID0gMDtcblx0XHRrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBrZXkgPSBrZXlzW2ldO1xuXHRcdFx0aWYgKGtleSA9PT0gJ3N1bW1hcnknKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGxlbiA9IHRoaXMuY291bnRDaGlsZHJlbihvYmpba2V5XSk7XG5cdFx0XHRsYWJlbHMucHVzaChrZXkpO1xuXHRcdFx0bGVuZ3Rocy5wdXNoKGxlbik7XG5cdFx0XHRpZiAobGVuID4gbWF4KSB7XG5cdFx0XHRcdG1heCA9IGxlbjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL21heCBpcyBrbm93biwgc28gZGV0ZXJtaW5lIEhTTCBjb2xvcnNcblx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3Rocy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGxlbiA9IGxlbmd0aHNbaV07XG5cdFx0XHRpZiAobGVuID09PSAwIHx8IG1heCA9PT0gMCkge1xuXHRcdFx0XHRjb2xvcnMucHVzaCgncmdiYSgwLCAyNTUsIDAsIDEuMCknKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vbmVlZCB0byBpbnZlcnQgdmFsdWUgYXMgMCA9PSByZWQgYW5kIDEyMCA9PSBncmVlblxuXHRcdFx0XHQvL2hvd2V2ZXIsIGJhcnMgdGhhdCBhcmUgZGlzcGxheWVkIGFyZSBieSBkZWZpbml0aW9uIG5vdCAwLWlzc3VlLWJhcnNcblx0XHRcdFx0Ly9zbyBzdG9wIGF0IDEwMFxuXHRcdFx0XHR2YXIgdmFsID0gMTAwKmxlbi9tYXg7XG5cdFx0XHRcdHZhciBpbnYgPSBNYXRoLmFicyh2YWwgLSAxMDApO1xuXHRcdFx0XHR2YXIgcm91bmRlZCA9IE1hdGgucm91bmQoaW52KVxuXHRcdFx0XHRjb2xvcnMucHVzaCgnaHNsKCcgKyByb3VuZGVkICsgJywxMDAlLDUwJSknKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgY2hhcnQgPSBuZXcgQ2hhcnQoY3R4LCB7XG5cdFx0XHR0eXBlOiAnYmFyJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XCJsYWJlbHNcIjogbGFiZWxzLFxuXHRcdFx0XHRcImRhdGFzZXRzXCI6IFt7XG5cdFx0XHRcdFx0bGFiZWw6ICdvY2N1cnJlbmNlcycsXG5cdFx0XHRcdFx0ZGF0YTogbGVuZ3Rocyxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IGNvbG9ycyxcblx0XHRcdFx0XHRib3JkZXJDb2xvcjogY29sb3JzLFxuXHRcdFx0XHRcdGJvcmRlcldpZHRoOiAwXG5cdFx0XHRcdH1dXG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRyZXNwb25zaXZlOiBmYWxzZSxcblx0XHRcdFx0bGVnZW5kOiB7XG5cdFx0XHRcdFx0ZGlzcGxheTogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuY291bnRDaGlsZHJlbiA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpICs9IG9ialtrZXldLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGk7XG5cdH07XG5cblx0Ly9wcmVzZW50IHJlcG9ydCBKU09OIGluIHRhYnVsYXIgZm9ybVxuXHR0aGlzLmZvcm1hdFJlcG9ydCA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdHZhciBidWZmZXIgPSBcIlwiO1xuXHRcdGZvciAoa2V5IGluIG9iaikge1xuXHRcdFx0aWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKHN1YmtleSBpbiBvYmpba2V5XSkge1xuXHRcdFx0XHR2YXIgbGlzdCA9IG9ialtrZXldW3N1YmtleV07XG5cdFx0XHRcdHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcblx0XHRcdFx0aWYgKGxlbiA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHBsdXJhbCA9IChsZW4gPT09IDEpID8gXCJcIiA6IFwic1wiXG5cdFx0XHRcdFx0YnVmZmVyICs9IFwiPGgzPlwiICsga2V5ICsgXCI6IFwiICsgc3Via2V5ICsgXCIgKFwiICsgbGVuICsgXCIgaXRlbVwiICsgcGx1cmFsICsgXCIpPC9oMz5cIjtcblx0XHRcdFx0YnVmZmVyICs9IFwiPHRhYmxlIGNsYXNzPSd0YWJsZSB0YWJsZS1zdHJpcGVkJz5cIjtcblx0XHRcdFx0YnVmZmVyICs9IFwiPHRoZWFkIGNsYXNzPSd0aGVhZC1kZWZhdWx0Jz48dHI+PHRoPk5hbWVzcGFjZTwvdGg+PHRoPk5hbWU8L3RoPjx0aD5Db250YWluZXI8L3RoPjwvdHI+PC90aGVhZD5cIjtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdGJ1ZmZlciArPSBcIjx0cj48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZXNwYWNlKSArIFwiPC90ZD48dGQ+XCIgKyB0aGlzLm5vbkJsYW5rKGxpc3RbaV0uTmFtZSkgKyBcIjwvdGQ+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLkNvbnRhaW5lcikgKyBcIjwvdGQ+PC90cj5cIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRidWZmZXIgKz0gXCI8L3RhYmxlPlwiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYnVmZmVyOyBcblx0fTtcblxuXHR0aGlzLm5vbkJsYW5rID0gZnVuY3Rpb24ocykge1xuXHRcdGlmIChzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFwiJm5kYXNoO1wiO1xuXHRcdH1cblx0XHRyZXR1cm4gcztcblx0fTtcblxuXHQvL0dFVCByZXF1ZXN0IHRvIGZldGNoIGxpc3Qgb2YgY29uZmlnIG9iamVjdHNcblx0dGhpcy5nZXQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFzdGVyID0gJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpO1xuXHRcdHZhciBwb3J0ID0gJCgnI3BvcnQtaW5wdXQnKS52YWwoKTtcblx0XHR2YXIgdG9rZW4gPSAkKCcjdG9rZW4taW5wdXQnKS52YWwoKTtcblx0XHR2YXIgcmVxdWVzdCA9ICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCk7XG5cdFx0dmFyIHVybCA9IG1hc3RlciArIFwiOlwiICsgcG9ydCArIHJlcXVlc3Q7XG5cblx0XHQkLmFqYXgoe1xuXHRcdFx0dXJsOiB1cmwsXG5cdFx0XHR0eXBlOiBcIkdFVFwiLFxuXHRcdFx0ZGF0YVR5cGU6IFwianNvblwiLFxuXHRcdFx0Y29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcIkF1dGhvcml6YXRpb25cIjogXCJCZWFyZXIgXCIgKyB0b2tlblxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0JCgnI2RhdGEnKS52YWwoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXHRcdFx0XHQkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBcIlwiXG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHR2YXIgbXNnID0gKGVyci5yZXNwb25zZUpTT04pID9cblx0XHRcdFx0XHRlcnIucmVzcG9uc2VKU09OLm1lc3NhZ2UgOlxuXHRcdFx0XHRcdGVyci5zdGF0dXNUZXh0O1xuXHRcdFx0XHQkKCcjZXJyb3InKVswXS5pbm5lckhUTUwgPSBtc2c7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5zaWRlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzID0gJCgnI21vZGFsLXNvdXJjZScpWzBdLnZhbHVlO1xuXHRcdHRyeSB7XG5cdFx0XHR2YXIgb2JqID0gSlNPTi5wYXJzZShzKTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdCQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBlLm1lc3NhZ2U7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG9iaiA9PT0ge30gfHwgb2JqID09PSBudWxsIHx8IHR5cGVvZihvYmopID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0JCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IFwiTm8gZGF0YVwiO1xuXHRcdH1cblxuXHRcdCQoJyNjaGFydHMnKS5jc3MoeydkaXNwbGF5JzogJ2Jsb2NrJ30pO1xuXHRcdHRoaXMuZHJhd0NoYXJ0U3VtbWFyeShvYmopO1xuXHRcdHRoaXMuZHJhd0NoYXJ0SXNzdWVUeXBlKG9iaik7XG5cblx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gdGhpcy5mb3JtYXRSZXBvcnQob2JqKTtcblx0fTtcblxuXG5cdHRoaXMuc3RvcmFnZUdldHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2YobG9jYWxTdG9yYWdlKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0JCgnI21hc3Rlci1pbnB1dCcpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm1hc3RlclwiKSk7XG5cdFx0JCgnI3BvcnQtaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJwb3J0XCIpKTtcblx0XHQkKCcjdG9rZW4taW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ0b2tlblwiKSk7XG5cdFx0JCgnI3JlcXVlc3QtaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJyZXF1ZXN0XCIpKTtcblx0XHQkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lc3BhY2UtcGF0dGVyblwiKSk7XG5cdFx0JCgnI25hbWUtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5hbWUtcGF0dGVyblwiKSk7XG5cdFx0JCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIikpO1xuXHRcdCQoJyNlbnYtcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImVudi1wYXR0ZXJuXCIpKTtcblx0XHQkKCcjZGF0YScpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImRhdGFcIikpO1xuXHRcdCQoJyNtb2RhbC1zb3VyY2UnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJyZXBvcnRcIikpO1xuXHR9O1xuXG5cdHRoaXMuc3RvcmFnZVNldHRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2YobG9jYWxTdG9yYWdlKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJtYXN0ZXJcIiwgJCgnI21hc3Rlci1pbnB1dCcpLnZhbCgpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInBvcnRcIiwgJCgnI3BvcnQtaW5wdXQnKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0b2tlblwiLCAkKCcjdG9rZW4taW5wdXQnKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJyZXF1ZXN0XCIsICQoJyNyZXF1ZXN0LWlucHV0JykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIiwgJCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibmFtZS1wYXR0ZXJuXCIsICQoJyNuYW1lLXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJjb250YWluZXItcGF0dGVyblwiLCAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJlbnYtcGF0dGVyblwiLCAkKCcjZW52LXBhdHRlcm4nKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJkYXRhXCIsICQoJyNkYXRhJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVwb3J0XCIsICQoJyNtb2RhbC1zb3VyY2UnKS52YWwoKSk7XG5cdH07XG59O1xuXG5mdW5jdGlvbiBtYWluRnVuYygpIHtcblx0dmFyIGFwcCA9IG5ldyBBcHAoKTtcblx0YXBwLmluaXQoKTtcbn1cblxud2luZG93Lm9ubG9hZCA9IG1haW5GdW5jO1xuIl19
