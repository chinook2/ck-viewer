/**
 * Display mouse position in the map.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *         action: "ckmapMouseposition"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.MousePosition', {
	extend: 'Ck.Action',
	alias: "widget.ckmapMouseposition",

	itemId: 'mouseposition',
	text: '',
	iconCls: 'ckfont ck-compass',
	tooltip: 'Mouse position',

	// Can stay active with other actions
	toggleGroup: 'ckmapActionMulti',

	ckLoaded: function(map, config) {
		this.olMap = map.getOlMap();
		var projMap = map.getProjection().getCode();

		this.mousePositionControl = new ol.control.MousePosition({
			coordinateFormat: function(coordinate) {
				return ol.coordinate.toStringXY(coordinate, 3);
				//return ol.coordinate.toStringXY(coordinate, 3) + '<br>' + ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate, projMap), 3);
			},
			className: 'ol-control ck-mouse-position',
			//projection: 'EPSG:4326',
			target: document.getElementById('lblCoordHide'),
			//undefinedHTML: '&nbsp;'
		});

		// TODO : manage in Actions.js if btn is pressed and call toggleAction...
		if(config.pressed) this.olMap.addControl(this.mousePositionControl);	
	},

	/**
	 * Set label coordinatee
	 */
	toggleMousePosition(event){
		var coordinate = ol.coordinate.toStringXY(event.coordinate,3);
		if(Ext.ComponentQuery.query('#lblCoord')){
			Ext.ComponentQuery.query('#lblCoord')[0].setHtml(coordinate);
		};
	},

	/**
	 * Show / Hide mouse position
	 */
	toggleAction: function(btn, pressed) {
		if(!this.olMap) return;
		if(pressed) {
			this.olMap.addControl(this.mousePositionControl);
			this.olMap.on('click', this.toggleMousePosition);
		}else{
			this.olMap.removeControl(this.mousePositionControl);
			this.olMap.un("click", this.toggleMousePosition);
			Ext.ComponentQuery.query('#lblCoord')[0].setHtml('');
		}
	}
});
