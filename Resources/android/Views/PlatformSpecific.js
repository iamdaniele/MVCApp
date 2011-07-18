var win = Ti.UI.currentWindow;
win.backgroundColor = '#222';

win.add(Ti.UI.createLabel({
	color: '#aaa',
	textAlign: 'center',
	text: 'This is a platform specific view created from a file. I\'m sure this is Android.\n'
		+ 'Press the device\'s back button to close this window.'
}));