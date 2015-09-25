/**
 * 
 */
Ext.define('Ck.importvector.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckimportvector',
	
	/**
	 * List of parameters to configure the import
	 */
	importParam: {},
	
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
	init: function() {
		var v = this.getView();
		var vm = this.getViewModel();
		this.ckMap = Ck.getMap();
		this.olMap = this.ckMap.getOlMap();
		this.olView = this.ckMap.getOlView();
		
		Ext.apply(this.importParam, vm.getData().importParam);
		
		this.control({
			"ckimportvector button#import": {
				click: this.startImport,
				scope: this
			},
			"ckimportvector button#cancel": {
				click: this.cancel
			},
			"ckimportvector textfield#file": {
				change: this.paramChange
			},
			"ckimportvector combo#format": {
				change: this.paramChange
			},
			"ckimportvector combo#projection": {
				change: this.paramChange
			}
		});
		
		this.loadDefaultParam();		
	},
	
	/**
	 * Create a layer to host imported features
	 * @param {String} Title of the created layer
	 */
	createLayer: function(title) {
		var vm = this.getViewModel();
		title = Ext.String.capitalize(title.toLowerCase()) || "Imported layer n°" + this.nbImport++;
		
		this.importLayer = new ol.layer.Vector({
			title: title,
			removable: true,
			source: new ol.source.Vector(),
			style: new ol.style.Style({
				fill: new ol.style.Fill(Ext.apply({
					color: 'rgba(255, 255, 255, 0.2)'
				}, vm.getData().layerParam.fill)),
				stroke: new ol.style.Stroke(Ext.apply({
					color: '#ffcc33',
					width: 1
				}, vm.getData().layerParam.stroke))
			})
		});
		this.olMap.addLayer(this.importLayer);
		this.layers.push(this.importLayer);
		this.ckMap.getLegend().addLayer(this.importLayer);
	},
	
	/**
	 * Set default value for each field
	 */
	loadDefaultParam: function() {
		var importParam = this.importParam;
		
		var formatCbx = this.getView().items.get("format");
		formatCbx.setValue(importParam.format);
		
		var projCbx = this.getView().items.get("projection");
		projCbx.setValue(importParam.projection);
	},
	
	/**
	 * Method to save parameter change
	 */
	paramChange: function(item, newValue, oldValue) {
		this.importParam[item.name] = newValue;
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
		switch(this.importParam.format) {
			case "shp":
				var oShp = this.ckZip.getFilesByExtension("shp")[0];
				this.createLayer(Ext.String.stripExtension(oShp.filename));
				if(!Ext.isEmpty(oShp)) {
					this.processShapefile(oShp);
				} else {
					Ext.Msg.show({
						title: "Import",
						message: "There is no ShapeFile in your archive",
						buttons: Ext.Msg.OK,
						icon: Ext.Msg.ERROR
					});
				}
				break;
			case "csv":
				var oShp = this.ckZip.getFilesByExtension("csv")[0];
				if(!Ext.isEmpty(oShp)) {
					
				}
				break;
			case "gpx":
				var oShp = this.ckZip.getFilesByExtension("gpx")[0];
				if(!Ext.isEmpty(oShp)) {
					
				}
				break;
		}
		
	},
	
	/**
	 * Create features from ShapeFile data file.
	 * Look for a dbf file to load properties.
	 * @param {Object}
	 */
	processShapefile: function(oShp) {
		var oDbf, features, feature, geom, ftLists, mapProj, featureProj;
		/**
		 * Block to create WGS84 features directly
			var oPrj = this.ckZip.getFilesByExtension("prj")[0];
			var wktPrj = String.fromCharCode.apply(null, new Uint8Array(oPrj.data));
			features = shp.parseShp(oShp.data, wktPrj);
		 */
		
		features = shp.parseShp(oShp.data);
		
		oDbf = this.ckZip.getFilesByExtension("dbf")[0];
		if(!Ext.isEmpty(oDbf)) {
			features = shp.combine([features, shp.parseDbf(oDbf.data)]);
			features = features.features
		}
		
		feature, geom;
		olFeatures = [];
		mapProj = this.olView.getProjection();
		featureProj = ol.proj.get("EPSG:" + this.importParam.projection);
		
		for(var i = 0; i < features.length; i++) {
			geom = new ol.geom[features[i].geometry.type](features[i].geometry.coordinates);
			geom.transform(featureProj, mapProj);
			feature = new ol.Feature(
				Ext.apply({
					geometry: geom
				}, features[i].properties)
			);
			olFeatures.push(feature);
		}
		
		this.importLayer.getSource().clear();
		this.importLayer.getSource().addFeatures(olFeatures);
	},
	
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.getView().openner.close();
	}
});
