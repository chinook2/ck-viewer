/**
 *
 */
Ext.define('Ck.login.action.Login', {
	extend: 'Ck.Action',
	alias: "widget.ckLogin",
	
	itemId: 'login',
	text: 'Login',
	iconCls: 'fa fa-lock',
	tooltip: 'Login',
	
	/**
	 * Login.
	 */
	doAction: function(btn) {
		if(!btn) return;
		var controller = (btn.isController) ? btn : btn.lookupController();
		var view = controller.getView();
		
		var form = view.down('form');
		if(!form)  form = view.up('form');
		if(!form) {
			Ck.error("Enable to find a valid form for action Login.");
			return;
		}
		
		var params = form.getValues();
		
		if(navigator.splashscreen) navigator.splashscreen.show();
		
		Cks.get({
			// CORS Authent
			withCredentials: true,
			url: Ck.getApi() + 'login',
			params: params,
			success: function(response) {
				var login = Ext.decode(response.responseText);
				if(login.success){
					if(login.data.uid == params.username){
						sessionStorage.setItem("CkLoggedIn", login.data.uid);
						
						// Remove Login Window
						var mainView = view.up('ckview');
						mainView.destroy();
						
						// Add the main view to the viewport		
						var ui = Ck.getOption('authenticatedUi') || 'ck-default';
						Ext.create({
							xtype: 'ckview',
							name: ui
						});
					}
				} else {
					form.getForm().markInvalid( login.errors );
					Ck.error('Login error for user "'+ params.username +'".');
				}
				if(navigator.splashscreen) navigator.splashscreen.hide();
			},
			failure: function(response) {
				if(navigator.splashscreen) navigator.splashscreen.hide();
			},
			scope: this
		});
	}
});
