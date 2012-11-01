Ti.include('MVCApp.js');
Ti.include('Ajax.js');
Ti.include('UI.js');

Ajax.baseUrl('http://socialcommerce.fbdublin.com');

Ti.Facebook.appid = '182903098482610';
Ti.Facebook.forceDialogAuth = false;
Ti.Facebook.permissions = ['publish_actions', 'user_likes', 'user_interests', 'friends_likes', 'friends_interests', 'manage_friendlists'];

/**
 * Your application bootstraps from Controllers/Main.js
 * If you do not specify an action (e.g. "Main/alert"), the default action will be triggered.
 */
App.dispatch('Main/auth');