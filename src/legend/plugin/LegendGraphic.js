/**
 * LegendGraphic query the server to retrieve an legend img.
 * Only done if "legend" property is set (with TRUE or with string)
 * "legend" property can be extra params or entire URL
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
		
		if(!(layer instanceof ol.layer.Group)) {
			var src = layer.getSource();
			if(src.getUrl && Ext.isString(src.getUrl()) && e.target.tagName == "SPAN" && record.isLeaf() && layer && layer.ckLayer && layer.ckLayer.getData().properties.legend &&
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
							style: {
								marginLeft: "2%"
							},
							renderTo: td,
							listeners: {el: {
								scope: this,
								load: this.loadSuccess,
								error: this.loadFailed
							}}
						});

						this.graphic = graphic;
						this.cklegend.getOlView().on("change:resolution", this.updateSrc.bind(this, record));
						record.set('graphic', graphic);
					}
				}
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
		if (img && img.getEl().dom && imgSrc) {
			img.setSrc(imgSrc);
		}
	},

	/**
	 * Generate the image source, "legend" property is use here.
	 * @param {ol.layer.Base}
	 * @return {String}
	 */
	generateSrc: function(lyr) {
		var src = lyr.getSource();
		if (!src.getUrl) return false;
		
		var url = lyr.ckLayer.getData().properties.legend;
		
		if(Ext.isString(url)) {
			// URL variables
			var urlVar = {
				scale: parseInt(this.getMap().getScale())
			};
			if(Ext.manifest.ckClient) {
				Ext.applyIf(urlVar, Ext.manifest.ckClient);
			};
			
			// Apply variables
			var urlTpl = new Ext.Template(url);
			url = urlTpl.applyTemplate(urlVar);
		} else {
			url = "";
		}
		
		if(url.indexOf("http") !== 0) {
			url = src.getUrl() + "?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=" + src.getParams().LAYERS + "&TRANSPARENT=true" + url;
		}

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
	 * Hide img on fail
	 */
	loadFailed: function() {
		this.graphic.setVisible(false);
	},
	
	/**
	 * Display img on fail
	 */
	loadSuccess: function() {
		this.graphic.setVisible(true);
	}
});
