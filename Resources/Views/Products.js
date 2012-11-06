Ti.include('../UI.js');
var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';

var header = UI.createHeader({title: win.title || 'Social Store'});
win.add(header);

var errorViews = {
	me: UI.createErrorView({title: 'Oops.', message: 'Something wrong happened while I tried to fetch some recommendations for you.', viewId: 'me'}),
	friends: UI.createErrorView({title: 'Darn!', message: 'Something wrong happened while I tried to fetch some recommendations for your friends.', viewId: 'friends'})
}

var mainView = Ti.UI.createScrollableView({
	backgroundColor: '#000',
	cacheSize: 2,
	top: header.getTitleHeight(),
	bottom: 0
});

Ti.App.addEventListener('products.error', function(e) {
	productsTableView[e.suggestionsFor].setData(null);
	productsTableView[e.suggestionsFor].hide();
	var views = mainView.getViews();
	if (e.suggestionsFor == 'me') {
		views[0].hide();
		views[0] = errorViews.me;
		errorViews.me.show();
		mainView.setViews(views);
	}
	
	if (e.suggestionsFor == 'friends') {
		views[1].hide();
		views[1] = errorViews.friends;
		errorViews.friends.show();
		mainView.setViews(views);
	}
	
});

Ti.App.addEventListener('errorView.reload', function(e) {
	errorViews[e.viewId].hide();
	productsTableView[e.viewId].show();
});

var productsTableView = {
	me: UI.createProductsTableView({backgroundColor: '#000', viewId: 'me'}),
	friends: UI.createProductsTableView({backgroundColor: '#000', viewId: 'friends'})
};

mainView.addView(productsTableView.me);
mainView.addView(productsTableView.friends);

win.add(mainView);

header.addEventListener('header.back', function() {
	header.backButton(false);
	Ti.App.fireEvent('itemWindow.close');
});

var itemClickListener = function(e) {
	header.backButton(true);
	win.dispatch('Main/item', e.rowData.item);
}

productsTableView.me.addEventListener('click', itemClickListener);
productsTableView.friends.addEventListener('click', itemClickListener);

var PAGE_SIZE = 5;
var since = {me: 0, friends: 0};

var updateOnScroll = function(e) {
	Ti.API.info('end scroll, requesting ' + since[e.source.viewId]);
	e.source.setUpdating(true);
	win.dispatch('Main/getSuggestions', since[e.source.viewId], e.source.viewId);
}

productsTableView.me.addEventListener('tableEnd', updateOnScroll);

Ti.App.addEventListener('products.received', function(e) {
	if (e.data) {
		var count = 0;
		for (var i in e.data) {
			count++;
			productsTableView[e.suggestionsFor].appendRow(productsTableView[e.suggestionsFor].createCell(e.data[i], i, e.crossReference));
		}
		since[e.suggestionsFor] += PAGE_SIZE;
		productsTableView[e.suggestionsFor].setUpdating(false);
		if (count < PAGE_SIZE) {
			productsTableView[e.suggestionsFor].removeEventListener('scroll', updateOnScroll);
		}
	}
});