/**
 * The print controller manage map printing.
 *
 * Method call order : layouChange -> loadCss -> updatePreview -> [printButton#click] -> beforePrint -> preparePrint -> print -> finishPrint <br/>
 * Below the print steps :
 *
 * - Once a layout is chosen the .html file and, optionnaly, the .css file are loaded
 * - renderLayout method calculate mapSize (so preview size) from layout, format and resolution
 * - [user drag the preview where he want and click "Print"]
 * - beforePrint call the right print engine (client with jsPDF or server)
 * - peparePrint move olMap
 */
Ext.define('Ck.print.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckprint',

	config: {
		maskMsg: 'Printing in progress...'
	},

	/**
	 * List of parameters to configure the print (dpi, format, layout, resolution, )
	 */
	// printParam: {},
	
	/**
	 * List of values to integrate in the print layout
	 * @var {Object}
	 */
	printValue: {},

	/**
	 * Layer hosting preview vector
	 * @var {ol.layer.Victor}
	 */
	previewLayer: null,

	/**
	 * HTML layouts { layoutId : layoutHTMLString }
	 * @var {Object}
	 */
	layoutsHTML: {},

	/**
	 * Div element
	 * @var {DOMElement}
	 */
	layoutDiv: null,

	/**
	 * Div element where the canvas will be put
	 * @var {DOMElement}
	 */
	printDiv: null,

	/**
	 * Printed map image. Delete it after each printing.
	 * @var {DOMElement}
	 */
	mapImg: null,

	bindings: {
        onChangeValue: {
			resolution: '{printParam.resolution}',
			format: '{printParam.format}',
			shape: '{printParam.shape}',
			orientation: '{printParam.orientation}',
			equipementExt: '{printParam.equipementExt}',
			//title: '{printParam.title}',
			dpi:  '{printParam.dpi}'
		}
	},
	
	ckLoaded: function(map) {
		// Creation preview layer
		var startangle = 0;
		var d=[0,0];

		this.previewLayer = new ol.layer.Vector({
			id: 'printpreview-layer',
			source: new ol.source.Vector(),
			style: getStyle
		});

		function getStyle(feature) {
			return [ 
			new ol.style.Style({
				image: new ol.style.RegularShape({
					fill: new ol.style.Fill({ color: [0,0,255,0.4]}),
					stroke: new ol.style.Stroke({color: [0,0,255,1],width: 1}),
					radius: 10,
					points: 3,
					angle: feature.get('angle')||0
				}),
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: '#ec7306',
					width: 5
				})
			})];
		}
		this.getMap().addSpecialLayer(this.previewLayer);
		this.previewLayerTransform = new ol.interaction.Transform({
			enableRotatedTransform: true,
			addCondition: ol.events.condition.shiftKeyOnly,
			// filter: function(f,l) { return f.getGeometry().getType()==='Polygon'; },
			layers: this.previewLayer,
			hitTolerance: 15,
			translateFeature: true,
			scale: true,
			rotate: true,
			keepAspectRatio: ol.events.condition.always,
			translate: true,
			stretch:false, 
		});

		// Handle rotate on first point
		var firstPoint = false;
		this.previewLayerTransform.on (['select'], function(e) {
			if (firstPoint && e.features && e.features.getLength()) {
				this.previewLayerTransform.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
			}
		});
	
		this.previewLayerTransform.on (['rotatestart','translatestart'], function(e){
			startangle = e.feature.get('angle')||0;
			d=[0,0];
		});
		this.previewLayerTransform.on('rotating', function (e){
			e.feature.set('angle', startangle - e.angle);
		});

		this.previewLayerTransform.on('translating', function (e){
			d[0]+=e.delta[0];
			d[1]+=e.delta[1];
			if (firstPoint) {
				this.previewLayerTransform.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
			}
		});

		this.previewLayerTransform.on('scaling', function (e){
			if (firstPoint) {
			  this.previewLayerTransform.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
			}
		});

		this.previewLayerTransform.on('rotateend', function (e){
			this.printAngle = e.feature.get('angle'); 
			this.set("printParam.angle", this.printAngle);
			Ext.ComponentQuery.query('#angle')[0].setValue(this.printAngle);
		});

		this.previewLayerTransform.on('scaleend', function (e) {
			var canvasSize = Ext.get("ckPrint-map").getWidth();
			var mapSizeWidth = ol.extent.getWidth(e.feature.getGeometry().getExtent());
			var mapSizeWidth = e.feature.getGeometry().flatCoordinates[0] - e.feature.getGeometry().flatCoordinates[2];
			var zoomNavRatio = window.devicePixelRatio;

			this.res = mapSizeWidth * zoomNavRatio / canvasSize;
			this.set("printParam.resolution", this.res);
			//Ext.ComponentQuery.query('#resolution')[0].setValue(this.res);
		});

		//this.getOlMap().addInteraction(this.previewLayerSelect);
	},

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		this.callParent(arguments);

		this.loadResolutions();

		// Init print value
		var fields = this.view.getForm().getFields();
		fields.each(function(field) {
			this.printValue[field.name] = field.getValue() || "";
		}, this);

		// Stylesheet for print div
		this.style = document.createElement("style");
		this.style.appendChild(document.createTextNode(""));
		document.head.appendChild(this.style);

		// Use ol.interaction.Translate
		// Add DragFeature interaction to move preview

		// Hide layout combo if they are only 1 layout
		//this.getView().items.get("printLayout").setVisible(this.getStore("layouts").getCount() > 3);

		// Create the mask
		this.mask = new Ext.LoadMask({
			msg: this.getMaskMsg(),
			target: this.getMap().getView()
		});

		this.control({
			"ckprint button#print": {
				click: this.beforePrint,
				scope: this
			},
			"ckprint button#cancel": {
				click: this.cancel
			},
			"ckprint slider#rotate": {
				change: this.rotatemap
			}
		});
	},

	destroy: function () {
		this.mask = null;
	},

	/**
	 * Load resolutions list from OwsContext
	 */
	loadResolutions: function() {
		var data = this.getView().scales || this.getMap().originOwc.getScales();
		this.getStore("resolutions").loadData(data);
		
		this.set("printParam.resolution", this.getMap().getNearestResolution(this.getOlView().getResolution(), 1));
	},

	/**
	 * Load corresponding json print layout
	 */
	loadHTML: function(layoutId) {
		var oLay = this.getStore("layouts").getById(layoutId);
		
		Cks.get({
			url: Ck.getPath(oLay.get("packageName")) + "/print/" + layoutId + ".html",
			scope: this,
			success: function(response){
				this.layoutsHTML[layoutId] = response.responseText;
				this.loadCss(layoutId);
			},
			failure: function(response, opts) {
				Ck.error('Error when loading the print layout !');
			}
		});
	},

	// TODO: merge css in the html template layout (get template from ck-viewer / app / api

	/**
	 * Load and add CSS to the document
	 */
	loadCss: function(layoutId) {
		var oLay = this.getStore("layouts").getById(layoutId);
		
		Cks.get({
			url: Ck.getPath(oLay.get("packageName")) + "/print/" + oLay.getId() + ".css",
			scope: this,
			success: function(response){
				this.style.innerHTML = response.responseText;
				this.updatePreview();
			}
		});

	},
	
	/**
	 * Display preview when view is rendered
	 */
	displayPreview: function() {
		this.updatePreview();
	},
	
	/**
	 * Update preview box. Update view model data (binded data is refreshed too late)
	 * Don't do anything for bind triggering (first call)
	 */
	onChangeValue: function(newValue) {
		this.set(newValue);
		this.updatePreview();
	},
	rotatemap: function(item, newValue, oldValue){
		this._olView.setRotation(newValue * Math.PI / 180);
		this.updatePreview();
	},

	/**
	 * Update the preview feature from layout, format and orientation
	 */
	updatePreview: function() {
		this.loadResolutions();

		if(this.get("printParam.orientation").__proto__.orientation !== undefined){
			var layoutHTML = this.layoutsHTML[this.get("printParam.layout") + "-" + this.get("printParam.orientation").__proto__.orientation + "-" + this.get("printParam.shape")['shape']];
		}else if (this.get("printParam.orientation").orientation !== undefined){
			var layoutHTML = this.layoutsHTML[this.get("printParam.layout") + "-" + this.get("printParam.orientation").orientation + "-" + this.get("printParam.shape")['shape']];
		}
		
		if(!Ext.isString(layoutHTML)) {
			if(this.get("printParam.orientation").__proto__.orientation !== undefined){
				this.loadHTML(this.get("printParam.layout") + "-" + this.get("printParam.orientation").__proto__.orientation + "-" + this.get("printParam.shape")['shape']);
			}else if (this.get("printParam.orientation").orientation !== undefined){
				this.loadHTML(this.get("printParam.layout") + "-" + this.get("printParam.orientation").orientation + "-" + this.get("printParam.shape")['shape']);
			}
			return false;
		}
		
		this.renderLayout(layoutHTML);
		
		var center = this.getMap().getOlView().getCenter();
		if(this.feature) {
			center = ol.extent.getCenter(this.feature.getGeometry().getExtent());
			this.previewLayer.getSource().clear();
		}
		//var rotation = this._olView.getRotation();
		var rotation = Ext.ComponentQuery.query('#angle')[0].getValue();
		var x0 = center[0];
		var y0 = center[1];
		var w = this.mapSize[0];
		var h = this.mapSize[1];
		
/*
		var coordinate = [
			center[0] - (this.mapSize[0] / 2),
			center[1] - (this.mapSize[1] / 2),
			center[0] + (this.mapSize[0] / 2),
			center[1] + (this.mapSize[1] / 2)
		];*/
		
		var coordinate = [
			[x0 - w / 2, y0 - h / 2],
			[x0 + w / 2, y0 - h / 2],
			[x0 + w / 2, y0 + h / 2],
			[x0 - w / 2, y0 + h / 2]
		];
				
		/*
		var coordinate = [
			this.rotate([x0 - w / 2, y0 - h / 2], rotation, center),
			this.rotate([x0 + w / 2, y0 - h / 2], rotation, center),
			this.rotate([x0 + w / 2, y0 + h / 2], rotation, center),
			this.rotate([x0 - w / 2, y0 + h / 2], rotation, center)
		];
		*/

		this.feature = new ol.Feature({
			geometry: new ol.geom.Polygon([coordinate])
		});
		this.previewLayer.getSource().addFeature(this.feature);
	},

	/**
	 * Render the HTML layout just to calculate some variables. Remove it after
	 *		- pageSize : printed page in CENTIMETERS (with margins) -> use to create pageCanvas
	 *		- mapSize : size of the map in METERS -> use to draw preview
	 *		- canvasSize : canvas size to print in PIXEL -> use for making div
	 * @param {String} The HTML string
	 */
	renderLayout: function(layoutHTML) {
		var parser = new DOMParser();
		var htmlLayout = parser.parseFromString(layoutHTML, "text/html");
		this.pageDiv = htmlLayout.getElementById("ckPrint-page");
		if (!this.pageDiv) return;

		if(this.layoutDiv) {
			Ext.get(this.layoutDiv).remove();
		}

		// Size of final print page in cm
		if(this.get("printParam.format") == 'a0'){
			this.pageSize = Ck.pageSize['a1'];
		}else{
			this.pageSize = Ck.pageSize[this.get("printParam.format")];
		}
		if (!this.pageSize) return;
		this.pageSize = this.pageSize.slice(0); // Clone
		// transform to cm
		this.pageSize[0] /= 10;
		this.pageSize[1] /= 10;

		// Reverse size according to orientation
		if(this.get("printParam.orientation").orientation == "l") {
			this.pageSize.reverse();
		}

		if(Ext.ComponentQuery.query('#format')[0].valueCollection.items.length !== 0){
			this.ratio = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.ratio;
		}else{
			this.ratio = 1;
		}

		// Apply DPI to get number of dot (pixel) needed
		this.pageDiv.style.width = Math.floor((this.pageSize[0] / Ck.CM_PER_INCH) * this.get("printParam.dpi")).toString() + "px";
		this.pageDiv.style.height = Math.floor((this.pageSize[1] / Ck.CM_PER_INCH) * this.get("printParam.dpi")).toString() + "px";

		// Insert pageDiv in layout div
		var dh = Ext.DomHelper;
		this.layoutDiv = dh.append(document.body, {
			tag: 'div',
			id: 'ckprint-layoutdiv',
			style: {
				position: 'absolute',
				left: "100%", // Comment to display layout
				zIndex: 500
			}
		});
		this.layoutDiv.appendChild(this.pageDiv);

		// Now calculate canvasSize (pixel) & mapSize (meters) from rendered page div
		var mapDiv = Ext.get("ckPrint-map");
		this.mapDiv = mapDiv.dom;

		// Adapt component size to format thanks to ratio
		var zoomNavRatio = window.devicePixelRatio;
		mapDiv.setWidth(mapDiv.getWidth() * zoomNavRatio);
		mapDiv.setHeight(mapDiv.getHeight() * zoomNavRatio);
		
		this.canvasSize = [mapDiv.getWidth(), mapDiv.getHeight()];

		// Calculate mapSize
		var res = this.get("printParam.resolution");

		// Définit la taille du rectangle englobant orange
		this.mapSize = [
			(this.canvasSize[0] * res),
			(this.canvasSize[1] * res)
		];

		//Edit with new resolution to not be included on mapSize (and print shape)
		mapDiv.setWidth(mapDiv.getWidth() * this.ratio * 2)
		mapDiv.setHeight(mapDiv.getHeight() * this.ratio * 2);
		this.canvasSize = [mapDiv.getWidth(), mapDiv.getHeight()];
	},

	/**
	 * Check how the document will be print
	 */
	beforePrint: function(btn) {
		// Hide preview vector
		this.previewLayer.setVisible(false);

		/* var rendererType = this.getOlMap().getRenderer().getType(); */
		var rendererType =  "canvas"; //this.getOlMap().getRenderer().getType()
		switch(rendererType) {
			case "canvas":
				if(!Ext.supports.Canvas) {
					Ext.Msg.show({
						title: "Print error",
						message: "Your browser doesn't support canvas and print tool need it. Use a modern browser.",
						icone: Ext.Msg.Error,
						buttons: Ext.Msg.OK
					})
				}
				this.preparePrint();
				break;
			case "webgl":
			default:
				Ext.Msg.show({
					message: "Chinook doesn't support printing from " + rendererType + " rendering map",
					icon: Ext.Msg.ERROR,
					buttons: Ext.Msg.OK
				});
				return false;
		}
		if(this.get("printParam.format") == 'a0'){
			this.getOlMap().getLayers().forEach(function(grp) {
				grp.getLayersArray().forEach(function(layer) {
					var source = layer.getSource();
					var context = Ck.getMap().originOwc.data.id;
					if(source.getParams && source.updateParams) {
						var params = source.getParams();
						if(Ext.ComponentQuery.query('#format')[0].valueCollection.items.length !== 0){
							this.ratio = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.ratio;
						}else{
							this.ratio = 1;
						}
						if(layer.getProperties().id == context + ':equipement_all_exterieur'){
							params['RESOLUTION'] = 110;
						}else{
							params['RESOLUTION'] = 92;
						}
						params['WIDTH'] = params['WIDTH'] * this.ratio;
						params['HEIGHT'] = params['HEIGHT'] * this.ratio;
						source.updateParams(params);
					}
				})
			});
		}
		// Close popup
		var win = this.getView().up('window');
		if(win) win.close();
	},

	/**
	 * 
	 */
	composeCanvas: function() {
		var mapCanvas = document.createElement('canvas');
		var size = this.getOlMap().getSize();
		if(Ext.ComponentQuery.query('#format')[0].valueCollection.items.length !== 0){
			this.ratio = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.ratio;
		}else{
			this.ratio = 1;
		}
		mapCanvas.width = size[0];
		mapCanvas.height = size[1];
		var mapContext = mapCanvas.getContext('2d');

		Array.prototype.forEach.call(
		  document.querySelectorAll('.ol-layer canvas'),
		  function (canvas) {
			if (canvas.width > 0) {
			  var opacity = canvas.parentNode.style.opacity;
			  mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
			  var transform = canvas.style.transform;
			  // Get the transform parameters from the style's transform matrix
			  var matrix = transform
				.match(/^matrix\(([^\(]*)\)$/)[1]
				.split(',')
				.map(Number);
			  // Apply the transform to the export map context
			  CanvasRenderingContext2D.prototype.setTransform.apply(
				mapContext,
				matrix
			  );
			  mapContext.drawImage(canvas, 0, 0);
			}
		  }
		);

		return mapCanvas;
	},

	/**
	 * 
	 */
	getClassLength : function(layer) {
		//Get class length
		Cks.get({
			url: Ck.getApi() + "service=SLD&request=get&layers=" + layer.get("id"),
			scope: this,
			async: false,
			success: function(response){
				this.nbClass = response.responseXML.getElementsByTagName('sld:Rule').length;
			},
			failure: function(response, opts) {
				Ck.error('Error count class !');
			}
		});
	},

	/**
	 * Create a snapshot of the map and display it on the user interface. <br/>
	 * Move the ol.Map in an invisible div to zoom on the right extent <br/>
	 * Hide preview box to didn't print it <br/>
	 * Hide listener to call the print method when all layers are loaded
	 */
	preparePrint: function() {
		// Save current view param
		this.oldRes = this.getOlView().getResolution();
		this.oldCenter = this.getOlView().getCenter();
		this.mapTarget = Ext.get(this.getOlMap().getTarget()).dom;
		if(!this.canvasSize) {
			return;
		}
		this.mask.show();
		this.getOlMap().once('rendercomplete', function() {
			// First display fake map on the screen during the real print
			var mapCanvas = this.composeCanvas();
			var mapCtx = mapCanvas.getContext("2d");
			var uri = mapCanvas.toDataURL('image/jpg', 1).replace(/^data:image\/[^;]/, 'data:application/octet-stream');

			var dh = Ext.DomHelper;

			// Create the img element and add over map
			this.fakeMap = dh.append(this.mapTarget, {
				tag: 'img',
				src: uri,
				style: 'width=' + mapCanvas.width + ';height=' + mapCanvas.width
			});
			
			//Insertion légende
			if (Ext.get('ckPrint-legend')){
				Ext.get("ckPrint-legend").dom.style.display = "block";
				listlay = Ck.getMap().getLayers().getArray();
				colcnt = "";
				var ittest = 0;
				var irgt = 0;
				if(this.get("printParam.orientation").__proto__.orientation == "p"){
					cntor = 9;
				}else{
					cntor = 24;
				}
				var parser = new DOMParser();

				for(i=0 ; i < listlay.length; i++) {
					//Si c'est un vecteur 
					if(listlay[i].values_.title != 'Photo aérienne' && listlay[i].values_.title != 'OpenStreetMap'){
						if(Ext.isFunction(listlay[i].getLayersArray)){
							listlay2 = listlay[i].getLayersArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										//Count list elmnt
										if(ittest == 0){
											colcnt += "<div><ul class='ulleg'>";
										}						

										this.getOlMap().getLayers().forEach(function(grp) {
											grp.getLayersArray().forEach(function(layer) {
												var source = layer.getSource();
												var context = Ck.getMap().originOwc.data.id;
												if(source.getParams && source.updateParams) {
													var params = source.getParams();
													if(Ext.ComponentQuery.query('#format')[0].valueCollection.items.length !== 0){
														this.ratio = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.ratio;
													}else{
														this.ratio = 1;
													}
													if(layer.getProperties().id == context + ':equipement_all_exterieur'){
														params['RESOLUTION'] = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.id !== 'a4' ? 500 : 192;
													}else{
														params['RESOLUTION'] = 192;
													}
													params['WIDTH'] = params['WIDTH'] * this.ratio;
													params['HEIGHT'] = params['HEIGHT'] * this.ratio;
													source.updateParams(params);
												}
											})
										});

										//Get params
										if(this.getOlMap().getLayers().getArray()[1].getLayersArray()[2].getSource().getParams()['SQL_FILTER']){
											var str = "&SQL_FILTER=" + encodeURIComponent(this.getOlMap().getLayers().getArray()[1].getLayersArray()[0].getSource().getParams()['SQL_FILTER']);
											var params = str.replace(/'/g, "%27");
										}else{
											var params = "";
										}

										//Get number classes
										this.getClassLength(listlay2[t]);
										if(this.nbClass !== 1){
											url = Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + listlay2[t].get("id") + "&BBOX=" + Ck.getMap().getExtent()[0]  + "," + Ck.getMap().getExtent()[1]  + "," + Ck.getMap().getExtent()[2]  + "," + Ck.getMap().getExtent()[3] + "&SRS=EPSG:2154&WIDTH=15&HEIGHT=15&RESOLUTION=192" + params;
											colcnt += "<li><div class='ckPrint-legtitle' style='font-size:calc(14px*{value:ratio})'>"+laytemp.getTitle()+"</div><img class='ckPrint-legimg' style='width:calc(20px*{value:ratio})' src='"+ url + "'></li>";
										}else{
											url = Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + listlay2[t].get("id") + "&RULE=Defaut&SRS=EPSG:2154&WIDTH=15&HEIGHT=15&RESOLUTION=192";
											colcnt += "<li class='flex-container'><img class='ckPrint-legimg' style='width:calc(20px*{value:ratio})' src='"+ url + "'><div class='ckPrint-legtitle' style='font-size:calc(12px*{value:ratio})'>"+laytemp.getTitle()+"</div></li>";
										}

										//Iterate on column
										if(ittest == cntor){
											colcnt += "</ul></div>";
											ittest = 0;
											irgt = irgt + 120;
										}else{
											ittest = ittest + 1;
										}
									}
								}
							}
						}
					}
					//Si c'est un fond de plan (type raster par exemple)
					else{
						if(Ext.isFunction(listlay[i].getLayers)){
							listlay2 = listlay[i].getLayers().getArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										colcnt += "<li><div style='background: rgba(255, 255, 255, 0.83) no-repeat scroll left 0px;'></div><div class='ckPrint-legtitle'>"+laytemp.getTitle()+"</div></li>";
									}
								}
							}
						}
					}
				}
				colcnt += "</ul></div>";
				var targetleg = Ext.get("ckPrint-legend").dom;
				targetleg.innerHTML = colcnt;	
			}
			
			// Fix map size from web browser
			var mapWidth = (this.canvasSize[0]  / (window.ZOOMRATIO || window.devicePixelRatio || 1)) /* / 4.34 */;
			var mapHeight = (this.canvasSize[1]  / (window.ZOOMRATIO || window.devicePixelRatio || 1)) /* / 4.34 */;
			// Zoom on the desired extent
			var center = ol.extent.getCenter(this.feature.getGeometry().getExtent());
			//var res = this.get("printParam.resolution");
			//var mapSizeWidth = ol.extent.getWidth(this.feature.getGeometry().getExtent());
			//var mapSizeWidth = this.feature.getGeometry().getCoordinates()[0][0][0] - this.feature.getGeometry().getCoordinates()[0][1][0];
			
			var line = new ol.geom.LineString([this.feature.getGeometry().getCoordinates()[0][0], this.feature.getGeometry().getCoordinates()[0][1]]);
			var mapSizeWidth =  Math.round(line.getLength() * 100) / 100;

			var res = mapSizeWidth / this.canvasSize[0];

			this.getMap().setCenter(center);
			this.getMap().setResolution(res);
			this.getOlView().setRotation(Ext.ComponentQuery.query('#angle')[0].getValue() * -1);
			// Move map to invisible div to print with right resolution
			this.printDiv = dh.append(document.body, {
				tag: 'div',
				id: 'ckprint-div',
				style: {
					position: 'absolute',
					top: (screen.height) + "px", // Comment to display div
					width: mapWidth.toString() + "px",
					height: mapHeight.toString() + "px"
				}
			});
			this.getOlMap().setTarget(this.printDiv);



			// Remettre à la normale la vue
			//if (Ck.getMap().getLayerById(Ck.getMap().originOwc.data.id + ":equipement_all_exterieur") && this.get("printParam.equipementExt").__proto__.equipementExt == true) {
			//	Ck.getMap().getLayerById(Ck.getMap().originOwc.data.id + ":equipement_all_exterieur").setVisible(true);
			//}
			//this.getOlView().setRotation(Ext.ComponentQuery.query('#angle')[0].getValue());
			//this._olView.setRotation(Ext.ComponentQuery.query('#angle')[0].getValue() * -1);

			// Call print when all layers are drawed
			this.getMap().on('layersloaded', this.print, this, {
				single: true
			});
			this.getMap().redraw();

		}.bind(this));
		this.getOlMap().renderSync();
	},

	/**
	 * Once all layers loaded, create an image of map and integrate it into the HTML layout <br/>
	 * Launch an html2canvas to create a canvas of HTML layout
	 */
	print: function() {
		this.getOlMap().removeInteraction(this.previewLayerTransform);
		this.getOlMap().once('rendercomplete', function(event) {
			this.integratePrintValue();
			// refresh mapDiv after integratePrintValue
			this.mapDiv = Ext.get("ckPrint-map").dom;
			var mapCanvas = this.composeCanvas();

			var uri = mapCanvas.toDataURL('image/jpg', 1).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			var dh = Ext.DomHelper;
			this.mapImg = dh.append(this.mapDiv, {
				tag: 'img',
				src: uri
			});

			// Convert layout page to canvas
			html2canvas(this.pageDiv, {
				allowTaint: true
			}).then(function(canvas) {
			    this.finishPrinting(canvas);
			}.bind(this));
		}.bind(this));
		this.getOlMap().renderSync();
	},

	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	finishPrinting: function(canvas) {
		switch(this.get("printParam.outputFormat")) {
			case "jpg":
			case "png":
				var uri = canvas.toDataURL('image/' + this.get("printParam.outputFormat"), 1).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				// Pop the download prompt
				var downloadLink = document.createElement("a");
				downloadLink.href = uri;
				downloadLink.download = "map." + this.get("printParam.outputFormat");
				document.body.appendChild(downloadLink);
				downloadLink.click();
				document.body.removeChild(downloadLink);
				break;

			case "pdf":
				var pdf = new jsPDF({
					orientation: this.get("printParam.orientation").orientation,
					format: this.get("printParam.format") == 'a0' ? 'a1' : this.get("printParam.format"),
					unit: "cm"
				});
				var imgURL = canvas.toDataURL("image/png", 1);
				pdf.addImage({
					imageData: imgURL,
					format: 'png',
					x: 0,
					y: 0,
					w: this.pageSize[0],
					h: this.pageSize[1],
					compression: 'FAST'
				});
				pdf.save("map.pdf");
		}

		// Replace the map at the right place and remove temp div
		//this.printDiv.parentNode.removeChild(this.printDiv);
		this.mapDiv.removeChild(this.mapImg);

		// Reset center, resolution and preview
		this.previewLayer.setVisible(true);
		this.getOlMap().setTarget(this.mapTarget);
		this.getMap().setCenter(this.oldCenter);
		this.getMap().setResolution(this.oldRes);
		Ext.ComponentQuery.query('#angle')[0].setValue(0);

		//Ext.ComponentQuery.query('#resolution')[0].setValue(this.previewLayerTransform.res);

		// Delete fake image
		this.mapTarget.removeChild(this.fakeMap);
		delete this.feature;
		// Close print popup, clear preview
		this.cancel();
		this.mask.hide();
	},

	/**
	 * Loop on all this.printValue members and put the values in the layout
	 * AGA - 28/10/2020 - Update print params and insert filters params on template
	 */
	integratePrintValue: function() {
		this.printValue = this.getView().getForm().getValues();
		//this.printValue['title'] = Ext.ComponentQuery.query("#printTitle")[0].getValue();
		this.printValue['title'];
		this.printValue['date'] = new Date(Date.now()).toLocaleDateString();
		this.printValue['scale'] = "1 / " + Math.round(Ck.getMap().getScale());
		this.printValue['srs'] = Ck.getMap().getProjection().getCode();
		if(Ext.ComponentQuery.query('#format')[0].valueCollection.items.length !== 0){
			this.printValue['ratio'] = Ext.ComponentQuery.query('#format')[0].valueCollection.items[0].data.ratio;
		}else{
			this.printValue['ratio'] = 1;
		}

		//Rotate north arrow
		//Ext.get("northArrow").setStyle("transform", "rotate(" + Ext.ComponentQuery.query('#angle')[0].getValue() + "deg)");
		if (document.getElementById("northArrow")){
			document.getElementById("northArrow").style.transform = 'rotate(-' + Ext.ComponentQuery.query('#angle')[0].getValue()*100 + 'deg)';
		}

		if(Ext.ComponentQuery.query('[componentCls~=comboFilter]') !== 0){
			var comboFilters = Ext.ComponentQuery.query('[componentCls~=comboFilter]');
			this.mapDiv = Ext.get("ckPrint-filters-list").dom;
			var dh = Ext.DomHelper;
			dh.append(this.mapDiv, "<em><b>Filtres utilisés : </b></em>");
			comboFilters.forEach(function(combo,value){
				if(combo.getRawValue() !== "" && combo.getRawValue !== null && combo.getRawValue !== undefined){
					this.mapImg = dh.append(this.mapDiv, "<div class='ckPrint-logtitle' style='display:inline; margin-right:10px'><b>" + combo.getDisplayField() + "</b> : " + combo.getRawValue() +  " (" + combo.valueCollection.items[0].data.surface + "m²)</div>");
				}
			}, this)
			if(Ext.get("ckPrint-filters-list").dom.childElementCount == 1){
				Ext.destroy(Ext.get("ckPrint-filters-list"));
			}
		}
		this.addDefaultValues();

		// Do substitutions
		var layout = this.pageDiv.innerHTML;
		for(var key in this.printValue) {
			layout = layout.replaceAll("{value:" + key + "}", this.printValue[key]);
		}
		layout = layout.replaceAll(new RegExp("{value:staticsrc}", 'g') , "src");


		this.pageDiv.innerHTML = layout;
	},

	addDefaultValues: Ext.emptyFn,

	get: function(id) {
		return this.getViewModel().get(id);
	},

	set: function(id, value) {
		return this.getViewModel().set(id, value);
	},

	hidePreview: function () {
		this.previewLayer.setVisible(false);
	},
	
	showPreview: function() {
		this.updatePreview();
		this.getOlMap().addInteraction(this.previewLayerTransform);
		this.previewLayer.setVisible(true);
	},

	cancel: function() {
		//var rotInput = this.getView().items.get("rotate");
		//rotInput.setValue(0);
		delete this.feature;
/* 		if(this.previewLayerTransform.res){
			Ext.ComponentQuery.query('#resolution')[0].setValue(this.previewLayerTransform.res);
		} */
		//Reset init resolution after print
		this.getOlMap().getLayers().forEach(function(grp) {
			grp.getLayersArray().forEach(function(layer) {
				var source = layer.getSource();
				if(source.getParams && source.updateParams) {
					var params = source.getParams();
					params['RESOLUTION'] = 92;
					source.updateParams(params);
				}
			})
		});
		this._olView.setRotation(0);
		this.previewLayer.getSource().clear();
		this.getView().openner.close();
		Ext.ComponentQuery.query('#angle')[0].setValue(0);
		this.getOlMap().removeInteraction(this.previewLayerTransform);
	},

    rotate: function(point, angle, origin) {
        //angle *= Math.PI / 180;
		/* var radius = this.distance(point, origin); */
		var line = new ol.geom.LineString([point, origin]);
		var radius =  Math.round(line.getLength() * 100) / 100;
        var theta = angle + Math.atan2(point[1] - origin[1], point[0] - origin[0]);
        var x = origin[0] + (radius * Math.cos(theta));
        var y = origin[1] + (radius * Math.sin(theta));
        return [x, y];
    }
});
