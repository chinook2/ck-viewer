/**
 * Edit tool used to delete a feature
 */
Ext.define('Ck.edit.action.Delete', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditDelete',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-remove fa-lg fa-flip-horizontal ck-plugin',
	tooltip: 'Delete feature',

	toggleAction: function(btn, status) {
		this.used = true;
		var source = this.getLayerSource();
		
		// this.map.getOlMap().registerRemoveEvent(source);
		
		if(!this.delInteraction) {
			this.delInteraction = new ol.interaction.Select({
				layers: [this.layer],
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
			
			this.delInteraction.on('select', function(e) {
				if(e.selected.length==0) return;
				var me = this;
				var feature = e.selected[0];
								
				Ext.Msg.show({
					title: "Borrar",
					message: "&iquest; Seguro que quiere borrar la entidad seleccionada ?",
					buttons: Ext.Msg.YESNO,
					icon: Ext.Msg.QUESTION,
					fn: function(btn) {
						if (btn === 'yes') {
							source.removeFeature(feature);						
							// me.updateDbRecord(feature);
						}
						// Efface la sélection dans tous les cas
						me.delInteraction.getFeatures().clear();
					}
				});
			}, this);
		   
			this.map.getOlMap().addInteraction(this.delInteraction);
		}

		this.delInteraction.setActive(status);
	},
	
	updateDbRecord: function(f) {
		var me = this;
		var v = me.getView();
		var lyr = v.layerId;
		var featureId = "cedula";
		
		var p = f.getProperties();
		var fid = p[featureId];
		
		// Pas encore de données en bdd sur ce predios
		if(!fid) return;
		
		var app = Panama.app.getApplication();
		var storage = app.storage;

		// TODO : avoir un storage.update()...
		storage.load({
			layer: lyr,
			fid: fid,
			success: function(res) {
			
				// Mis à jour du status
				res.status = "DELETED";				
				// Mis à jour de la date de modification
				res.re_fecha = Ext.Date.clearTime(new Date());
				
				storage.save({
					layer: lyr,
					sid: res.id, // storage ID en cours
					data: res,
					success: function(res) {
						// TODO : Message que tout est OK
					},
					failure: function() {
						// TODO
					}
				});
			},
			failure: function() {
				// TODO
			}
		});
	},
	
	closeAction: function() {
		this.map.getOlMap().removeInteraction(this.drawInteraction);
	}
});