/**
 * 
 */
Ext.define('Ck.login.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cklogin',
	
	control: {
		'textfield': {
			specialkey: function(field, e, options){
				if (e.getKey() == e.ENTER) {
					this.doLogin();
				}
			}
		}
	},
	
	/**
	 *
	 */
	doLogin: function() {
		var login = Ck.actions["ckLogin"];
		if(login) login.doAction(this);
	},
	
	doLogout: function() {
		var logout = Ck.actions["ckLogout"];
		if(logout) logout.doAction(this);
	}
});
