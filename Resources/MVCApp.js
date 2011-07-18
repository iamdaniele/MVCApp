/**
 * MVCApp
 * © 2011 Studio Melonpie
 */
var App = {
	controllers: {},
	_controller: null,
	android: null,
	iphone: null,
	toArray: function(o) {return Array().slice.call(o)},
	controller: function(c) {App._controller = c},
	create: function(what, params) {
		var method = 'create' + what;

		params = params || {};
		if(!Ti.UI[method]) {
			Ti.API.error('[MVCApp] create: ' + method + ' is an invalid method');
			return;
		}
		
		var object = Ti.UI[method](params);
		object.android = App.android;
		object.iphone = App.iphone;
		return object;
	},
	/**
	 *		App.view(file, params)				to load the specified file with the additional parameters
	 */
	view: function(name, params) {
		params = params || null;
		var type = 'Window';
		params.url = params.url || 'Views/' + name + '.js';
		if(params._type) {
			type = params._type;
			delete params._type;
		}
		return App.create(type, params);
	},
	
	onDispatch: function(data) {
		if(typeof App.controllers[data.url] == 'undefined') {

			try {
				Ti.include(data.url);

				App.controllers[data.url] = new App._controller;
				App._controller = null;
				if(App.controllers[data.url] && typeof App.controllers[data.url].init == 'function') {
					App.controllers[data.url].init();						
				}
			} catch(e) {
				return Ti.API.error('[MVCApp] Invalid controller: ' + data.url);
			}
		}
		
		if(typeof App.controllers[data.url] == 'undefined' || !App.controllers[data.url]) {
			return Ti.API.error('[MVCApp] Invalid controller: ' + data.url.replace(/^Controllers\/(.+?)\.js$/, '$1'));
		}

		if(typeof App.controllers[data.url][data.action] != 'function') {
			return Ti.API.error('[MVCApp] Action ' + data.action + ' not found in controller ' + data.url.replace(/^Controllers\/(.+?)\.js$/, '$1'));
		}

		try {
			App.controllers[data.url][data.action].apply(this, data.params);
		}
		catch (e) {
			return Ti.API.error('[MVCApp] ' + e.name + ' at ' + data.url + ' line ' + e.line + ': ' + e.message);
		}
	},
	dispatch: function(/* location, param, param, ... */) {
		var params = App.toArray(arguments);
		var location = params.shift();
		var action = location.split('/');
		if(action.length == 1) {
			action = 'defaultAction';
		}
		else if(action.length == 2){
			location = action[0];
			action = action[1] + 'Action';
		}
		
		App.onDispatch({url: 'Controllers/' + location + '.js', action: action, params: params || []});
	},
	init: function() {
		App.iphone = Ti.Platform.name == 'iPhone OS';
		App.android = Ti.Platform.name == 'android';

		Ti.App.addEventListener('App.dispatch', function(e) {
			if(!e.url) {
				return Ti.API.error('App.dispatch: missing URL');
			}
			
			App.dispatch(e.url, e.data || null);
		});
	}
};
App.init();