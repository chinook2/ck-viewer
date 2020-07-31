/**
 */
Ext.define('Ck.map.action.draw.Polygon', {
	extend: 'Ck.map.action.draw.Action',
	alias: 'widget.ckmapDrawPolygon',

	itemId: 'drawPolygon',
	iconCls: 'ckfont ck-draw-polygon',

	type: "Polygon",

	allowSelfIntersect: true,
	selfIntersectAlert: true,
	selfIntersectText: 'Self intersection detected.',

	toggleAction: function (btn, pressed) {
		this.callParent(arguments);

		if(pressed && btn.allowSelfIntersect === false) {
			this.draw.getSource().on('addfeature', function (e) {
				var geom = e.feature.getGeometry();

				if (!window.turf) {
					Ck.log("Enable to detect self-intersection. turf library required.");
					return;
				}
				
				// Self intersect
				var poly = turf.multiPolygon(geom.getCoordinates());
				var sip = turf.kinks(poly);
				if (sip && sip.features.length>0) {
					if (this.selfIntersectAlert) {
						Ck.alert("Invalid polygon", this.selfIntersectText);
					}
					this.draw.getSource().clear();
				}
			}.bind(this));
		}
	}
});
