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
	
	/**
	 * @var {Number[]}
	 * Offset to translate marker to another location
	 */
	offset: [0, 0],
	
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
		if(!this.getGeolocation()){
			Ck.Notify.info("Geolocation is not enable. Please check Map configuration.");
			return;
		}
		if(pressed) {
			this.setPosition(this.getGeolocation());
			
			if(Ext.isEmpty(this.geoListener)) {
				this.geoListener = this.getGeolocation().on('change', function(evt) {
					this.setPosition(evt.target);
				}.bind(this));
			}
		} else {
			this.marker.setVisible(false);
			ol.Observable.unByKey(this.geoListener);
			delete this.geoListener;
		}
	},
	
	/**
	 * Move marker to the Geolocation position.
	 * Apply the offset.
	 * @params {ol.Geolocation}
	 */
	setPosition: function(geolocation) {
		var p = geolocation.getPosition();
		
		if(Ext.isArray(p)) {
			var mark = this.getGeolocationMarker();
			p[0] = p[0] + this.offset[0];
			p[1] = p[1] + this.offset[1];
			this.marker.setVisible(true);
			mark.setPosition(p);
			this.getOlView().setCenter(p);
		}
	}
});
