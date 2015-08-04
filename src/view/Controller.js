/**
 * 
 */
//<debug>
// Mini hack to load Ck.js main static class in dev mode
Ext.Loader.loadScriptsSync([Ext.manifest.paths.Ck + "/Ck.js"]);
//</debug>

Ext.define('Ck.view.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckview',
	
	init: function() {
		if(Ck.params.app) {
			this.getView().setName(Ck.params.app);
		}
		
		this.initUi();				
	},
	
	/**
	 * Called before adding the UI to the view. To be overridden by the app in order to modify, control the UI.
	 */
	beforeAdd: function(ui) {
		return ui;
	},
	
	/**
	 * Add the UI in the view.
	 * @private
	 */
	initUi: function(ui) {
		if(!ui) {
			var uiName = this.getView().getName();
			this.getUi(uiName);
			return;
		}
		
		ui = this.beforeAdd(ui);
		
		if(this.fireEvent('beforeadd', ui) !== false) {
			this.view.add(ui);
		}
		
		return true;
	},
	
	/**
	 *	Get the json definition of the UI from the server (or localstorage).
	 * @private
	 */
	getUi: function(uiName) {
		var path = Ext.manifest.profile + '/resources/ck-viewer';
		//<debug>
		// mini hack to load static resource in dev and prod (this is ignored in prod) !
		path = 'packages/local/ck-viewer/resources';
		//</debug>
		Cks.get({
			url: path + '/ui/'+uiName+'.json',
			scope: this,
			success: function(response){
				var uiConfig = Ext.decode(response.responseText);
				this.initUi(uiConfig);
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				// var uiConfig = Ext.decode(response.responseText);
				// this.initUi(uiConfig);
				
				Ck.error('Error when loading "'+uiName+'" interface !. Loading the default interface...');
				
				this.getUi('default');
			}
		});
	}

});
