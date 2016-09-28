/**
 * Slider to set layer opacity. It's displayed at the layer click.
 * The opacity range begins from 0 to 100 pourcent.
 */
Ext.define('Ck.legend.plugin.Slider', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendslider',

	tipPrefix: 'Opacity',

	init: function(cmp) {
		cmp.on({
			itemmousedown: this.onItemmousedown,
			itemremove: this.onItemremove,
			scope: this
		});
	},
	
	onItemmousedown: function(tree, record, item, index, e, eOpts ) {
		var layer = record.get('layer');
		if(!layer || e.target.tagName != "SPAN") {
			return false;
		}
		
		var opacity = layer.getOpacity();
		
		var slider = record.get('slider');
		if(slider) {
			slider.setVisible(slider.hidden);
		} else {
			var td = item.firstChild.insertRow().insertCell();
			td.colSpan = 2;
			
			slider = Ext.create('Ext.slider.Single', {
				width: "96%",
				value: (opacity * 100),
				increment: 1,
				minValue: 0,
				maxValue: 100,
				renderTo: td,
				useTips: true,
				tipPrefix: this.tipPrefix,
				style: {
					marginRight: "2%",
					marginLeft: "2%"
				},
				tipText: function(thumb) {
					return Ext.String.format(slider.tipPrefix + ' {0} %', thumb.value);
				},
				listeners: {
					change: function(s, v) {
						layer.setOpacity(v/100);
					}
				}
			});
			record.set('slider', slider);
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
