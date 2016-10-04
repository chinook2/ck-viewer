/**
 * LegendGraphic to set layer opacity. It's displayed at the layer click.
 * The opacity range begins from 0 to 100 pourcent.
 */
Ext.define('Ck.legend.plugin.LegendGraphic', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendgraphic',

	requires: [
		'Ext.Img'
	],

	tipPrefix: 'Opacity',
	cklegend: null,

	init: function(cmp) {
		cmp.on({
			// itemmousedown: function(a,b,c,d,e) { setTimeout(this.onItemmousedown.bind(this, a, b, c, d, e), 0) },
			itemmousedown: this.onItemmousedown,
			itemremove: this.onItemremove,
			scope: this
		});

		this.cklegend = cmp.getController();
	},

	onItemmousedown: function(tree, record, item, index, e) {
		var layer = record.get('layer');
		if(!layer || !layer.ckLayer || layer.ckLayer.getData().properties.legend === false || e.target.tagName != "SPAN") {
			return false;
		}

		var graphic = record.get('graphic');
		if(graphic) {
			graphic.setVisible(graphic.hidden);
		} else {
			var td = item.firstChild.insertRow().insertCell();
			td.colSpan = 2;
			var imgSrc = this.generateSrc(layer);
			if (imgSrc) {
				graphic = Ck.create("Ext.Img", {
					src: imgSrc,
					urlParam: layer.ckLayer.getData().properties.legend,
					style: {
						marginLeft: "2%"
					},
					renderTo: td
				});

				this.cklegend.getOlView().on("change:resolution", this.updateSrc.bind(this, record));
			}
		}

		record.set('graphic', graphic);
	},

	/**
	 *
	 */
	updateSrc: function(rcd, evt) {
		var img = rcd.get("graphic");
		var imgSrc = this.generateSrc(rcd.get("layer"));
		if (imgSrc) {
			img.setSrc(imgSrc);
		}
	},

	/**
	 * Generate the image source
	 * @return {String}
	 */
	generateSrc: function(lyr) {
		var src = lyr.getSource();
		if (!src.getUrl) return false;

		var url = src.getUrl() + "?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=" + src.getParams().LAYERS + "&TRANSPARENT=true";

		var lgd = lyr.ckLayer.getData().properties.legend;
		if(lgd) {
			url += lgd;
		}

		var turl = new Ext.Template(url);
		url = turl.applyTemplate({
			scale: parseInt(Ck.getMap().getScale())
		});

		return url;

	},

	/**
	 * The Ext doc is wrong for the list params !!
	 */
	onItemremove: function(root, record) {
		// After drag&drop the legend reference is wrong, need to rebuild
		record.set('graphic', false);
	}

});
