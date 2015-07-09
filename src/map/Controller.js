/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('ck.map.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckmap',
	
	
	init: function() {
		var me = this;
		var v = me.getView();
		
		if(!(v.getMap() instanceof ol.Map)){
			var olMap = new ol.Map({
				view: new ol.View({
					center: v.getCenter(),
					zoom: v.getZoom()
				}),
				
				layers: [
					new ol.layer.Tile({
						source: new ol.source.MapQuest({layer: 'osm'}),
						title: 'Open Stree Map'
					}),
					new ol.layer.Image({
						source: new ol.source.ImageWMS({
							url: 'http://localhost:8080/projets/__Chinookgs/app/1.6/demo_l93/www/index.php',
							params: {
								'LAYERS': 'region',
								'VERSION': '1.1.0'
							}
						}),
						title: 'Régions',
						path: 'GEOFLA'
					}),
					new ol.layer.Image({
						source: new ol.source.ImageWMS({
							url: 'http://localhost:8080/projets/__Chinookgs/app/1.6/demo_l93/www/index.php',
							params: {
								'LAYERS': 'departement',
								'VERSION': '1.1.0'
							}
						}),
						title: 'Départements',
						path: 'GEOFLA',
                        visible: false
					})
				]
			});
			v.setMap(olMap);
			
			var vm = me.getViewModel();		   
			
			var p = v.getCoordPrecision();
			var olv = olMap.getView();
			
			var proj = olv.getProjection().getCode();
			var units = olv.getProjection().getUnits();
			vm.set('olview.projection.code', proj);
			vm.set('olview.projection.units', units);
			
			olMap.on('moveend', function(e){

				var c = olv.getCenter();
				vm.set('olview.center', c );
				
				var res = olv.getResolution();
				vm.set('olview.resolution', res );
				
				var rot = olv.getRotation();
				vm.set('olview.rotation', rot );
				
				var extent = olv.calculateExtent(olMap.getSize());
				var bl = ol.extent.getBottomLeft(extent);
				var tr = ol.extent.getTopRight(extent);
				vm.set('extent', [
					ol.coordinate.format(bl, '{x}', p),
					ol.coordinate.format(bl, '{y}', p),
					ol.coordinate.format(tr, '{x}', p),
					ol.coordinate.format(tr, '{y}', p)
				]);
				
				var z = olv.getZoom();
				vm.set('zoom', z);
			});
			
			
			this.fireEvent('ckmapReady', v);
		}
	},
	
	getMap: function() {
		return this.getView().getMap();
	},
	getMapView: function() {
		return this.getMap().getView();
	},
	
	
	setCenter: function(c) {
		return this.getMapView().setCenter(c);
	},
	
	setResolution: function(res) {
		return this.getMapView().setResolution(res);
	},
	
	setRotation: function(rot) {
		return this.getMapView().setRotation(rot);
	},
	
		
	
	/**
	*	Function resizeMap
	*	Retaille la map en fonction de la taille de la div de la vue
	**/
	resize: function() {
		var v = this.getView();
		var m = v.getMap();
		if(!m.isRendered()){
			m.setTarget(v.body.id);
		} else {
			m.updateSize();
		}
	}
	 
});
