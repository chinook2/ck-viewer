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
	
	config: {
		map: null
	},
	
	/**
	 * @var {Ck.legend.Controller}
	 */
	cklegend: null,

	/**
	 * Register event on tree
	 * @param {Ext.tree.Panel}
	 */
	init: function(cmp) {
		cmp.on({
			itemclick: this.onItemclick,
			itemremove: this.onItemremove,
			scope: this
		});

		this.cklegend = cmp.getController();
		this.cklegend.on("ready", function() {
			this.setMap(this.cklegend.getMap());
		}, this);
	},

	/**
	 * When clicking on a layer display graphic
	 * Not available for local layer (check URL)
	 * @param {Ext.view.View}
	 * @param {Ext.data.Model}
	 * @param {HTMLElemeent}
	 * @param {Number}
	 * @param {Ext.event.Event}
	 */
	onItemclick: function(tree, record, item, index, e) {
		var layer = record.get('layer');
		
		var src = layer.getSource();
		
		if(src.getUrl && Ext.isString(src.getUrl()) && e.target.tagName == "SPAN" && record.isLeaf() && layer && layer.ckLayer && layer.ckLayer.getData().properties.legend !== false &&
			!Ext.String.startsWith(e.target.className.trim(), "x-action") && !Ext.String.startsWith(e.target.className.trim(), "x-tree-checkbox")) {
			var graphic = record.get('graphic');
			
			if(graphic && graphic.getEl() && graphic.getEl().dom && Ext.get(graphic.getEl().dom.id)) {
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
					
					graphic.getEl().dom.addEventListener("error", this.interceptError.bind(this));
					// window[window.i++] = graphic;
					record.set('graphic', graphic);
				}
			}
			
			if(graphic) {
				window.g = graphic;
			}
		}
	},

	/**
	 * On resolution change, update image because legend can be differente
	 * 
	 */
	updateSrc: function(rcd, evt) {
		var img = rcd.get("graphic");
		var imgSrc = this.generateSrc(rcd.get("layer"));
		if (img && imgSrc) {
			img.setSrc(imgSrc);
		}
	},

	/**
	 * Generate the image source
	 * @param {ol.layer.Base}
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
			scale: parseInt(this.getMap().getScale())
		});

		return url;

	},

	/**
	 * The Ext doc is wrong for the list params !!
	 * After drag&drop the legend reference is wrong, need to rebuild
	 */
	onItemremove: function(root, record) {
		record.set('graphic', false);
	},
	
	/**
	 * @param {HTMLElemeent}
	 */
	interceptError: function(el) {
		this.setVisible(false)
	}
});
