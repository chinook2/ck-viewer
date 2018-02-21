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

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		this.callParent(arguments);

		this.loadResolutions();

		// Creation preview layer
		this.previewLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: this.get("previewParam.fill.color") || 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: this.get("previewParam.stroke.color") || '#ffcc33',
					width: this.get("previewParam.stroke.width") || 1
				})
			})
		});
		this.getMap().addSpecialLayer(this.previewLayer);

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
		this.moveInteraction = new ol.interaction.Translate({
			features: new ol.Collection([])
		});
		this.getOlMap().addInteraction(this.moveInteraction);
		
		// Hide layout combo if they are only 1 layout
		this.getView().items.get("printLayout").setVisible(this.getStore("layouts").getCount() > 1);

		// Create the mask
		this.mask = new Ext.LoadMask({
			msg: this.getMaskMsg(),
			target: this.getMap().getView()
		});
	},

	destroy: function () {
		this.mask = null;
	},

	/**
	 * Load resolutions list from OwsContext
	 */
	loadResolutions: function() {
		var data = this.getMap().originOwc.getScales();

		this.getStore("resolutions").loadData(data);
		
		if(this.get("printParam.resolution") == null) {
			this.set("printParam.resolution", this.getMap().getNearestResolution(this.getOlView().getResolution(), 1));
		}
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
	changeValue: function(field, newValue, oldValue, opts) {
		if(opts.firstCall !== false) {
			opts.firstCall = false;
		} else {
			this.set("printParam." + field.itemId, newValue);
			this.updatePreview();
		}
	},
	
	/**
	 * Update the preview feature from layout, format and orientation
	 */
	updatePreview: function() {
		var layoutHTML = this.layoutsHTML[this.get("printParam.layout")];
		
		if(!Ext.isString(layoutHTML)) {
			this.loadHTML(this.get("printParam.layout"));
			return false;
		}
		
		this.renderLayout(layoutHTML);
		
		var center = this.getMap().getOlView().getCenter();
		if(this.feature) {
			center = ol.extent.getCenter(this.feature.getGeometry().getExtent());
			this.previewLayer.getSource().clear();
		}

		var coordinate = [
			center[0] - (this.mapSize[0] / 2),
			center[1] - (this.mapSize[1] / 2),
			center[0] + (this.mapSize[0] / 2),
			center[1] + (this.mapSize[1] / 2)
		];

		this.feature = new ol.Feature({
			geometry: new ol.geom.Polygon.fromExtent(coordinate)
		});
		this.moveInteraction.features_ = new ol.Collection([this.feature]);
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
		this.pageSize = Ck.pageSize[this.get("printParam.format")];
		if (!this.pageSize) return;
		this.pageSize = this.pageSize.slice(0); // Clone
		// transform to cm
		this.pageSize[0] /= 10;
		this.pageSize[1] /= 10;

		// Reverse size according to orientation
		if(this.get("printParam.orientation").orientation == "l") {
			this.pageSize.reverse();
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
		this.canvasSize = [mapDiv.getWidth(), mapDiv.getHeight()];

		// Calculate mapSize
		var res = this.get("printParam.resolution");
		this.mapSize = [
			(this.canvasSize[0] * res),
			(this.canvasSize[1] * res)
		];
	},

	/**
	 * Check how the document will be print
	 */
	beforePrint: function(btn) {
		
		
		// Hide preview vector
		this.previewLayer.setVisible(false);

		var rendererType = this.getOlMap().getRenderer().getType();
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

		// Close popup
		var win = this.getView().up('window');
		if(win) win.close();
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
		this.getOlMap().once('postcompose', function(event) {
			// First display fake map on the screen during the real print
			var mapCanvas = event.context.canvas;
			var mapCtx = mapCanvas.getContext("2d");
			var uri = mapCanvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');

			var dh = Ext.DomHelper;

			// Create the img element and add over map
			this.fakeMap = dh.append(this.mapTarget, {
				tag: 'img',
				src: uri
			});
			
			// Fix map size from web browser
			var mapWidth = (this.canvasSize[0]  / (window.ZOOMRATIO || window.devicePixelRatio));
			var mapHeight = (this.canvasSize[1]  / (window.ZOOMRATIO || window.devicePixelRatio));

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


			// Zoom on the desired extent
			var center = ol.extent.getCenter(this.feature.getGeometry().getExtent());
			var res = this.get("printParam.resolution");
			this.getMap().setCenter(center);
			this.getMap().setResolution(res);

			// Call print when all layers are drawed
			this.getMap().on('layersloaded', this.print, this, {
				single: true
			});

			this.getMap().redraw();
		}, this);
		this.getOlMap().renderSync();
	},

	/**
	 * Once all layers loaded, create an image of map and integrate it into the HTML layout <br/>
	 * Launch an html2canvas to create a canvas of HTML layout
	 */
	print: function() {
		this.getOlMap().once('postcompose', function(event) {
			this.integratePrintValue();
			// refresh mapDiv after integratePrintValue
			this.mapDiv = Ext.get("ckPrint-map").dom;

			var uri = event.context.canvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
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
		}, this);
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
				var uri = canvas.toDataURL('image/' + this.get("printParam.outputFormat")).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
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
					format: this.get("printParam.format"),
					unit: "cm"
				});
				var imgURL = canvas.toDataURL("image/jpg");
				pdf.addImage({
					imageData: imgURL,
					format: 'jpeg',
					x: 0,
					y: 0,
					w: this.pageSize[0],
					h: this.pageSize[1]
				});
				pdf.save("map.pdf");
		}

		// Replace the map at the right place and remove temp div
		this.printDiv.parentNode.removeChild(this.printDiv);
		this.mapDiv.removeChild(this.mapImg);

		// Reset center, resolution and preview
		this.previewLayer.setVisible(true);
		this.getOlMap().setTarget(this.mapTarget);
		this.getMap().setCenter(this.oldCenter);
		this.getMap().setResolution(this.oldRes);

		// Delete fake image
		this.mapTarget.removeChild(this.fakeMap);

		// Close print popup, clear preview
		this.cancel();
		this.mask.hide();
	},

	/**
	 * Loop on all this.printValue members and put the values in the layout
	 */
	integratePrintValue: function() {
		this.printValue = this.getView().getForm().getValues();
		this.addDefaultValues();

		// Do substitutions
		var layout = this.pageDiv.innerHTML;
		for(var key in this.printValue) {
			layout = layout.replace("{value:" + key + "}", this.printValue[key]);
		}
		layout = layout.replace(new RegExp("{value:staticsrc}", 'g') , "src");


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
		this.previewLayer.setVisible(true);
	},

	cancel: function() {
		this.getView().openner.close();
	}
});
