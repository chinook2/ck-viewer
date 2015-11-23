/**
 *
 */
Ext.define('Ck.login.action.Logout', {
	extend: 'Ck.Action',
	alias: "widget.ckLogout",
	
	itemId: 'logout',
	text: 'Logout',
	iconCls: 'fa fa-unlock-alt',
	tooltip: 'Logout',
	
	/**
	 * Logout.
	 */
	doAction: function(btn) {
		Cks.post({
			// CORS Authent
			withCredentials: true,
			url: Ck.getApi() + 'logout',			
			success: function(response) {
				var logout = Ext.decode(response.responseText);
				if(logout.success){
					// Remove the localStorage key/value
					sessionStorage.removeItem('CkLoggedIn');
					
					// Remove App
					var view = btn.up('ckview');
					view.destroy();
					
					// Remove windows
					var aw = Ext.query('.x-window');
					aw.forEach(function(w){
						var win = Ext.getCmp(w.id);
						if(win) win.destroy();
					})

					// Remove globals tips
					var at = Ext.query('.x-tip');
					at.forEach(function(t){
						var tip = Ext.getCmp(t.id);
						if(tip) tip.destroy();
					})
					
					// Add the main view to the viewport		
					var ui = Ck.getOption('anonymousUi') || 'ck-login';
					Ext.create({
						xtype: 'ckview',
						name: ui
					});
				} else {
					Ck.error('Logout error for user "'+ sessionStorage.getItem("CkLoggedIn") +'".');
				}
			},
			failure: function(response) {
			},
			scope: this
		});		
	}
});
