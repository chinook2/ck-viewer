/**
 *
 */
Ext.define('Ck.edit.action.Attribute', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditAttribute',

	iconCls: 'fa fa-align-justify',
	tooltip: 'Edit attribute',

	toggleAction: function(btn, status) {
		if(!this.used) {
			this.callParent([btn]);
		}
		
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
				map				: this.getMap(),
				drawStyle		: null,
				overHighlight	: true,
				// AGA - Update 04042020 getDefaultStyleFunction is not a function
				//highlightStyle	: ol.interaction.Select.getDefaultStyleFunction(),
				selectId		: "ckmapSelectEdit"
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
		dataFid.fid = feature.getId();
		dataFid.layer = layer.get('id');
		
		// var source = layer.getSource();
		var formName = layer.getExtension('form');
		if(!formName){
			formName = '/' +  layer.get('id');
		}
		
		this.mapFormPanel =  Ext.create({
			xtype: 'ckform',
			editing: true,
			formName: formName,
			layer: layer,
			dataFid: dataFid
		});
		
		this.mapFormWindow = Ext.create('Ext.window.Window', {
			// height: 300,
			// width: 600,
			layout: 'fit',
			headerPosition: 'right',
			
			maximized: true,
			closable: false,
			
			closeAction: 'hide',
			listeners:{
				//close: this.clearSelection,
				scope: this
			},
			items: this.mapFormPanel 
		});
		
		this.mapFormWindow.show();
	}
});