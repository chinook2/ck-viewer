/**
 * 
 */
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
			url: 'packages/local/ck-viewer/resources/ui/'+uiName+'.json',
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
