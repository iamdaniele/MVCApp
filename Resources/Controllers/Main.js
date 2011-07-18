/**
 * To create a new controller, use App.controller and an anonymous function.
 * The controller's name is the same as the file name.
 */
App.controller(function() {
	
	/**
	 * You can create private methods and properties inside your constructor.
	 * Attach members to this to make them public.
	 */
	var privateMethod = function() {
		alert('This is a private method');
	}
	
	/**
	 * This is the controller's constructor.
	 */
	this.init = function() {
		alert('Controller constructor. You should see me only once.');
	}
	
	this.heavyweightAction = function() {
		/**
		 * Create a heavyweight window by specifying its view name (the filename, without extension).
		 * You can pass an optional array of parameters (the same that you would pass to Ti.UI.createWindow).
		 */
		var view = App.view('Heavyweight', {title: 'Heavyweight test', modal: true});
		view.open();
	}

	this.platformSpecificAction = function() {
		var view = App.view('PlatformSpecific', {title: 'Platform Specific', modal: true});
		view.open();
	}
	
	this.lightweightAction = function() {
		var view = App.create('Window', {title: 'Lightweight', modal: true, backgroundColor: '#222'});
		view.add(Ti.UI.createLabel({text: 'Lightweight window', color: '#aaa', textAlign: 'center'}));
		if(App.iphone) {
			var close = Ti.UI.createButton({title: 'Close'});
			close.addEventListener('click', function() {
				view.close();
			});
			view.leftNavButton = close;
		}
		view.open();
	}
	
	/**
	 * The default action, called when App.dispatch is triggered without specifying any action.
	 * To create an action, create a public method with the "Action" suffix.
	 * For instance, to create the showMessage action, create this.showMessageAction.
	 */
	this.defaultAction = function() {
		var titleText = 'MVCApp ';
		if(App.android) {
			titleText += '(Android)';
		}
		else if(App.iphone) {
			titleText += '(iOS)';
		}
		
		var win = Ti.UI.createWindow({backgroundColor: '#222', title: 'Test', exitOnClose: true});
		var data = [];
		var title = Ti.UI.createTableViewRow({touchEnabled: false});
		var titleLabel = Ti.UI.createLabel({
			font: {fontSize: 22, fontWeight: 'bold'},
			color: '#aaa',
			text: titleText,
			textAlign: 'center'
		});
		title.add(titleLabel);
		data.push(title);		
		data.push({title: 'Call private method', action: function() {privateMethod()}});
		data.push({title: 'Create lightweight view', action: 'Main/lightweight'});
		data.push({title: 'Create heavyweight view', action: 'Main/heavyweight'});
		data.push({title: 'Show platform-specific view', action: 'Main/platformSpecific'});
		data.push({title: 'Controller (default action)', action: 'Other'});
		data.push({title: 'Controller (specific action)', action: 'Other/sample'});
		
		var table = Ti.UI.createTableView({data: data});
		table.addEventListener('click', function(e) {
			if(e.rowData.action) {
				if(e.rowData.action instanceof Function) {
					e.rowData.action();
				}
				else {
					App.dispatch(e.rowData.action);
				}				
			}
		})
		win.add(table);
		win.open();
	}
});