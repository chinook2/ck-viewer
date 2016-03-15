/**
 * Legend for layer. Use getLegendGraphic to get image
 */
Ext.define('Ck.legend.plugin.Legend', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendgraphic',

	init: function(cmp) {
		cmp.on({
			itemclick: this.onItemmousedown,
			itemremove: this.onItemremove,
			scope: this
		});
	},
	
	onItemmousedown: function(tree, record, item, index, e, eOpts ) {
		var layer = record.get('layer');
		if(layer && record.isLeaf() && !e.target.className.trim().startsWith("x-action") && !e.target.className.trim().startsWith("x-tree-checkbox")) {
			
			var legend = record.get('legend');
			if(legend && legend.getEl().dom && Ext.get(legend.getEl().dom.id)) {
				legend.setVisible(legend.hidden);
			} else {
				legend = Ext.create('Ext.Img', {
					src: Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + layer.get("id"),
					renderTo: item,
					alt: "No legend available",
					style: {
						marginLeft: '5%',
						marginRight: '5%'
					}
				});
				legend.getEl().dom.addEventListener("error", this.interceptError.bind(this));
				record.set('legend', legend);
			}
		}
	},
	
	onItemremove: function(root, record) {
		// After drag&drop the slider reference is wrong, need to rebuild
		record.set('legend', false);
	},
	
	interceptError: function(el) {
		this.setVisible(false)
	}
});
