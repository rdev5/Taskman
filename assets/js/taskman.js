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
	// setCookie(key, JSON.stringify(data), 365);

	createBackupData();
}

var createBackupData = function() {
	var backup = {
		panels: loadData(options.dataPanels),
		tasks: loadData(options.dataTasks),
	};

	var backup_key = 'taskmanBackup-' + moment().format('YYYYMMDDHHmmss');
	var backup_val = btoa(JSON.stringify(backup));

	$('#backup-data').val(backup_val);
	localStorage.setItem(backup_key, backup_val);

	return backup;
}

var loadData = function(key) {
	var data = localStorage.getItem(key);

	return data ? JSON.parse(data) : {};
}

var saveItem = function(id, value, prefix, key) {
	id = id.replace(prefix, '');

	var data = loadData(key);
	data[id] = value;

	saveData(key, data);
}

var saveItemOrder = function(root, event, ui, prefix, key) {
	var children = ui.item.parent().find(root);

	for (var i = 0; i < children.length; i++) {
		var id = children[i].id;
		var item = getItem(id, prefix, key);

		item.index = i;
		item.parent = ui.item.parent().attr('id');
		
		saveItem(id, item, prefix, key);
	}
}

var getItem = function(id, prefix, key) {
	id = id.replace(prefix, '');

	var data = loadData(key);

	return data[id] ? data[id] : { id: id };
}

var createTaskElement = function(id, params) {
	var parent = $('#' + params.parent);

	if (!parent) {
		return;
	}

	var wrapper = $('<div />', {
		'class': options.todoTask + ' one-edge-shadow-slim',
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

var removeTaskElement = function(task) {
	var task = $('#' + options.taskId + task.id);

	task.remove();
}

var createPanelElement = function(id, panel) {
	var parent = $('#panels');

	var panel_container = $('<div />', {
		'class': 'col-md-4 task-container',
		'id': 'panel-' + id
	}).appendTo(parent);

	var list = $('<div />', {
		'class': 'panel panel-default one-edge-shadow'
	}).appendTo(panel_container);

	$('<div />', {
		'class': 'panel-heading',
		'text': panel.label
	}).appendTo(list);

	$('<div />', {
		'class': 'panel-body task-list',
		'id': id,
	}).appendTo(list);
}

var getTask = function(id) { return getItem(id, options.taskId, options.dataTasks); }
var saveTask = function(id, task) { saveItem(id, task, options.taskId, options.dataTasks); }
var saveTaskOrder = function(event, ui) { saveItemOrder('.todo-task', event, ui, options.taskId, options.dataTasks); }

var deleteTask = function(task) {
	var data = loadData(options.dataTasks);

	if (data[task.id]) {
		delete data[task.id];

		saveData(options.dataTasks, data);
	}

	// Remove from view
	removeTaskElement(task);
}

var getPanel = function(id) { return getItem(id, options.panelId, options.dataPanels); }
var savePanel = function(id, panel) { saveItem(id, panel, options.panelId, options.dataPanels); }
var savePanelOrder = function(event, ui) { saveItemOrder('.task-container', event, ui, options.panelId, options.dataPanels); }

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

			createPanelElement(panel_id, panel);
		}
	}

	for (var p in panels) {
		p = p.replace(options.panelId, '');

		// Enable sortable task-container
		$('#panels').sortable({ stop: savePanelOrder }).disableSelection;

		// Enable sortable task-list
		$('#' + p).sortable({ connectWith: '.task-list', placeholder: 'ui-state-highlight', start: startTaskOrder, stop: saveTaskOrder }).disableSelection();

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

				createTaskElement(task_id, task);
			}
		}
	}

	// Delete tasks if dropped into delete-div
	$('#' + options.deleteDiv).droppable({
		drop: function(event, ui) {
			if (!confirm('Are you sure?')) {
				return;
			}

			var element = ui.helper;
			var task = getTask(element.attr('id'));

			// Update local storage
			deleteTask(task);
		}
	});
}

var startTaskOrder = function(event, ui) {

}

var setBackground = function(url) {
	localStorage.setItem('taskmanBackgroundUrl', url);

	loadBackground();
}

var loadBackground = function() {
	var background_url = localStorage.getItem('taskmanBackgroundUrl');
	if (background_url) {
		$('html').css('background-image', 'url(' + background_url + ')');

		$('#settings-form').find('input[name=background]').first().val(background_url);
	}
}

var taskmanSetup = function() {
	// Set cursor focus
	defaultFocus();

	// Load panels
	loadPanels();

	// Load background
	loadBackground();

	// Bind to form
	$('#settings-form').submit(function() {

		// Background URL
		var background_url = $('input[name=background]').val();

		if(background_url) {
			setBackground(background_url);
		}

		return false;
	});

	$('#' + options.formId).submit(function() {
		try {
			addItem();
		} catch(e) {
			console.log(e);
		}
		return false;
	});

	// Import/Export
	createBackupData();
	$('#import-form').submit(function() {
		
		var backup = JSON.parse(atob($('textarea[name=import]').val()));

		saveData(options.dataTasks, backup.tasks);
		saveData(options.dataPanels, backup.panels);

		location.reload(false);
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
		taskInlineEdit({'description' : 'Description', 'input': '<textarea />'}, $(this));
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

	var input_type = f.input ? f.input : '<input />';

	var input = $(input_type, {
		'name': field,
		'placeholder': placeholder,
		'class': 'form-control',
	});

	// Set field value
	input.val(task[field]);

	if (input_type == '<textarea />') {
		input.css('font-size', '12px');
	}

	self.html(input);

	// Focus on input field
	input.focus();
	input[0].setSelectionRange(0, input.val().length);

	// Bind input.keypress(13) to taskInlineCommit()
	input.on('keydown', function(e) {
		var key = e.keyCode || e.which;

		// Enter
		if (input_type != '<textarea />') {
			if (key === 13) {
				e.preventDefault();
				defaultFocus();
			}
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

	var input = self.find(':input[name=' + field + ']').first();
	var task_id = self.parent().attr('id');

	self.text(input.val()).removeClass('editing');

	var task = getTask(task_id);
	task[field] = input.val();

	saveTask(task_id, task);
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
	createTaskElement(task.id, task);

	// Reset form
	resetForm('#' + options.formId);
}