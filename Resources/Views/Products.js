Ti.include('../UI.js');
var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';

var createProductsTableView = function(config) {
	var TABLE_ROW_HEIGHT = '200dp';
	config = config || {};
	config.separatorColor = '#000';
	config.minRowHeight = TABLE_ROW_HEIGHT;
	var tableView = Ti.UI.createTableView(config);
	
	function createCell(item, key, crossReference) {
		var row = Ti.UI.createTableViewRow({item: item, height: TABLE_ROW_HEIGHT, className: 'productItem'});
		var background = Ti.UI.createImageView({image: item.images.large, width: 'auto', height: 'auto', top: '0dp', bottom: '0dp', left: '0dp', right: '0dp'});
		var labelView = Ti.UI.createView({
			backgroundColor: '#000', 
			opacity: 0.8, 
			height: '50dp', 
			top: '150dp',
			bottom: '0dp', zIndex: 1});
			
		var titleLabel = Ti.UI.createLabel({
			text: item.title, 
			font: {fontSize: '18dp', fontWeight: 'bold'}, 
			color: '#fff', 
			top: '0dp',
			height: '26dp',
			width: Ti.UI.FILL,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT});
			
		var crossReferenceLabel = Ti.UI.createLabel({
			text: crossReference + ' ' + key, 
			font: {fontSize: '13dp'}, 
			color: '#fff',
			top: '30dp',
			height: '20dp',
			bottom: '10dp',
			width: Ti.UI.FILL,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT});
		
		labelView.add(titleLabel);
		labelView.add(crossReferenceLabel);
		
		row.add(background);
		row.add(labelView);
		return row;
	}
	
	var _appendRow = tableView.appendRow;
	
	tableView.appendRow = function(item, key, crossReference) {
		_appendRow.apply(tableView, [createCell(item, key, crossReference)]);
	}
	
	return tableView;
}

var header = UI.createHeader({title: 'Social Store'});
win.add(header);

var errorView = UI.createErrorView();
win.add(errorView);


var mainView = Ti.UI.createScrollableView({
	backgroundColor: '#000',
	cacheSize: 2,
	top: '60dp',
	bottom: '0dp'
});

Ti.App.addEventListener('App.errorFetchingProducts', function() {
	mainView.hide();
	errorView.show();
});

Ti.App.addEventListener('App.errorReloadButton', function() {
	errorView.hide();
	mainView.show();
});

var productsTableView = {
	me: createProductsTableView({backgroundColor: '#000'}),
	friends: createProductsTableView({backgroundColor: '#000'})
};

mainView.addView(productsTableView.me);
mainView.addView(productsTableView.friends);

win.add(mainView);

productsTableView.me.addEventListener('click', function(e) {
	win.dispatch('Main/item', e.rowData.item);
});

productsTableView.friends.addEventListener('click', function(e) {
	win.dispatch('Main/item', e.rowData.item);
});

Ti.App.addEventListener('products.received', function(e) {
	if (e.data) {
		productsTableView[e.suggestionsFor].setData(null);
		for (var i in e.data) {
			productsTableView[e.suggestionsFor].appendRow(e.data[i], i, e.crossReference);
		}
	}
});

Ti.App.addEventListener('facebook.userchanged', function(e) {
	var user = Ti.App.Properties.getObject('facebook.user');

	var image = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'userpicture.jpg');
	if (!image.exists()) {
		image = null;
	}
	header.setUser(user.name, image);
});

if (Ti.App.Properties.hasProperty('facebook.user')) {
	var user = Ti.App.Properties.getObject('facebook.user');
		
	var image = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'userpicture.jpg');
	if (!image.exists()) {
		image = null;
	}
	header.setUser(user.name, image);
}
