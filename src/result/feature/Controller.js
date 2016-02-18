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
		var record = btn.getWidgetRecord().data;
		var layer = this.getView().ownerCt.getController().currentLayer.data.data.layer;
		
		var formName = layer.getExtension('form');
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
			dataFid: record.objectid
		});
		
		this.mapFormWindow = Ext.create('Ext.window.Window', {
			// height: 300,
			// width: 600,
			layout: 'fit',
			headerPosition: 'right',
			
			maximized: true,
			closable: false,
			
			closeAction: 'hide',
			listeners:{
				//close: this.clearSelection,
				scope: this
			},
			items: this.mapFormPanel 
		});
		
		this.mapFormWindow.show();
	}
});
