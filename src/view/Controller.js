/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('ck.view.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckview',
		
	init: function() {
		this.initUi();				
	},
		
	/**
	 * PRIVATE
	 */
	initUi: function(ui) {
		if(!ui) {
			this.getUi();
			return;
		}
		
		this.view.add(ui);
		return true;
	},
	
	// Récupère la définition de l'application
	getUi: function() {
		Ext.Ajax.request({
			// url: Ext.manifest.fileConf.appFullPath + '/ui/main.json',
			url: '../packages/local/ck-viewer/resources/ui/default.json',
			disableCaching: false,
			scope: this,
			success: function(response){
				var uiConfig = Ext.decode(response.responseText);
				this.initUi(uiConfig);
			},
			failure: function(response, opts) {
				var uiConfig = Ext.decode(response.responseText);
				this.initUi(uiConfig);
			}
		});		
	},
	
	onBtnClick: function(btn) {
		alert("click" + btn.text);
	}
	
});
