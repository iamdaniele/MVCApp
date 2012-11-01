/**
 * To create a new controller, use App.controller and an anonymous function.
 * The controller's name is the same as the file name.
 */
App.controller(function() {
	
	var loginWindow = null;
	var indicator = null;
	var store = null;
	var Store = function() {
		var items = {};
		this.set = function(key, value) {items[key] = value}
		this.get = function(key) {return items[key] || null}
		this.reset = function() {items = {}}
	};
	
	var initLoginWindow = function() {
		if (loginWindow) {
			return;
		}
		loginWindow = App.create('Window', {modal: true, backgroundColor: '#fff', navBarHidden: true});
		loginWindow.add(Ti.UI.createLabel({top: 40, text: 'Log in', font: {fontSize: 18, fontWeight: 'bold'}, color: '#222'}));
		
		var loginButton = Ti.UI.createButton({title: 'Log in with Facebook', top: 70});
		loginButton.addEventListener('click', function() {
			Ti.Facebook.authorize();
		});
		
		loginWindow.add(loginButton);
		Ti.API.info('login window init done');
	}
	
	var initStore = function() {
		store.reset();
		
		Ti.App.addEventListener('products.received', function(e) {
			for (var i in e.data) {
				store.set(e.data[i].id, e.data[i]);	
			}
		});
	}
	
	var setUserDetails = function() {
		if (Ti.App.Properties.hasProperty('facebook.user')) {
			return;
		}
		
		Ti.Facebook.requestWithGraphPath('/me', {}, 'GET', function(res) {
			Ti.API.info(JSON.stringify(res));
			if (res.success) {
				// cache user picture
				var result = JSON.parse(res.result);
				var xhr = Ti.Network.createHTTPClient();
				xhr.onload = function() {
					
					if (xhr.status == 200) {
						var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'userpicture.jpg');
						if (App.android) {
							file.write(this.responseData)
						}
						Ti.App.fireEvent('facebook.userchanged');
					}
				}
				
				xhr.open('GET', String.format('https://graph.facebook.com/%s/picture?width=150&height=150', result.id));
				if (App.iphone) {
					xhr.file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'userpicture.jpg');
				}
				xhr.send();
				
				Ti.App.Properties.setObject('facebook.user', result);
			} else {
				Ti.API.error('Could not retrieve details from /me path endpoint: ' + JSON.stringify(res));
				Ti.App.Properties.setObject('facebook.user', {});
			}
		});
	}
	
	this.init = function() {
		store = new Store();
		
		initStore();
		indicator = UI.createLoadingIndicator({message: 'Fetching products…'});
		
		initLoginWindow();
		
		Ti.Facebook.addEventListener('login', function(res) {
			if (res.success) {
				setUserDetails();
				loginWindow.close();
				App.dispatch('Main/default');
			}
		});
		
		Ti.Facebook.addEventListener('logout', function(res) {
			loginWindow.open();
		});
		
		Ti.App.addEventListener('App.errorReloadButton', function() {
			refresh();
		});
	}

	var data = null;	
	var refresh = function() {
		indicator.show();
		Ajax.get('/ajax/suggestions/for/me', {format: 'json', access_token: Ti.Facebook.getAccessToken()}, function(r, status, xhr) {
			indicator.hide();			
			if (status.success) {
				data = r;
				Ti.App.fireEvent('products.received', {data: r.results, crossReference: r.crossReferenceLabel, suggestionsFor: 'me'});		
			} else {
				Ti.API.info('showing error window')
				Ti.App.fireEvent('App.errorFetchingProducts');
			}
		});

		Ajax.get('/ajax/suggestions/for/friends', {format: 'json', access_token: Ti.Facebook.getAccessToken()}, function(r, status, xhr) {			
			if (status.success) {
				data = r;
				Ti.App.fireEvent('products.received', {data: r.results, crossReference: r.crossReferenceLabel, suggestionsFor: 'friends'});		
			} else {
				Ti.API.info('show error window')
				Ti.App.fireEvent('App.errorFetchingProducts');
			}
		});
	}
	
	this.ogAddAction = function(data) {
		var item = store.get(data.item.id);
		if (item) {
			item.actions[data.action] = 1;
			store.set(data.item.id, item);
		}
		
		Ajax.get('/ajax/og', {access_token: Ti.Facebook.getAccessToken(), action: data.action, item: data.item.id, method: 'post'}, function(r, status, xhr) {
			if (r.error) {
				Ti.API.warn('Could not add action: ' + xhr.responseText);
			}
		});
	}
	
	this.ogRemoveAction = function(data) {
		var item = store.get(data.item.id);
		if (item) {
			item.actions[data.action] = 0;
			store.set(data.item.id, item);
		}
		Ajax.get('/ajax/og', {access_token: Ti.Facebook.getAccessToken(), action: data.action, item: data.item.id, method: 'delete'}, function(r, status, xhr) {
			if (r.error) {
				Ti.API.warn('Could not delete action: ' + xhr.responseText);
			}
		});
	}
	
	var mainWindow = null;
	this.defaultAction = function() {
		
		if (!mainWindow) {
			mainWindow = App.view('Products', {exitOnClose: true, navBarHidden: true});
			mainWindow.addEventListener('android:back', function(e) {
				if (itemWindow && itemWindow.visible) {
					itemWindow.hide();
					itemWindow.scrollTo(0, 0);
				} else {
					mainWindow.close();
				}
			});
			mainWindow.open();
		}
		
		if (data == null) {
			refresh();
		}
	}
	
	var itemWindow = null;
	this.itemAction = function(item) {
		if (!itemWindow) {
			itemWindow = UI.createItemView();
			mainWindow.add(itemWindow);
		}
		var itemStore = store.get(item.id);
		if (itemStore) {
			itemWindow.setItem(itemStore);
			itemWindow.show();
		} else {
			Ti.API.error('calamity.');
		}
	}
	
	this.authAction = function() {
		if (!Ti.Facebook.loggedIn) {
			loginWindow.open();	
		} else {
			Ti.API.info('user logged in');
			Ti.Facebook.requestWithGraphPath('/me', {}, 'GET', function(e) {
				Ti.API.info('response…');
				Ti.API.info(JSON.stringify(e));
				if (e.error) {
					Ti.Facebook.logout();
					loginWindow.open();
				}
			});
			App.dispatch('Main/default');
		}
	}
});