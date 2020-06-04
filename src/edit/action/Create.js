/**
 * Edit tool used to create new feature.
 * this.layer define with layer will be used for snapping
 */
Ext.define('Ck.edit.action.Create', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditCreate',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'ckfont ck-plus',
	tooltip: 'Create features',

	toggleGroup: 'ckmapAction',

	/**
	 * True to snap vertex to nearest point
	 */
	snap: true,
	snapTolerance: 10,

	/**
	 * Activate the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent([btn]);
		var olMap = this.getOlMap();

		// Force disable action when change tab or close window
		if (!this.initialized) {
			var win = btn.up('window');
			if (win) {
				win.on({
					hide: function () {
						btn.toggle(false);
					}
				});
			}
			this.initialized = true;
		}

		if (!status) {
			olMap.removeInteraction(this.drawInteraction);
			olMap.removeInteraction(this.snapInteraction);
	        this.drawInteraction = null;
			this.snapInteraction = null;
			return;
        }

		// Create the interaction if it doesn't already exist
		if(!this.drawInteraction) {
			this.drawSource = this.getLayerSource();
			this.drawInteraction = new ol.interaction.Draw({
				type: this.getGeometryType(),
				source: this.drawSource
			});

			// Set special style when point is snapped
			this.drawInteraction.styleSnapped_ = [
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 12,
						stroke: new ol.style.Stroke({
							color: 'red',
							width: 1
						})
					})
				}),
				new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: 'white'
						}),
						radius: 6,
						stroke: new ol.style.Stroke({
							color: 'red',
							width: 1
						})
					})
				}),
				new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: 'red'
						}),
						radius: 2
					})
				})
			];
			
			olMap.addInteraction(this.drawInteraction);

			//https://github.com/openlayers/ol3/issues/3610
			this.drawInteraction.on('drawend', this.onFinishSelection.bind(this));
			//
			//this.interactions["drawInteraction"] = this.drawInteraction;
		}

		// Enable snap interaction to existing parcels
		if (this.snap === true) {
			if (!this.snapInteraction && this.drawSource) {
				// The snap interaction must be added after the Modify and Draw interactions
				// in order for its map browser event handlers to be fired first. Its handlers
				// are responsible of doing the snapping.
				this.snapInteraction = new ol.interaction.Snap({
					source: this.drawSource,
					pixelTolerance: this.snapTolerance
				});
				olMap.addInteraction(this.snapInteraction);
			}
		}


		if(status && btn.single === true){
			if(this.drawSource) this.drawSource.clear();
			this.drawInteraction.on('drawstart', function(){
				if(this.drawSource) this.drawSource.clear();
			}.bind(this));
		}

		this.drawInteraction.setActive(status);
	},


	//https://github.com/openlayers/ol3/issues/3610
	//Setup drawend event handle function
	onFinishSelection: function (evt) {
		var me = this;

		this.controller.fireEvent("featurecreate", evt.feature, me);

		//Call to double click zoom control function to deactivate zoom event
		me.controlDoubleClickZoom(false);

		//Delay execution of activation of double click zoom function
		setTimeout(function(){
			me.controlDoubleClickZoom(true);
		}, 251);
	},

	//Control active state of double click zoom interaction
	controlDoubleClickZoom:function (active){
	    //Find double click interaction
	    var interactions = this.getMap().getOlMap().getInteractions();
	    for (var i = 0; i < interactions.getLength(); i++) {
	        var interaction = interactions.item(i);
	        if (interaction instanceof ol.interaction.DoubleClickZoom) {
	            interaction.setActive(active);
	        }
	    }
	}
});
