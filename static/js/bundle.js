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
		console.log(obj);
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
				var val = 100*len/max
					var inv = Math.abs(val - 100)
					colors.push('hsl(' + inv + ',100%,50%)');
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
				scales: {
					yAxes: [],
					xAxes: []
				},
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsibWFpbkZ1bmMiLCJhcHAiLCJBcHAiLCJpbml0IiwidGhpcyIsImNvdW50ZXIiLCJzZWxmIiwic3RvcmFnZUdldHRlciIsIiQiLCJvbiIsInN0b3JhZ2VTZXR0ZXIiLCJnZXQiLCJwb3N0IiwiY2xpcGJvYXJkIiwiQ2xpcGJvYXJkIiwiZSIsInNpZGVsb2FkIiwiZm9jdXMiLCJjc3MiLCJkaXNwbGF5Iiwib2JqIiwiSlNPTiIsInBhcnNlIiwidmFsIiwidGV4dCIsImN1c3RvbU5hbWVzcGFjZUxhYmVsIiwiY3VzdG9tTmFtZXNwYWNlUGF0dGVybiIsImN1c3RvbU5hbWVQYXR0ZXJuIiwiY3VzdG9tQ29udGFpbmVyUGF0dGVybiIsImN1c3RvbUVudlBhdHRlcm4iLCJsZW5ndGgiLCJhamF4IiwidXJsIiwidHlwZSIsImRhdGEiLCJzdHJpbmdpZnkiLCJkYXRhVHlwZSIsImNvbnRlbnRUeXBlIiwic3VjY2VzcyIsImlubmVySFRNTCIsImZvcm1hdFJlcG9ydCIsImVycm9yIiwiZXJyIiwiZHJhd0NoYXJ0U3VtbWFyeSIsImN0eCIsInN1bW1hcnkiLCJ2YWx1ZXMiLCJnIiwiZ2EiLCJhIiwiYXIiLCJyIiwiQ2hhcnQiLCJsYWJlbHMiLCJkYXRhc2V0cyIsImJhY2tncm91bmRDb2xvciIsImJvcmRlckNvbG9yIiwiYm9yZGVyV2lkdGgiLCJvcHRpb25zIiwicmVzcG9uc2l2ZSIsImRyYXdDaGFydElzc3VlVHlwZSIsImNvbnNvbGUiLCJsb2ciLCJsZW5ndGhzIiwiY29sb3JzIiwibWF4Iiwia2V5cyIsIk9iamVjdCIsImdldE93blByb3BlcnR5TmFtZXMiLCJpIiwia2V5IiwibGVuIiwiY291bnRDaGlsZHJlbiIsInB1c2giLCJpbnYiLCJNYXRoIiwiYWJzIiwibGFiZWwiLCJzY2FsZXMiLCJ5QXhlcyIsInhBeGVzIiwibGVnZW5kIiwiaGFzT3duUHJvcGVydHkiLCJidWZmZXIiLCJzdWJrZXkiLCJsaXN0IiwicGx1cmFsIiwibm9uQmxhbmsiLCJOYW1lc3BhY2UiLCJOYW1lIiwiQ29udGFpbmVyIiwicyIsIm1hc3RlciIsInBvcnQiLCJ0b2tlbiIsInJlcXVlc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsIm1zZyIsInJlc3BvbnNlSlNPTiIsIm1lc3NhZ2UiLCJzdGF0dXNUZXh0IiwidmFsdWUiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIndpbmRvdyIsIm9ubG9hZCJdLCJtYXBwaW5ncyI6IkFBMFRBLFFBQUFBLFlBQ0EsR0FBQUMsR0FBQSxHQUFBQyxJQUNBRCxHQUFBRSxPQTVUQSxHQUFBRCxLQUFBLFdBQ0FFLEtBQUFDLFFBQUEsRUFDQUQsS0FBQUQsS0FBQSxXQUNBLEdBQUFHLEdBQUFGLElBQ0FBLE1BQUFHLGdCQUNBQyxFQUFBLGtCQUFBQyxHQUFBLFFBQUEsV0FDQUgsRUFBQUksZ0JBQ0FKLEVBQUFLLFFBRUFILEVBQUEseUJBQUFDLEdBQUEsUUFBQSxXQUNBSCxFQUFBSSxnQkFDQUosRUFBQU0sU0FFQVIsS0FBQVMsVUFBQSxHQUFBQyxXQUFBLGdCQUNBVixLQUFBUyxVQUFBSixHQUFBLFFBQUEsU0FBQU0sTUFLQVAsRUFBQSx3QkFBQUMsR0FBQSxRQUFBLFdBQ0FILEVBQUFVLGFBS0FSLEVBQUEsbUJBQUFDLEdBQUEsaUJBQUEsV0FDQUQsRUFBQSxpQkFBQVMsVUFHQVQsRUFBQSxXQUFBVSxLQUFBQyxRQUFBLFVBSUFmLEtBQUFRLEtBQUEsV0FDQSxHQUFBTixHQUFBRixLQUNBZ0IsSUFDQSxLQUNBQSxFQUFBQyxLQUFBQyxNQUFBZCxFQUFBLFNBQUFlLE9BQ0EsTUFBQVIsR0FFQSxXQURBUCxHQUFBLFdBQUFnQixLQUFBLHlCQUlBLEdBQUFDLEdBQUFqQixFQUFBLG9CQUFBZSxNQUNBRyxFQUFBbEIsRUFBQSxzQkFBQWUsTUFDQUksRUFBQW5CLEVBQUEsaUJBQUFlLE1BQ0FLLEVBQUFwQixFQUFBLHNCQUFBZSxNQUNBTSxFQUFBckIsRUFBQSxnQkFBQWUsS0FDQUUsR0FBQUssT0FB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LE9BQ0FnRixhQUFBRSxRQUFBLG9CQUFBakcsRUFBQSxzQkFBQWUsT0FDQWdGLGFBQUFFLFFBQUEsY0FBQWpHLEVBQUEsZ0JBQUFlLE9BQ0FnRixhQUFBRSxRQUFBLE9BQUFqRyxFQUFBLFNBQUFlLE9BQ0FnRixhQUFBRSxRQUFBLFNBQUFqRyxFQUFBLGlCQUFBZSxTQVNBbUYsUUFBQUMsT0FBQTNHIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHAgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5jb3VudGVyID0gMDtcblx0dGhpcy5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHRoaXMuc3RvcmFnZUdldHRlcigpO1xuXHRcdCQoJyN1cGRhdGUtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcblx0XHRcdHNlbGYuZ2V0KCk7XG5cdFx0fSk7XG5cdFx0JCgnI2NyZWF0ZS1yZXBvcnQtYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnN0b3JhZ2VTZXR0ZXIoKTtcblx0XHRcdHNlbGYucG9zdCgpO1xuXHRcdH0pO1xuXHRcdHRoaXMuY2xpcGJvYXJkID0gbmV3IENsaXBib2FyZCgnI2NvcHktYnV0dG9uJyk7XG5cdFx0dGhpcy5jbGlwYm9hcmQub24oJ2Vycm9yJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0Ly9UT0RPOiBDdHJsK0MgbWVzc2FnZSBmYWxsYmFja1xuXHRcdH0pO1xuXG5cdFx0Ly9tb2RhbCBhY3Rpb25cblx0XHQkKCcjbW9kYWwtYWN0aW9uLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zaWRlbG9hZCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly9rZXlib2FyZCBmb2N1cyBvbiB0ZXh0YXJlYSBmb3IgcXVpY2sgcGFzdGUgYWN0aW9uXG5cdFx0Ly9ub3QgYWxsb3dlZCB0byByZWFkIGZyb20gY2xpcGJvYXJkXG5cdFx0JCgnI3NpZGVsb2FkLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkKCcjbW9kYWwtc291cmNlJykuZm9jdXMoKTtcblx0XHR9KTtcblxuXHRcdCQoJyNjaGFydHMnKS5jc3MoeydkaXNwbGF5JzogJ25vbmUnfSk7XG5cdH07XG5cblx0Ly9QT1NUIGNvbmZpZyBvYmplY3RzLCByZXRyaWV2ZSByZXBvcnRcblx0dGhpcy5wb3N0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBvYmogPSB7fTtcblx0XHR0cnkge1xuXHRcdFx0b2JqID0gSlNPTi5wYXJzZSgkKCcjZGF0YScpLnZhbCgpKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQkKCcjcmVwb3J0JykudGV4dChcIkNhbid0IHBhcnNlIEpTT04gZGF0YVwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgY3VzdG9tTmFtZXNwYWNlTGFiZWwgPSAkKCcjbmFtZXNwYWNlLWxhYmVsJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSAkKCcjbmFtZXNwYWNlLXBhdHRlcm4nKS52YWwoKTtcblx0XHR2YXIgY3VzdG9tTmFtZVBhdHRlcm4gPSAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCk7XG5cdFx0dmFyIGN1c3RvbUNvbnRhaW5lclBhdHRlcm4gPSAkKCcjY29udGFpbmVyLXBhdHRlcm4nKS52YWwoKTtcblx0XHR2YXIgY3VzdG9tRW52UGF0dGVybiA9ICQoJyNlbnYtcGF0dGVybicpLnZhbCgpO1xuXHRcdGlmIChjdXN0b21OYW1lc3BhY2VMYWJlbC5sZW5ndGggPiAwKSB7XG5cdFx0XHRvYmouY3VzdG9tTmFtZXNwYWNlTGFiZWwgPSBjdXN0b21OYW1lc3BhY2VMYWJlbDtcblx0XHR9XG5cdFx0aWYgKGN1c3RvbU5hbWVzcGFjZVBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbU5hbWVzcGFjZVBhdHRlcm4gPSBjdXN0b21OYW1lc3BhY2VQYXR0ZXJuO1xuXHRcdH1cblx0XHRpZiAoY3VzdG9tTmFtZVBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbU5hbWVQYXR0ZXJuID0gY3VzdG9tTmFtZVBhdHRlcm47XG5cdFx0fVxuXHRcdGlmIChjdXN0b21Db250YWluZXJQYXR0ZXJuLmxlbmd0aCA+IDApIHtcblx0XHRcdG9iai5jdXN0b21Db250YWluZXJQYXR0ZXJuID0gY3VzdG9tQ29udGFpbmVyUGF0dGVybjtcblx0XHR9XG5cdFx0aWYgKGN1c3RvbUVudlBhdHRlcm4ubGVuZ3RoID4gMCkge1xuXHRcdFx0b2JqLmN1c3RvbUVudlBhdHRlcm4gPSBjdXN0b21FbnZQYXR0ZXJuO1xuXHRcdH1cblxuXHRcdCQuYWpheCh7XG5cdFx0XHR1cmw6IFwiL29wZW5zaGlmdC1saW50ZXJcIixcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkob2JqKSxcblx0XHRcdGRhdGFUeXBlOiBcImpzb25cIixcblx0XHRcdGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0Ly9UT0RPOiBlcnJvciBtZXNzYWdlcyBzaG91bGQgYmUgSlNPTiB0b29cblx0XHRcdFx0aWYgKHR5cGVvZihkYXRhKSAhPT0gXCJvYmplY3RcIikge1xuXHRcdFx0XHRcdCQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBkYXRhO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gc2VsZi5mb3JtYXRSZXBvcnQoZGF0YSk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gXCJQT1NUIHJlcXVlc3QgZmFpbGVkXCI7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly9kcmF3IGNoYXJ0IChzdW1tYXJ5KVxuXHR0aGlzLmRyYXdDaGFydFN1bW1hcnkgPSBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgY3R4ID0gJCgnI2NhbnZhczAxJyk7XG5cdFx0dmFyIHN1bW1hcnkgPSBvYmouc3VtbWFyeTtcblxuXHRcdHZhciB2YWx1ZXMgPSBbXG5cdFx0XHQoc3VtbWFyeS5nKSA/IHN1bW1hcnkuZy5sZW5ndGggOiAwLFxuXHRcdFx0KHN1bW1hcnkuZ2EpID8gc3VtbWFyeS5nYS5sZW5ndGggOiAwLFxuXHRcdFx0KHN1bW1hcnkuYSkgPyBzdW1tYXJ5LmEubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LmFyKSA/IHN1bW1hcnkuYXIubGVuZ3RoIDogMCxcblx0XHRcdChzdW1tYXJ5LnIpID8gc3VtbWFyeS5yLmxlbmd0aCA6IDAsXG5cdFx0XTtcblxuXHRcdHZhciBjaGFydCA9IG5ldyBDaGFydChjdHgsIHtcblx0XHRcdHR5cGU6ICdwaWUnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRsYWJlbHM6IFtcIk5vIGlzc3Vlc1wiLCBcIjEgaXNzdWVcIiwgXCIyIGlzc3Vlc1wiLCBcIjMgaXNzdWVzXCIsIFwiNCBvciBtb3JlIGlzc3Vlc1wiXSxcblx0XHRcdFx0ZGF0YXNldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRhdGE6IHZhbHVlcyxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IFtcblx0XHRcdFx0XHRcdCdyZ2JhKDAsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgxMjcsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDI1NSwgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDEyNywgMCwgMS4wKScsXG5cdFx0XHRcdFx0XHQncmdiYSgyNTUsIDAsIDAsIDEuMCknXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRib3JkZXJDb2xvcjogW1xuXHRcdFx0XHRcdFx0J3JnYmEoMCwgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDEyNywgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMjU1LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMTI3LCAwLCAxLjApJyxcblx0XHRcdFx0XHRcdCdyZ2JhKDI1NSwgMCwgMCwgMS4wKSdcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGJvcmRlcldpZHRoOiAxICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IHsgcmVzcG9uc2l2ZTogZmFsc2UgfVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8vZHJhdyBjaGFydCAoaXNzdWUgdHlwZSlcblx0dGhpcy5kcmF3Q2hhcnRJc3N1ZVR5cGUgPSBmdW5jdGlvbihvYmopIHtcblx0XHRjb25zb2xlLmxvZyhvYmopO1xuXHRcdHZhciBjdHggPSAkKCcjY2FudmFzMDInKTtcblx0XHR2YXIgbGFiZWxzID0gW10sIGxlbmd0aHMgPSBbXSwgY29sb3JzID0gW107XG5cdFx0dmFyIG1heCA9IDA7XG5cdFx0a2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIga2V5ID0ga2V5c1tpXTtcblx0XHRcdGlmIChrZXkgPT09ICdzdW1tYXJ5Jykge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdHZhciBsZW4gPSB0aGlzLmNvdW50Q2hpbGRyZW4ob2JqW2tleV0pO1xuXHRcdFx0bGFiZWxzLnB1c2goa2V5KTtcblx0XHRcdGxlbmd0aHMucHVzaChsZW4pO1xuXHRcdFx0aWYgKGxlbiA+IG1heCkge1xuXHRcdFx0XHRtYXggPSBsZW47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly9tYXggaXMga25vd24sIHNvIGRldGVybWluZSBIU0wgY29sb3JzXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbmd0aHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBsZW4gPSBsZW5ndGhzW2ldO1xuXHRcdFx0aWYgKGxlbiA9PT0gMCB8fCBtYXggPT09IDApIHtcblx0XHRcdFx0Y29sb3JzLnB1c2goJ3JnYmEoMCwgMjU1LCAwLCAxLjApJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvL25lZWQgdG8gaW52ZXJ0IHZhbHVlIGFzIDAgPT0gcmVkIGFuZCAxMjAgPT0gZ3JlZW5cblx0XHRcdFx0Ly9ob3dldmVyLCBiYXJzIHRoYXQgYXJlIGRpc3BsYXllZCBhcmUgYnkgZGVmaW5pdGlvbiBub3QgMC1pc3N1ZS1iYXJzXG5cdFx0XHRcdC8vc28gc3RvcCBhdCAxMDBcblx0XHRcdFx0dmFyIHZhbCA9IDEwMCpsZW4vbWF4XG5cdFx0XHRcdFx0dmFyIGludiA9IE1hdGguYWJzKHZhbCAtIDEwMClcblx0XHRcdFx0XHRjb2xvcnMucHVzaCgnaHNsKCcgKyBpbnYgKyAnLDEwMCUsNTAlKScpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBjaGFydCA9IG5ldyBDaGFydChjdHgsIHtcblx0XHRcdHR5cGU6ICdiYXInLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcImxhYmVsc1wiOiBsYWJlbHMsXG5cdFx0XHRcdFwiZGF0YXNldHNcIjogW3tcblx0XHRcdFx0XHRsYWJlbDogJ29jY3VycmVuY2VzJyxcblx0XHRcdFx0XHRkYXRhOiBsZW5ndGhzLFxuXHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogY29sb3JzLFxuXHRcdFx0XHRcdGJvcmRlckNvbG9yOiBjb2xvcnMsXG5cdFx0XHRcdFx0Ym9yZGVyV2lkdGg6IDBcblx0XHRcdFx0fV1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdHJlc3BvbnNpdmU6IGZhbHNlLFxuXHRcdFx0XHRzY2FsZXM6IHtcblx0XHRcdFx0XHR5QXhlczogW10sXG5cdFx0XHRcdFx0eEF4ZXM6IFtdXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxlZ2VuZDoge1xuXHRcdFx0XHRcdGRpc3BsYXk6IGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmNvdW50Q2hpbGRyZW4gPSBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yIChrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSArPSBvYmpba2V5XS5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpO1xuXHR9O1xuXG5cdC8vcHJlc2VudCByZXBvcnQgSlNPTiBpbiB0YWJ1bGFyIGZvcm1cblx0dGhpcy5mb3JtYXRSZXBvcnQgPSBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgYnVmZmVyID0gXCJcIjtcblx0XHRmb3IgKGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChrZXkgPT09IFwic3VtbWFyeVwiKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0Zm9yIChzdWJrZXkgaW4gb2JqW2tleV0pIHtcblx0XHRcdFx0dmFyIGxpc3QgPSBvYmpba2V5XVtzdWJrZXldO1xuXHRcdFx0XHR2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG5cdFx0XHRcdGlmIChsZW4gPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRwbHVyYWwgPSAobGVuID09PSAxKSA/IFwiXCIgOiBcInNcIlxuXHRcdFx0XHRcdGJ1ZmZlciArPSBcIjxoMz5cIiArIGtleSArIFwiOiBcIiArIHN1YmtleSArIFwiIChcIiArIGxlbiArIFwiIGl0ZW1cIiArIHBsdXJhbCArIFwiKTwvaDM+XCI7XG5cdFx0XHRcdGJ1ZmZlciArPSBcIjx0YWJsZSBjbGFzcz0ndGFibGUgdGFibGUtc3RyaXBlZCc+XCI7XG5cdFx0XHRcdGJ1ZmZlciArPSBcIjx0aGVhZCBjbGFzcz0ndGhlYWQtZGVmYXVsdCc+PHRyPjx0aD5OYW1lc3BhY2U8L3RoPjx0aD5OYW1lPC90aD48dGg+Q29udGFpbmVyPC90aD48L3RyPjwvdGhlYWQ+XCI7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHRidWZmZXIgKz0gXCI8dHI+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLk5hbWVzcGFjZSkgKyBcIjwvdGQ+PHRkPlwiICsgdGhpcy5ub25CbGFuayhsaXN0W2ldLk5hbWUpICsgXCI8L3RkPjx0ZD5cIiArIHRoaXMubm9uQmxhbmsobGlzdFtpXS5Db250YWluZXIpICsgXCI8L3RkPjwvdHI+XCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnVmZmVyICs9IFwiPC90YWJsZT5cIjtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGJ1ZmZlcjsgXG5cdH07XG5cblx0dGhpcy5ub25CbGFuayA9IGZ1bmN0aW9uKHMpIHtcblx0XHRpZiAocy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBcIiZuZGFzaDtcIjtcblx0XHR9XG5cdFx0cmV0dXJuIHM7XG5cdH07XG5cblx0Ly9HRVQgcmVxdWVzdCB0byBmZXRjaCBsaXN0IG9mIGNvbmZpZyBvYmplY3RzXG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1hc3RlciA9ICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKTtcblx0XHR2YXIgcG9ydCA9ICQoJyNwb3J0LWlucHV0JykudmFsKCk7XG5cdFx0dmFyIHRva2VuID0gJCgnI3Rva2VuLWlucHV0JykudmFsKCk7XG5cdFx0dmFyIHJlcXVlc3QgPSAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpO1xuXHRcdHZhciB1cmwgPSBtYXN0ZXIgKyBcIjpcIiArIHBvcnQgKyByZXF1ZXN0O1xuXG5cdFx0JC5hamF4KHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0dHlwZTogXCJHRVRcIixcblx0XHRcdGRhdGFUeXBlOiBcImpzb25cIixcblx0XHRcdGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XCJBdXRob3JpemF0aW9uXCI6IFwiQmVhcmVyIFwiICsgdG9rZW5cblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdCQoJyNkYXRhJykudmFsKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblx0XHRcdFx0JCgnI2Vycm9yJylbMF0uaW5uZXJIVE1MID0gXCJcIlxuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbihlcnIpIHtcblx0XHRcdFx0dmFyIG1zZyA9IChlcnIucmVzcG9uc2VKU09OKSA/XG5cdFx0XHRcdFx0ZXJyLnJlc3BvbnNlSlNPTi5tZXNzYWdlIDpcblx0XHRcdFx0XHRlcnIuc3RhdHVzVGV4dDtcblx0XHRcdFx0JCgnI2Vycm9yJylbMF0uaW5uZXJIVE1MID0gbXNnO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuc2lkZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgcyA9ICQoJyNtb2RhbC1zb3VyY2UnKVswXS52YWx1ZTtcblx0XHR0cnkge1xuXHRcdFx0dmFyIG9iaiA9IEpTT04ucGFyc2Uocyk7XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQkKCcjcmVwb3J0JylbMF0uaW5uZXJIVE1MID0gZS5tZXNzYWdlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChvYmogPT09IHt9IHx8IG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Yob2JqKSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdCQoJyNyZXBvcnQnKVswXS5pbm5lckhUTUwgPSBcIk5vIGRhdGFcIjtcblx0XHR9XG5cblx0XHQkKCcjY2hhcnRzJykuY3NzKHsnZGlzcGxheSc6ICdibG9jayd9KTtcblx0XHR0aGlzLmRyYXdDaGFydFN1bW1hcnkob2JqKTtcblx0XHR0aGlzLmRyYXdDaGFydElzc3VlVHlwZShvYmopO1xuXG5cdFx0JCgnI3JlcG9ydCcpWzBdLmlubmVySFRNTCA9IHRoaXMuZm9ybWF0UmVwb3J0KG9iaik7XG5cdH07XG5cblxuXHR0aGlzLnN0b3JhZ2VHZXR0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdCQoJyNtYXN0ZXItaW5wdXQnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJtYXN0ZXJcIikpO1xuXHRcdCQoJyNwb3J0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicG9ydFwiKSk7XG5cdFx0JCgnI3Rva2VuLWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidG9rZW5cIikpO1xuXHRcdCQoJyNyZXF1ZXN0LWlucHV0JykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVxdWVzdFwiKSk7XG5cdFx0JCgnI25hbWVzcGFjZS1wYXR0ZXJuJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibmFtZXNwYWNlLXBhdHRlcm5cIikpO1xuXHRcdCQoJyNuYW1lLXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJuYW1lLXBhdHRlcm5cIikpO1xuXHRcdCQoJyNjb250YWluZXItcGF0dGVybicpLnZhbChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImNvbnRhaW5lci1wYXR0ZXJuXCIpKTtcblx0XHQkKCcjZW52LXBhdHRlcm4nKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJlbnYtcGF0dGVyblwiKSk7XG5cdFx0JCgnI2RhdGEnKS52YWwobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkYXRhXCIpKTtcblx0XHQkKCcjbW9kYWwtc291cmNlJykudmFsKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicmVwb3J0XCIpKTtcblx0fTtcblxuXHR0aGlzLnN0b3JhZ2VTZXR0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodHlwZW9mKGxvY2FsU3RvcmFnZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibWFzdGVyXCIsICQoJyNtYXN0ZXItaW5wdXQnKS52YWwoKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwb3J0XCIsICQoJyNwb3J0LWlucHV0JykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgJCgnI3Rva2VuLWlucHV0JykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicmVxdWVzdFwiLCAkKCcjcmVxdWVzdC1pbnB1dCcpLnZhbCgpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWVzcGFjZS1wYXR0ZXJuXCIsICQoJyNuYW1lc3BhY2UtcGF0dGVybicpLnZhbCgpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5hbWUtcGF0dGVyblwiLCAkKCcjbmFtZS1wYXR0ZXJuJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiY29udGFpbmVyLXBhdHRlcm5cIiwgJCgnI2NvbnRhaW5lci1wYXR0ZXJuJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZW52LXBhdHRlcm5cIiwgJCgnI2Vudi1wYXR0ZXJuJykudmFsKCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZGF0YVwiLCAkKCcjZGF0YScpLnZhbCgpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInJlcG9ydFwiLCAkKCcjbW9kYWwtc291cmNlJykudmFsKCkpO1xuXHR9O1xufTtcblxuZnVuY3Rpb24gbWFpbkZ1bmMoKSB7XG5cdHZhciBhcHAgPSBuZXcgQXBwKCk7XG5cdGFwcC5pbml0KCk7XG59XG5cbndpbmRvdy5vbmxvYWQgPSBtYWluRnVuYztcbiJdfQ==
