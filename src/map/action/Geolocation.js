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
	tooltip: 'Zoom to your location',
	iconCls: 'fa fa-street-view',
	
	itemId: 'geolocation',
	
	text: '',
	
	// iconCls: 'fa fa-child',
	
	// iconCls: 'fa fa-flag',
	// iconCls: 'fa fa-bullseye',
	
	
	
	config: {
		map: null,
		
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
	 * @param {Ck.map.Controller}
	 */
	ckLoaded: function(map) {
		if(!Ext.isEmpty(map.geolocation)) {
			var body = Ext.getBody();
			body.insertHtml("BeforeEnd", "<div id='location-gps' class='gps-marker marker-blue'></div>");
			
			this.setGeolocationMarker(new ol.Overlay({
				element: document.getElementById('location-gps'),
				positioning: 'bottom-center'
			}));
			
			map.geolocation.on('change', function(evt) {             
				this.getGeolocationMarker().setPosition(evt.target.getPosition());
			}, this);
			this.setGeolocation(map.geolocation);
			
			map.getOlMap().addOverlay(this.getGeolocationMarker());
		}
	},
	
	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	toggleAction: function(btn, pressed) {
		var olMap = this.getMap().getOlMap();
		var mark = this.getGeolocationMarker();
		
		if(pressed) {
			var p = this.getGeolocation().getPosition();                
			if(!Ext.isEmpty(p)) {	
				mark.setVisible(true);
				mark.setPosition(p);
				olMap.getView().setCenter(p);
			}
		} else {
			mark.setVisible(false);
		}
	}
});