/**
 * This panel give vertex manipulation possibility.
 */

Ext.define("Ck.edit.Vertex", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckedit-vertex",
	
	controller: "ckedit.vertex",
	
	cls: "ck-edit-vertex",
	itemId: "edit-vertex",
	_height: "auto",
	hidden: true,
	
	layout: {
		type: "fit"
	},
	
	items: [{
		xtype: "gridpanel",
		itemId: "vertexgrid",
		selModel: "rowmodel",
		// Disable buffere for UP and DOWN grid loop (decrease display perf)
		bufferedRenderer: false,
		_width: "auto",
		_height: "auto",
		plugins: [{
			ptype: 'gridediting'
		},{
			ptype: "rowediting",
			clicksToEdit: 1
		}],
		columns: [{
				text: "#",
				dataIndex: "number",
				width: 50,
				hideable: true,
				locked: true
			},{
				text: "X",
				dataIndex: "longitude",
				editor: "numberfield",
				width: 115
			},{
				text: "Y",
				dataIndex: "latitude",
				editor: "numberfield",
				decimalPrecision: 4,
				width: 115
			}],
		store: {
			storeId: "editVertexStore",
			fields: ["number", "longitude", "latitude", "geometry"]
		}
	}],
	
	dockedItems: [{
		xtype: 'toolbar',
		dock: 'bottom',
		_ui: 'footer',
		bind: {
			hidden: "{!editing}"
		},
		items: [{
			iconCls: 'fa fa-check',
			itemId: "save-vertex"
		},{
			iconCls: 'fa fa-remove',
			itemId: "cancel-vertex"
		},"->",{
			text: "Add vertex",
			itemId: "add-vertex"
		},{
			xtype: "tbtext",
			text: "Position :"
		},{
			xtype: "numberfield",
			itemId: "vertex-position",
			width: 60,
			value: 1,
			minValue: 1,
			allowDecimals: false,
			allowBlank: false,
			hideTrigger: true
		},{
			xtype: "splitbutton",
			itemId: "vertex-live-edit",
			iconCls: "fa fa-list",
			tooltip: "Dynamic interaction",
			menu: [{
				xtype: "radio",
				itemId: "action-none",
				checked: true,
				boxLabel: "None",
				boxLabelAlign: "before",
				inputValue: "n",
				width: 120,
				dock: "left",
				margin: "0 5 0 5"
			},{
				xtype: "radio",
				itemId: "action-alter",
				boxLabel: "Alter vertex",
				boxLabelAlign: "before",
				inputValue: "a",
				width: 120,
				dock: "left",
				margin: "0 5 0 5"
			},{
				xtype: "radio",
				itemId: "action-move",
				boxLabel: "Move feature",
				boxLabelAlign: "before",
				inputValue: "a",
				width: 120,
				dock: "left",
				margin: "0 5 0 5"
			}]
		}]
	}]
});
