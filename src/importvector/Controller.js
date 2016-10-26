/**
 * 
 */
Ext.define('Ck.importvector.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckimportvector',
	
	requires: [
		'Ck.Zip'
	],
	
	/**
	 * List of parameters to configure the import
	 */
	importParam: {},
	
	/**
	 * @property {ol.layer.Vector}
	 * Current layer imported
	 */
	importLayer: null,
	
	/**
	 * @property {ol.layer.Group}
	 */
	targetGrp: null,
	
	/**
	 * Objet containing parsed files
	 */
	files: {},
	
	/**
	 * @property {ol.layer.Vector[]}
	 * Array of created layers
	 */
	layers: [],
	
	/**
	 * Counter import
	 */
	nbImport: 0,
	
	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);
		Ext.apply(this.importParam, this.getViewModel().getData().importParam);
		this.targetGrp = this.getOlMap().getLayerGroup();
		this.loadDefaultParam();
	},
	
	/**
	 * Init cbx with default parameters. Hide cbx if only 1 choice
	 */
	loadDefaultParam: function() {
		var formatCbx = this.getView().getComponent("format");
		if(this.getViewModel().getStore("format").count() < 2) {
			formatCbx.hide();
		} else {
			formatCbx.setValue(this.importParam.format);
		}
		
		var projCbx = this.getView().getComponent("projection");
		if(this.getViewModel().getStore("projection").count() < 2) {
			projCbx.hide();
		} else {
			projCbx.setValue(this.importParam.projection);
		}
	},
	
	/**
	 * Method to save parameter change
	 */
	paramChange: function(item, newValue, oldValue) {
		this.importParam[item.name] = newValue;
		this.importParam[item.name + "Label"] = item.getRawValue();
	},
	
	/**
	 * Call on import button action.
	 */
	startImport: function() {
		var fileName = this.importParam.file;
		if(Ext.isEmpty(fileName)) {
			Ext.Msg.show({
				message: "Choose a file",
				icon: Ext.Msg.WARNING,
				buttons: Ext.Msg.OK
			});
			return false;
		}
		var file = this.getView().items.get("file").fileInputEl.dom.files[0];
		this.files = {};
		this.processedFiles = 0;
		
		this.ckZip = new CkZip({
			fileName: file,
			onProgress: this.showProgress,
			onFilesLoaded: this.processFiles,
			onGetEntry: function() { alert('toto') },
			scope: {
				onProgress: this,
				onFilesLoaded: this
			}
		});
		
		this.ckZip.getEntries();
	},
	
	showProgress: function(current, total) {
		var toto = 1;
	},
	
	/**
	 * When all files are loaded, do the right action.
	 */
	processFiles: function() {
		var file = this.ckZip.getFilesByExtension(this.importParam.format)[0];
		
		if(Ext.isEmpty(file)) {
			Ext.Msg.show({
				title: "Import",
				message: "There is no " + this.importParam.formatLabel + " in your archive",
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR
			});
		} else {
			switch(this.importParam.format) {
				case "shp":
					this.processShapefile(file);
					break;
				case "csv":
					break;
				case "gpx":
					break;
			}
		}
		
	},
	
	/**
	 * Create features from ShapeFile data file.
	 * Look for a dbf file to load properties.
	 * @param {Object}
	 */
	processShapefile: function(oShp) {
		var oDbf, features, feature, geom, wgsGeom, ftLists, mapProj, featureProj;
		var refProj = ol.proj.get("EPSG:4326");
		
		features = shp.parseShp(oShp.data);
		
		oDbf = this.ckZip.getFilesByExtension("dbf")[0];
		if(!Ext.isEmpty(oDbf)) {
			features = shp.combine([features, shp.parseDbf(oDbf.data)]);
			features = features.features
		}
		
		feature, geom;
		olFeatures = [];
		mapProj = this.getOlView().getProjection();
		featureProj = ol.proj.get("EPSG:" + this.importParam.projection);
		
		// Get map extent as WGS 84 for comparison
		mapExtent = Ck.reprojectExtent(this.getMap().originOwc.getExtent(), mapProj);
		
		for(var i = 0; i < features.length; i++) {
			geom = new ol.geom[features[i].geometry.type](features[i].geometry.coordinates);
			wgsGeom = geom.clone().transform(featureProj, refProj);
			
			if(wgsGeom.intersectsExtent(mapExtent)) {
				geom.transform(featureProj, mapProj);
				feature = new ol.Feature(
					Ext.apply({
						geometry: geom
					}, features[i].properties)
				);
				olFeatures.push(feature);
			}
		}
		
		if(olFeatures.length < 1) {
			Ext.Msg.show({
				message: "There are no feature within the extent of the project</br>Check the projection, it may be wrong",
				icon: Ext.Msg.ERROR,
				buttons: Ext.Msg.OK
			});
		} else {
			this.createLayer(oShp.filename.stripExtension());
			this.importLayer.getSource().clear();
			this.importLayer.getSource().addFeatures(olFeatures);
		}
	},
	
	/**
	 * Create a layer to host imported features
	 * @param {String} Title of the created layer
	 */
	createLayer: function(name) {
		var vm = this.getViewModel();
		name = Ext.String.capitalize(name.toLowerCase()) || "Imported layer n°" + this.nbImport++;
		
		this.importLayer = new ol.layer.Vector({
			title: name,
			removable: true,
			source: new ol.source.Vector(),
			style: Ck.Style.importStyle,
			group: this.targetGrp
		});
		this.getMap().shamCkLayer(this.importLayer);
		
		this.getMap().addNormalLayer(this.importLayer);
		this.layers.push(this.importLayer);
	},
	
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.getView().openner.close();
	}
});
