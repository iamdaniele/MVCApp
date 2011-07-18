var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';
/**
 * You can still use App.iphone and App.android inside a view. Those properties
 * will be attached to any new heavyweight view you create.
 */
if(win.iphone) {
	var close = Ti.UI.createButton({title: 'Close'});

	close.addEventListener('click', function() {
		win.close();
	});

	win.leftNavButton = close;	
}

win.add(Ti.UI.createLabel({
	color: '#aaa',
	textAlign: 'center',
	text: 'This is a heavyweight view created from a file.\n'
		+ 'You can dispatch actions from within a view by using Ti.App.fireEvent.'
}));

var dispatch = Ti.UI.createButton({bottom: 40, height: 30, title: 'Dispatch', left: 10, right: 10});
dispatch.addEventListener('click', function() {
	Ti.App.fireEvent('App.dispatch', {url: 'Other/fromView'});
});

win.add(dispatch);