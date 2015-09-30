/**
 * This action is used to modify the geometry of a feature.
 * Two interactions are created :
 *
 * - vertexInteraction : to select the feature to modify
 * - vertexModifyInteraction : to modify vertex
 */
Ext.define('Ck.edit.action.Geometry', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeometry',

	iconCls: 'fa fa-edit',
	tooltip: 'Edit geometry',

	toggleAction: function(btn, status) {
		this.used = true;
		
		var source = this.getLayerSource();
		
		// this.type = btn.handlerOptions.type;
				
		if(!this.vertexInteraction) {
			// Sélection du predios (modification du style)
			// TODO : limiter l'édition à ce predios (en conservant la topologie)
			// voir si on peut ajouter un onBeforeDrag sur le modify et tester l'id du feature ?
			this.vertexInteraction = new ol.interaction.Select({
				layers: [layer],
				style: this.editModifyStyleFunction,
				condition: function(mapBrowserEvent) {
					return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DBLCLICK;
				}
			});
			this.map.getOlMap().addInteraction(this.vertexInteraction);

			// At the selection we analyse the feature
			this.vertexInteraction.on('select', function (e) {
				// Interaction il faut supprimer l'interaction à chaque clic, fonction de la sélection...
				if(this.vertexModifyInteraction) {
					this.map.getOlMap().removeInteraction(this.vertexModifyInteraction);
				}
				
				this.feature = null;
				this.selectedVertex = null;
				
				// If nothing selected -> return
				if(e.selected.length==0) return;
				
				this.feature = e.selected[0];				
				
				
				
				
				
				
				
				
				
				
				// il faut refaire l'interaction à chaque clic, fonction de la sélection...
				this.vertexModifyInteraction = new ol.interaction.Vertex({
					feature: this.feature, // JMA limite l'édition à ce feature, mais passe les autres pour la topologie...
					source: source,
					//features: new ol.Collection(aFeatures),
					pixelTolerance: 15,
					type: this.type
				});
				
				this.vertexModifyInteraction.on('select', function(e) {
					this.selectedVertex = e.selected;
					this.selectedVertex.setStyle(this.editSelectedStyle);
				});
				
				this.map.getOlMap().addInteraction(this.vertexModifyInteraction);				
				
				switch(this.type) {
					case "ADD":
						Panama.utils.message.Msg.showToast("Clic en un l&iacute;mite de predio para a&ntilde;adir un v&eacute;rtice.");
						break;
					case "DELETE":
						Panama.utils.message.Msg.showToast("Seleccionar un v&eacute;rtice para borrarlo.");
						break;
					case "MODIFY":
						Panama.utils.message.Msg.showToast("Arrastrar y soltar para mover un v&eacute;rtice.");
						break;
				}		   
			});
		}
		
		this.vertexInteraction.setActive(status);
		
		/*
		// GPS ---
		if(!this.geolocation) {
			var app = Panama.app.getApplication();
			this.geolocation = app.geolocation;
			
			// add a marker to display the current location
			if(!Ext.get('location-gps')) {
				var body = Ext.getBody();
				body.insertHtml("BeforeEnd", "<div id=\"location-gps\" class=\"marker-gps\"><span class=\"geolocation\"></span></div>");
			}
			
			this.geolocationMarker = new ol.Overlay({
				element: document.getElementById('location-gps'),
				positioning: 'center-center'
			});
			this.map.getOlMap().addOverlay(this.geolocationMarker);
			
			// Update geolocationMarker's position via GPS
			this.geolocation.on('change', function(evt) {
				var p = this.geolocation.getPosition();				
				this.geolocationMarker.setPosition(p);
			}, this);
		}
		
		if(!this.btnGPS) {
			this.btnGPS = Ext.create('Ext.Button', {
				text: 'GPS',
				renderTo: Ext.getBody(),
				floating: true,
				style: {
					bottom: '150px',
					right: '20px'
				},
				handler: function() {
					// set up geolocation to track our position
					var coord = this.geolocation.getPosition();
					
					// coord = [672720, 6176890];
					
					if(!coord) {
						Panama.utils.message.Msg.showToast("El GPS no esta conectado.");
						return;
					}
										
					switch(this.type) {
						case "ADD":
							if(this.feature){
								// Simule un clic à la position du GPS
								
								// Récup le point le plus proche du GPS sur le feature
								var closestPoint = this.feature.getGeometry().getClosestPoint(coord);		  
								// Il faut élargir l'extent pour pouvoir sélectionner le/les segments à modifier pour l'ajout du vertex
								this.vertexModifyInteraction.vertexFeatureExtent_ = ol.extent.boundingExtent([closestPoint, coord]);
							   
								// Ruse N°3642 :) on passe la coord du closestPoint (> pixel) pour recup les segments qui vont bien dans handlePointerAtPixel_
								var p = this.map.getOlMap().getPixelFromCoordinate(closestPoint);
								var e = {
									map: this.map.getOlMap(),
									pixel: p, 
									coordinate: coord
								};
								
								// On utilise les coord du GPS pour re-init le VertexFeature et contourner l'appel de handlePointerAtPixel_ 
								// qui a été init avec le closestPoint en plus donc pas bon pour après (facile :) )
								this.vertexModifyInteraction.vertexFeatureGPS_ = new ol.Feature(new ol.geom.Point(e.coordinate));

								// On simule les clic sur la carte
								this.vertexModifyInteraction.handleDownEvent_(e);
								this.vertexModifyInteraction.handleUpEvent_(e);
								
								this.vertexModifyInteraction.vertexFeatureGPS_ = null;
								this.vertexModifyInteraction.vertexFeatureExtent_ = null;
							}
							break;
						case "MODIFY":
							if(this.selectedVertex){
								// Simule un clic à la position du GPS
								var p = this.map.getOlMap().getPixelFromCoordinate(coord);
								var e = {
									map: this.map.getOlMap(),
									pixel: p,
									coordinate: coord
								};

								// On utilise le vertex précédenment sélctionné (à la position actuelle du GPS il n'y a probablement rien...)
								this.vertexModifyInteraction.vertexFeatureGPS_ = this.selectedVertex;
								
								this.vertexModifyInteraction.handleDownEvent_(e);
								this.vertexModifyInteraction.handleDragEvent_(e);
								this.vertexModifyInteraction.handleUpEvent_(e);
								
								this.selectedVertex = null;
								this.vertexModifyInteraction.vertexFeatureGPS_ = null;
							}
							break;
					}		   
				},
				scope: this
			});
		}
	
		if(!this.task) {
			this.task = new Ext.util.DelayedTask(function(){
				this.feature = null;
			}, this);
		}
		
		// Active ou non le GPS / tracking
		if(this.geolocation) this.geolocation.setTracking(status);
		if(this.btnGPS) this.btnGPS.setVisible(status);
		if(Ext.get('location-gps')) Ext.get('location-gps').setVisible(status);

		switch(this.type) {
			case "ADD":
				this.btnGPS.setText("GPS<br>A&ntilde;adir v&eacute;rtice");
				break;
			case "DELETE":
				this.btnGPS.hide();
				break;
			case "MODIFY":
				this.btnGPS.setText("GPS<br>Mover v&eacute;rtice");
				break;
		}
		*/
		
		if(status){
			if(this.feature) {
				// Resélectionne le dernier feature édité.
				this.vertexInteraction.featureOverlay_.addFeature(this.feature);
				this.vertexInteraction.dispatchEvent(new ol.SelectEvent(ol.SelectEventType.SELECT, [this.feature], []));
				// Annule le vidage de la sélection (on reste sur les outils d'édition de vertex...).
				this.task.cancel();
			} else {
				Panama.utils.message.Msg.showToast("Seleccionar el predio a editar.");
			}
		} else {
			// Si désactive le contrôle il faut suppr aussi l'interaction modify...
			this.vertexInteraction.getFeatures().clear();
			this.map.getOlMap().removeInteraction(this.vertexModifyInteraction);
			this.selectedVertex = null;
			// Vide la sélection en cours au bout de 0.5 sec.
			this.task.delay(500);
		}
	},
	
	closeAction: function() {
		
	}
});