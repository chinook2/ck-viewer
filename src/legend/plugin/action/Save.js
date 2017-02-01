/**
 * 
 */
Ext.define('Ck.legend.plugin.action.Save', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayersave',
	
	iconCls: 'fa fa-save fa-lg ck-plugin',
	tooltip: 'Save layer from map',
	
	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr) || lyr instanceof ol.layer.Group || !Ext.isFunction(lyr.getExtension)) {
					return this.disableClass;
				} else {
					var offering = lyr.ckLayer.getOffering("geojson");
					
					if(((lyr.getExtension("editable") || lyr.ckLayer.getPermission("edit")) && lyr.getExtension("geometryType")) && offering) {
						return this.iconCls;	
					}
					
					return this.disableClass;
				}
				
			},
			scope: this
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	doAction: function(layer) {		
		this.callParent(arguments);
		
		var map = Ck.getMap();
		var date = new Date();
		var datePrefix = Ext.Date.format(date, "d_m_Y_H_i");		
		var exportPath = Ext.manifest.fileConf.exportDirectory + "/";		
		var layerSource = {};
		var layerFeatures = [];
		var filename = layer.get("id");
		var path = exportPath + layer.get("id") + "_" + datePrefix;
		var type = "POLYGON";
				
		layerSource = layer.getSource();
		layerFeatures = layerSource.getFeatures();	

		if(layerFeatures.length > 0) {
			var feat = layerFeatures[0];
			var type = feat.getGeometry().getType();
			
			if(type == "Point") {
				type = "POINT";
			} else if(type == "LineString") {
				type = "POLYLINE";
			} else if(type == "Polygon") {
				type = "POLYGON";
			}
		}
				
		var offering = layer.ckLayer.getOffering("geojson");
		
		if(offering) {
			if(offering.getIsFromShape()) {
				var layerSrs = offering.getSrs();
				
				if(layerSrs && layerSrs != map.getProjection().getCode()) {
					var layerFeaturesTmp = layerFeatures;
					layerFeatures = [];
					
					for(var i=0; i<layerFeaturesTmp.length; i++) {
						var feature = layerFeaturesTmp[i];
						var newFeature = feature.clone();
						
						newFeature.getGeometry().transform(map.getProjection().getCode(), layerSrs);
						layerFeatures[i] = newFeature;
					}					
				}				
				
				this.saveLayerAsShapefile(path, layerFeatures, filename, layer, type);
			} else {
				this.saveLayerAsGeojson(path, layerFeatures, filename, layer);
			}			
		}
	},
	
	/**
	*	saveLayerAsShapefile 
	*	Save features in shapefile
	**/
	saveLayerAsShapefile: function(path, layerFeatures, filename, layer, type) {
		
        if(!path) {
			return;
		}

		Ext.MessageBox.show({
			title: "Couche " + layer.get("title"),
			msg: "Sauvegarde de la couche en Shapefile...",
			width: 400,
			progress: false,
			closable: false,
			animEl: "mb6"
		});
		
		var shapewriter = new Shapefile();
		shapewriter.addOL3Graphics(layerFeatures);
		
		var res = shapewriter.getShapefile(type);
		// res is object with properties "successful" and "shapefile"
		if (res.successful) {
			var shapefile = res['shapefile'];
			// shapefile is object with properties "shp", "shx" and "dbf" - use these names as file extensions
			if(!Ck.isMobileDevice()) {
				var saver = new BinaryHelper();
				for (var actualfile in shapefile) {
					if (shapefile.hasOwnProperty(actualfile)) {
						saver.addData({
							filename: filename,
							extension: actualfile,
							datablob: shapefile[actualfile]
						});
					}
				}
			
				Ext.MessageBox.hide();
			
				// btn will be created either as normal HTML button that calls saveNative (in Chrome),
				// or flash look-a-like which uses downloadify to save 
				// var btn = saver.createSaveControl("saveButtonDiv");
				// in the case of Chrome we could also call saver.saveNative() programatically at this point 
				// without need for user interaction, but downloadify can only save in response to 
				// actual click event on its button	
				saver._saveNative()
			} else {
				this.firstSaved = false;
				var thisRef = this;
				
				for (var actualfile in shapefile) {
					if (shapefile.hasOwnProperty(actualfile)) {
						
						var fileWriter = new Ck.utils.file.Writer({
							path: path + "." + actualfile,
							layer : layer,
							listeners: {
								dataWritten: function(evt) {									
									if(evt.target.error !== undefined && evt.target.error) {
										Ext.MessageBox.hide();
										Ck.error('Error while recording. ', evt.target.error);
									} else {
										Ext.MessageBox.hide();
										Ext.Msg.alert('Sauvegarde', 'Fichier sauvegardé : ' + path + '.');
										
										if(thisRef.firstSaved === false) {
											thisRef.firstSaved = true;
											
											for(var i=0; i<layerFeatures.length; i++) {
												var feature = layerFeatures[i];
												feature.set("export", false);
											}
											
											// Save init document
											thisRef.saveGeojson(layer);
										}										
									}					
								}
							}
						});	
						fileWriter.writeData(shapefile[actualfile], Ck.utils.file.Writer.MODE.ERASE);
					}
				}
				
				if(window.projDef) { // defined in Application.js !!!
					var offering = layer.ckLayer.getOffering("geojson");
					var layerSrs = offering.getSrs();
					var proj = projDef[layerSrs];
					
					if(!proj) {
						proj = projDef[Ck.getMap().getProjection().getCode()];
					}
					
					var fileWriter = new Ck.utils.file.Writer({
						path: path + ".prj",
						layer : layer,
						listeners: {
							dataWritten: function(evt) {
								if(evt.target.error !== undefined && evt.target.error) {
									Ck.error('Error while recording. ', evt.target.error);
								} else {						
									Ext.Msg.alert('Sauvegarde', 'Fichier sauvegardé : ' + path + '.');
								}					
							}
						}
					});	
					fileWriter.writeData(proj, Ck.utils.file.Writer.MODE.ERASE);
				}
			}			
		}
		else {
			Ext.MessageBox.hide();
			
			Ck.Msg.show({
				title: "Error generating shapefile",
				message: res.message,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR
			});
		}
	},
	
	/**
	*	saveLayerAsGeojson 
	*	Save features in geojson file
	**/
	saveLayerAsGeojson: function(path, layerFeatures, filename, layer) {
		var offering = layer.ckLayer.getOffering("geojson");
		
        if(!path) {
			return;
		}
		
		filename =  filename + ".geojson";
		path =  path + ".geojson";
		
		var geojsonFormat = new ol.format.GeoJSON();
		var geojson = geojsonFormat.writeFeaturesObject(
			layerFeatures, {
			dataProjection: Ck.getMap().getProjection().getCode(),
			featureProjection: offering.getSrs()
		});
		
		var thisRef = this;
		var fileWriter = new Ck.utils.file.Writer({
			path: path,
			layer : layer,
			listeners: {
				dataWritten: function(evt) {
					if(evt.target.error !== undefined && evt.target.error) {
						Ck.error('Error while recording. ', evt.target.error);
					} else {						
						Ext.Msg.alert('Sauvegarde', 'Fichier sauvegardé : ' + path + '.');
						
						for(var i=0; i<layerFeatures.length; i++) {
							var feature = layerFeatures[i];
							feature.set("export", false);
						}
						
						// Save init document
						thisRef.saveGeojson(layer);
					}					
				}
			}
		});	
		fileWriter.writeData(geojson, Ck.utils.file.Writer.MODE.ERASE);
	},
	
	/**
	*	saveGeojson
	**/
	saveGeojson: function(layer) {
		Ext.MessageBox.show({
			title: "Couche " + layer.get("title"),
			msg: "Sauvegarde de la couche en GeoJSON...",
			width: 400,
			progress: false,
			closable: false,
			animEl: "mb6"
		});
		
		var offering = layer.ckLayer.getOffering("geojson");
		var url = layer.ckLayer.getOfferings()[0].getOperations()[0].getUrl();
		var urlSplit = url.split("/");
		urlSplit = urlSplit.reverse();
		urlSplit = urlSplit.slice(0, 1);
		urlSplit = urlSplit.toString().split(".");
		urlSplit = urlSplit.slice(0, 1);
		
		var fileName = urlSplit.toString() + ".geojson";
		var layerSource = layer.getSource();
		var layerFeatures = layerSource.getFeatures();
		var geojsonFormat = new ol.format.GeoJSON();
		
		var layerSrs = offering.getSrs();
				
		if(layerSrs && layerSrs != Ck.getMap().getProjection().getCode()) {
			var layerFeaturesTmp = layerFeatures;
			layerFeatures = [];
			
			for(var i=0; i<layerFeaturesTmp.length; i++) {
				var feature = layerFeaturesTmp[i];
				var newFeature = feature.clone();
				
				newFeature.getGeometry().transform(Ck.getMap().getProjection().getCode(), layerSrs);
				layerFeatures[i] = newFeature;
			}					
		}	
				
		var geojson = geojsonFormat.writeFeaturesObject(
			layerFeatures, {
			dataProjection: offering.getSrs(),
			featureProjection: offering.getSrs()
		});
		geojson.crs = {"type": "name", "properties":{"name": offering.getSrs() }};
		
		var thisRef = this;
		
		var fileWriter = new Ck.utils.file.Writer({
			path: Ext.manifest.fileConf.geojsonDirectory + fileName,
			listeners: {
				dataWritten: function(evt) {
					Ext.MessageBox.hide();
					
					if(evt.target.error !== undefined && evt.target.error) {
						Ck.error('Error while recording. ', evt.target.error);
					} else {
						Ck.error('File saved succesfully.');						
					}					
				}
			}
		});	
		
		fileWriter.writeData(JSON.stringify(geojson), Ck.utils.file.Writer.MODE.ERASE);
		
	}

});