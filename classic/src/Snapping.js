/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.Snapping", {
	extend: "Ext.grid.Panel",
	alias: "widget.cksnapping",
	
	controller: "cksnapping",
	
	id: "edit-snapping-options",
	
	cls: "ck-snapping",

	config:{
		tolerance: 15
	},
	
	
	columns: [{
		text		: "Layer",
		dataIndex	: "title",
		flex		: 1
	},{
		dataIndex	: "active",
		xtype		: "widgetcolumn",
		width		: 40,
		widget		: {
			xtype	: "checkbox",
			width	: 40,
			listeners: {
				change: function(nbField, value) {
					if (nbField.getWidgetRecord) {
						var rec = nbField.getWidgetRecord();
						if (nbField.isValid() && rec) {
							rec.set('active', value);
							var cmp = Ext.getCmp("edit-snapping-options");
							Ext.GlobalEvents.fireEvent("layerSnapActive", rec, value);
						}
					}
				}
			}
		}
	},{
		text		: "Tolerance",
		dataIndex	: "tolerance",
		xtype		: "widgetcolumn",
		width		: 100,
		widget		: {
			xtype		: "numberfield",
			minValue	: 1,
			maxValue	: 99,
			height 		: 50,
			listeners: {
				change: function(nbField, value) {
					if (nbField.getWidgetRecord) {
						var rec = nbField.getWidgetRecord();
						if (nbField.isValid() && rec) {
							rec.set('tolerance', value);
							var cmp = Ext.getCmp("edit-snapping-options");
							Ext.GlobalEvents.fireEvent("layerSnapTolerance", rec, value);
						}
					}
				}
			}
		}
	}],
	
	enableColumnHide: false,
	enableColumnMove: false,
	enableColumnResize: false,
	sortableColumns: false,
	store: {
		fields: ["layer", "title", "active", "tolerance"]
	},
	
	// hideHeaders: true,
	
	buttons: [{
		text: "Close",
		itemId: "close"
	}]
	
});
