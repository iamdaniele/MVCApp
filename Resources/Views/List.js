Ti.include('../UI.js');
var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';

var header = UI.createHeader({title: win.title, disableMenu: true, backButton: true});
header.addEventListener('header.back', function() {
	win.close();
});
win.add(header);

var errorView = UI.createErrorView({title: 'Oops.', message: 'Sorry, I could not retrieve this list. It may help if you try again.'});
win.add(errorView);
var list = UI.createProductsTableView({backgroundColor: '#000', top: header.getTitleHeight()});
win.add(list);
Ti.App.addEventListener('list.error', function(e) {
	if (e.list == win.list) {
		list.hide();
		errorView.show();
	}
});

Ti.App.addEventListener('errorView.reload', function(e) {
	errorView.hide();
	list.show();
});

list.addEventListener('click', function(e) {
	win.dispatch('Main/item', e.rowData.item);
});

Ti.App.addEventListener('list.received', function(e) {
	Ti.API.info(String.format('event received: e.list: %s, win.list: %s', e.list, win.list));
	if (e.list == win.list) {
		var data = [];
		for (var i in e.data) {
			data.push(list.createCell(e.data[i], '', e.crossReference));
		}
		list.setData(data);
	}
});
