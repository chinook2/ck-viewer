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
		if(formName && Ck.isMobileDevice()) {
			formName += '&mod=mobile';
		}
		if(!formName){
			var lyrName = layer.get('id');
			var lyrName = lyrName.split(":");
			lyrName = lyrName.pop();
			formName = '/' + lyrName
		}
		
		var fid = this.currentRecord.data.objectid || this.currentRecord.data.ogc_fid || this.currentRecord.data.ogc_fid || this.currentRecord.data.gid || this.currentRecord.data.id;
		if(Ext.isFunction(layer.getExtension) && layer.getExtension("fidColumn")) {
			var fidColumn = layer.getExtension("fidColumn");
			
			if(fidColumn) {
				fid = this.currentRecord.data[fidColumn];
			}
		}
		
		if(!fid){
			fid = this.currentRecord.data.ckFeature.getId();
		}
		
		var dataObject = null;
		var offerings = layer.ckLayer.getOfferings();
		if(offerings) {
			for(var i=0; i<offerings.length; i++) {
				var offering = offerings[i];
				if(offering.getType() == "geojson" || offering.getType() == "shapefile") {
					dataObject = this.currentRecord.data;
					break;
				}
			}			
		}
		
		this.mapFormPanel =  Ext.create({
			xtype: 'ckform',
			editing: false,
			formName: formName,
			layer: layer.get("id"),
			dataFid: fid,
			dataObject: dataObject
		});
		
		this.mapFormPanel.getController().on("aftersave", this.editingComplete, this);
		
		this.mapFormWindow = Ext.create('Ext.window.Window', {
			layout: 'fit',
			headerPosition: 'right',
			
			//maximized: true,
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
