var options = {
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
	deleteDiv: 'delete-div',
	defaultPanels: {
		pending: {
			label: 'Pending'
		},

		inProgress: {
			label: 'In Progress'
		},

		completed: {
			label: 'Completed'
		}
	}
};

var saveData = function(key, data) {
	localStorage.setItem(key, JSON.stringify(data));
}

var loadData = function(key) {
	var data = localStorage.getItem(key);

	return data ? JSON.parse(data) : {};
}

var generateTask = function(id, params) {
	var parent = $('#' + params.parent);

	if (!parent) {
		return;
	}

	var wrapper = $('<div />', {
		'class': options.todoTask,
		'id': options.taskId + id,
		'data': id
	}).appendTo(parent);

	$('<div />', {
		'class': options.todoHeader,
		'text': params.title
	}).appendTo(wrapper);

	$('<div />', {
		'class': options.todoDate,
		'text': date_display(params.date) // time_remaining(params.date)
	}).appendTo(wrapper);

	$('<div />', {
		'class': options.todoDescription,
		'text': params.description
	}).appendTo(wrapper);
}

var generatePanel = function(id, panel) {
	var parent = $('#panels');

	var panel_container = $('<div />', {
		'class': 'col-md-4 task-container',
		'id': 'panel-' + id
	}).appendTo(parent);

	var list = $('<div />', {
		'class': 'panel panel-default'
	}).appendTo(panel_container);

	$('<div />', {
		'class': 'panel-heading',
		'html': '<h3 class="panel-title">' + panel.label + '</h3>'
	}).appendTo(list);

	$('<div />', {
		'class': 'panel-body task-list',
		'id': id,
	}).appendTo(list);
}

var savePanelOrder = function(event, ui) {
	// Update indexes on all children
	var children = ui.item.parent().find('.task-container');

	for (var i = 0; i < children.length; i++) {
		var panel_id = children[i].id.replace(options.panelId, '');
		var panel = getPanel(panel_id);

		panel.index = i;
		
		savePanel(panel_id, panel);
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

		saveTask(task_id, task);
	}
}

// Initialize panels and tasks
var loadPanels = function() {
	var panel_ids = [];
	var tasks = loadData(options.dataTasks);
	var panels = loadData(options.dataPanels);

	if (Object.keys(panels).length === 0) {
		panels = options.defaultPanels;

		for (var p in panels) {
			savePanel(p, panels[p]);
		}
	}

	// Sort and load panels
	var panels_sorted = [];
	for (var t in panels) {
		var panel = panels[t];

		panels_sorted.push([t, panel.index]);
	}

	if (panels_sorted.length > 0) {
		// Sort
		panels_sorted.sort(function(a, b) {
			return a[1] - b[1];
		});

		for (var t = 0; t < panels_sorted.length; t++) {
			var panel_id = panels_sorted[t][0];
			var panel = panels[panel_id];

			generatePanel(panel_id, panel);
		}
	}

	for (var p in panels) {
		p = p.replace(options.panelId, '');

		// Enable sortable task-container
		$('#panels').sortable({ stop: savePanelOrder }).disableSelection;

		// Enable sortable task-list
		$('#' + p).sortable({ connectWith: '.task-list', placeholder: 'ui-state-highlight', stop: saveTaskOrder }).disableSelection();

		// Sort and load tasks
		var tasks_sorted = [];
		for (var t in tasks) {
			var task = tasks[t];

			if (task.parent != p.replace(options.panelId, '')) {
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

				generateTask(task_id, task);
			}
		}
	}

	// Delete tasks if dropped into delete-div
	$('#' + options.deleteDiv).droppable({
		drop: function(event, ui) {
			var element = ui.helper;
			var task = getTask(element.attr('id'));

			// Update local storage
			deleteTask(task);
		}
	});
}

var taskmanSetup = function() {
	// Set cursor focus
	defaultFocus();

	// Load panels
	loadPanels();

	// Bind to form
	$('#' + options.formId).submit(function() {
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

	saveTask(task_id, task);
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
	var task = $('#' + options.taskId + task.id);

	task.remove();
}

var getTask = function(id) {
	return getItem(id, options.taskId, options.dataTasks);
}

var getPanel = function(id) {
	return getItem(id, options.panelId, options.dataPanels);
}

var getItem = function(id, prefix, key) {
	var data = loadData(key);
	id = id.replace(prefix, '');

	return data[id] ? data[id] : { id: id };
}

var saveTask = function(id, task) {
	id = id.replace(options.taskId, '');
	
	var data = loadData(options.dataTasks);
	data[id] = task;

	saveData(options.dataTasks, data);
}

var savePanel = function(id, panel) {
	var data = loadData(options.dataPanels);
	data[id] = panel;

	saveData(options.dataPanels, data);
}

var deleteTask = function(task) {
	var data = loadData(options.dataTasks);

	if (data[task.id]) {
		delete data[task.id];

		saveData(options.dataTasks, data);
	}

	// Remove from view
	removeElement(task);
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
		parent: options.defaultPanel,
		title: title,
		date: date,
		description: description
	};

	// Save
	saveTask(task.id, task);

	// Generate
	generateTask(task);

	// Reset form
	resetForm('#' + options.formId);
}