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
			isDisabled: function(v, r, c, i, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return true
				} else {
					return !(lyr instanceof ol.layer.Vector);
				}
			},
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return "";
				} else {
					return (lyr instanceof ol.layer.Vector)? this.iconCls : this.disableClass;
				}
				
			},
			scope: this
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	doAction: function(layer) {
		this.win = Ext.create('Ext.window.Window', {
			title: "Edit layer " + layer.get('title'),
			// height: 400,
			width: 400,
			layout: 'fit',
			items: {
				xtype: 'ckedit',
				openner: this,
				layer: layer
			}
		});

		this.win.show();
	},
	
	close: function() {
		this.win.close();
	}
});
