/**
 *
 */
Ext.define('Ck.legend.plugin.action.Delete', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayerremove',

	iconCls: 'ckClose ck-plugin',
	tooltip: 'Remove layer from map',

	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			isDisabled: function(v, r, c, i, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return true
				} else {
					return !lyr.getExtension("removable");
				}
			},
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return "";
				} else {
					return (lyr.getExtension("removable"))? this.iconCls : this.disableClass;
				}

			},
			scope: this
		}

		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},

	doAction: function(layer) {
		this.getMap().removeLayer(layer);
	}
});
