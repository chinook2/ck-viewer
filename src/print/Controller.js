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
	
	getTransformEventFeature: function(e) {
		var feature;

		if (!e) {
			return this.feature || null;
		}
		if (e.feature) {
			return e.feature;
		}
		if (e.features && e.features.getLength && e.features.getLength()) {
			feature = e.features.item ? e.features.item(0) : null;
			if (feature) {
				return feature;
			}
			return e.features.getArray()[0];
		}
		return this.feature || null;
	},

	getTransformFeatureGeometry: function(e) {
		var feature = this.getTransformEventFeature(e);
		return feature ? feature.getGeometry() : null;
	},

	ckLoaded: function(map) {
		// Creation preview layer
		var startangle = 0;
		var d=[0,0];
		var ctrl = this;

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
		this.previewLayerTransform.on(['select'], function(e) {
			var geometry;
			if (firstPoint && e.features && e.features.getLength()) {
				geometry = ctrl.getTransformFeatureGeometry(e);
				if (geometry) {
					ctrl.previewLayerTransform.setCenter(geometry.getFirstCoordinate());
				}
			}
		}, ctrl);
	
		this.previewLayerTransform.on(['rotatestart', 'translatestart'], function(e) {
			var feature = ctrl.getTransformEventFeature(e);
			startangle = feature ? (feature.get('angle') || 0) : 0;
			d = [0, 0];
		}, ctrl);

		this.previewLayerTransform.on('rotating', function(e) {
			var feature = ctrl.getTransformEventFeature(e);
			if (feature) {
				feature.set('angle', startangle - e.angle);
			}
		}, ctrl);

		this.previewLayerTransform.on('translating', function(e) {
			var geometry;
			d[0] += e.delta[0];
			d[1] += e.delta[1];
			if (firstPoint) {
				geometry = ctrl.getTransformFeatureGeometry(e);
				if (geometry) {
					ctrl.previewLayerTransform.setCenter(geometry.getFirstCoordinate());
				}
			}
		}, ctrl);

		this.previewLayerTransform.on('scaling', function(e) {
			var geometry;
			if (firstPoint) {
				geometry = ctrl.getTransformFeatureGeometry(e);
				if (geometry) {
					ctrl.previewLayerTransform.setCenter(geometry.getFirstCoordinate());
				}
			}
		}, ctrl);

		this.previewLayerTransform.on('rotateend', function(e) {
			var feature = ctrl.getTransformEventFeature(e);
			var angleField;
			if (!feature) {
				return;
			}
			ctrl.printAngle = feature.get('angle');
			ctrl.set("printParam.angle", ctrl.printAngle);
			angleField = Ext.ComponentQuery.query('#angle')[0];
			if (angleField) {
				angleField.setValue(ctrl.printAngle);
			}
		}, ctrl);

		this.previewLayerTransform.on(['rotatestart', 'translatestart', 'scalestart'], function() {
			ctrl._previewTransformActive = true;
		}, ctrl);

		this.previewLayerTransform.on(['rotateend', 'translateend'], function() {
			ctrl._previewTransformActive = false;
		}, ctrl);

		this.previewLayerTransform.on('scaleend', function(e) {
			ctrl._previewTransformActive = false;
			var geometry = ctrl.getTransformFeatureGeometry(e);
			var zoomNavRatio = window.devicePixelRatio || 1;
			var canvasSize;
			var mapSizeWidth;
			var ckPrintMap;
			var res;
			var coords;

			if (!geometry) {
				return;
			}

			if (ctrl.fullPagePrintLayout) {
				canvasSize = ctrl.getOverlayMapAreaSize()[0] * zoomNavRatio;
			} else {
				ckPrintMap = Ext.get("ckPrint-map");
				canvasSize = ckPrintMap ? ckPrintMap.getWidth() : 0;
			}
			if (!canvasSize) {
				return;
			}

			coords = geometry.getCoordinates();
			if (coords && coords[0] && coords[0].length > 1) {
				mapSizeWidth = new ol.geom.LineString([coords[0][0], coords[0][1]]).getLength();
			} else {
				mapSizeWidth = ol.extent.getWidth(geometry.getExtent());
			}

			res = Math.abs(mapSizeWidth) * zoomNavRatio / canvasSize;
			ctrl.res = res;
			ctrl._previewScaled = true;
			ctrl._previewLayoutId = ctrl.getPrintLayoutId();
		}, ctrl);

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
			},
			"ckprint radiogroup#shape": {
				change: this.onPrintLayoutOptionChange
			},
			"ckprint radiogroup#orientation": {
				change: this.onPrintLayoutOptionChange
			}
		});
	},

	onPrintLayoutOptionChange: function() {
		this._previewScaled = false;
		if (this._previewParams) {
			this._previewParams.shape = this.getPrintShape();
			this._previewParams.orientation = this.getPrintOrientation();
		}
		this.updatePreview();
	},

	getPrintParamToken: function(paramName, key, fallback) {
		var value = this.get("printParam." + paramName);

		if (!value) {
			return fallback;
		}
		if (typeof value === "string") {
			return value;
		}
		if (value[key] !== undefined) {
			return value[key];
		}
		if (value.__proto__ && value.__proto__[key] !== undefined) {
			return value.__proto__[key];
		}
		return fallback;
	},

	destroy: function () {
		if (this.mask) {
			this.mask.destroy();
		}
		this.mask = null;
	},

	getPrintMaskTarget: function() {
		var mapCtrl = this.getMap();
		var view;

		if (mapCtrl && mapCtrl.getView) {
			view = mapCtrl.getView();
			if (view && (view.rendered || view.getEl())) {
				return view;
			}
		}

		var olMap = this.getOlMap();
		if (olMap && olMap.getTarget) {
			var target = olMap.getTarget();
			if (target) {
				return Ext.get(target);
			}
		}

		return Ext.getBody();
	},

	getPrintMask: function() {
		if (!this.mask) {
			this.mask = new Ext.LoadMask({
				msg: this.getMaskMsg(),
				target: this.getPrintMaskTarget()
			});
		}
		return this.mask;
	},

	releasePrintDialogFocus: function(btn) {
		var el;

		if (btn && btn.getEl) {
			el = btn.getEl().dom;
		} else if (btn && btn.nodeType === 1) {
			el = btn;
		}

		if (el && el.blur) {
			el.blur();
		}

		if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
			document.activeElement.blur();
		}

		this.focusPrintTarget();
	},

	focusPrintTarget: function() {
		var focusTarget = this.getPrintMaskTarget();
		var dom;

		if (focusTarget && focusTarget.el) {
			dom = focusTarget.el.dom;
		} else if (focusTarget && focusTarget.dom) {
			dom = focusTarget.dom;
		}

		if (dom && dom.focus) {
			if (!dom.hasAttribute('tabindex')) {
				dom.setAttribute('tabindex', '-1');
			}
			dom.focus({ preventScroll: true });
			return;
		}

		if (document.body && document.body.focus) {
			document.body.focus();
		}
	},

	hidePrintDialog: function() {
		var win = this.getView().up('window');
		if (win && !win.destroyed) {
			win.hide();
		}
	},

	ensurePreviewLayers: function() {
		if (!this.previewLayer && this.getMap()) {
			this.ckLoaded(this.getMap());
		}
	},

	/**
	 * Load resolutions list from OwsContext
	 */
	loadResolutions: function() {
		var data = this.getView().scales || this.getMap().originOwc.getScales();
		this.getStore("resolutions").loadData(data);
		
		this.set("printParam.resolution", this.getMap().getNearestResolution(this.getOlView().getResolution(), 1));
	},

	getLayoutStoreEntry: function(layoutId) {
		if (this.getStore("layouts").getById(layoutId)) {
			return this.getStore("layouts").getById(layoutId);
		}
		return this.getStore("layouts").getById(this.get("printParam.layout") || "default-layout");
	},

	getLayoutResourceBasePath: function(layoutId) {
		var oLay = this.getLayoutStoreEntry(layoutId);
		var pkg = oLay && oLay.get("packageName");
		return Ck.getPath(pkg || "ck-viewer") + "/print/";
	},

	getPrintShape: function() {
		return this.getPrintParamToken("shape", "shape", "r");
	},

	getPrintLayoutId: function() {
		var base = this.get("printParam.layout") || "default-layout";
		return base + "-" + this.getPrintOrientation() + "-" + this.getPrintShape();
	},

	/**
	 * Load corresponding json print layout
	 */
	loadHTML: function(layoutId) {
		Cks.get({
			url: this.getLayoutResourceBasePath(layoutId) + layoutId + ".html",
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
		var basePath = this.getLayoutResourceBasePath(layoutId);

		Cks.get({
			url: basePath + "print-hubim-layout.css",
			scope: this,
			success: function(baseResponse) {
				Cks.get({
					url: basePath + layoutId + ".css",
					scope: this,
					success: function(response) {
						this.style.innerHTML = baseResponse.responseText + "\n" + response.responseText;
						if (!this._previewScaled && !this._previewTransformActive) {
							this.updatePreview();
						}
					},
					failure: function() {
						this.style.innerHTML = baseResponse.responseText;
						if (!this._previewScaled && !this._previewTransformActive) {
							this.updatePreview();
						}
					}
				});
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
	onChangeValue: function(resolution, format, shape, orientation, equipementExt, dpi) {
		var prev = this._previewParams;
		var params = {
			resolution: resolution,
			format: format || this.get("printParam.format"),
			shape: this.getPrintShape(),
			orientation: this.getPrintOrientation(),
			equipementExt: this.getPrintParamToken("equipementExt", "equipementExt", "false"),
			dpi: dpi !== undefined ? dpi : this.get("printParam.dpi")
		};
		var layoutChanged = !prev
			|| params.format !== prev.format
			|| params.shape !== prev.shape
			|| params.orientation !== prev.orientation
			|| params.dpi !== prev.dpi
			|| params.equipementExt !== prev.equipementExt;

		this._previewParams = params;

		if (layoutChanged) {
			this._previewScaled = false;
			this.updatePreview();
			return;
		}
		if (this._previewScaled) {
			return;
		}
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
		var layoutId = this.getPrintLayoutId();
		var layoutHTML = this.layoutsHTML[layoutId];

		if(!Ext.isString(layoutHTML)) {
			this.loadHTML(layoutId);
			return false;
		}

		if (!this.previewLayer) {
			return false;
		}

		if (this._previewTransformActive) {
			return false;
		}

		if (this._previewScaled && this.feature) {
			var scaledFeatures = this.previewLayer.getSource().getFeatures().getArray();
			if (scaledFeatures.indexOf(this.feature) !== -1 && this._previewLayoutId === layoutId) {
				this.renderLayout(layoutHTML);
				return;
			}
			this._previewScaled = false;
		}

		this.loadResolutions();
		
		this.renderLayout(layoutHTML);
		
		var center = this.getMap().getOlView().getCenter();
		if(this.feature) {
			var featureGeometry = this.feature.getGeometry();
			if (featureGeometry) {
				center = ol.extent.getCenter(featureGeometry.getExtent());
			}
			this.previewLayer.getSource().clear();
		}
		//var rotation = this._olView.getRotation();
		var angleField = Ext.ComponentQuery.query('#angle')[0];
		var rotation = angleField ? angleField.getValue() : 0;
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
		this._previewLayoutId = layoutId;
	},

	isFullPagePrintLayout: function(layoutHTML) {
		return layoutHTML && layoutHTML.indexOf('id="ckPrint-param"') !== -1;
	},

	getLegendColumnFallbackWidth: function() {
		return 240;
	},

	/**
	 * Pre-SIEML overlay map slot (fixed inline #ckPrint-map px from default-layout-*.html).
	 * Independent of print DPI — used only for the orange preview on the live map.
	 */
	getOverlayMapAreaSize: function() {
		var orientation = this.getPrintOrientation();
		var shape = this.pageDiv && this.pageDiv.classList.contains("shape-c") ? "c" : "r";
		var sizes = {
			"p-r": [789, 1118],
			"p-c": [774, 825],
			"l-r": [1118, 789],
			"l-c": [774, 700]
		};
		var key = orientation + "-" + shape;
		var size = sizes[key] || sizes["p-r"];
		return [size[0], size[1]];
	},

	/**
	 * Map slot on the Hub'im print page (sidebar legend layout).
	 */
	getPrintMapAreaSize: function() {
		var pageW = this.pageDiv.offsetWidth;
		var pageH = this.pageDiv.offsetHeight;
		var orientation = this.getPrintOrientation();
		var top = orientation === "l" ? 98 : 105;
		var bottom = 100;
		var mapLeft = 262;
		var mapRight = 6;
		var w = pageW - mapLeft - mapRight;
		var h = pageH - top - bottom;

		if (this.pageDiv.classList.contains("shape-c") && w > 0) {
			h = w;
		}

		return [Math.max(w, 1), Math.max(h, 1)];
	},

	getMapAreaFallbackSize: function() {
		return this.getPrintMapAreaSize();
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

		this.fullPagePrintLayout = this.isFullPagePrintLayout(layoutHTML);

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
		if (this.getPrintOrientation() === "l") {
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
		var mapWidthPx;
		var mapHeightPx;
		var previewSize;
		var zoomNavRatio = window.devicePixelRatio || 1;
		var res = this.get("printParam.resolution");

		previewSize = this.getOverlayMapAreaSize();
		if (this.pageDiv.classList.contains("shape-c")) {
			previewSize[1] = previewSize[0];
		}

		// Orange preview on the live map (pre-SIEML: before ratio×2 print upscale)
		this.mapSize = [
			previewSize[0] * zoomNavRatio * res,
			previewSize[1] * zoomNavRatio * res
		];

		if (this.fullPagePrintLayout) {
			mapWidthPx = this.getPrintMapAreaSize()[0];
			mapHeightPx = this.getPrintMapAreaSize()[1];
			mapDiv.setWidth(mapWidthPx);
			mapDiv.setHeight(mapHeightPx);
			this.canvasSize = [mapWidthPx, mapHeightPx];
		} else {
			mapDiv.setWidth(previewSize[0] * zoomNavRatio);
			mapDiv.setHeight(previewSize[1] * zoomNavRatio);
			this.canvasSize = [mapDiv.getWidth(), mapDiv.getHeight()];

			mapDiv.setWidth(mapDiv.getWidth() * this.ratio * 2);
			mapDiv.setHeight(mapDiv.getHeight() * this.ratio * 2);
			this.canvasSize = [mapDiv.getWidth(), mapDiv.getHeight()];
		}
	},

	/**
	 * Check how the document will be print
	 */
	beforePrint: function(btn) {
		// Hide preview vector
		if (this.previewLayer) {
			this.previewLayer.setVisible(false);
		}

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
					});
					return false;
				}
				this.releasePrintDialogFocus(btn);
				this.hidePrintDialog();
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

	getHubimPrintTextLayerColorMap: function() {
		return {
			'locaux_all-4': '#1565C0',
			'locaux_all-2': '#2E7D32',
			'locaux_all-0': '#C62828',
			'locaux_all-1': '#6A1B9A',
			'description': '#1565C0',
			'types locaux': '#2E7D32',
			'codes locaux': '#C62828',
			'surfaces': '#6A1B9A'
		};
	},

	isHubimPrintTextLayerColorsEnabled: function() {
		return false;
	},

	getHubimPrintTextLayerKey: function(olLayer, ckLayer) {
		var layerId = olLayer.get('id') || '';
		var shortName = layerId.indexOf(':') >= 0 ? layerId.split(':').pop() : layerId;
		var match = shortName.match(/^locaux_all-([0124])(?:-\d+)?$/);
		var title;

		if (match) {
			return 'locaux_all-' + match[1];
		}

		title = ckLayer && Ext.isFunction(ckLayer.getTitle) ? ckLayer.getTitle() : '';
		return title ? title.toLowerCase() : null;
	},

	getHubimPrintTextLayerColor: function(olLayer, ckLayer) {
		var key = this.getHubimPrintTextLayerKey(olLayer, ckLayer);
		var colors;

		if (!this.isHubimPrintTextLayerColorsEnabled() || !key) {
			return null;
		}

		colors = this.getHubimPrintTextLayerColorMap();
		if (colors[key]) {
			return colors[key];
		}

		return colors[key.toLowerCase()] || null;
	},

	isHubimDefaultTextLayerColor: function(color) {
		var normalized;

		if (!color) {
			return true;
		}

		normalized = String(color).trim().toLowerCase().replace(/\s+/g, '');
		return normalized === '#000'
			|| normalized === '#000000'
			|| normalized === 'black'
			|| normalized === 'rgb(0,0,0)';
	},

	getTextLayerSldFillColor: function(sldContent) {
		var match = sldContent.match(/<sld:TextSymbolizer>[\s\S]*?<sld:CssParameter name="fill">([^<]+)<\/sld:CssParameter>/i);

		if (!match) {
			match = sldContent.match(/<TextSymbolizer>[\s\S]*?<CssParameter name="fill">([^<]+)<\/CssParameter>/i);
		}

		return match ? match[1].trim() : null;
	},

	replaceTextLayerSldFillColor: function(sldContent, newColor) {
		var updated = sldContent.replace(
			/(<sld:TextSymbolizer>[\s\S]*?<sld:CssParameter name="fill">)[^<]+(<\/sld:CssParameter>)/i,
			'$1' + newColor + '$2'
		);

		if (updated === sldContent) {
			updated = sldContent.replace(
				/(<TextSymbolizer>[\s\S]*?<CssParameter name="fill">)[^<]+(<\/CssParameter>)/i,
				'$1' + newColor + '$2'
			);
		}

		return updated;
	},

	forEachVisiblePrintLayer: function(callback) {
		var listlay = Ck.getMap().getLayers().getArray();
		var i, t, listlay2;

		for (i = 0; i < listlay.length; i++) {
			if (!this.isBasemapLayerGroup(listlay[i]) && Ext.isFunction(listlay[i].getLayersArray)) {
				listlay2 = listlay[i].getLayersArray();
				for (t = 0; t < listlay2.length; t++) {
					if (listlay2[t].ckLayer && listlay2[t].getVisible() === true) {
						callback(listlay2[t], listlay2[t].ckLayer);
					}
				}
			}
		}
	},

	saveHubimPrintTextLayerSldSession: function(layerId, sldContent) {
		var xhr = new XMLHttpRequest();

		try {
			xhr.open('POST', Ck.getApi() + 'service=sld&request=edit', false);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
			xhr.send(Ext.urlEncode({
				service: 'sld',
				request: 'edit',
				layer: layerId,
				sld: sldContent,
				mode: 'session'
			}));
			return xhr.status === 200;
		} catch (e) {
			return false;
		}
	},

	clearHubimPrintTextLayerSldSession: function(layerId) {
		var xhr = new XMLHttpRequest();

		try {
			xhr.open('POST', Ck.getApi() + 'service=sld&request=edit', false);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
			xhr.send(Ext.urlEncode({
				service: 'sld',
				request: 'edit',
				layer: layerId,
				sld: '',
				mode: 'session'
			}));
			return xhr.status === 200;
		} catch (e) {
			return false;
		}
	},

	getLegendBackgroundStyle: function(imageUrl) {
		if (!imageUrl) {
			return '';
		}

		return "background-image:url(" + imageUrl + ");"
			+ "background-repeat:no-repeat;"
			+ "background-position:center center;"
			+ "background-size:contain;";
	},

	refreshHubimPrintWmsLayers: function() {
		var refreshStamp = Date.now();

		this.getOlMap().getLayers().forEach(function(grp) {
			if (!Ext.isFunction(grp.getLayersArray)) {
				return;
			}

			grp.getLayersArray().forEach(function(layer) {
				var source = layer.getSource();

				if (source && source.getParams && source.updateParams) {
					var params = source.getParams();
					params['_hubimPrintRefresh'] = refreshStamp;
					source.updateParams(params);
				}
			});
		});
	},

	fetchSldContentSync: function(layerId) {
		var xhr = new XMLHttpRequest();

		try {
			xhr.open('GET', Ck.getApi() + "service=SLD&request=get&layers=" + encodeURIComponent(layerId), false);
			xhr.send(null);
			if (xhr.status === 200) {
				return xhr.responseText;
			}
		} catch (e) {
			return null;
		}

		return null;
	},

	applyHubimPrintTextLayerColors: function() {
		var scope = this;
		var sldContent, currentColor, modifiedSld;

		this._hubimPrintTextLayerColors = {};
		this._hubimPrintTextLayerIds = [];

		if (!this.isHubimPrintTextLayerColorsEnabled()) {
			return;
		}

		this.forEachVisiblePrintLayer(function(olLayer, ckLayer) {
			var printColor = scope.getHubimPrintTextLayerColor(olLayer, ckLayer);
			var layerId = olLayer.get('id');

			if (!printColor || !layerId) {
				return;
			}

			sldContent = scope.fetchSldContentSync(layerId);
			if (!sldContent || sldContent.indexOf('TextSymbolizer') < 0) {
				return;
			}

			currentColor = scope.getTextLayerSldFillColor(sldContent);
			if (!scope.isHubimDefaultTextLayerColor(currentColor)) {
				return;
			}

			modifiedSld = scope.replaceTextLayerSldFillColor(sldContent, printColor);
			if (modifiedSld === sldContent) {
				return;
			}

			if (!scope.saveHubimPrintTextLayerSldSession(layerId, modifiedSld)) {
				return;
			}

			scope._hubimPrintTextLayerColors[layerId] = printColor;
			if (scope._hubimPrintTextLayerIds.indexOf(layerId) < 0) {
				scope._hubimPrintTextLayerIds.push(layerId);
			}
		});

		this.refreshHubimPrintWmsLayers();
	},

	restoreHubimPrintTextLayerColors: function() {
		var scope = this;
		var i, layerId;

		if (this._hubimPrintTextLayerIds && this._hubimPrintTextLayerIds.length) {
			for (i = 0; i < this._hubimPrintTextLayerIds.length; i++) {
				layerId = this._hubimPrintTextLayerIds[i];
				scope.clearHubimPrintTextLayerSldSession(layerId);
			}
		}

		this._hubimPrintTextLayerIds = [];
		this._hubimPrintTextLayerColors = {};
		this.refreshHubimPrintWmsLayers();
		this.getMap().redraw();
	},

	getHubimPrintLegendTextColor: function(olLayer) {
		var layerId = olLayer.get('id');

		if (!this.isHubimPrintTextLayerColorsEnabled()) {
			return null;
		}

		if (this._hubimPrintTextLayerColors && this._hubimPrintTextLayerColors[layerId]) {
			return this._hubimPrintTextLayerColors[layerId];
		}

		return null;
	},

	parseXmlResponse: function(response) {
		var xml = response.responseXML;

		if (!xml || !xml.documentElement || xml.documentElement.nodeName === 'parsererror') {
			if (response.responseText) {
				xml = (new DOMParser()).parseFromString(response.responseText, 'text/xml');
			}
		}

		return xml;
	},

	getPrintExtent: function() {
		var map = this.getOlMap();

		if (map) {
			var size = map.getSize();
			var view = map.getView();

			if (size && view && size[0] > 0 && size[1] > 0) {
				var viewExtent = view.calculateExtent(size);
				if (viewExtent && viewExtent.length === 4 && isFinite(viewExtent[0])) {
					return viewExtent;
				}
			}
		}

		if (this.feature && this.feature.getGeometry()) {
			return this.feature.getGeometry().getExtent();
		}

		return Ck.getMap().getExtent();
	},

	getPrintScaleDenominator: function() {
		if (this.getMap && Ext.isFunction(this.getMap)) {
			var scale = this.getMap().getScale();
			if (scale && isFinite(scale)) {
				return Math.round(scale);
			}
		}
		return null;
	},

	getSldRuleFillColor: function(ruleNode) {
		var params = ruleNode.getElementsByTagNameNS('http://www.opengis.net/sld', 'CssParameter');
		var i, param, nameAttr, value;

		if (!params.length) {
			params = ruleNode.getElementsByTagName('CssParameter');
		}

		for (i = 0; i < params.length; i++) {
			param = params[i];
			nameAttr = param.getAttribute('name');
			if (nameAttr === 'fill') {
				value = param.textContent ? param.textContent.trim() : '';
				return this.sanitizeSldColor(value);
			}
		}

		return null;
	},

	sanitizeSldColor: function(color) {
		if (!color) {
			return null;
		}

		color = color.trim();
		if (/^#[0-9a-fA-F]{3,8}$/.test(color) || /^rgba?\([^)]+\)$/.test(color)) {
			return color;
		}

		return null;
	},

	ruleUsesPolygonFill: function(ruleNode) {
		return !!(ruleNode.getElementsByTagNameNS('http://www.opengis.net/sld', 'PolygonSymbolizer')[0]
			|| ruleNode.getElementsByTagName('PolygonSymbolizer')[0]);
	},

	getSldRules: function(layer) {
		var rules = [];
		var ogcNs = 'http://www.opengis.net/ogc';

		Cks.get({
			url: Ck.getApi() + "service=SLD&request=get&layers=" + layer.get("id"),
			scope: this,
			async: false,
			success: function(response) {
				var xml = this.parseXmlResponse(response);
				var ruleNodes = xml && xml.getElementsByTagNameNS('http://www.opengis.net/sld', 'Rule');
				var ns = 'http://www.opengis.net/sld';
				var i, ruleNode, nameEl, titleEl, filterEl, propEl, literalEl, wknEl, minScaleEl, maxScaleEl;
				var name, title, filterProperty, filterValue, symbolShape, minScale, maxScale, fillColor, isPolygonFill;

				if (!ruleNodes || !ruleNodes.length) {
					ruleNodes = xml ? xml.getElementsByTagName('Rule') : [];
				}

				for (i = 0; i < ruleNodes.length; i++) {
					ruleNode = ruleNodes[i];
					nameEl = ruleNode.getElementsByTagNameNS(ns, 'Name')[0] || ruleNode.getElementsByTagName('Name')[0];
					titleEl = ruleNode.getElementsByTagNameNS(ns, 'Title')[0] || ruleNode.getElementsByTagName('Title')[0];
					filterEl = ruleNode.getElementsByTagNameNS(ogcNs, 'Filter')[0]
						|| ruleNode.getElementsByTagNameNS(ns, 'Filter')[0]
						|| ruleNode.getElementsByTagName('Filter')[0];
					propEl = filterEl && (filterEl.getElementsByTagNameNS(ogcNs, 'PropertyName')[0] || filterEl.getElementsByTagName('PropertyName')[0]);
					literalEl = filterEl && (filterEl.getElementsByTagNameNS(ogcNs, 'Literal')[0] || filterEl.getElementsByTagName('Literal')[0]);
					wknEl = ruleNode.getElementsByTagNameNS(ns, 'WellKnownName')[0] || ruleNode.getElementsByTagName('WellKnownName')[0];
					minScaleEl = ruleNode.getElementsByTagNameNS(ns, 'MinScaleDenominator')[0] || ruleNode.getElementsByTagName('MinScaleDenominator')[0];
					maxScaleEl = ruleNode.getElementsByTagNameNS(ns, 'MaxScaleDenominator')[0] || ruleNode.getElementsByTagName('MaxScaleDenominator')[0];
					name = nameEl && nameEl.textContent ? nameEl.textContent : 'Defaut';
					title = titleEl && titleEl.textContent ? titleEl.textContent : name;
					filterProperty = propEl && propEl.textContent ? propEl.textContent.trim() : null;
					filterValue = literalEl && literalEl.textContent ? literalEl.textContent.trim() : title;
					symbolShape = wknEl && wknEl.textContent ? wknEl.textContent.trim().toLowerCase() : 'square';
					minScale = minScaleEl && minScaleEl.textContent ? parseFloat(minScaleEl.textContent) : null;
					maxScale = maxScaleEl && maxScaleEl.textContent ? parseFloat(maxScaleEl.textContent) : null;
					isPolygonFill = this.ruleUsesPolygonFill(ruleNode);
					fillColor = isPolygonFill ? this.getSldRuleFillColor(ruleNode) : null;
					rules.push({
						name: name,
						title: title,
						filterProperty: filterProperty,
						filterValue: filterValue,
						symbolShape: symbolShape,
						isPolygonFill: isPolygonFill,
						fillColor: fillColor,
						minScale: minScale,
						maxScale: maxScale
					});
				}
			},
			failure: function() {
				Ck.error('Error reading SLD rules !');
			}
		});

		this.nbClass = rules.length || 1;
		return rules;
	},

	getLayerSqlQueryParam: function(layer) {
		var source = layer.getSource();
		if (!source || !source.getParams) {
			return "";
		}

		var params = source.getParams();
		var sqlFilter = params['SQL_FILTER'] || params['sql_query'] || params['sql_filter'];

		if (!sqlFilter) {
			return "";
		}

		return "&sql_query=" + encodeURIComponent(sqlFilter);
	},

	getVisibleClassificationValues: function(layer, propertyName) {
		var result = {
			values: {},
			queried: false
		};
		var extent = this.getPrintExtent();
		var layerId = layer.get("id");
		var typename = layerId.indexOf(':') >= 0 ? layerId.split(':')[1] : layerId;
		var url = Ck.getApi() + "service=wfs&request=GetFeature"
			+ "&layers=" + encodeURIComponent(layerId)
			+ "&typename=" + encodeURIComponent(typename)
			+ "&SRS=EPSG:2154"
			+ "&BBOX=" + extent.join(",")
			+ "&maxfeatures=5000"
			+ "&outputformat=GML2"
			+ this.getLayerSqlQueryParam(layer);

		Cks.get({
			url: url,
			scope: this,
			async: false,
			success: function(response) {
				var xml = this.parseXmlResponse(response);
				var all, j, node, localName, value, propertyKey;

				result.queried = true;

				if (!xml || !propertyName) {
					return;
				}

				propertyKey = propertyName.indexOf(':') >= 0 ? propertyName.split(':').pop() : propertyName;
				all = xml.getElementsByTagName('*');
				for (j = 0; j < all.length; j++) {
					node = all[j];
					localName = node.localName || (node.nodeName ? node.nodeName.split(':').pop() : '');
					if (localName === propertyKey) {
						value = node.textContent ? node.textContent.trim() : '';
						if (value) {
							result.values[value] = true;
						}
					}
				}
			}
		});

		return result;
	},

	ruleMatchesVisibleValues: function(rule, visibleValues) {
		if (visibleValues[rule.filterValue] || visibleValues[rule.title]) {
			return true;
		}

		var key;
		for (key in visibleValues) {
			if (visibleValues.hasOwnProperty(key)) {
				if (key.toLowerCase() === rule.filterValue.toLowerCase()
					|| key.toLowerCase() === rule.title.toLowerCase()) {
					return true;
				}
			}
		}
		return false;
	},

	ruleIsVisibleAtScale: function(rule, scale) {
		if (!scale) {
			return true;
		}
		if (rule.minScale != null && scale < rule.minScale) {
			return false;
		}
		if (rule.maxScale != null && scale > rule.maxScale) {
			return false;
		}
		return true;
	},

	filterVisibleRules: function(layer, rules) {
		if (!rules || rules.length <= 1) {
			return rules || [];
		}

		var propertyName = null;
		var scale = this.getPrintScaleDenominator();
		var visibleData, visibleValues, visible = [];
		var i, rule;

		for (i = 0; i < rules.length; i++) {
			if (rules[i].filterProperty) {
				propertyName = rules[i].filterProperty;
				break;
			}
		}

		if (!propertyName) {
			return rules;
		}

		visibleData = this.getVisibleClassificationValues(layer, propertyName);
		visibleValues = visibleData.values;

		if (visibleData.queried && Ext.Object.isEmpty(visibleValues)) {
			return [];
		}

		for (i = 0; i < rules.length; i++) {
			rule = rules[i];
			if (!this.ruleIsVisibleAtScale(rule, scale)) {
				continue;
			}
			if (this.ruleMatchesVisibleValues(rule, visibleValues)) {
				visible.push(rule);
			}
		}

		return visible;
	},

	getPrintOrientation: function() {
		return this.getPrintParamToken("orientation", "orientation", "p");
	},

	getPrintRatio: function() {
		var formatField = Ext.ComponentQuery.query('#format')[0];
		if (formatField && formatField.valueCollection.items.length !== 0) {
			return formatField.valueCollection.items[0].data.ratio;
		}
		return 1;
	},

	getPrintWmsResolution: function(layerId) {
		var printDpi = parseInt(this.get('printParam.dpi'), 10) || 192;
		var context = Ck.getMap().originOwc.data.id;
		var formatField = Ext.ComponentQuery.query('#format')[0];
		var formatId;

		if (layerId === context + ':equipement_all_exterieur'
			&& formatField
			&& formatField.valueCollection.items.length !== 0) {
			formatId = formatField.valueCollection.items[0].data.id;
			if (formatId !== 'a4') {
				return Math.max(500, printDpi);
			}
		}

		return printDpi;
	},

	updateLayerResolutionForPrint: function() {
		var formatField = Ext.ComponentQuery.query('#format')[0];
		var scope = this;
		var ratio;
		var fullPagePrintLayout;

		if (!formatField || formatField.valueCollection.items.length === 0) {
			return;
		}

		ratio = this.getPrintRatio();
		fullPagePrintLayout = this.fullPagePrintLayout;

		this.getOlMap().getLayers().forEach(function(grp) {
			grp.getLayersArray().forEach(function(layer) {
				var source = layer.getSource();
				var params;

				if (source.getParams && source.updateParams) {
					params = source.getParams();
					params['RESOLUTION'] = scope.getPrintWmsResolution(layer.getProperties().id);
					if (!fullPagePrintLayout) {
						params['WIDTH'] = params['WIDTH'] * ratio;
						params['HEIGHT'] = params['HEIGHT'] * ratio;
					}
					source.updateParams(params);
				}
			});
		});
	},

	getLayerSqlFilterParam: function(layer) {
		var source = layer.getSource();
		if (source && source.getParams) {
			var params = source.getParams();
			if (params['SQL_FILTER']) {
				return "&SQL_FILTER=" + encodeURIComponent(params['SQL_FILTER']).replace(/'/g, "%27");
			}
		}
		return "";
	},

	getLegendResolution: function(layer) {
		return this.getPrintWmsResolution(layer.get('id'));
	},

	getLegendGraphicUrl: function(layer, ruleName, rule) {
		var sqlFilter = this.getLayerSqlFilterParam(layer);
		var legendRule = ruleName || 'Defaut';
		var iconWidth = 26;
		var iconHeight = 26;

		if (rule && rule.isPolygonFill) {
			iconWidth = 30;
			iconHeight = 15;
		}

		var url = Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + layer.get("id")
			+ "&FORMAT=image/png&TRANSPARENT=true"
			+ "&SRS=EPSG:2154&RESOLUTION=" + this.getLegendResolution(layer) + sqlFilter;

		return url + "&RULE=" + encodeURIComponent(legendRule) + "&WIDTH=" + iconWidth + "&HEIGHT=" + iconHeight;
	},

	getLegendIconClass: function(rule) {
		if (!rule || !rule.symbolShape) {
			return 'ckPrint-legicon-point';
		}

		if (rule.symbolShape === 'circle') {
			return 'ckPrint-legicon-circle';
		}
		if (rule.symbolShape === 'triangle') {
			return 'ckPrint-legicon-triangle';
		}

		return 'ckPrint-legicon-point';
	},

	buildMultiClassIconHtml: function(rule, olLayer) {
		var url = this.getLegendGraphicUrl(olLayer, rule.name, rule);

		if (rule.isPolygonFill) {
			return "<div class='ckPrint-legimg ckPrint-legchild-swatch' style='"
				+ this.getLegendBackgroundStyle(url) + "'></div>";
		}

		var iconClass = this.getLegendIconClass(rule);

		return "<img class='ckPrint-legicon-img " + iconClass + "' src='"
			+ Ext.String.htmlEncode(url) + "' width='26' height='26' alt='' />";
	},

	getMultiClassChildrenColumnClass: function(rulesCount) {
		if (rulesCount > 30) {
			return 'ckPrint-legchildren-cols-3';
		}
		if (rulesCount > 10) {
			return 'ckPrint-legchildren-cols-2';
		}
		return '';
	},

	appendMultiClassLegend: function(state, olLayer, ckLayer, rules) {
		if (!rules.length) {
			return;
		}

		if (state.ittest === 0) {
			state.colcnt += "<div class='ckPrint-legend-col'><ul class='ulleg'>";
		}

		var safeTitle = Ext.String.htmlEncode(ckLayer.getTitle());
		var childrenHtml = '';
		var childrenClass = this.getMultiClassChildrenColumnClass(rules.length);
		var i, rule;

		for (i = 0; i < rules.length; i++) {
			rule = rules[i];
			childrenHtml += "<li class='ckPrint-legchild'>" + this.buildMultiClassIconHtml(rule, olLayer)
				+ "<div class='ckPrint-legtitle'>" + Ext.String.htmlEncode(rule.title.toLowerCase()) + "</div></li>";
		}

		state.colcnt += "<li class='ckPrint-leggroup'><div class='ckPrint-legparent'><div class='ckPrint-legimg ckPrint-legimg-spacer'></div>"
			+ "<div class='ckPrint-legtitle'>" + safeTitle + "</div></div>"
			+ "<ul class='ckPrint-legchildren" + (childrenClass ? " " + childrenClass : "") + "'>" + childrenHtml + "</ul></li>";

		if (state.ittest === state.cntor) {
			state.colcnt += "</ul></div>";
			state.ittest = 0;
		} else {
			state.ittest = state.ittest + 1;
		}
	},

	appendLegendEntry: function(state, title, imageUrl, legendTextColor) {
		if (state.ittest === 0) {
			state.colcnt += "<div class='ckPrint-legend-col'><ul class='ulleg'>";
		}

		var safeTitle = Ext.String.htmlEncode(title);
		var imgStyle = this.getLegendBackgroundStyle(imageUrl);
		var iconExtraStyle = '';
		var titleStyle = '';
		var iconHtml;

		if (legendTextColor) {
			titleStyle = " style='color:" + legendTextColor + " !important;'";
			if (!imageUrl) {
				iconExtraStyle = "background-color:" + legendTextColor + "; border-radius:50%;";
			}
		}

		if (imageUrl) {
			iconHtml = "<img class='ckPrint-legicon-img ckPrint-legtext-icon' src='" + Ext.String.htmlEncode(imageUrl) + "' width='22' height='22' alt='' />";
		} else {
			iconHtml = "<div class='ckPrint-legimg ckPrint-legtext-icon' style='" + imgStyle + iconExtraStyle + "'></div>";
		}

		state.colcnt += "<li class='ckPrint-legentry'>" + iconHtml
			+ "<div class='ckPrint-legtitle ckPrint-legtext-title'" + titleStyle + ">" + safeTitle + "</div></li>";

		if (state.ittest === state.cntor) {
			state.colcnt += "</ul></div>";
			state.ittest = 0;
		} else {
			state.ittest = state.ittest + 1;
		}
	},

	appendLayerLegend: function(state, olLayer, ckLayer) {
		var rules = this.getSldRules(olLayer);
		var visibleRules, url;

		if (rules.length > 1) {
			visibleRules = this.filterVisibleRules(olLayer, rules);
			this.appendMultiClassLegend(state, olLayer, ckLayer, visibleRules);
			return;
		}

		url = this.getLegendGraphicUrl(olLayer, rules.length === 1 ? rules[0].name : 'Defaut', rules.length === 1 ? rules[0] : null);
		this.appendLegendEntry(state, ckLayer.getTitle(), url, this.getHubimPrintLegendTextColor(olLayer));
	},

	isBasemapLayerGroup: function(layerGroup) {
		var title = layerGroup.values_ && layerGroup.values_.title;
		return title === 'Photo aérienne' || title === 'OpenStreetMap';
	},

	createLegendState: function(orientation) {
		return {
			orientation: orientation,
			cntor: orientation === "p" ? 8 : 48,
			colWidth: orientation === "p" ? 215 : 180,
			colcnt: "",
			ittest: 0,
			irgt: 0
		};
	},

	closeLegendState: function(state) {
		if (state.ittest > 0) {
			state.colcnt += "</ul></div>";
		}
		return "<div class='ckPrint-legend-backdrop'></div><div class='ckPrint-legend-cols'>" + state.colcnt + "</div>";
	},

	fitLegendPanel: function() {
		var legendEl = Ext.get('ckPrint-legend');
		var mapEl = Ext.get('ckPrint-map');
		var pageEl = Ext.get('ckPrint-page');
		if (!legendEl) {
			return;
		}

		var filtersEl = Ext.get('ckPrint-filters');
		var panelBottom = '100px';
		if (!filtersEl || filtersEl.dom.style.display === 'none') {
			panelBottom = '13px';
		}
		legendEl.setStyle('bottom', panelBottom);

		var cols = legendEl.dom.querySelector('.ckPrint-legend-cols');
		if (!cols) {
			return;
		}

		var legendLeft = 12;
		var paddingRight = 10;
		var gap = 10;
		var contentWidth = cols.scrollWidth;
		var pageWidth = pageEl ? pageEl.getWidth() : 0;
		var maxWidth = pageWidth > 0 ? Math.floor(pageWidth * 0.45) : contentWidth;
		var legendWidth = Math.min(Math.max(contentWidth, 180), maxWidth) + paddingRight;

		legendEl.setStyle({
			width: legendWidth + 'px',
			paddingRight: paddingRight + 'px',
			boxSizing: 'border-box'
		});

		if (mapEl) {
			mapEl.setStyle('left', (legendLeft + legendWidth + gap) + 'px');
		}
	},

	waitForLegendAssets: function(callback) {
		var legendEl = Ext.get('ckPrint-legend');
		if (!legendEl) {
			callback();
			return;
		}

		var urls = [];
		var imgs = legendEl.dom.querySelectorAll('img');
		var i;

		for (i = 0; i < imgs.length; i++) {
			if (imgs[i].src) {
				urls.push(imgs[i].src);
			}
		}

		var legImgs = legendEl.dom.querySelectorAll('.ckPrint-legimg[style*="url("]');
		for (i = 0; i < legImgs.length; i++) {
			var match = legImgs[i].getAttribute('style').match(/url\(["']?([^"')]+)["']?\)/);
			if (match && match[1]) {
				urls.push(match[1]);
			}
		}

		if (!urls.length) {
			callback();
			return;
		}

		var pending = urls.length;
		var finish = function() {
			pending--;
			if (pending <= 0) {
				Ext.defer(callback, 50);
			}
		};

		for (i = 0; i < urls.length; i++) {
			var img = new Image();
			img.onload = finish;
			img.onerror = finish;
			img.src = urls[i];
		}
	},

	buildLegendHtml: function() {
		var orientation = this.getPrintOrientation();
		var state = this.createLegendState(orientation);
		var listlay = Ck.getMap().getLayers().getArray();
		var i, t, listlay2, laytemp;

		for (i = 0; i < listlay.length; i++) {
			if (!this.isBasemapLayerGroup(listlay[i]) && Ext.isFunction(listlay[i].getLayersArray)) {
				listlay2 = listlay[i].getLayersArray();
				for (t = 0; t < listlay2.length; t++) {
					if (listlay2[t].ckLayer && listlay2[t].getVisible() === true) {
						laytemp = listlay2[t].ckLayer;
						this.appendLayerLegend(state, listlay2[t], laytemp);
					}
				}
			} else if (this.isBasemapLayerGroup(listlay[i]) && Ext.isFunction(listlay[i].getLayers)) {
				listlay2 = listlay[i].getLayers().getArray();
				for (t = 0; t < listlay2.length; t++) {
					if (listlay2[t].ckLayer && listlay2[t].getVisible() === true) {
						laytemp = listlay2[t].ckLayer;
						this.appendLegendEntry(state, laytemp.getTitle(), null);
					}
				}
			}
		}

		return this.closeLegendState(state);
	},

	getLayerAttribution: function(olLayer) {
		var ext = olLayer.get("extension");
		if (ext && ext.attribution) {
			return ext.attribution;
		}
		if (olLayer.ckLayer && Ext.isFunction(olLayer.ckLayer.getExtension)) {
			return olLayer.ckLayer.getExtension("attribution") || "";
		}
		return "";
	},

	buildAttributionHtml: function() {
		var strlstcpr = "";
		var listlay = this.getOlMap().getLayers().getArray();
		var i, t, listlay2, attribution;

		for (i = 0; i < listlay.length; i++) {
			if (Ext.isFunction(listlay[i].getLayersArray)) {
				listlay2 = listlay[i].getLayersArray();
			} else if (Ext.isFunction(listlay[i].getLayers)) {
				listlay2 = listlay[i].getLayers().getArray();
			} else {
				continue;
			}
			for (t = 0; t < listlay2.length; t++) {
				if (listlay2[t].ckLayer && listlay2[t].getVisible() === true) {
					attribution = this.getLayerAttribution(listlay2[t]);
					if (attribution) {
						if (strlstcpr !== "") {
							strlstcpr += ", ";
						}
						strlstcpr += attribution;
						return strlstcpr;
					}
				}
			}
		}
		return strlstcpr;
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
		if(!this.canvasSize || !this.canvasSize[0] || !this.canvasSize[1]) {
			if (this.mask) {
				this.mask.hide();
			}
			Ck.error('Print map size is invalid');
			return;
		}
		this.getPrintMask().show();
		this.getOlMap().once('rendercomplete', function() {
			// First display fake map on the screen during the real print
			var mapCanvas = this.composeCanvas();
			var uri = mapCanvas.toDataURL('image/png').replace(/^data:image\/[^;]/, 'data:application/octet-stream');

			var dh = Ext.DomHelper;

			// Create the img element and add over map
			this.fakeMap = dh.append(this.mapTarget, {
				tag: 'img',
				src: uri,
				style: 'width=' + mapCanvas.width + ';height=' + mapCanvas.width
			});

			this.updateLayerResolutionForPrint();

			var dpr = window.ZOOMRATIO || window.devicePixelRatio || 1;
			var mapWidth;
			var mapHeight;
			if (this.fullPagePrintLayout) {
				mapWidth = this.canvasSize[0];
				mapHeight = this.canvasSize[1];
			} else {
				mapWidth = this.canvasSize[0] / dpr;
				mapHeight = this.canvasSize[1] / dpr;
			}
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
			this.getOlMap().updateSize();
			this.applyHubimPrintTextLayerColors();

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
			this._printLayersTimeout = setTimeout(function() {
				this.getMap().un('layersloaded', this.print, this);
				this.print();
			}.bind(this), 90000);
			this.getMap().redraw();

		}.bind(this));
		this.getOlMap().renderSync();
	},

	/**
	 * Once all layers loaded, create an image of map and integrate it into the HTML layout <br/>
	 * Launch an html2canvas to create a canvas of HTML layout
	 */
	print: function() {
		if (this._printLayersTimeout) {
			clearTimeout(this._printLayersTimeout);
			this._printLayersTimeout = null;
		}

		this.getOlMap().removeInteraction(this.previewLayerTransform);
		this.getOlMap().once('rendercomplete', function(event) {
			var finalizePrint = function() {
				var cprTarget = Ext.get("ckPrint-cpr");
				if (cprTarget) {
					cprTarget.dom.innerHTML = this.buildAttributionHtml();
				}

				this.integratePrintValue();
				this.fitLegendPanel();
				// refresh mapDiv after integratePrintValue
				this.mapDiv = Ext.get("ckPrint-map").dom;
				var mapCanvas = this.composeCanvas();

				var uri = mapCanvas.toDataURL('image/png').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				var dh = Ext.DomHelper;
				this.mapImg = dh.append(this.mapDiv, {
					tag: 'img',
					src: uri,
					width: mapCanvas.width,
					height: mapCanvas.height
				});

				if (this.get("printParam.outputFormat") === "html") {
					this.finishPrintingHtml();
					return;
				}

				// Convert layout page to canvas
				html2canvas(this.pageDiv, {
					allowTaint: true
				}).then(function(canvas) {
					this.finishPrinting(canvas);
				}.bind(this));
			}.bind(this);

			var legendTarget = Ext.get('ckPrint-legend');
			if (legendTarget) {
				legendTarget.dom.style.display = "block";
				legendTarget.dom.innerHTML = this.buildLegendHtml();
				this.waitForLegendAssets(finalizePrint);
			} else {
				finalizePrint();
			}
		}.bind(this));
		this.getOlMap().renderSync();
	},

	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	downloadBlob: function(blob, filename) {
		var url = URL.createObjectURL(blob);
		var downloadLink = document.createElement("a");

		downloadLink.href = url;
		downloadLink.download = filename;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		URL.revokeObjectURL(url);
	},

	downloadCanvasImage: function(canvas, format) {
		var mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
		var extension = format === "jpg" || format === "jpeg" ? "jpg" : "png";
		var quality = mimeType === "image/jpeg" ? 0.92 : undefined;

		if (canvas.toBlob) {
			canvas.toBlob(function(blob) {
				if (blob) {
					this.downloadBlob(blob, "map." + extension);
					return;
				}
				this.downloadCanvasDataUrl(canvas, mimeType, extension, quality);
			}.bind(this), mimeType, quality);
			return;
		}

		this.downloadCanvasDataUrl(canvas, mimeType, extension, quality);
	},

	downloadCanvasDataUrl: function(canvas, mimeType, extension, quality) {
		var uri = canvas.toDataURL(mimeType, quality);
		var downloadLink = document.createElement("a");

		downloadLink.href = uri;
		downloadLink.download = "map." + extension;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
	},

	buildPrintHtmlDocument: function() {
		var css = this.style ? this.style.innerHTML : "";

		return "<!DOCTYPE html>\n<html>\n<head>\n"
			+ "<meta charset=\"UTF-8\">\n"
			+ "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
			+ "<title>" + Ext.String.htmlEncode(this.printValue.title || "map") + "</title>\n"
			+ "<style>\n" + css + "\n</style>\n"
			+ "</head>\n<body>\n"
			+ this.pageDiv.outerHTML + "\n"
			+ "</body>\n</html>";
	},

	finishPrintingHtml: function() {
		var html = this.buildPrintHtmlDocument();
		var blob = new Blob([html], { type: "text/html;charset=utf-8" });

		this.downloadBlob(blob, "map.html");
		this.resetAfterPrint();
	},

	resetAfterPrint: function() {
		this.restoreHubimPrintTextLayerColors();
		if (this.mapImg && this.mapDiv) {
			this.mapDiv.removeChild(this.mapImg);
		}

		if (this.previewLayer) {
			this.previewLayer.setVisible(true);
		}
		this.getOlMap().setTarget(this.mapTarget);
		this.getMap().setCenter(this.oldCenter);
		this.getMap().setResolution(this.oldRes);
		var angleField = Ext.ComponentQuery.query('#angle')[0];
		if (angleField) {
			angleField.setValue(0);
		}

		if (this.fakeMap && this.mapTarget) {
			this.mapTarget.removeChild(this.fakeMap);
		}
		delete this.feature;
		if (this._printLayersTimeout) {
			clearTimeout(this._printLayersTimeout);
			this._printLayersTimeout = null;
		}
		this.cancel();
		if (this.mask) {
			this.mask.hide();
		}
	},

	finishPrinting: function(canvas) {
		switch(this.get("printParam.outputFormat")) {
			case "jpg":
			case "jpeg":
				this.downloadCanvasImage(canvas, "jpg");
				break;
			case "png":
				this.downloadCanvasImage(canvas, "png");
				break;

			case "pdf":
				var pdf = new jsPDF({
					orientation: this.getPrintOrientation(),
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
				break;

			case "html":
				this.finishPrintingHtml();
				return;

			default:
				Ck.error("Unsupported print output format: " + this.get("printParam.outputFormat"));
		}

		this.resetAfterPrint();
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

		if(Ext.ComponentQuery.query('[componentCls~=comboFilter]').length !== 0){
			var comboFilters = Ext.ComponentQuery.query('[componentCls~=comboFilter]');
			var filtersDiv = Ext.get("ckPrint-filters-list");
			if (filtersDiv) {
				this.mapDiv = filtersDiv.dom;
				var dh = Ext.DomHelper;
				dh.append(this.mapDiv, "<em><b>Filtres utilisés : </b></em>");
				comboFilters.forEach(function(combo){
					if(combo.getRawValue() !== "" && combo.getRawValue !== null && combo.getRawValue !== undefined){
						dh.append(this.mapDiv, "<div class='ckPrint-logtitle' style='display:inline; margin-right:10px'><b>" + combo.getDisplayField() + "</b> : " + combo.getRawValue() +  " (" + combo.valueCollection.items[0].data.surface + "m²)</div>");
					}
				}, this);
				if(filtersDiv.dom.childElementCount == 1){
					var filtersSection = Ext.get("ckPrint-filters");
					if (filtersSection) {
						filtersSection.setStyle("display", "none");
						var mapEl = Ext.get("ckPrint-map");
						if (mapEl) {
							mapEl.setStyle("bottom", "13px");
						}
					}
				}
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
		if (this.previewLayer) {
			this.previewLayer.setVisible(false);
		}
	},
	
	showPreview: function() {
		this.ensurePreviewLayers();
		this._previewScaled = false;
		this.updatePreview();
		if (this.previewLayerTransform && this.getOlMap()) {
			this.getOlMap().addInteraction(this.previewLayerTransform);
		}
		if (this.previewLayer) {
			this.previewLayer.setVisible(true);
		}
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
		if (this.previewLayer) {
			this.previewLayer.getSource().clear();
		}
		this.getView().openner.close();
		var angleField = Ext.ComponentQuery.query('#angle')[0];
		if (angleField) {
			angleField.setValue(0);
		}
		if (this.previewLayerTransform && this.getOlMap()) {
			this.getOlMap().removeInteraction(this.previewLayerTransform);
		}
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
