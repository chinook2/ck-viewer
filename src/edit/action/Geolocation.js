/**
 * Edit tool used to geolocation new feature
 */
Ext.define('Ck.edit.action.Geolocation', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeolocation',
	
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
		this.associatedEl = el;
		this.controller = el.lookupController();
		
		if(!this.used) {
			this.firstUse();
		}
		
		this.controller.fireEvent("geolocation", Ck.getMap().geolocation.getPosition());
	}
});