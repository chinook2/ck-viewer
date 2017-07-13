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

	/**
	 * List of parameters to configure the print (dpi, format, layout...)
	 */
	// printParam: {},

	/**
	 * List of values to integrate in the print layout
	 */
	printValue: {},

	/**
	 * @property {ol.layer.Victor}
	 * Layer hosting preview vector
	 */
	previewLayer: null,

	/**
	 * The layout as HTML
	 * @property {String}
	 */
	printLayout: null,

	/**
	 * Div element
	 * @property {DOMElement}
	 */
	layoutDiv: null,

	/**
	 * Div element where the canvas will be put
	 * @property {DOMElement}
	 */
	printDiv: null,

	/**
	 * Printed map image. Delete it after each printing.
	 * @property {DOMElement}
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
		this.layoutChange(null, this.get("printParam.layout"));
	},

	destroy: function () {

	},

	/**
	 * Load resolutions list from OwsContext
	 */
	loadResolutions: function() {
		var data = this.getMap().originOwc.getScales();
		var combo = this.getView().items.get("resolution");

		var store = new Ext.data.Store({
			fields: ["scale", "res"],
			data: data
		});
		combo.setStore(store);

		this.initResolution();
	},

	initResolution: function () {
		this.set("printParam.resolution", this.getOlView().getResolution());
	},

	/**
	 * Update param for dpi, format and orientation then call this.updatePreview method
	 */
	paramChange: function(item, rec) {
		if(Ext.isEmpty(rec)) return;
		var val = item.getValue();
		// if(item.getChecked) {
		// 	var i = item = item.getChecked()[0];
		// 	if(i && i.getSubmitValue) val = i.getSubmitValue();
		// }

		this.set("printParam." + item.name, val);
		this.updatePreview();
	},

	/**
	 * Load corresponding json print layout
	 */
	layoutChange: function(combo, newValue) {
		this.set("printParam.layout", this.getStore("layouts").getById(newValue));

		Cks.get({
			url: Ck.getPath(this.get("printParam.layout").get("packageName")) + "/print/" + newValue + ".html",
			scope: this,
			success: function(response){
				this.printLayout = response.responseText;
				this.loadCss();
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
	loadCss: function() {
		Cks.get({
			url: Ck.getPath(this.get("printParam.layout").get("packageName")) + "/print/" + this.get("printParam.layout").getId() + ".css",
			scope: this,
			success: function(response){
				this.style.innerHTML = response.responseText;
				this.updatePreview();
			}
		});

	},

	/**
	 * Render the HTML layout just to calculate some variables. Remove it after
	 *		- pageSize : printed page in CENTIMETERS (with margins) -> use to create pageCanvas
	 *		- bodySize : printed page in PIXEL (without margins) -> use to create bodyCanvas
	 *		- mapExtent : extent of the map in METERS -> use to draw preview
	 *		- canvasSize : canvas size to print in PIXEL -> use for making div
	 */
	renderLayout: function() {
		if (this.printLayout==='') return;

		var parser = new DOMParser();
		htmlLayout = parser.parseFromString(this.printLayout, "text/html");
		var pageDiv = htmlLayout.getElementById("ckPrint-page");
		if (!pageDiv) return;

		if(this.layoutDiv) {
			this.layoutDiv.parentNode.removeChild(this.layoutDiv);
		}

		var layoutDiv = document.createElement("div");
		layoutDiv.style.position = "absolute";
		layoutDiv.style.zIndex = 500;
		layoutDiv.style.left = "100%"; // Comment to display layout

		// Size of final print page in cm
		this.pageSize = Ck.pageSize[this.get("printParam.format")];
		if (!this.pageSize) return;
		this.pageSize = this.pageSize.slice(0); // Clone
		this.pageSize[0] /= 10;
		this.pageSize[1] /= 10;

		// Reverse size according to orientation
		if(this.get("printParam.orientation").orientation == "l") {
			this.pageSize.reverse();
		}

		// Apply DPI to get number of dot (pixel) needed
		pageDiv.style.width = Math.floor((this.pageSize[0] / Ck.CM_PER_INCH) * this.get("printParam.dpi")).toString() + "px";
		pageDiv.style.height = Math.floor((this.pageSize[1] / Ck.CM_PER_INCH) * this.get("printParam.dpi")).toString() + "px";

		//
		document.body.appendChild(layoutDiv);
		layoutDiv.appendChild(pageDiv);

		this.pageDiv = pageDiv;
		this.layoutDiv = layoutDiv;

		// Now calculate some variable from rendered page div
		var mapDiv = Ext.get("ckPrint-map").dom;
		var mapSize = [mapDiv.offsetWidth, mapDiv.offsetHeight];
		var res = this.get("printParam.resolution");

		// Calculate mapExtent
		this.mapExtent = [
			(mapSize[0] * res),
			(mapSize[1] * res)
		];

		this.canvasSize = [
			this.mapExtent[0] / res,
			this.mapExtent[1] / res
		];
	},

	/**
	 * Update the preview feature from layout, format and orientation
	 */
	updatePreview: function() {
		var vm = this.getViewModel();
		var olView = this.getMap().getOlView();

		this.renderLayout();
		if(!this.mapExtent) return;

		var center = olView.getCenter();
		if(this.feature) {
			center = this.feature.getGeometry().getExtent();
			center = [
				(center[2] + center[0]) / 2,
				(center[3] + center[1]) / 2
			];
			this.previewLayer.getSource().clear();
		}

		var coordinate = [
			center[0] - (this.mapExtent[0] / 2),
			center[1] - (this.mapExtent[1] / 2),
			center[0] + (this.mapExtent[0] / 2),
			center[1] + (this.mapExtent[1] / 2)
		];

		this.feature = new ol.Feature({
			geometry: new ol.geom.Polygon.fromExtent(coordinate)
		});
		this.moveInteraction.features_ = new ol.Collection([this.feature]);
		this.previewLayer.getSource().addFeature(this.feature);
	},

	/**
	 * Check how the document will be print
	 */
	beforePrint: function(btn) {
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

		this.getOlMap().once('postcompose', function(event) {
			// First print to display fake map on the screen during the real print
			var mapCanvas = event.context.canvas;
			var mapCtx = mapCanvas.getContext("2d");

			uri = mapCanvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');

			// Create the img element
			this.fakeMap = document.createElement("img");
			this.fakeMap.src = uri;

			var target = this.getMap().getView().getEl().dom;
			target.firstChild.appendChild(this.fakeMap);

			// Move map to invisible div to print with right resolution
			var printDiv = document.createElement("div");
			this.printDiv = printDiv;
			document.body.appendChild(printDiv);
			printDiv.style.position = "absolute";
			printDiv.style.top = (screen.height) + "px";
			printDiv.style.width = (this.canvasSize[0]).toString() + "px";
			printDiv.style.height = (this.canvasSize[1]).toString() + "px";

			this.getOlMap().setTarget(printDiv);

			// Hide preview vector
			this.previewLayer.setVisible(false);

			// Zoom on the desired extent
			var extent = this.feature.getGeometry().getExtent();
			Ck.zoomToExtent(extent);

			// this.getMap().once doesn't exists :-(
			this.layersEndLoad = this.getMap().on({
				destroyable: true,
				"layersloaded": function() {
					// Unset layersloaded event
					this.layersEndLoad.destroy();
					this.print();
				},
				scope: this
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

			uri = event.context.canvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			this.mapImg = document.createElement("img");

			this.mapImg.src = uri;
			var target = Ext.get("ckPrint-map").dom;
			target.appendChild(this.mapImg);

			html2canvas(this.pageDiv, {
				printControl: this,
				logging: true,
				allowTaint: true,
				onrendered: this.finishPrinting
			});
		}, this);
		this.getOlMap().renderSync();
	},

	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	finishPrinting: function(canvas) {
		switch(this.printControl.get("printParam.outputFormat")) {
			case "jpg":
			case "png":
				uri = canvas.toDataURL('image/' + this.printControl.get("printParam.outputFormat")).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				// Pop the download prompt
				var downloadLink = document.createElement("a");
				downloadLink.href = uri;
				downloadLink.download = "map." + this.printControl.get("printParam.outputFormat");
				document.body.appendChild(downloadLink);
				downloadLink.click();
				document.body.removeChild(downloadLink);
				break;

			case "pdf":
				var pdf = new jsPDF({
					orientation: this.printControl.get("printParam.orientation").orientation,
					format: this.printControl.get("printParam.format"),
					unit: "cm"
				});
				var imgURL = canvas.toDataURL("image/jpg");
				pdf.addImage({
					imageData: imgURL,
					format: 'jpeg',
					x: 0,
					y: 0,
					w: this.printControl.pageSize[0],
					h: this.printControl.pageSize[1]
				});
				pdf.save("map.pdf");
		}

		// Replace the map at the right place and remove temp div
		this.printControl.getOlMap().setTarget(this.printControl.getMap().getView().getEl().dom.firstChild);
		this.printControl.printDiv.parentNode.removeChild(this.printControl.printDiv);
		Ext.get("ckPrint-map").dom.removeChild(this.printControl.mapImg);

		// Reset center, resolution and preview
		this.printControl.previewLayer.setVisible(true);
		this.printControl.getOlView().setCenter(this.printControl.oldCenter);
		this.printControl.getOlView().setResolution(this.printControl.oldRes);

		// Delete fake image
		this.printControl.getMap().getView().getEl().dom.firstChild.removeChild(this.printControl.fakeMap);
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

	clearPreview: function () {
		this.previewLayer.getSource().clear();
		this.feature = null;
	},

	cancel: function() {
		this.clearPreview();
		var win = this.getView().up('window');
		if(win) win.close();
	}
});
