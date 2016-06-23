/**
 *	GPS Location utility action
 *	Use corova-plugin-gpslocation
 */
Ext.define('Ck.map.action.GpsLocation', {
	extend: 'Ck.Action',
	alias: "widget.ckmapGpsLocation",

	toggleGroup: 'geolocation-toggle',
	tooltip: 'Mark your location',
	iconCls: 'fa fa-street-view',

	itemId: 'gpslocation',

	config: {
		/**
		 * integer
		 */
		timeout: 3000,
		maximumAge: 2000,

		/**
		 * @var {ol.Overlay}
		 */
		geolocationMarker: null
	},
	
	geoListener: null,
	win: null,
	xField: null,
	yField: null,
	altitudeField: null,
	accuracyField: null,
	
	/**
	 * @param {Ck.map.Controller}
	 */
	ckLoaded: function(map) {
		if(Ck.isMobileDevice()) {
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
			
			map.getOlMap().addOverlay(this.getGeolocationMarker());
		}
	},

	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	toggleAction: function(btn, pressed) {
		if(Ck.isMobileDevice() && !Ext.isEmpty(GPSLocation)) {
			if(pressed) {
				this.createWin();
				this.getMap().gpslocation = this;
				this.geoListener = GPSLocation.watchPosition(
					this.onChange, 
					this.onError, { 
						timeout: this.timout, 
						maximumAge: this.maximumAge,
						enableHighAccuracy: true
					}
				);
			} else {
				this.marker.setVisible(false);
				GPSLocation.clearWatch(this.geoListener);
				this.geoListener = null;
				
				this.getMap().gpslocation = null;
				
				if(Ext.isArray(this.win) && this.win[0]) {
					this.win[0].close();
				}
			}
		}
	},
	
	/**
	 *	Fired every time the GPS position change with a Position object
	 */
	onChange: function(position) {
		if(position) {
			var thisref = Ck.getMap().gpslocation;
			
			if(thisref) {
				var coordinates = position.coords;
				var coords = [coordinates.longitude, coordinates.latitude];
				
				var mapProj = thisref.getMap().getProjection();
				var proj = new ol.proj.Projection({code:"EPSG:4326"});
				
				if(mapProj.getCode() != proj.getCode()) {
					coords = ol.proj.transform(coords, proj, mapProj);				
				}
				
				thisref.setPosition(coords);
				thisref.xField.setValue(coords[0]);
				thisref.yField.setValue(coords[1]);
				thisref.altitudeField.setValue(coordinates.altitude);
				thisref.accuracyField.setValue(coordinates.accuracy);
			}			
		}		
	},
		
	/**
	 * Move marker to the geolocation position.
	 * Apply the offset.
	 * @params {ol.coordinate}
	 */
	setPosition: function(coords) {
		var thisref = Ck.getMap().gpslocation;
		
		if(thisref) {
			if(Ext.isArray(coords)) {
				coords[0] = coords[0] + thisref.getMap().geolocationOffset[0];
				coords[1] = coords[1] + thisref.getMap().geolocationOffset[1];
					
				var mark = thisref.getGeolocationMarker();
				thisref.marker.setVisible(true);
				mark.setPosition(coords);
				thisref.getOlView().setCenter(coords);
			}
		}
	},
	
	/**
	 *	Error callback function
	 */
	onError: function(error) {
		console.log(error);
	},
	
	/**
	 *	Create a docked window at the bottom of the map with GPS informations
	 */
	createWin: function() {
		var view = this.getMap().getView();
		
		this.xField = Ck.create("Ext.form.field.Text", {
			fieldLabel: "X",
			labelWidth: 10,
			width: 150,
			editable: false
		});
		this.yField = Ck.create("Ext.form.field.Text", {
			fieldLabel: "Y",
			labelWidth: 10,
			width: 150,
			editable: false
		});
		this.altitudeField = Ck.create("Ext.form.field.Text", {
			fieldLabel: "Altitude",
			labelWidth: 50,
			width: 100,
			editable: false
		});
		this.accuracyField = Ck.create("Ext.form.field.Text", {
			fieldLabel: "Accuracy",
			labelWidth: 50,
			width: 100,
			editable: false
		});
		
		this.win = view.addDocked(
			Ext.apply({
				dock : "bottom"
			}, {}, {
				xtype: "panel",
				layout: "hbox",
				cls: "gpsLocationPanel",
				items: [this.xField, this.yField, this.altitudeField, this.accuracyField]
			})
		);
		this.getMap().getOlMap().updateSize();
	},
	
	/**
	 *	Retrieve GPS position and call success or error function passed as arguments
	 */
	getPosition: function(sucessFn, errorFn, opt) {
		if(Ck.isMobileDevice() && !Ext.isEmpty(GPSLocation)) {
			GPSLocation.getCurrentPosition(sucessFn, errorFn, opt);
		}		
	}
});
