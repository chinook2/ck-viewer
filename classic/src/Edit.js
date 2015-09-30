/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.Edit", {
	extend: "Ext.Panel",
	alias: "widget.ckedit",
	
	controller: "ckedit",
	
	cls: "ck-edit",

	requires: [
		"Ck.edit.*",
		"Ck.edit.action.*"
	],
	
	editConfig: {
		layerId: "ckedit-layer",
		snapLayer: "",
		tolerance: 10000
	},
	
	items: [{
		xtype: "grid",
		itemId: "edit-history",
		columns: [
			{ text: "#", dataIndex: "number", width: 35 },
			{ text: "FeatureID", dataIndex: "featureid" },
			{ text: "Action", dataIndex: "action" }
		],
		store: {
			storeId: "editHistoryStore",
			fields: ["number", "featureid", "action"],
			data: [
				{ number: 99, featureid: "toto", action: "sup" }
			]
		}
	}],
	

	buttons: [{
		text: "Close",
		itemId: "close"
	}]
	
});
