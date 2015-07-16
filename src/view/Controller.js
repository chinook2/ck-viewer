/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('ck.view.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckview',
		
	init: function() {
		var cfg = Ext.Object.fromQueryString(location.search);
		if(cfg.app) {
			this.getView().setName(cfg.app);
		}
		
		this.initUi();				
	},
		
	/**
	 * PRIVATE
	 */
	initUi: function(ui) {
		if(!ui) {
			var uiName = this.getView().getName();
			this.getUi(uiName);
			return;
		}
		
		this.view.add(ui);
		return true;
	},
	
	// Récupère la définition de l'application
	getUi: function(uiName) {
		Ext.Ajax.request({
			url: '../packages/local/ck-viewer/resources/ui/'+uiName+'.json',
			disableCaching: false,
			scope: this,
			success: function(response){
				var uiConfig = Ext.decode(response.responseText);
				this.initUi(uiConfig);
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				// var uiConfig = Ext.decode(response.responseText);
				// this.initUi(uiConfig);
				
				Ext.log({
					level: 'error',
					msg: 'Error when loading "'+uiName+'" interface !. Loading the default interface...'
				});
				
				this.getUi('default');
			}
		});		
	}

});
