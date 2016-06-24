/**
 * Edit tool used to geolocation new feature
 * Use corova-plugin-gpslocation
 */
Ext.define('Ck.edit.action.Gpslocation', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGpslocation',
	
	itemId: "edit-geolocation",

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-bullseye',
	tooltip: 'Move feature at GPS position',
	
	/**
	 * Activate the geometry geolocation interaction. First, select the geom what want to geolocation.
	 **/
	doAction: function(el) {
		if(!Ext.isEmpty(Ck.getMap().gpslocation)) {
			this.associatedEl = el;
			this.controller = el.lookupController();
			
			if(!this.used) {
				this.firstUse();
			}
			
			var thisRef = this;
			
			// Retrieve position
			Ck.getMap().gpslocation.getPosition(
				function(position) {
					var coords = [position.coords.longitude, position.coords.latitude];
					var mapProj = Ck.getMap().getProjection();
					var proj = new ol.proj.Projection({code:"EPSG:4326"});
					
					// Reproject if needed
					if(mapProj.getCode() != proj.getCode()) {
						coords = ol.proj.transform(coords, proj, mapProj);				
					}
					
					// Apply offset for testing
					coords[0] = coords[0] + Ck.getMap().geolocationOffset[0];
					coords[1] = coords[1] + Ck.getMap().geolocationOffset[1];
					
					// Fire parent controller event
					thisRef.controller.fireEvent("geolocation", coords);
				}, 
				function(error) {
					Ext.Msg.show({
						title: "GPS location",
						message: "Error " + error.code + " : " + error.message + ".",
						buttons: Ext.Msg.OK,
						icon: Ext.Msg.ERROR
					});
				}, 
				{ maximumAge: 0, timeout: 1000 } // Geolocation parameters
			);
		} else {
			Ext.Msg.show({
				title: "GPS location",
				message: "You must activate GPS location to use this feature.",
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});
		}
	}
});