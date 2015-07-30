/**
 * 
 */
Ext.define('Ck.view.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckview',
	
	init: function() {
		//<debug>
		// mini hack to load Ck.js main static class in dev mode
		if(!Ck.params) {
			Ext.Loader.loadScript({
				url: Ext.manifest.paths.Ck + "/Ck.js",
				onLoad: this.init,
				scope: this
			});
			return;
		} else {
			Ck.init();
		}
		//</debug>
		
		if(Ck.params.app) {
			this.getView().setName(Ck.params.app);
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
		Cks.get({
			url: Ext.manifest.profile +'/resources/ck-viewer/ui/'+uiName+'.json',
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
