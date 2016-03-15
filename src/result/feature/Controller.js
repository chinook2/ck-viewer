/**
 *
 */
Ext.define('Ck.result.feature.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckresult.feature',
	
	/**
	 * @protected
	 */
	init: function(view) {
		var menu = view.getExtraMenu();
		if(menu.length > 0) {
			var gridCols = view.getHeaderContainer().getMenu();
			
			for(var i = 0; i < menu.length; i++) {	
				var majBtn = Ext.create(menu[i]);
				gridCols.add(majBtn);
			}
		}
		
	},
	
	openSheet: function(btn) {
		this.currentRecord = btn.getWidgetRecord();
		var layer = this.getView().ownerCt.getController().currentLayer.data.data.layer;
		
		var formName = layer.getExtension('form');
		// Filter form fields for mobile (when using Forms serveur)
		// if(formName) {
		if(formName && !Ext.os.is.desktop) {
			formName += '&mod=mobile';
		}
		if(!formName){
			var lyrName = layer.get('id');
			var lyrName = lyrName.split(":");
			lyrName = lyrName.pop();
			formName = '/' + lyrName
		}
		
		
		
		this.mapFormPanel =  Ext.create({
			xtype: 'ckform',
			editing: false,
			formName: formName,
			layer: layer.get("id"),
			dataFid: this.currentRecord.data.objectid
			// ,dataObject: feature.getProperties() 
		});
		
		this.mapFormPanel.getController().on("aftersave", this.editingComplete, this);
		
		this.mapFormWindow = Ext.create('Ext.window.Window', {
			layout: 'fit',
			headerPosition: 'right',
			
			maximized: true,
			closable: false,
			
			closeAction: 'hide',
			listeners:{
				scope: this
			},
			items: this.mapFormPanel 
		});
		
		this.mapFormWindow.show();
	},
	
	/**
	 * After sheet saving, update the corresponding row
	 */
	editingComplete: function(data) {
		var config = {};
		
		// HARDCOOORE FIX to avoid schema and table prefix in field name
		for(field in data) {
			config[field.split(".").pop()] = data[field];
		}
		
		this.currentRecord.set(config);
	}
});
