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
	iconCls: 'fa fa-plus',
	tooltip: 'Create features',

	toggleGroup: 'ckmapAction',

	/**
	 * True to snap vertex to nearest point
	 */
	snap: true,

	/**
	 * Activate the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent([btn]);
		var olMap = this.getOlMap();

		if (!status) {
			olMap.removeInteraction(this.drawInteraction);
	        this.drawInteraction = null;
			return;
        }

		// Create the interaction if it doesn't already exist
		//if(!this.drawInteraction) {
			this.drawSource = this.getLayerSource();
			this.drawInteraction = new ol.interaction.Draw({
				type: this.getGeometryType(),
				//snapGeometry: this.snapGeometry,
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
			this.drawInteraction.on('drawend', this.onFinishSelection, this);
			//
			//this.interactions["drawInteraction"] = this.drawInteraction;
		//}

		if(status && btn.single === true){
			if(this.drawSource) this.drawSource.clear();
			this.drawInteraction.on('drawstart', function(){
				if(this.drawSource) this.drawSource.clear();
			}, this);
		}

		//this.drawInteraction.setActive(status);
	},

	/**
	 * Hang the polygon's points to those nearest according to the tolerance.
	 * @params {ol.Feature}
	 **/
	snapGeometry: function(feature) {
		var geometry = feature.getGeometry();
		var extent = geometry.getExtent();

		// Récupération des features dans un buffer d'extent du feature
		var buffer = [
			extent[0] - this.getTolerance(),
			extent[1] - this.getTolerance(),
			extent[2] + this.getTolerance(),
			extent[3] + this.getTolerance()
		];

		var featuresInExtent = [];

		var coordinates = geometry.getCoordinates();
		var type = feature.getGeometry().getType();
		if(type != "Point") {
			var coordinates = coordinates[0];
		}
		var source = this.getLayerSource();

		if(type != "Point" && this.snap) {
			// Loop on vertex of the feature
			for(var i=0; i<coordinates.length - 1; i++ ) {
				var coordinate = coordinates[i];
				var feat = source.getClosestFeatureToCoordinate(coordinate);
				// If nearest feature was found
				if(!Ext.isEmpty(feat)) {
					var geom = feat.getGeometry();
					var point = geom.getClosestPoint(coordinate).slice(0, 2); // Find the nearest point of the feature (force 2D)
					var line = new ol.geom.LineString([coordinate, point]);
					var length = line.getLength();

					// Si on rentre dans la tolérance
					if(length <= this.getTolerance()) {
						coordinates[i] = point;
					}
				}
			}
		}

		if(type.indexOf("multi") != -1) {
			coordinates = [coordinates];
		}

		var d = new Date();
		date = Ext.Date.format(d, 'Y-m-d');
		var ced = 'A' + Ext.Date.format(d, 'YmdHis');

		var f = new ol.Feature({
			geometry: Ck.create("ol.geom." + type, coordinates),
			status: "CREATED"
		});

		return f;
	},

	//https://github.com/openlayers/ol3/issues/3610
	//Setup drawend event handle function
	onFinishSelection: function (evt) {

		this.controller.fireEvent("featurecreate", evt.feature);

		var me = this;
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
