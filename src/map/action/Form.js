/**
 *
 */
Ext.define('Ck.map.action.Form', {
	extend: 'Ck.Action',
	alias: "widget.ckmapForm",

	itemId: 'form',
	text: '',
	iconCls: 'fa fa-file-text',
	tooltip: 'Open Form',

	mapFormSelect: null,
	mapFormPanel: null,

	doAction: function(btn, status) {
		var map = this.getMap();
		var layer = btn.layer;
		var featureId = btn.featureId || 'fid';
		if(!map) {
			Ck.log("enable to find Map");
			return false;
		}

		var lyr = map.getLayerById(layer);
		if(!lyr) {
			Ck.log("enable to find layer : "+layer);
			return false;
		}
		var source = lyr.getSource();

		// Initialise le formulaire (dans une popup plein écran)
		if(!this.mapFormPanel) {
			this.mapFormPanel =  Ext.create({
				xtype: 'ckform',
				ckview: this.getCkView().getView(),
				formName: '/' + layer,
				layer: layer
			});

			this.mapFormWindow = Ext.create(this.classWindow, {
				height: 300,
				width: 600,
				layout: 'fit',
				headerPosition: 'right',
				parentMap: this.getMap(),
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

				// For testing grid...
				if(layer=='region'){
					p.departements = [
						{ "ID_GEOFLA": 11, "CODE_DEPT": "11", "NOM_DEPT": "AUDE", "CODE_CHF": "069", "NOM_CHF": "CARCASSONNE", "CODE_REG": "91", "NOM_REGION": "LANGUEDOC-ROUSSILLON" },
						{ "ID_GEOFLA": 31, "CODE_DEPT": "30", "NOM_DEPT": "GARD", "CODE_CHF": "189", "NOM_CHF": "NIMES", "CODE_REG": "91", "NOM_REGION": "LANGUEDOC-ROUSSILLON" },
						{ "ID_GEOFLA": 34, "CODE_DEPT": "33", "NOM_DEPT": "GIRONDE", "CODE_CHF": "063", "NOM_CHF": "BORDEAUX", "CODE_REG": "72", "NOM_REGION": "AQUITAINE" },
						{ "ID_GEOFLA": 49, "CODE_DEPT": "48", "NOM_DEPT": "LOZERE", "CODE_CHF": "095", "NOM_CHF": "MENDE", "CODE_REG": "91", "NOM_REGION": "LANGUEDOC-ROUSSILLON" },
						{ "ID_GEOFLA": 67, "CODE_DEPT": "66", "NOM_DEPT": "PYRENEES-ORIENTALES", "CODE_CHF": "136", "NOM_CHF": "PERPIGNAN", "CODE_REG": "91", "NOM_REGION": "LANGUEDOC-ROUSSILLON" }
					]
				}
				//

				this.mapFormPanel.getController().formLoad({
					raw: p
					//fid: 66  // or
					//url: url  // or
				});

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
