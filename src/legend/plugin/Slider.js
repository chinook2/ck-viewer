/**
 * Slider to set layer opacity. It's displayed at the layer click.
 * The opacity range begins from 0 to 100 pourcent.
 */
Ext.define('Ck.legend.plugin.Slider', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendslider',

	tipPrefix: Ck.text('opacity'),

	init: function(cmp) {
		cmp.on({
			itemclick: this.onItemclick,
			itemremove: this.onItemremove,
			scope: this
		});
	},

	onItemclick: function(tree, record, item, index, e, eOpts ) {
		var layer = record.get('layer');
		if(layer && record.isLeaf() && e.target.tagName == "SPAN" && !Ext.String.startsWith(e.target.className.trim(), "x-action") && !Ext.String.startsWith(e.target.className.trim(), "x-tree-checkbox")) {
			var opacity = layer.getOpacity();

			var slider = record.get('slider');
			if(slider && record.isLeaf() && slider.getEl().dom && slider.getEl().dom && Ext.get(slider.getEl().dom.id)) {
				slider.setVisible(slider.hidden);
			} else {
				var tr = item.firstChild.insertRow();
				tr.classList.add("ck-layer-slider");
				var td = tr.insertCell();
				td.colSpan = 2;

				slider = Ext.create('Ext.slider.Single', {
					width: '90%', // ok with vertical scrollbar in panel
					value: (opacity * 100),
					increment: 1,
					minValue: 0,
					maxValue: 100,
					renderTo: td,
					useTips: true,
					tipPrefix: this.tipPrefix,
					saveDelay: 300,
					checkChangeEvents: ["change"],
					style: {
						marginRight: "2%",
						marginLeft: "2%"
					},
					tipText: function(thumb) {
						return Ext.String.format(slider.tipPrefix + ' {0} %', thumb.value);
					},
					listeners: {
						change: function(s, v) {
							// Ck.log(v.toString());
							layer.setOpacity(v/100);
						}
					}
				});
				record.set('slider', slider);
			}
		}
	},

	/**
	 * The Ext doc is wrong for the list params !!
	 * After drag&drop the slider reference is wrong, need to rebuild
	 */
	onItemremove: function(root, record) {
		record.set('slider', false);
	}

});
