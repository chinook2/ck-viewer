/**
 *
 *
 *
 *
 *
 *
 *
 */
Ext.define('Ck.map.action.Geolocation', {
	extend: 'Ck.Action',
	alias: "widget.ckmapGeolocation",

	toggleGroup: 'geolocation-toggle',
	tooltip: 'Mark your location',
	iconCls: 'fa fa-street-view',

	itemId: 'geolocation',

	config: {
		/**
		 * @var {ol.Geolocation}
		 */
		geolocation: null,

		/**
		 * @var {ol.Overlay}
		 */
		geolocationMarker: null
	},
	
	geoListener: null,

	/**
	 * @param {Ck.map.Controller}
	 */
	ckLoaded: function(map) {
		if(!Ext.isEmpty(map.geolocation)) {
			var body = Ext.getBody();

			this.marker = body.createChild({
				"class": "gps-marker marker-blue",
				"style": {
					"visibility": "hidden"
				}
			});

			this.setGeolocationMarker(new ol.Overlay({
				element: this.marker.dom,
				positioning: 'bottom-center',
				stopEvent: false
			}));

			this.setGeolocation(map.geolocation);

			map.getOlMap().addOverlay(this.getGeolocationMarker());
		}
	},

	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	toggleAction: function(btn, pressed) {
		if(pressed) {
			var geoloc = this.getMap().geolocation.getPosition();
			if(Ext.isArray(geoloc)) {
				this.setPosition();
				this.getOlView().setCenter(geoloc);
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
			this.marker.setVisible(false);
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
		if(Ext.isArray(geoloc)) {
			var mark = this.getGeolocationMarker();
			this.marker.setVisible(true);
			mark.setPosition(geoloc);
		}
	}
});
