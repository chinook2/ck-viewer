/**
 *
 */
Ext.define('Ck.edit.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit',

	listen: {
		controller: {
			'ckmap': {
				ready: 'linkToMap'
			}
		}
	},
	
	linkToMap: function(ckMap) {
		ckMap.edit = this;
	},

	/**
	 * @protected
	 */
	init: function(view) {
		var conf = view.editConfig;
		this.openner = view.openner;
		
		Ext.apply(conf, {
			openner: this,
			layer: view.layer,
			enableToggle: true,
			toggleGroup: "edit-tools"
		});
		
		view.addDocked({
			xtype: "toolbar",
			dock: "top",
			items: [
				Ext.apply({action: "ckEditCreate"}, conf),
				Ext.apply({action: "ckEditAttribute"}, conf),
				Ext.apply({action: "ckEditGeometry"}, conf),
				Ext.apply({action: "ckEditDelete"}, conf)
			]
		});
		
		this.action = {
			"create": Ck.getAction("ckEditCreate"),
			"attribute": Ck.getAction("ckEditAttribute"),
			"geometry": Ck.getAction("ckEditGeometry"),
			"delete": Ck.getAction("ckEditDelete")
		},
		
		this.control({
			"ckedit button#close": {
				click: this.close,
				scope: this
			}
		});
	},
	
	close: function() {
		for(var key in this.action) {
			this.action[key].close.bind(this.action[key])();
		}
		this.openner.close();
	},
});
