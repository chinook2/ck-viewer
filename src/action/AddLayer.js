/**
 *
 *
 *
 *
 *
 *
 *
 */
Ext.define('Ck.action.AddLayer', {
	extend: 'Ck.Action',
	alias: "widget.ckAddLayer",

	text: "Add layer",
	tooltip: 'Add a layer',
	iconCls: 'fa fa-plus-square',

	itemId: 'addlayer',

	// panels	: ["chinook", "wms", "wfs"],
	panels	: ["chinook"],

	/**
	 * @param {Ck.map.Controller}
	 */
	ckLoaded: function(map) {
	},

	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	doAction: function(btn) {
		if(Ext.isEmpty(this.win) || this.win.isDestroyed) {
			this.mainPanel = this.createMainPanel();

			this.win = Ck.create("Ext.window.Window", {
				title		: "Additional layer",
				height		: 350,
				width		: 500,
				layout		: "fit",
				maximizable	: true,
				collapsible	: true,
				items		: [this.mainPanel]
			});
		}

		this.win.show();
	},

	createMainPanel: function() {
		var cls, config, items = [];

		for(var i in this.panels) {
			items.push({
				xtype	: "ckaddlayer",
				source	: this.panels[i],
				config	: {
					source	: this.panels[i]
				}
			})
		}

		if(items.length > 1) {
			cls = "Ext.tab.Tab";
			config = {items: items}
		} else {
			cls = "Ext.panel.Panel";
			config = {
				items: items,
				layout: "fit"
			}
		}

		return Ck.create(cls, config);
	}
});
