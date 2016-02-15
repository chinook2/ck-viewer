/**
 * This action is used to modify the geometry of a feature.
 * A geometryInteraction was created
 */
Ext.define('Ck.edit.action.Geometry', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeometry',

	iconCls: 'fa fa-edit',
	tooltip: 'Edit geometry',
	
	interactionId: "geometryInteraction",

	toggleAction: function(btn, status) {
		if(!this.used) {
			this.callParent(arguments);
			this.firstUse();
		}
		
		var source = this.getLayerSource();
		
		if(!this.geometryInteraction) {
			this.geometryInteraction = Ck.create("Ck.Selection", {
				layers			: [this.getLayer()],
				type			: "Point",
				callback		: function(layers) {
					if(layers[0]) {
						var ft = layers[0].features;
						if(ft.length == 1) {
							this.controller.startGeometryEdition(ft[0]);
						}
					}
				},
				scope			: this,
				map				: this.map,
				drawStyle		: null,
				overHighlight	: true,
				highlightStyle	: ol.interaction.Select.getDefaultStyleFunction(),
				selectId		: "ckmapSelectEdit"
			});
			this.interactions["geometryInteraction"] = this.geometryInteraction;
		}

		this.geometryInteraction.setActive(status);
		if(!status) {
			this.geometryInteraction.resetSelection();
		}
	},
	
	firstUse: function() {
		this.controller.addListener("featuresessionstart", function() {
			this.reset();
			this.disableInteraction();
		}, this);
		this.controller.addListener("vertexsessionstart", function() {
			this.disableInteraction();
		}, this);
		this.controller.addListener("sessioncomplete", function() {
			this.reset(); this.enableInteraction();
		}, this);
		this.controller.addListener("savesuccess", function() {
			this.geometryInteraction.resetSelection();
		}, this);
	},
	
	disableInteraction: function() {
		this.geometryInteraction.setActive(false);
	},
	
	enableInteraction: function() {
		this.geometryInteraction.setActive(true);
	},
	
	/**
	 * Unhighlight feature
	 */
	reset: function() {
		this.geometryInteraction.resetSelection();
	}
});