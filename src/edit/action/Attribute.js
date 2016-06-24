/**
 *
 */
Ext.define('Ck.edit.action.Attribute', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditAttribute',

	itemId: 'edit-attribute',
	iconCls: 'fa fa-align-justify',
	tooltip: 'Edit attribute',

	/**
	*  Click tolerance to select features
	*/
	tolerance: 20,
	
	toggleAction: function(btn, status) {
		this.callParent(arguments);
		
		var source = this.getLayerSource();
		
		if(!this.attributeInteraction) {
			this.attributeInteraction = Ck.create("Ck.Selection", {
				layers			: [this.getLayer()],
				type			: "Point",
				callback		: function(layers) {
					if(layers[0]) {
						var ft = layers[0].features;
						if(ft.length == 1) {
							this.displayInfo(ft[0]);
						}
					}
				},
				scope			: this,
				map				: this.map,
				drawStyle		: null,
				overHighlight	: true,
				highlightStyle	: ol.interaction.Select.getDefaultStyleFunction(),
				selectId		: "ckmapSelectEdit",
				tolerance       : this.tolerance
			});
			this.interactions["attributeInteraction"] = this.attributeInteraction;
		}

		this.attributeInteraction.setActive(status);
		if(!status) {
			this.attributeInteraction.resetSelection();
		}
	},
	
	displayInfo: function(feature) {
		
		var layer = this.getLayer();
		if(!layer) {
			Ck.log("enable to find layer : "+layer);
			return false;
		}
		
		// Get all properties and add layer name and fid. Used by dataUrl Template in form to load data
		var dataFid =  feature.getProperties();
		dataFid.fid = this.controller.getFid(feature);
		dataFid.layer = layer.get('id');
		
		// var source = layer.getSource();
		var formName = layer.getExtension('form');
		// Filter form fields for mobile (when using Forms serveur)
		// if(formName) {
		if(formName && Ck.isMobileDevice()) {
			formName += '&mod=mobile';
		}
		
		if(!formName){
			var lyrName = layer.get('id');
			var lyrName = lyrName.split(":");
			lyrName = lyrName.pop();
			formName = '/' + lyrName
		}
		
		var dataObject = null;
		var offerings = layer.ckLayer.getOfferings();
		if(offerings) {
			for(var i=0; i<offerings.length; i++) {
				var offering = offerings[i];
				if(offering.getType() == "geojson") {
					dataObject = feature.getProperties();
					break;
				}
			}			
		}
		
		this.mapFormPanel =  Ext.create({
			xtype		: 'ckform',
			editing		: true,
			formName	: formName,
			layer		: layer.get("id"),
			dataFid		: feature.getId(),
			dataObject	: dataObject
		});
		
		this.mapFormPanel.getController().on("aftersave", this.editingComplete, this);
		this.mapFormPanel.getController().on("afterclose", this.editingComplete, this);
		
		this.mapFormWindow = Ext.create('Ext.window.Window', {
			layout: 'fit',
			headerPosition: 'right',
			
			maximized: true,
			closable: false,
			
			closeAction: 'hide',
			listeners:{
				scope: this
			},
			items: this.mapFormPanel 
		});
		
		this.mapFormWindow.show();
	},
	
	/**
	 * Firered when edit ends (with success or failure)
	 */
	editingComplete: function() {
		this.attributeInteraction.resetSelection();
	}
});