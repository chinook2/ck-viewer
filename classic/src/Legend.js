/**
 * 
 */

Ext.define("Ck.Legend", {
	extend: "Ext.tree.Panel",
	alias: "widget.cklegend",
	
	requires: [
		'Ck.legend.*'
	],

	controller: "cklegend",
	
	viewModel: {
		type: "cklegend"
	},

	plugins: [
		'legendchecker',
		'legendslider',
		'legendgraphic',
		'legendlayersave',
		'legendlayeredit',
		'legendlayerzoom',
		'legendlayerremove'
	],
	
	viewConfig: {
		plugins: { 
			ptype: 'treeviewdragdrop',
			containerScroll: true,
			allowParentInserts: true
		}
	},
	
	config: {
		map: null
	},
	
	useArrows: true,
	rootVisible: false,
	hideHeaders: true,
	
	cls: 'ck-legend',
	
	columns: [{
		xtype: 'treecolumn',
		text: 'Layers',
		dataIndex: 'text',
		flex: 1
	},{
		xtype: 'actioncolumn'
	}]
});
