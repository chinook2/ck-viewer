/**
 * This panel can organize result
 */

Ext.define("Ck.Result", {
	extend: "Ext.Panel",
	alias: "widget.ckresult",
	
	controller: "ckresult",
	
	cls: "ck-result",

	requires: [],
	
	config: {
		pageSize: 15,
		
		/**
		 * @param {Object[]}
		 */
		widgetColumns: [{
			type: "sheet"
		}]
	},
	
	layout: {
		type: 'hbox',
		pack: 'start',
		align: 'stretch'
	},
	
	items: [{
		itemId: "layer_tree",
		xtype: "treepanel",
		width: 200,
		resizable: true,
		rootVisible: false,
		store: {
			xtype: "tree",
			root : {
				text: "Layer",
				expanded: true
			}
		},
		bbar: [{
			text: "Clear history",
			// JMA Hard fix - temp
			hidden: true,
			//
			itemId: "clear-history"
		}]
	},{
		itemId: "feature_grid",
		xtype: "ckresult-feature"
	}],
	

	buttons: [{
		text: "Close",
		itemId: "close"
	}]
	
});
