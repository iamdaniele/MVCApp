var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';

var close = Ti.UI.createButton({title: 'Close'});

close.addEventListener('click', function() {
	win.close();
});

win.leftNavButton = close;	

win.add(Ti.UI.createLabel({
	color: '#aaa',
	textAlign: 'center',
	text: 'This is a platform specific view created from a file. I\'m sure this is iOS.\n'
		+ 'Press "Close" to go back.'
}));