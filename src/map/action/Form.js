/**
 *
 */
Ext.define('Ck.map.action.Form', {
	extend: 'Ck.Action',
	alias: "widget.ckmapForm",
	
	itemId: 'forms',
	text: '',
	iconCls: 'fa fa-file-text',
	tooltip: 'Open Form',	
	
	mapFormSelect: null,
	mapFormPanel: null,
	
	doAction: function(btn, status) {
		var map = this.getMap();
		var layer = btn.layer;
		var featureId = btn.featureId || 'fid';
		
		var lyr = map.getLayer(layer);
		if(!lyr) {
			Ck.log("enable to find layer : "+layer);
			return false;
		}
		var source = lyr.getSource();
		
		// Initialise le formulaire (dans une popup plein écran)
		if(!this.mapFormPanel) {			
			this.mapFormPanel =  Ext.create({
				xtype: 'ckforms',
				formName: layer
			});
			
			this.mapFormWindow = Ext.create('Ext.window.Window', {
				height: 200,
				width: 400,
				layout: 'fit',
				headerPosition: 'right',
				//maximized: true,
				//closable: false,
				closeAction: 'hide',
				listeners:{
					close: this.clearSelection,
					scope: this
				},
				items: this.mapFormPanel 
			});
		}
		
		if(!this.mapFormSelect) {
			this.mapFormSelect = this.initInteraction(lyr);
			
			// Après sélection d'un objet charge les infos dans le formulaire puis l'affiche
			this.mapFormSelect.getFeatures().on('add', function (ce) {
				var f = ce.element;
				var p = f.getProperties();
				var fid = p[featureId];
				
				this.mapFormPanel.setConfig({
					fid: fid
				}).getController().formLoad();
				
				//
				var tab = this.mapFormPanel.down('tabpanel');
				if(tab) tab.setActiveTab(0);
				//
				
				this.mapFormWindow.show();
			}, this);

			// this.mapFormSelect.on('change:active', this.clearSelection, this);
		}
		
		// Active / Désactive l'interaction.
		this.mapFormSelect.setActive(status);
	},
	
	clearSelection: function() {
		this.mapFormSelect.getFeatures().clear();
	},
	
	initInteraction: function(layer) {
		var it = new ol.interaction.Select({
			layers: [layer],
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'yellow',
					width: 3
				}),
				fill: new ol.style.Fill({
					color: 'rgba(0, 0, 255, 0.1)'
				})
			})
		});
		//this.olMap = map.getOlMap();
		this.getMap().getOlMap().addInteraction(it);
		return it;
	}
});
