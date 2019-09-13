/**
 *
 */
Ext.define('Ck.map.action.Geolocation', {
	extend: 'Ck.Action',
	alias: "widget.ckmapGeolocation",

	toggleGroup: 'geolocation-toggle',
	tooltip: 'Mark your location',
	iconCls: 'fa fa-street-view',

	zoomTo: 8,
	itemId: 'geolocation',

	config: {
		/**
		 * @var {ol.Geolocation}
		 */
		geolocation: null,

		/**
		 * @var {ol.Overlay}
		 */
		geolocationMarker: null,

		marker: {	
			//cls: 'gps-marker',
			cls: 'marker-blue',
			positioning: 'bottom-center',
			offset: [0, 12.5]
		}
	},
	
	geoListener: null,

	
	destroy: function (params) {
		if(this.geoListener) {
			this.geoListener.destroy();
			delete this.geoListener;
		}
	},

	/**
	 * @param {Ck.map.Controller}
	 */
	ckLoaded: function(map) {
		if(!Ext.isEmpty(map.geolocation)) {
			var body = Ext.getBody();
			var markerCfg = this.getMarker();

			this.marker = body.createChild({
				"class": markerCfg.cls + ' ' + markerCfg.extraCls
			});
			var geolocationMarker = new ol.Overlay({
				element: this.marker.dom,
				positioning: markerCfg.positioning,
				offset: markerCfg.offset,
				stopEvent: false
			});
			this.setGeolocationMarker(geolocationMarker);

			this.setGeolocation(map.geolocation);

			map.getOlMap().addOverlay(this.getGeolocationMarker());
		}
	},

	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	toggleAction: function(btn, pressed) {
		if(!this.getGeolocation()){
			Ck.Notify.info("Geolocation is not enable. Please check Map configuration.");
			return;
		}
		if(pressed) {
			var geoloc = this.getMap().geolocation.getPosition();
			if(Ext.isArray(geoloc)) {
				this.setPosition(geoloc);
				this.getOlView().setCenter(geoloc);
				this.getOlView().setZoom(this.zoomTo || 8);
			}
			
			// Add listener to move marker on geolocation change
			if(Ext.isEmpty(this.geoListener)) {
				this.geoListener = this.getMap().on({
					geolocationchange: this.setPosition,
					destroyable: true,
					scope: this
				});
			}
		} else {
			this.setPosition();
			this.geoListener.destroy();
			delete this.geoListener;
		}
	},
	
	/**
	 * Move marker to the geolocation position.
	 * Apply the offset.
	 * @params {ol.coordinate}
	 */
	setPosition: function(geoloc) {
		var mark = this.getGeolocationMarker();
		if(Ext.isArray(geoloc)) {
			mark.setPosition(geoloc);
		} else {
			// unset position > hide marker
			mark.setPosition();
		}
	}
});
