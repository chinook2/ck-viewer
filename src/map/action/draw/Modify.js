/**
 */
Ext.define('Ck.map.action.draw.Modify', {
	extend: 'Ck.map.action.draw.Action',
	alias: 'widget.ckmapDrawModify',
	itemId: 'drawModify',
	iconCls: 'ckfont ck-edit',

	drawId: "default",
	requires: [
		'Ck.Draw'
	],

	selectedFeatures: [],

	/**
	 * Create the draw interaction
	 * @param  {Object} opt : Options to pass to the interaction instantiation
	 */
	createInteraction: function(opt) {
		/*opt = (Ext.isObject(opt))? opt : {};
		this.interaction = new ol.interaction.Modify(Ext.applyIf(opt, {
			features: new ol.Collection(this.getFeatures())
		}));
		this.draw.getOlMap().addInteraction(this.interaction);*/

		/*var selectStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#ff0000',
				width: 2
			})
		});*/

		var map = this.draw.getOlMap();
		var draw = this.draw;

		if (this.interaction) {
			map.removeInteraction(this.interaction);
		}

		this.interaction = new ol.interaction.Select({
			layers: [draw.getLayer()],
			condition: ol.events.condition.singleClick
			//multi: false
			//style: [selectStyle]
		});
		this.interaction.on('select', this.onInteractionSelect.bind(this));
		    
		this.selectedFeatures = this.interaction.getFeatures();
		
		//
		map.addInteraction(this.interaction);
	},

	/**
	 * [toggleInteraction description]
	 */
	toggleInteraction: function(type) {
		var interaction,
			features = this.selectedFeatures,
			draw = this.draw,
			map = draw.getOlMap();

		if (this.interaction) {
			map.removeInteraction(this.interaction);
		}		

		switch (type) {
			case 'translate':
				this.interaction = new ol.interaction.Translate({
					features: features
				});
				break;

			case 'rotate':
				this.interaction = new ol.interaction.DragRotate({
					features: features
				});
				break;

			default: 	// modify
				this.interaction = new ol.interaction.Modify({
					features: features
				});
				break;
		}

		this.interaction.on('select', this.onInteractionSelect.bind(this));

		map.addInteraction(this.interaction);
		var drawSource = this.draw.getSource();
		this.interaction.on('modifyend', function(event) {
			var geojsonStr = (new ol.format.GeoJSON()).writeFeatures(drawSource.getFeatures());
			localStorage.setItem("shapes", geojsonStr);
		});
	},

	/**
	 * [removeFeature description]
	 * @param  {[type]} feature [description]
	 */
	removeSelectedFeature: function() {
		var feature = this.selectedFeatures.getArray()[0];
		//console.log(feature);
		this.selectedFeatures.clear();
		this.removeFeature(feature);	
	},

	/**
	 * [removeFeature description]
	 * @param  {[type]} feature [description]
	 */
	removeFeature: function(feature) {
		var props, features,
			source = this.draw.getSource();

		features = source.getFeatures() || [];

		if (features.length == 0) {
			return;
		}

		if (feature) {
			source.removeFeature(feature);
		} /*else {
			for (k in features) {
				feature = features[k];
				props = feature.getProperties();
				console.log(props.id, props, typeof(feature));
				if (this.selectedFeatures[0].id === props.id) {
					source.removeFeature(feature);
					break;
				}
			}
		}*/		
	},

	/**
	 * [onInteractionSelect description]
	 * @param  {[type]} evt [description]
	 */
	onInteractionSelect: function(evt) {
		var choicePanel = this.choicePanel;
	    var feature = evt.selected[0], type, items;

	    if (feature) {
	    	type = feature.getGeometry().getType();
		
			// Mystère du style du matin !!
			var getStyle = feature.getStyle();
			var style = getStyle(feature);

			var text = style[0].getText();
			if (text!=null) {
				type='Text';
			}

	    	if (!choicePanel) {
	    		return;
	    	}
	    	//choicePanel.drawCt.selectedFeature = feature;

	    	items = choicePanel.query('#Modify'+type);
	        //console.info(choicePanel, type);
	        if (items[0]) {
	        	choicePanel.setActiveItem(items[0]);
	        	choicePanel.getDockedItems()[0].setVisible(true);
	        }
	    } else {
	    	if (evt.deselected.length > 0) {
	    		choicePanel.setActiveItem(0);
	        	choicePanel.getDockedItems()[0].setVisible(false);
	    	}
	    }
	}
});
