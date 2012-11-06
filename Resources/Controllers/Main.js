App.controller(function() {
	
	var loginWindow = null;
	var mainWindow = null;
	var itemWindow = null;
	var listWindows = {};
	var indicator = null;
	var store = null;
	var listStore = {};
	var Store = function() {
		var items = {};
		var count = 0;
		this.isEmpty = function() {return count == 0;}
		this.count = function() {return count;}
		this.set = function(key, value) {
			if (typeof items[key] == 'undefined') {
				count++;
			}
			
			items[key] = value;
		}
		this.get = function(key) {return items[key] || null}
		this.items = function() {return items}
		this.forEach = function(callback) {
			var index = 0;
			for (var key in items) {
				callback(items[key], key, index++);
			}
		}
		this.remove = function(key) {
			if (typeof items[key] != 'undefined') {
				count--;
				count = count < 0 ? 0 : count;
			}
			delete items[key];
		}
		this.reset = function() {items = {};count = 0;}
	};
	
	var initLoginWindow = function() {
		if (loginWindow) {
			return;
		}
		loginWindow = App.create('Window', {modal: true, backgroundColor: '#fff', navBarHidden: true, exitOnClose: true});
		loginWindow.add(Ti.UI.createLabel({top: 40, text: 'Log in', font: {fontSize: 18, fontWeight: 'bold'}, color: '#222'}));
		
		var loginButton = Ti.UI.createButton({title: 'Log in with Facebook', top: 70});
		loginButton.addEventListener('click', function() {
			Ti.Facebook.authorize();
		});
		
		loginWindow.add(loginButton);
	}
	
	var initStore = function() {
		store.reset();
		
		Ti.App.addEventListener('products.received', function(e) {
			for (var i in e.data) {
				store.set(e.data[i].id, e.data[i]);	
			}
		});
	}
	
	var setUserDetails = function(force) {
		if (typeof force == 'undefined' && Ti.App.Properties.hasProperty('facebook.user')) {
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
	
	this.getUserAction = function() {setUserDetails(true)}
	
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
		
		Ti.App.addEventListener('errorView.reload', function(e) {
			refresh(e.viewId);
		});
	}

	var refresh = function(feed) {
		indicator.show();
		if (!feed || feed == 'me') {
			Ajax.get('/ajax/suggestions/for/me', {format: 'json', access_token: Ti.Facebook.getAccessToken()}, function(r, status, xhr) {
				indicator.hide();			
				if (status.success) {
					Ti.App.fireEvent('products.received', {data: r.results, crossReference: r.crossReferenceLabel, suggestionsFor: 'me'});		
				} else {
					Ti.API.info('showing error window')
					Ti.App.fireEvent('products.error', {suggestionsFor: 'me'});
				}
			});	
		}
		
		if (!feed || feed == 'friends') {
			Ajax.get('/ajax/suggestions/for/friends', {format: 'json', access_token: Ti.Facebook.getAccessToken()}, function(r, status, xhr) {
				indicator.hide();			
				if (status.success) {
					Ti.App.fireEvent('products.received', {data: r.results, crossReference: r.crossReferenceLabel, suggestionsFor: 'friends'});		
				} else {
					Ti.API.info('show error window')
					Ti.App.fireEvent('products.error', {suggestionsFor: 'friends'});
				}
			});
		}	
	}
	
	this.getSuggestionsAction = function(since, feed) {
		Ajax.get('/ajax/suggestions', {since: since, 'for': feed, format: 'json', access_token: Ti.Facebook.getAccessToken()}, function(r, status, xhr) {
			if (status.success) {
				Ti.App.fireEvent('products.received', {data: r.results, crossReference: r.crossReferenceLabel, suggestionsFor: feed});		
			} else {
				Ti.API.error(String.format('Error while retrieving feed %s, position %s', feed, since));
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
			if (listStore[data.action]) {
				listStore[data.action].remove(data.item.id);
			}
		}
		Ajax.get('/ajax/og', {access_token: Ti.Facebook.getAccessToken(), action: data.action, item: data.item.id, method: 'delete'}, function(r, status, xhr) {
			if (r.error) {
				Ti.API.warn('Could not delete action: ' + xhr.responseText);
			}
		});
	}
	
	this.defaultAction = function() {	
		if (!mainWindow) {
			mainWindow = App.view('Products', {exitOnClose: true, navBarHidden: true});
			mainWindow.addEventListener('android:back', function(e) {
				Ti.API.info('android:back')
				if (itemWindow && itemWindow.visible) {
					itemWindow.hide();
					itemWindow.scrollTo(0, 0);
				} else {
					mainWindow.close();
				}
			});
			mainWindow.open();
		}
		
		if (store.isEmpty()) {
			refresh();
		}
	}
	
	this.listAction = function(data) {
		if (!data.listName) {
			Ti.API.info('no list specified.');
			return;
		}
		var title = data.listName.charAt(0).toUpperCase() + data.listName.slice(1);
		listWindows[data.listName] = App.view('List', {navBarHidden: true, title: title, list: data.listName});
		listWindows[data.listName].open();
 
		// if (!listStore[data.listName] || listStore[data.listName].isEmpty()) {
			listStore[data.listName] = new Store();
			indicator.show();
			Ajax.get('/ajax/lists',
				{name: data.listName, format: 'json', access_token: Ti.Facebook.getAccessToken(), user: Ti.Facebook.getUid()}, 
				function(r, data, xhr) {
				indicator.hide();
				if (r.error) {
					Ti.App.fireEvent('list.error', {list: r.list});
				} else {
					for (var i in r.results) {
						listStore[r.list].set(r.results[i].id, r.results[i]);
						Ti.API.info(listStore[r.list].get(r.results[i].id).id);
					}
					Ti.API.info(String.format('store: %s: received. count: %d', r.list, listStore[r.list].count()));
					Ti.App.fireEvent('list.received', {list: r.list, data: listStore[r.list].items(), crossReference: r.crossReferenceLabel});
				}
			});
		// } else {
			// Ti.App.fireEvent('list.received', {list: data.listName, data: listStore[data.listName].items(), crossReference: String.format('You %s this.', data.listName)});
		// }
	}
	
	this.itemAction = function(item) {
		if (!itemWindow) {
			itemWindow = UI.createItemView();
			Ti.App.addEventListener('itemWindow.close', function() {itemWindow.hide();});
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
		Ti.API.info('logged in? ' + Ti.Facebook.loggedIn);
		if (!Ti.Facebook.loggedIn) {
			loginWindow.open();	
		} else {
			Ti.Facebook.requestWithGraphPath('/me', {}, 'GET', function(e) {
				if (e.error) {
					Ti.Facebook.logout();
					loginWindow.open();
				}
			});
			App.dispatch('Main/default');
		}
	}
});