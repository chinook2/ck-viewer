/**
 * LiveSnapping management
 */
Ext.define('Ck.LiveSnap', {
	
	/**
	 *	Original options
	 */
	snappingOptions: null,
	
	/**
	 *	Current active interactions - 1 ol.interaction.Snap = 1 layer
	 */
	interactions: null,
	
	/**
	 *	Owner component
	 */
	interactions: null,
	
	/**
	 *	Constructor
	 */
	constructor: function(snappingOptions, owner) {
		this.owner = owner;
		this.map = Ck.getMap().getOlMap();
		this.initInteractions(snappingOptions);
    },
	
	/**
	 *	Initialize interactions from snapping options from Ck.Snapping
	 */
	initInteractions: function(snappingOptions) {
		this.snappingOptions = snappingOptions;		
		
		this.interactions = [];
		
		for(var i=0; i<snappingOptions.length; i++) {
			var opt = snappingOptions[i];
			var interaction = this.createInteraction(opt.layer, opt.tolerance);
			this.addInteraction(interaction);
		}
	},
	
	/**
	 *	Create an ol.interaction.Snap
	 */
	createInteraction: function(layer, tolerance) {
		var interaction = new ol.interaction.Snap({
			source: layer.getSource(),
			pixelTolerance: tolerance
		});
		
		interaction.layer = layer;
		
		return interaction;
	},
	
	/**
	 *	Add an interaction to the map, this list and activates it
	 */
	addInteraction: function(interaction) {
		this.interactions.push(interaction);
		this.map.addInteraction(interaction);
		interaction.setActive(true);
		
		if(this.owner) {
			if(this.owner.interactions === undefined) {
				this.owner.interactions = [];
			}
			
			this.owner.interactions.push(interaction);
		}
	},
	
	/**
	 *	Remove an interaction from the map, this list and deactivates it
	 */
	removeInteraction: function(layer) {
		
		if(this.owner) {
			for(var i=0; i<this.owner.interactions.length; i++) {
				var interaction = this.owner.interactions[i];
				
				if(interaction.layer == layer) {
					interaction.setActive(false);
					this.map.removeInteraction(interaction);
					this.owner.interactions.slice(i, 1);
				}
			}
		}
		
		for(var i=0; i<this.interactions.length; i++) {
			var interaction = this.interactions[i];
			
			if(interaction.layer == layer) {
				interaction.setActive(false);
				this.map.removeInteraction(interaction);
				this.interactions.slice(i, 1);
			}
		}
	},
	
	/**
	 *	Retrieve an interaction from this list using layer
	 */
	getInteraction: function(layer) {
		
		for(var i=0; i<this.interactions.length; i++) {
			var interaction = this.interactions[i];
			
			if(interaction.layer == layer) {
				return interaction;
			}
		}
	},
	
	/**
	 *	Manage layer activation from Ck.Snapping event 
	 */
	manageLayerActive: function(record, active) {
		var layer = record.get("layer");
		
		if(active) {
			var tolerance = record.get("tolerance");
			var interaction = this.createInteraction(layer, tolerance);
			this.addInteraction(interaction);
		} else {
			this.removeInteraction(layer);
		}
	},
	
	/**
	 *	Manage layer tolerance change from Ck.Snapping event
	 */
	manageLayerTolerance: function(record, tolerance) {
		var layer = record.get("layer");		
		var interaction = this.getInteraction(layer);
		
		if(interaction) {
			interaction.pixelTolerance_ = tolerance;
		}		
	}
});