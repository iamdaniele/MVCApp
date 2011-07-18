App.controller(function() {
	
	this.fromViewAction = function() {
		alert('Called action from a view');
	}
	
	this.sampleAction = function() {
		alert('Called sample action from other controller');
	}
	
	this.defaultAction = function() {
		alert('Called default action from other controller');
	}
});