/**
 *
 */
Ext.define('Ck.legend.plugin.action.Edit', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayeredit',

	iconCls: 'fa fa-pencil fa-lg ck-plugin',
	tooltip: 'Edit layer',
	
	/**
	 * Where display the edit panel
	 */
	target: "window",
	
	/**
	 * Options merged to the target instanciation options
	 */
	targetOpt: {},

	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(this.isEditable(lyr)) {
					return this.iconCls;
				} else {
					return this.disableClass;
				}
			},
			scope: this
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	doAction: function(layer) {		
		var map = this.getMap();
		
		var editOpt = {
			xtype	: "ckedit",
			layer	: layer,
			openner	: this
		};
		
		if(!Ext.isEmpty(this.win)) {
			this.close();
		}
		
		switch(this.target) {
			case "window":
				this.win = Ext.create('Ext.window.Window', Ext.apply({
					title: "Edit layer " + layer.get('title'),
					width: 410,
					height: 300,
					layout: 'fit',
					collapsible: true,
					closable: false,
					items: [editOpt]
				}), this.targetOpt);

				this.win.show();
				break;
			case "docked":
				var view = map.getView();
				this.win = view.addDocked(Ext.apply({
					dock : "top"
				}, this.targetOpt, editOpt));
				this.getMap().getOlMap().updateSize()
				break;
		}
		
	},
	
	/**
	 * @param {ol.layer.Base}
	 */
	isEditable: function(layer) {
		if(!Ext.isEmpty(layer) && !(layer instanceof ol.layer.Group)) {
			if(layer.getExtension("editable") || layer.ckLayer.getPermission("edit")) {
				return true;
			}
		}
		return false;
	},
	
	close: function() {
		switch(this.target) {
			case "window":
				this.win.close();
				this.win.destroy();
				break;
			case "docked":
				this.win[0].close();
				this.win[0].destroy();
				this.getMap().getOlMap().updateSize()
				break;
		}
		delete this.win;
	}
});
