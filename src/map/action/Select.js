/**
 * Base class for select actions.
 * 
 * See : Ck.map.action.select.Point, Ck.map.action.select.Square ...
 *
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
	 *  - point
	 *  - circle
	 *  - box
	 *  - ...
	 */
	type: 'point',
	
	multi: true,
	
	// Select on vector layer
	//    - select by geometry (circle, box, polygon)
	//
	// Select on WMS layer (via WFS call)
	//    - draw selection as vector
	//    - draw selection by WMS call of a dynamic layer using WFS filter (for large selection !)
	
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
				maxPoints: maxPoints
			});
			
			
			this.draw.on('drawstart', function(evt) {
				// set sketch
				this.sketch = evt.feature;
			}, this);

			this.draw.on('drawend', function(feature){
				// Fix delay for clear current drawing
				Ext.defer(function(){
					this.overlay_.getFeatures().clear();
				}, 200, this);
				
				// unset sketch
				this.sketch = null;
			});
			
			
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
		
		if(!this.select){
			this.select = new ol.interaction.Select({
				// layers: this.getLayers,
				multi: this.multi
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
