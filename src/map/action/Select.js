/**
 * Base class for select actions.
 *
 * The ol.interaction.Select is not used because ol does not support exotic selection (circle, polygon...).
 * However an ol.interaction.Select is created to manage selected features properly.
 * So selections are made manually.
 * 
 * See : Ck.map.action.select.Point, Ck.map.action.select.Square ...
 */
Ext.define('Ck.map.action.Select', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapSelect',
	
	itemId: 'select',
	text: '',
	iconCls: 'fa fa-asterisk',
	tooltip: '',
	
	toggleGroup: 'ckmapAction',
	
	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */
	sketch: null,

	/**
	 * Message to show when the user start selection.
	 */
	startMsg : 'Click to select feature.<br>Shift+Click to add feature to selection.',
	
	/**
	 * Message to show when the user is measuring.
	 */
	continueMsg: 'Drag to select features',
	
	/**
	 * The type of the selection :
	 *
	 *    - point
	 *    - circle
	 *    - box
	 *    - ...
	 */
	type: 'point',
	
	multi: true,
	
	/**
	 * Select on vector layer :
	 *
	 *    - select by geometry (circle, box, polygon)
	 *
	 * Select on WMS layer (via WFS call) :
	 *
	 *    - draw selection as vector
	 *    - draw selection by WMS call of a dynamic layer using WFS filter (for large selection !)
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		this.type = this.initialConfig.type || this.type;
		if(this.type) {
			var geometryFunction, maxPoints;
			if (this.type === 'square') {
				this.type = 'Circle';
				geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
			} else if (this.type === 'point') {
				this.type = 'Point';
			} else if (this.type === 'circle') {
				this.type = 'Circle';
			} else if (this.type === 'box') {
				this.type = 'LineString';
				maxPoints = 2;
				geometryFunction = function(coordinates, geometry) {
					if (!geometry) {
						geometry = new ol.geom.Polygon(null);
					}
					var start = coordinates[0];
					var end = coordinates[1];
					geometry.setCoordinates([
						[start, [start[0], end[1]], end, [end[0], start[1]], start]
					]);
					return geometry;
				};
			}
			
			this.draw = new ol.interaction.Draw({
				type: this.type,
				geometryFunction: geometryFunction,
				maxPoints: maxPoints,
				caller: this,
				condition: function(params) {
					window.shiftKey = params.originalEvent.shiftKey;
					return true;
				},
				freehandCondition: undefined
			});
			
			
			this.draw.on('drawstart', function(evt) {
				// set sketch
				this.sketch = evt.feature;
			}, this);
			
			this.draw.on('drawend', this.processSelection, this);
			
			
			this.olMap.addInteraction(this.draw);
			this.draw.setActive(false);
			
			this.createHelpTooltip();
		}
		
		// Share only one select interaction for all sub classes
		var inte = this.olMap.getInteractions();
		for(i=0; i<inte.getLength(); i++){
			if(inte.item(i).get('id') == 'ckmapSelect') {
				this.select = inte.item(i);
				break;
			}
		}
		
		// Select controls to host selected features
		if(!this.select){
			this.select = new ol.interaction.Select({
				style: Ck.map.Style.selectionStyle
			});
			this.olMap.addInteraction(this.select);
			this.select.set('id', 'ckmapSelect');
			this.select.setActive(false);
			
			this.select.on('select', function(e) {
				Ck.log(e.target.getFeatures().getLength() +
				  ' selected features (last operation selected ' + e.selected.length +
				  ' and deselected ' + e.deselected.length + ' features)');
			});		
		}
	},
	
	/**
	 * Query layers with current selection
	 * @param {ol.interaction.DrawEvent}
	 */
	processSelection: function(evntParams) {
		var feature = evntParams.feature;
		if(!window.shiftKey) {
			this.select.getFeatures().clear();
		}
		// Fix delay to remove cursor drawing point
		Ext.defer(function(){
			this.overlay_.getSource().clear();
		}, 200, this.draw);
		
		// unset sketch
		this.draw.sketch = null;
		
		// Parse les géométries en GeoJSON
		var geoJSON  = new ol.format.GeoJSON();
		var type = feature.getGeometry().getType();
		
		switch(type) {
			case "Circle" :
				var radius = feature.getGeometry().getRadius();
				var pt = turf.point(feature.getGeometry().getCenter());
				var geom = turf.buffer(pt, radius, "meters");
				var selFt = geom.features[0];
				break;
			case "Point" :
				var radius = Ck.getMap().getOlView().getResolution() * 10; // 10px buffer
				var pt = turf.point(feature.getGeometry().getCoordinates());
				var geom = turf.buffer(pt, radius, "meters");
				var selFt = geom.features[0];
				break;
			default :
				var selFt = geoJSON.writeFeatureObject(feature);
		}
		
		/* Developper : you can display buffered draw for Circle and Point
			writer = new ol.format.WKT();
			// writer.writeFeature(geoJSON.readFeature(selFt)); // getWKT
			ft = geoJSON.readFeature(selFt);
			
			if(!window.lyr) {
				window.lyr = new ol.layer.Vector({
					id: "onTheFlyLayer",
					title: "onTheFlyLayer",
					source: new ol.source.Vector({
						projection: 'EPSG:3857',
						format: new ol.format.GeoJSON()
					}),
					style: new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'blue',
							width: 3
						}),
						fill: new ol.style.Fill({
							color: 'rgba(0, 0, 255, 0.1)'
						})
					})
				});
				Ck.getMap().getOlMap().addLayer(window.lyr);
			}
			window.lyr.getSource().addFeature(ft);
		//*/
		
		var i = 0; res = [];
		
		// Query vector layers
		var vectorLayers = Ck.getMap().getLayers(function(lyr) {
			return (lyr.getVisible() && lyr instanceof ol.layer.Vector && lyr.getProperties("id") != "measureLayer");
		});
		
		vectorLayers.forEach(function(lyr) {
			var lyrFts, lyrFt;
			res[i] = [];
			lyrFts = lyr.getSource().getFeatures();
			for(var j = 0; j < lyrFts.length; j++) {
				lyrFt = geoJSON.writeFeatureObject(lyrFts[j]);
				if(turf.intersect(lyrFt, selFt)) {
					if(lyrFts[j].getProperties().features) {
						for(k = 0; k < lyrFts[j].getProperties().features.length; k++) {
							res[i].push(lyrFts[j].getProperties().features[k]);
						}
					} else {
						res[i].push(lyrFts[j]);
					}
				}
			}
			i++;
		});
		
		// Query raster layers
		var rasterLayers = Ck.getMap().getLayers(function(lyr) {
			return (lyr.getVisible() && lyr instanceof ol.layer.Image);
		});
		
		rasterLayers.forEach(function(lyr) {
			var source = lyr.getSource();
			url = source.getUrl();
		});
		
		
		// Highligth selected features and add them to select collection
		this.select.setActive(true);
		var selCollection = this.select.getFeatures();
		for(var i = 0; i < res.length; i++) {
			for(var j = 0; j < res[i].length; j++) {
				if(!window.shiftKey || selCollection.getArray().indexOf(res[i][j]) == -1) {
					selCollection.push(res[i][j]);
				}
			}
		}
		this.select.setActive(false);
		
		return res;
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		if(!this.select) return;
		this.select.setActive(pressed);
		this.draw.setActive(pressed);
	},
	
	
	/**
	 * Get queryable layers
	 */
	getLayers: function() {
		var layers = [];
		this.getMap().getLayers().foreach(function(layer) {
			// in legend, is visible, is queryable, is queryme
			var a= layer.get('name');
		});
		return layers ;
	},
	
	/**
	 * Creates a new help tooltip
	 */
	createHelpTooltip: function() {
		Ext.create('Ext.tip.ToolTip', {
			target: this.olMap.getViewport(),
			trackMouse: true,
			dismissDelay: 0,
			renderTo: Ext.getBody(),
			onDocMouseDown: function() {
				// prevent hide tooltip on click
				Ext.defer(function(){
					this.fireEvent('beforeshow', this);
				}, 200, this);
			}, 
			listeners: {
				beforeshow: function(tip) {
					if(!this.draw.get('active')) return false;
					
					var helpMsg = this.startMsg;
					if (this.sketch && this.type != 'Point') helpMsg = this.continueMsg;
					tip.update(helpMsg);
				},
				scope: this
			}
		});
	}	
});
