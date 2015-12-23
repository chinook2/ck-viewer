/**
 *
 */
Ext.define('Ck.legend.plugin.action.Edit', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayeredit',

	iconCls: 'fa fa-pencil fa-lg ck-plugin',
	tooltip: 'Edit layer',

	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(!Ext.isEmpty(lyr)) {
					var ext = lyr.get("extension");
					if(ext && ext.editable) {
						return this.iconCls;
					}
				}
				
				return this.disableClass;
				
			},
			scope: this
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	doAction: function(layer) {
		if(this.win) {
			this.win.destroy();
		}
		this.win = Ext.create('Ext.window.Window', {
			title: "Edit layer " + layer.get('title'),
			width: 410,
			height: 300,
			layout: 'fit',
			collapsible: true,
			closable: false,
			items: {
				xtype: 'ckedit',
				layer: layer
			}
		});

		this.win.show();
	},
	
	close: function() {
		this.win.close();
	}
});
