var defaults = {
	dataTasks: 'taskmanTasks',
	dataPanels: 'taskmanPanels',
	defaultPanel: 'pending',
	todoTask: 'todo-task',
	todoHeader: 'task-header',
	todoDate: 'task-date',
	todoDescription: 'task-description',
	taskId: 'task-',
	panelId: 'panel-',
	formId: 'todo-form',
	dataAttribute: 'data',
	deleteDiv: 'delete-div'
};

var entropy;

var panels = {
	pending: {
		label: 'Pending'
	},

	inProgress: {
		label: 'In Progress'
	},

	completed: {
		label: 'Completed'
	}
};

var collectEntropy = function() {
	$('body').mousemove(function(e) {
		entropy += e.pageX.toString() + e.pageY.toString();
	});
}

// Central data save/load functions (useful to send to multiple sources)
var saveData = function(key, data) {

	// localStorage
	localStorage.setItem(key, JSON.stringify(data));
}

var loadData = function(key) {
	var data = localStorage.getItem(key);

	return data ? JSON.parse(data) : {};
}

// guid() - http://stackoverflow.com/a/105074/901156
var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

var generateElement = function(params) {
	var parent = $('#' + params.parent);

	if (!parent) {
		return;
	}

	var wrapper = $('<div />', {
		'class': defaults.todoTask,
		'id': defaults.taskId + params.id,
		'data': params.id
	}).appendTo(parent);

	/*
	wrapper.draggable({
		start: function(event, ui) {
			$('#' + defaults.deleteDiv).show();
		},
		stop: function(event, ui) {
			$('#' + defaults.deleteDiv).hide();
		}
	});
	*/

	$('<div />', {
		'class': defaults.todoHeader,
		'text': params.title
	}).appendTo(wrapper);

	$('<div />', {
		'class': defaults.todoDate,
		'text': date_display(params.date) // time_remaining(params.date)
	}).appendTo(wrapper);

	$('<div />', {
		'class': defaults.todoDescription,
		'text': params.description
	}).appendTo(wrapper);
}

var generatePanel = function(panel) {
	panel.id = panel.id.replace(defaults.panelId, '');

	var data = panels[panel.id];
	var parent = $('#panels');

	var panel_container = $('<div />', {
		'class': 'col-md-4 task-container',
		'id': 'panel-' + panel.id
	}).appendTo(parent);

	var list = $('<div />', {
		'class': 'panel panel-default'
	}).appendTo(panel_container);

	$('<div />', {
		'class': 'panel-heading',
		'html': '<h3 class="panel-title">' + data.label + '</h3>'
	}).appendTo(list);

	$('<div />', {
		'class': 'panel-body task-list',
		'id': panel.id,
	}).appendTo(list);
}

var savePanelOrder = function(event, ui) {
	// Update indexes on all children
	var children = ui.item.parent().find('.task-container');

	for (var i = 0; i < children.length; i++) {
		var panel_id = children[i].id;
		var panel = getPanel(panel_id);

		panel.index = i;
		
		savePanel(panel);
	}
}

var saveTaskOrder = function(event, ui) {
	// Update indexes on all children
	var children = ui.item.parent().find('.todo-task');

	for (var i = 0; i < children.length; i++) {
		var task_id = children[i].id;
		var task = getTask(task_id);

		task.index = i;
		task.parent = ui.item.parent().attr('id');
		
		saveTask(task);
	}
}

// Initialize panels and tasks
var loadPanels = function() {
	var panel_ids = [];
	var tasks = loadData(defaults.dataTasks);
	var panels = loadData(defaults.dataPanels);

	// Sort and load panels
	var panels_sorted = [];
	for (var t in panels) {
		var panel = panels[t];

		panels_sorted.push([panel.id, panel.index]);
	}

	if (panels_sorted.length > 0) {
		// Sort
		panels_sorted.sort(function(a, b) {
			return a[1] - b[1];
		});

		for (var t = 0; t < panels_sorted.length; t++) {
			var panel_id = panels_sorted[t][0];
			var panel = panels[panel_id];
			
			generatePanel(panel);
		}
	}

	for (var p in panels) {
		p = p.replace(defaults.panelId, '');

		// Enable sortable task-container
		$('#panels').sortable({ stop: savePanelOrder }).disableSelection;

		// Enable sortable task-list
		$('#' + p).sortable({ connectWith: '.task-list', placeholder: 'ui-state-highlight', stop: saveTaskOrder }).disableSelection();

		// Sort and load tasks
		var tasks_sorted = [];
		for (var t in tasks) {
			var task = tasks[t];

			if (task.parent != p.replace(defaults.panelId, '')) {
				continue;
			}

			tasks_sorted.push([task.id, task.index]);
		}

		if (tasks_sorted.length > 0) {
			// Sort
			tasks_sorted.sort(function(a, b) {
				return a[1] - b[1];
			});

			for (var t = 0; t < tasks_sorted.length; t++) {
				var task_id = tasks_sorted[t][0];
				var task = tasks[task_id];

				generateElement(task);
			}
		}
	}

	// Delete tasks if dropped into delete-div
	$('#' + defaults.deleteDiv).droppable({
		drop: function(event, ui) {
			var element = ui.helper;
			var task = getTask(element.attr('id'));

			// Update local storage
			deleteTask(task);
		}
	});
}

var taskmanSetup = function() {
	// Collect entropy
	collectEntropy();

	// Set cursor focus
	defaultFocus();

	// Load panels
	loadPanels();

	// Bind to form
	$('#' + defaults.formId).submit(function() {
		addItem();
		return false;
	});

	// Bind to task items for inline editing
	$('.task-header').click(function() {
		taskInlineEdit({'title': 'Title'}, $(this));
	});

	// Bind to task items for inline editing
	$('.task-date').click(function() {
		taskInlineEdit({'date': 'Due date'}, $(this));
	});

	// Bind to task items for inline editing
	$('.task-description').click(function() {
		taskInlineEdit({'description' : 'Description'}, $(this));
	});
}

var taskInlineEdit = function(f, self) {

	// Don't update if already in edit mode
	if (self.hasClass('editing')) {
		return;
	}

	// Change to inline edit mode
	self.addClass('editing');

	var field = Object.keys(f)[0];
	var placeholder = f[field];

	var task_id = self.parent().attr('id');
	var task = getTask(task_id);

	var input = $('<input />', {
		'name': field,
		'placeholder': placeholder,
		'class': 'form-control',
		'value': task[field]
	});

	self.html(input);

	// Focus on input field
	input.focus();
	input[0].setSelectionRange(0, input.val().length);

	// Bind input.keypress(13) to taskInlineCommit()
	input.on('keydown', function(e) {
		var key = e.keyCode || e.which;

		// Enter
		if (key === 13) {
			e.preventDefault();
			defaultFocus();
		}

		// Tab
		if (key === 9) {
			e.preventDefault();

			self.next().trigger('click');
		}
	});

	// Bind self.focusout() to taskInlineCommit()
	self.focusout(function() {
		taskInlineCommit(field, self);
	});
}

var defaultFocus = function() {
	$('#todo-form').find('input[name=title]').first().focus();
}

var taskInlineCommit = function(field, self) {
	if (!self.hasClass('editing')) {
		return;
	}

	var input = self.find('input[name=' + field + ']').first();
	var task_id = self.parent().attr('id');

	self.text(input.val()).removeClass('editing');

	var task = getTask(task_id);
	task[field] = input.val();

	saveTask(task);
}

var pluralize = function(s, n) {
	return n + ' ' + ((n !== 1) ? s.pluralize() : s);
}

var time_remaining = function(d) {
	var date = moment(d);
	var date_format = (date.get('year') == moment().get('year')) ? 'MMM D' : 'MMM D, YYYY';
	var days_remaining = Math.floor(moment.duration(date.diff(moment())).asDays());
	var hours_remaining = Math.floor(moment.duration(date.diff(moment())).asHours());
	var minutes_remaining = Math.floor(moment.duration(date.diff(moment())).asMinutes());

	// Set date display mode
	// Date format: date.format(date_format)
	// Days remaining: days_remaining + ' days';
	// Hours remaining: hours_remaining + ' hours';
	var result = 'Due in ';

	if (days_remaining > 0)					result += pluralize('day', days_remaining)
	else if(hours_remaining > 0)		result += pluralize('hour', hours_remaining)
	else if(minutes_remaining > 0)	result += pluralize('minute', minutes_remaining)
	else														result = 'Expired (' + date.format(date_format) +')';

	return result;
}

var date_display = function(d) {
	return moment(d).isValid() ? moment(d).format('M/D') : d;
}

var removeElement = function(task) {
	var task = $('#' + defaults.taskId + task.id);

	task.remove();
}

var getTask = function(id) {
	var data = loadData(defaults.dataTasks);

	return data[id.replace(defaults.taskId, '')];
}

var saveTask = function(task) {
	var data = loadData(defaults.dataTasks);
	data[task.id] = task;

	saveData(defaults.dataTasks, data);

	return data;
}

var getPanel = function(id) {
	var panel_id = id.replace(defaults.panelId, '');
	var data = loadData(defaults.dataPanels);

	return data[panel_id] ? data[panel_id] : { id: id };
}

var savePanel = function(panel) {
	var data = loadData(defaults.dataPanels);
	data[panel.id] = panel;

	saveData(defaults.dataPanels, data);

	return data;
}

var deleteTask = function(task) {
	var data = loadData(defaults.dataTasks);

	if (data[task.id]) {
		delete data[task.id];

		saveData(defaults.dataTasks, data);
	}

	// Remove from view
	removeElement(task);

	return data;
}

var resetForm = function(id) {
	$(id).find('button[type=reset]').first().trigger('click');
	$('input[name=duedate]').val(moment().format('YYYY-MM-DD'));
}

var addItem = function() {
	var title = $('input[name=title]').val();
	var description = $('textarea[name=description]').val();
	var date = $('input[name=date]').val();

	if (!title) {
		alert('Title cannot be empty');
		return;
	}

	var id = guid();

	var task = {
		id: id,
		parent: defaults.defaultPanel,
		title: title,
		date: date,
		description: description
	};

	// Save
	saveTask(task);

	// Generate
	generateElement(task);

	// Reset form
	resetForm('#' + defaults.formId);
}