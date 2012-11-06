var UI = {};
UI.navGroup = null;
UI.mainWindow = null;
UI.ios = Ti.Platform.name == 'iPhone OS';
UI.android = Ti.Platform.name == 'android';
UI.openWindow = function(win) {
	win.UI = UI;
	if(UI.ios) {
		UI.navGroup.open(win);
	}
	else if(UI.android) {
		win.open();
	}
}

UI.open = function(win) {
	win.UI = UI;
	if(UI.ios && !UI.navGroup) {
		UI.navGroup = Ti.UI.iPhone.createNavigationGroup({window: win});
		UI.mainWindow = Ti.UI.createWindow({backgroundColor: '#fff'});
		UI.mainWindow.add(UI.navGroup);
		UI.mainWindow.open();
	}
	else if(UI.android) {
		win.open();
	}
}

UI.createLoadingIndicator = function(config) {
	config = config || {message: 'Loading…'}
	return new function() {
		//
		//  CREATE CUSTOM LOADING INDICATOR
		//
		var indWin = null;
		var actInd = Titanium.UI.createActivityIndicator({
			style:Titanium.UI.iPhone.ActivityIndicatorStyle.BIG,
			top: 40,
			height:50,
			width:50
		});
		var indView = null;
		this.show = function()
		{
			if (Ti.Platform.osname != 'android')
			{
				// window container
				if(!config.asView) {
					indWin = Titanium.UI.createWindow({
						height:150,
						width:150
					});
					
				}

				// black view
				indView = Titanium.UI.createView({
					height:150,
					width:150,
					backgroundColor:'#000',
					borderRadius:10,
					opacity:0.8
				});
				
				if(!config.asView) {
					indWin.add(indView);					
				}
			}

			if (Ti.Platform.osname != 'android') {
				if(!config.asView) {
					indWin.add(actInd);					
				}
				else {
					indView.add(actInd);
				}

				// message
				var message = Titanium.UI.createLabel({
					text:config.message,
					color:'#fff',
					width:'auto',
					height:'auto',
					font:{fontSize:20,fontWeight:'bold'},
					bottom:20
				});

				if(!config.asView) {
					indWin.add(message);
					indWin.open();					
				}
				else {
					indView.add(message);
				}
			} else {
				actInd.message = config.message;
			}
			actInd.show();
			return indView;
		};

		this.hide = function()
		{
			actInd.hide();
			if (Ti.Platform.osname != 'android') {
				if(!config.asView) {
					indWin.close();					
				}
				else {
					indView.hide();
				}
			}
		};		
	}
}

UI.createToast = function(text, delay, position) {	
	var n = function() {
		// window container
		var options = {
			height:40,
			width:200,
			touchEnabled:false
		}
		
		if(!position) {
			options.bottom = 50;
		}
		else {
			for(var i in position) {
				options[i] = position[i];
			}
		}
		
		this.popup = Titanium.UI.createWindow(options);

		// black view
		this.indView = Titanium.UI.createView({
			height:40,
			width:200,
			backgroundColor:'#000',
			// borderWidth: 2,
			// borderColor: '#ccc',
			borderRadius:10,
			opacity:0.8,
			touchEnabled:false
		});
		this.popup.add(this.indView);

		// message
		this.message = Titanium.UI.createLabel({
			text:text,
			color:'#fff',
			textAlign:'center',
			font:{fontSize:12},
			height:'auto',
			width:'auto'
		});
		this.popup.add(this.message);
		this.popup.open();

		// if delay is set, it is a show-once notification, that is, it won't stay
		// onscreen forever.
		if(delay) {
			this.hide(delay === true ? 1500 : delay);
		}
		
	};
	
	n.prototype.text = function(text) {
		this.message.text = text;
		return this;
	}
	
	n.prototype.show = function() {
		this.popup.open();
		return this;
	}
	
	n.prototype.hide = function(delay) {
//		var t = Ti.UI.create2DMatrix().translate(-200,200).scale(0);
		var options = {opacity:0.1, duration: 1000};

//		options.transform = t;
		// options.delay = 1500;

		if(delay) {
			options.delay = delay;
		}
		
		var self = this;
		this.popup.animate(options,function() {self.popup.close()});
		return this;
	}
	
	return new n;
}

UI.createErrorView = function(config) {
	config = config || {};
	config.top = config.top || 60;
	config.bottom = config.bottom || 0;
	config.title = config.title || 'Oops.';
	config.message = config.message || 'Something wrong happened while I tried to fetch products for you.';
	config.viewId = config.viewId || null;
	config.backgroundColor = config.backgroundColor || '#ccc';
	var view = Ti.UI.createView(config);
	view.hide();
	
	view.add(Ti.UI.createLabel({
			top: 80,
			text: config.title,
			font: {fontSize: 48, fontWeight: 'bold'},
			color: '#222'
		}));
		
	view.add(Ti.UI.createLabel({
		top: 160,
		color: '#666',
		text: config.message,
		font: {fontSize: 28},
		left: 30,
		right: 30,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
	}));
	
	var reloadButton = Ti.UI.createButton({
		bottom: 40,
		left: 30,
		right: 30,
		title: 'Reload'
	});
	
	reloadButton.addEventListener('click', function() {
		Ti.App.fireEvent('errorView.reload', {viewId: config.viewId});
	});
	
	view.add(reloadButton);

	return view;
}

UI.createHeader = function(config) {
	var ios = Ti.Platform.osname == 'iphone';
	var android = Ti.Platform.osname == 'android';
	var TITLE_HEIGHT = ios ? 40 : 80;
	var TABLE_HEIGHT = 200;
	var TABLE_CELL_HEIGHT = ios ? 40 : 80;
	var TITLE_FONT_SIZE = ios ? 18 : 28;
	config = config || {};
	
	config.disableMenu = config.disableMenu || false;
	config.backButton = config.backButton || false;
	config.backgroundColor = config.backgroundColor || '#fff';
	config.borderColor = config.borderColor || '#aaa';
	config.color = config.color || '#222';
	config.title = config.title || '';
	
	var head = Ti.UI.createView({
		top: 0, 
		backgroundColor: config.backgroundColor, 
		height: TITLE_HEIGHT, 
		zIndex: 10
	});
	
	var isExpanded = false;

	var titleLabel = Ti.UI.createLabel({
		font: {fontSize: TITLE_FONT_SIZE, fontWeight: 'bold'},
		text: config.title,
		color: config.color,
		top: 0,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		width: Ti.UI.FILL,
		height: TITLE_HEIGHT
	});
	head.add(titleLabel);
	
	var backButton = Ti.UI.createLabel({
		width: TITLE_HEIGHT, 
		height: TITLE_HEIGHT,
		top: 0,
		left: 0, 
		border: config.borderColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER, 
		font: {fontSize: TITLE_FONT_SIZE, fontWeight: 'bold'},
		text: '<'
	});
	
	if (config.backButton == false) {
		backButton.hide();
	}
	
	backButton.addEventListener('click', function() {
		head.fireEvent('header.back');
	});
	
	head.backButton = function(value) {
		if (value === true) {
			backButton.show();
		} else if (value === false) {
			backButton.hide();
		}
		return backButton.visible;
	}
	
	head.add(backButton);
	
	head.title = function(text) {
		if (text) {
			titleLabel.text = text;
		}
		return titleLabel.text;
	}
	if (config.disableMenu == true) {
		head.toggle = 
		head.expand = 
		head.collapse = 
		head.isExpanded = 
		head.setUser = function() {return false}		
	} else {
		var userRow = Ti.UI.createTableViewRow({height: TABLE_CELL_HEIGHT, touchEnabled: false});
		var userProfilePicture = Ti.UI.createImageView({width: TABLE_CELL_HEIGHT, height: TABLE_CELL_HEIGHT, left: 0, top: 0});
		var userNameLabel = Ti.UI.createLabel({
			text: 'Let me guess your name.', 
			font: {fontSize: TITLE_FONT_SIZE, fontWeight: 'bold'}, 
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT, 
			color: '#222',
			left: TABLE_CELL_HEIGHT + 10
		});
		userNameLabel.hide();
		userRow.add(userProfilePicture);
		userRow.add(userNameLabel);
		
		var detailsView = Ti.UI.createTableView({top: TITLE_HEIGHT + 10, height: TABLE_HEIGHT, bottom: 0});
		detailsView.setData([
			userRow,
			{title: 'Want', height: TABLE_CELL_HEIGHT, url: 'Main/list', data: {listName: 'want'}},
			{title: 'Own', height: TABLE_CELL_HEIGHT, url: 'Main/list', data: {listName: 'own'}},
			{title: 'Logout', height: TABLE_CELL_HEIGHT, url: 'Main/logout', data: null}
		]);
	
		titleLabel.addEventListener('click', function() {
			head.toggle();
		});
		
		detailsView.addEventListener('click', function(e) {
			head.collapse();
			detailsView.scrollToIndex(0);
			Ti.App.fireEvent('App.dispatch', {url: e.rowData.url, data: e.rowData.data});
		});
		
		head.add(detailsView);
			
		head.toggle = function() {
			var height = isExpanded ? TITLE_HEIGHT : (TITLE_HEIGHT + TABLE_HEIGHT);
			
			head.updateLayout({height: height});
			isExpanded = !isExpanded;
		}
		
		head.getTitleHeight = function() {
			return TITLE_HEIGHT;
		}
		
		head.expand = function() {
			head.updateLayout({height: TITLE_HEIGHT + TABLE_HEIGHT});
			isExpanded = true;
		}
		
		head.collapse = function() {
			head.updateLayout({height: TITLE_HEIGHT});
			isExpanded = false;
		}
		
		head.isExpanded = function() {
			return isExpanded;
		}
		
		head.setUser = function(name, image) {
			userNameLabel.text = name;
			if (image) {
				userProfilePicture.image = image.nativePath;
			}
		}
		
		var getUser = function() {
			var user = Ti.App.Properties.getObject('facebook.user');
		
			var image = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'userpicture.jpg');
			if (!image.exists()) {
				image = null;
			}
			head.setUser(user.name, image);			
		}
	
		Ti.App.addEventListener('facebook.userchanged', getUser);
		
		if (Ti.App.Properties.hasProperty('facebook.user')) {
			getUser();
		} else {
			Ti.App.fireEvent('App.dispatch', {url: 'Main/getUser'});
		}
	}
	
	return head;
}

// This should actually be an external module.
// Try to use the require() pattern.
UI.createItemView = function(config) {
	config = config || {removeActionUrl: 'Main/ogRemove', addActionUrl: 'Main/ogAdd'};
	var TICK = '✔ ';
	var view = Ti.UI.createScrollView({
		layout: 'vertical', 
		showVerticalScrollIndicator: true,
		backgroundColor: '#000', 
		contentHeight: 'auto', 
		top: Ti.Platform.osname == 'iphone' ? 40 : 80, 
		bottom: 0, 
		zIndex: 2
	});
	
	view.hide();
	view.title = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		left: '5dip',
		top: '5dip',
		font: {fontSize: '36dip', fontWeight: 'bold'},
		color: '#fff'
	});
	
	view.image = Ti.UI.createImageView({
		top: '10dip',
	});
	
	view.likeButton = Ti.UI.createButton({title: 'Like', top: '10dip', left: '20dip', right: '20dip', action: 'like'});
	view.wantButton = Ti.UI.createButton({title: 'Want', top: '10dip', left: '20dip', right: '20dip', action: 'want'});
	view.ownButton = Ti.UI.createButton({title: 'Own', top: '10dip', left: '20dip', right: '20dip', action: 'own'});
	
	var buttonClickHandler = function(e) {
		if (view.item.actions[e.source.action] != 0) {
			view.item.actions[e.source.action] = 0;
			e.source.title = e.source.title.replace(TICK, '');
			Ti.App.fireEvent('App.dispatch', {url: config.removeActionUrl, data: {item: view.item, action: e.source.action, actionType: 'remove', actionSource: 'ItemView'}});
		} else {
			view.item.actions[e.source.action] = 1;
			e.source.title = TICK + e.source.title;
			Ti.App.fireEvent('App.dispatch', {url: config.addActionUrl, data: {item: view.item, action: e.source.action, actionType: 'add', actionSource: 'ItemView'}});
		}
	};
	
	view.likeButton.addEventListener('click', buttonClickHandler);
	view.wantButton.addEventListener('click', buttonClickHandler);
	view.ownButton.addEventListener('click', buttonClickHandler);
		
	view.add(view.title);
	view.add(view.image);
	view.add(view.likeButton);
	view.add(view.wantButton);
	view.add(view.ownButton);
	
	view.setItem = function(item) {
		// A local copy of the item is held to keep track of the actions.
		view.item = item;
		view.title.text = item.title;
		view.image.image = item.images.large;
		view.likeButton.title = String.format('%sLike', item.actions.like != 0 ? TICK : '');
		view.wantButton.title = String.format('%sWant', item.actions.want != 0 ? TICK : '');
		view.ownButton.title = String.format('%sOwn', item.actions.own != 0 ? TICK : '');	
		
		view.image.updateLayout({top: '10dip'});
		view.likeButton.updateLayout({top: '10dip'});
		view.wantButton.updateLayout({top: '10dip'});
		view.ownButton.updateLayout({top: '10dip'});			
	}
	
	return view;	
}

UI.createProductsTableView = function(config) {
	var TABLE_ROW_HEIGHT = 200;
	config = config || {};
	config.separatorColor = '#000';
	config.minRowHeight = TABLE_ROW_HEIGHT;
	var tableView = Ti.UI.createTableView(config);
	var android = Ti.Platform.osname == 'android';
	var ios = Ti.Platform.osname == 'iphone';
	
	var lastDistance = 0;
	var updating = false;
	var detectEndOfTable = function(e) {
		if (updating) {
			return;
		}
		
	    if (Ti.Platform.osname === 'iphone') {
	        var offset = e.contentOffset.y;
	        var height = e.size.height;
	        var total = offset + height;
	        var theEnd = e.contentSize.height;
	        var distance = theEnd - total;
	 
	        // going down is the only time we dynamically load,
	        // going up we can safely ignore -- note here that
	        // the values will be negative so we do the opposite
	        if (distance < lastDistance) {
	            // adjust the % of rows scrolled before we decide to start fetching
	            var nearEnd = theEnd * .75;
	 
	            if ((total >= nearEnd)) {
	            	tableView.fireEvent('tableEnd');
	            }
	        }
	        lastDistance = distance;
	    } else if (Ti.Platform.osname === 'android') {
	        var firstVisibleItemIndex = e.firstVisibleItem;
	        var totalItems = e.totalItemCount;
	        var visibleItemCount = e.visibleItemCount;
	        if ((firstVisibleItemIndex + visibleItemCount) >= (totalItems*0.75)) {
	        	tableView.fireEvent('tableEnd');
			}
	    }
	}
	tableView.addEventListener('scroll', detectEndOfTable);
	
	tableView.setUpdating = function(u) {
		updating = u;
	}
	
	tableView.createCell = function(item, key, crossReference) {
		var row = Ti.UI.createTableViewRow({item: item, height: TABLE_ROW_HEIGHT, className: 'productItem'});
		var background = Ti.UI.createImageView({image: item.images.large, width: 'auto', height: 'auto', top: 0, bottom: 0, left: 0, right: 0});
		var labelView = Ti.UI.createView({
			backgroundColor: '#000', 
			opacity: 0.8, 
			height: 50, 
			top: 150,
			bottom: 0, zIndex: 1});
			
		var titleLabel = Ti.UI.createLabel({
			text: item.title, 
			font: {fontSize: 18, fontWeight: 'bold'}, 
			color: '#fff', 
			top: 0,
			height: 26,
			width: Ti.UI.FILL,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT});
			
		var crossReferenceLabel = Ti.UI.createLabel({
			text: crossReference + ' ' + key, 
			font: {fontSize: 13}, 
			color: '#fff',
			top: 30,
			height: 20,
			bottom: 10,
			width: Ti.UI.FILL,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT});
		
		labelView.add(titleLabel);
		labelView.add(crossReferenceLabel);
		
		row.add(background);
		row.add(labelView);
		return row;
	}
	
	return tableView;
}