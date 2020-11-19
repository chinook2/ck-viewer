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
		},
		getRowClass: function(record, rowIndex, rowParams, store){
			return record.get("disabled") ? "ck-disabled-layer" : "";
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
		/*
		,
        renderer: function (val, meta, rec) {
            if (rec.get('disabled')) {
				if(meta){
					meta.style = 'color: gray; font-style: italic;background:#dedede';
				}
            }
            return val;
        }
		*/
	},{
		xtype: 'actioncolumn'
	}]
});
