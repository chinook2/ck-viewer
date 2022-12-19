/**
 * Display features infos in a tooltip
 *  - Add layer config to set fields and infos to Display
 *  - TODO filter layer list (default all visible layers)
 */
Ext.define('Ck.map.plugin.Tooltip', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.maptooltip',

	cachedTpl: [],

	/**
	 * Init the map component, init the viewModel
	 * @protected
	 */
	init: function(map) {
		this.map = map;
		this.olMap = map.getMap();

		this.tip = this.createTooltip();

		if(this.tip){
			this.olMap.on('pointermove', function(evt) {
				if (evt.dragging) {
					this.tip.html = null;
					this.tip.hide();
					return;
				}
	        	this.displayFeatureInfo(evt.pixel);//this.olMap.getEventPixel(evt.originalEvent));
		  	}.bind(this));

	        this.olMap.on('click', function(evt) {
				this.displayFeatureInfo(evt.pixel);
	        }.bind(this));
		}

		//ckMap.getController().on("addLayer", this.addLoadListeners, this);
	},

	destroy: function(){
		this.tip.destroy();
	},


	/**
	 * Creates a new help tooltip
	 */
	createTooltip: function() {
		if(!Ext.tip.QuickTipManager.isEnabled()) return;

		return Ext.create('Ext.tip.ToolTip', {
			target: this.olMap.getViewport(),
			trackMouse: true,
			dismissDelay: 0,
			renderTo: Ext.getBody(),
            mouseOffset: [12, 15],
			listeners: {
				beforeshow: function(tip) {
					// Prevent show empty tooltip
					if (!tip.html || tip.html == '') return false;
				},
				scope: this
			}
		});
	},

	displayFeatureInfo: function (pixel) {
		this.tip.html = null;
		this.tip.hide();

        var feature = this.olMap.forEachFeatureAtPixel(pixel, function(feature, layer) {
			// return the first feature with a tooltip config
			if (feature.get('tooltipTpl') || feature.get('tooltip')) {
				return feature;
			}
        });

		if (!feature) return;

		var tttpl = feature.get('tooltipTpl');
		var tpl = this.cachedTpl[tttpl];

		if (!tpl) {
			// Generate default template from fields list
			var tt = feature.get('tooltip');
			if (tt) {
				tt = tt.split(',');
				tt = tt.map(function (it) {
					var v = it.trim();
					return '<strong>'+ v +'</strong> : {'+ v +'}';
				});
				tttpl = tt.join('<br>');
				feature.set('tooltipTpl', tttpl);
			}
			// Create Ext template and cahe it
			if(tttpl){
				tpl = new Ext.XTemplate(tttpl);
				this.cachedTpl[tttpl] = tpl;
			}
		}

		if(tpl){
			var msg = tpl.apply(feature.getProperties());
			if(msg){
				this.tip.setHtml(msg);
				this.tip.showBy(this.map); // Use this.map instead of the target to ensure to have a ExtJS element
                this.tip.showAt(pixel); // force the pixel position
			}
		}

	}
});
