var Ajax = {BASE_URL:''};
Ajax.toArray = function(o) {return Array().slice.call(o)};
Ajax.toQueryString = function(o) {
	var qs = [];
	for(var key in o) {
		qs.push(key + '=' + Ti.Network.encodeURIComponent(o[key]));				
	}
	
	return '?' + qs.join('&');	
}

Ajax.baseUrl = function(base) {
	if (base !== null) {
		Ajax.BASE_URL = base;
	}
	
	return Ajax.BASE_URL;
}

Ajax.send = function() {
	var args = {
		type: null,
		url: null,
		data: null,
		callback: null,
		auth: null
	};
	
	var params = Ajax.toArray(arguments);
	
	for(var i in args) {
		args[i] = params.shift() || null;
	}
	
	if(args.data instanceof Function) {
		args.callback = args.data;
		args.data = null;
	}
	
	args.url = Ajax.BASE_URL + args.url;
	
	if(!args.url.match(/^http/)) {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, args.url);
		var contents = f.read().text;
		var json = null;
		try {
			json = JSON.parse(contents);
			if(args.data) {
				var out = {data:[]};
				var type = 'array';
				for(var i in args.data) {
					if(json.data.push) {
						out.data = [];
						type = 'array';
					}
					else {
						out.data = {};
						type = 'object';
					}
					for(var d in json.data) {
						if(type == 'array' && json.data[d][i][0].id && json.data[d][i][0].id == args.data[i]) {
							out.data.push(json.data[d]);															
						}
						else if(type == 'object') {
							for(var c in json.data[d]) {
								if(json.data[d][c][i] == null) {
									continue;
								}
								else if(json.data[d][c][i][0] && json.data[d][c][i][0].id && json.data[d][c][i][0].id == args.data[i]){
									if(typeof out.data[d] == 'undefined') {
										out.data[d] = [];
									}
									out.data[d].push(json.data[d][c]);
								}
							}
						}
					}
				}
				json = out;
				contents = JSON.stringify(out);
			}
		}
		catch(e){
			Ti.API.warn('[Ajax.send] exception while parsing JSON for local file ' + args.url);
		 	json = null;
		}
		if(args.callback && args.callback instanceof Function) {
			args.callback(json, {success: true, error: false}, {responseText: contents});
		}
		return false;
	}
	
	var req = Ti.Network.createHTTPClient();
	
	if(args.type == 'GET' && args.data) {
		args.url += Ajax.toQueryString(args.data);
	}
	Ti.API.info(args.url);
	req.open(args.type, args.url);
	req.timeout = 30000;
	if(args.auth && args.auth.user && args.auth.pass) {
		req.setRequestHeader('Authorization', 'Basic ' + Ti.Ajax.base64encode(args.auth.user + ':' + args.auth.pass));
	}
	req.onload = function() {
		var json = null;
		var status = {success: true, error: false};
		try {
			if(typeof this.responseText != 'undefined') {
				json = JSON.parse(this.responseText);							
			}
		}
		catch(e) {
			Ti.API.warn('[Ajax.send] exception while parsing JSON for URL ' + args.url + ': ' + JSON.stringify(e));
			Ti.API.warn(String.format('Original response text: %s', this.responseText));
			Ti.API.warn(e);
			Ti.API.warn(JSON.stringify(e));
			json = null;
			status.success = false;
			status.error = true;
		}

		if(args.callback && args.callback instanceof Function) {
			args.callback(json, status, this);
		}
	};
	
	req.onerror = function() {
		var json = null;
		try {
			if(typeof this.responseText != 'undefined') {
				json = JSON.parse(this.responseText);							
			}

		}
		catch(e) {
			Ti.API.warn('[Ajax.send] exception while parsing JSON for URL ' + args.url);
			json = null;
		}

		if(args.callback && args.callback instanceof Function) {
			args.callback(json, {success: false, error: true}, this);
		}
	};
	req.send(args.data);
}

for(var i = 0, methods = ['GET', 'POST', 'PUT', 'DELETE'], l = methods.length; i < l; i++) {
	var name = methods[i].toLowerCase();
	Ajax[name] = new Function("var args = Ajax.toArray(arguments); args.unshift('" + methods[i] + "'); Ajax.send.apply(this, args);");
}