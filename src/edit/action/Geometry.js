/**
 * This action is used to modify the geometry of a feature.
 * Click on a feature on the map to edit it.
 * A geometryInteraction was created
 */
Ext.define('Ck.edit.action.Geometry', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeometry',

	itemId: 'edit-geometry',
	iconCls: 'ckfont ck-edit-geom',
	tooltip: 'Edit geometry',

	interactionId: "geometryInteraction",

	/**
	*  Click tolerance to select features
	*/
	tolerance: 20,
	
	/** 
	 * True to livesnap vertex to nearest point
	 */
	allowLiveSnap: false,
	
	toggleAction: function(btn, status) {
		this.callParent(arguments);
		this.btn = btn;

		if(!this.geometryInteraction) {
			this.geometryInteraction = Ck.create("Ck.Selection", {
				layers			: [this.getLayer()],
				type			: "Point",
				callback		: function(layers) {
					if(layers[0]) {
						var ft = layers[0].features;
						if(ft.length == 1) {
							this.controller.startGeometryEdition(ft[0]);
							
							if(this.controller.vertexContainer !== undefined) {
								this.controller.vertexContainer.setVisible(true);
							}
						}
					}
				},
				scope			: this,
				map				: this.map,
				drawStyle		: null,
				overHighlight	: true,
				highlightStyle	: ol.interaction.Select.getDefaultStyleFunction(),
				selectId		: "ckmapSelectEdit",
				tolerance       : this.tolerance
			});
			this.interactions["geometryInteraction"] = this.geometryInteraction;
		}

		this.geometryInteraction.setActive(status);
		if(!status) {
			this.controller.geolocationBtn.disable();
			if(this.controller.moveInteraction) {
				this.controller.moveInteraction.setActive(false);
			}
			this.geometryInteraction.resetSelection();

			if(this.controller.vertex !== undefined) {
				this.controller.vertex.closeAll();
			}
			
			if(this.controller.vertexContainer !== undefined) {
				this.controller.vertexContainer.setVisible(false);
			}
		}
	},

	firstUse: function() {
		this.callParent();
		this.controller.addListener("featuresessionstart", function() {
			this.reset();
			this.disableInteraction();
		}, this);
		this.controller.addListener("vertexsessionstart", function() {
			this.disableInteraction();
		}, this);
		this.controller.addListener("sessioncomplete", function() {
			this.reset();
			this.enableInteraction();
		}, this);
		this.controller.addListener("savesuccess", function() {
			this.reset();
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
		this.toggleAction(this.btn, true);
	}
});
