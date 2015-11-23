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
	 * List of parameters to configure the print
	 */
	printParam: {},
	
	/**
	 * List of values to integrate in the print layout
	 */
	printValue: {},
	
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
		
		Ext.apply(this.printParam, vm.getData().printParam);
		
		this.loadResolutions();
		this.loadDefaultParam();
		
		// Creation preview layer
		this.previewLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			style: new ol.style.Style({
				fill: new ol.style.Fill(Ext.apply({
					color: 'rgba(255, 255, 255, 0.2)'
				}, vm.getData().previewParam.fill)),
				stroke: new ol.style.Stroke(Ext.apply({
					color: '#ffcc33',
					width: 1
				}, vm.getData().previewParam.stroke))
			})
		});
		this.olMap.addLayer(this.previewLayer);
		window.previewLayer = this.previewLayer;
		
		this.control({
			"ckprint button#print": {
				click: this.beforePrint,
				scope: this
			},
			"ckprint button#cancel": {
				click: this.cancel
			},
			"ckprint textfield#title": {
				change: this.valueChange
			},
			"ckprint combo#resolution": {
				change: this.paramChange
			},
			"ckprint combo#printLayout": {
				change: this.layoutChange
			},
			"ckprint combo#dpi": {
				change: this.paramChange
			},
			"ckprint combo#outputFormat": {
				change: function(item, newValue) {
					this.printParam.outputFormat = newValue;
				}
			},
			"ckprint combo#format": {
				change: this.paramChange
			},
			"ckprint radiogroup#orientation": {
				change: this.paramChange
			}
		});
		
		// Stylesheet for print div
		this.style = document.createElement("style");
		this.style.appendChild(document.createTextNode(""));
		document.head.appendChild(this.style);
		
		// Use ol.interaction.Translate
		// Add DragFeature interaction to move preview
		this.moveInteraction = new ol.interaction.Translate({
			features: []
		});
		this.olMap.addInteraction(this.moveInteraction);
		this.layoutChange(null, this.printParam.printLayout);
	},
	
	/**
	 * Set default value for each item
	 */
	loadDefaultParam: function() {
		var printParam = this.printParam;

		var resCbx = this.getView().items.get("resolution");
		resCbx.setValue(printParam.resolution);
		
		var layCbx = this.getView().items.get("printLayout");
		layCbx.setValue(printParam.printLayout);
		
		var outCbx = this.getView().items.get("outputFormat");
		outCbx.setValue(printParam.outputFormat);
		
		// var dpiCbx = this.getView().items.get("dpi");
		// dpiCbx.setValue(printParam.dpi);
		
		var fmtCbx = this.getView().items.get("format");
		fmtCbx.setValue(printParam.format);
		
		var oriRG = this.getView().items.get("orientation");
		oriRG.setValue({"orientation": printParam.orientation});
	},
	
	/**
	 * Load resolutions list from OwcContext
	 */
	loadResolutions: function() {
		var data = this.ckMap.originOwc.getScales();
		var combo = this.getView().items.get("resolution");
		combo.setStore(new Ext.data.Store({
			fields: ["scale", "res"],
			data: data
		}));
		this.printParam.resolution = this.olView.getResolution();
	},
	
	valueChange: function(item, newValue, oldValue) {
		this.printValue[item.name] = newValue;
	},
	
	/**
	 * Update param for dpi, format and orientation then call this.updatePreview method
	 */
	paramChange: function(item, newValue, oldValue) {
		newValue = (Ext.isObject(newValue))? newValue[item.name] : newValue;
		this.printParam[item.name] = newValue;
		if(!Ext.isEmpty(oldValue)) {
			this.updatePreview();
		}
	},
	
	/**
	 * Load corresponding json print layout
	 */
	layoutChange: function(combo, newValue) {
		this.printParam.printLayout = newValue;
		Cks.get({
			url: Ck.getPath() + "/print/" + newValue + ".html",
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
			url: Ck.getPath() + "/print/" + this.printParam.printLayout + ".css",
			scope: this,
			success: function(response){
				this.style.innerHTML = response.responseText;
				this.updatePreview();
			},
			failure: function(response, opts) {
				this.style.innerHTML = "";
				this.updatePreview();
			}
		});
		
	},
	
	/**
	 * Render the HTML layout to the body and resize at the right size
	 * Calculate from printParam these variables : 
	 *		- pageSize : printed page in CENTIMETERS (with margins) -> use to create pageCanvas
	 *		- bodySize : printed page in PIXEL (without margins) -> use to create bodyCanvas
	 *		- mapExtent : extent of the map in METERS -> use to draw preview
	 *		- canvasSize : canvas size to print in PIXEL -> use for making div
	 */
	renderLayout: function() {
		var parser=new DOMParser();
		htmlLayout = parser.parseFromString(this.printLayout, "text/html");
		var pageDiv = htmlLayout.getElementById("ckPrint-page");
		
		var layoutDiv = document.createElement("div");
		layoutDiv.style.position = "absolute";
		layoutDiv.style.top = "0px";
		layoutDiv.style.zIndex = 100;
		layoutDiv.style.left = "101%"; // Comment to display layoutDiv before print
		
		// Size of final print page in cm. Convert it into centimeters
		this.pageSize = Ck.pageSize[this.printParam.format].slice(0);
		this.pageSize[0] /= 10;
		this.pageSize[1] /= 10;
		
		// Reverse size according to orientation
		if(this.printParam.orientation == "l")
			this.pageSize.reverse();
		
		pageDiv.style.width = Math.floor((this.pageSize[0] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
		pageDiv.style.height = Math.floor((this.pageSize[1] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
		
		document.body.appendChild(layoutDiv);
		layoutDiv.appendChild(pageDiv);
		
		this.pageDiv = pageDiv;
		this.layoutDiv = layoutDiv;
		
		var mapDiv = Ext.get("ckPrint-map").dom;
		var mapSize = [mapDiv.offsetWidth, mapDiv.offsetHeight];
		
		// Calculate mapExtent
		// var scale = Ck.getScaleFromResolution(this.printParam.resolution, this.olView.getProjection());
		this.mapExtent = [
			(mapSize[0] * this.printParam.resolution),
			(mapSize[1] * this.printParam.resolution)
		];
		
		// TODO : Multiply by DPI (quality)
		this.canvasSize = [
			this.mapExtent[0] / this.printParam.resolution,
			this.mapExtent[1] / this.printParam.resolution
		];
	},
	
	/**
	 * Update the preview feature from layout, format and orientation
	 */
	updatePreview: function() {
		var vm = this.getViewModel();
		var olView = this.ckMap.getOlView();
		
		this.renderLayout();
		document.body.removeChild(this.layoutDiv);
		
		if(this.feature) {
			var center = this.feature.getGeometry().getExtent();
			var center = [
				(center[2] + center[0]) / 2,
				(center[3] + center[1]) / 2
			];
			this.previewLayer.getSource().clear();
		} else {
			var center = olView.getCenter()
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
		var rendererType = this.olMap.getRenderer().getType();
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
				this.renderLayout();
				this.preparePrint();
				break;
			case "webgl":
			default:
				Ext.Msg.show({
					message: "Chinook doesn't support printing from " + rendererType + " rendering map",
					icon: Ext.Msg.ERROR,
					buttons: Ext.Msg.OK
				});			
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
		this.oldRes = this.olView.getResolution();
		this.oldCenter = this.olView.getCenter();
		
		this.olMap.once('postcompose', function(event) {
			// First print to display fake map on the screen during the real print
			var mapCanvas = event.context.canvas;
			var mapCtx = mapCanvas.getContext("2d");
			
			uri = mapCanvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			
			// Create the img element
			this.fakeMap = document.createElement("img");
			this.fakeMap.src = uri;
			
			var target = this.ckMap.getView().getEl().dom;
			target.firstChild.appendChild(this.fakeMap);
			
			// Move map to invisible div to print with right resolution
			var printDiv = document.createElement("div");
			printDiv.style.width = (this.canvasSize[0] + 1).toString() + "px";
			printDiv.style.height = (this.canvasSize[1] + 1).toString() + "px";
			/* Comment this line to display the map
			printDiv.style.position = "absolute";
			printDiv.style.top = "1px";
			// */
			
			document.body.appendChild(printDiv);
			this.olMap.setTarget(printDiv);
			
			this.printDiv = printDiv;
			
			// Hide preview vector
			this.previewLayer.setVisible(false);
			
			// Zoom on the desired extent
			var extent = this.feature.getGeometry().getExtent();
			Ck.zoomToExtent(extent);
			
			// this.ckMap.once doesn't exists :-(
			this.layersEndLoad = this.ckMap.on({
				destroyable: true,
				"layersloaded": function() {
					// Unset layersloaded event
					this.layersEndLoad.destroy();
					this.print();
				},
				scope: this
			});
			
			Ck.getMap().redraw();			
		}, this);
		this.olMap.renderSync();
	},
	
	/**
	 * Create an image of map and integrate it into the HTML layout <br/>
	 * Launch an html2canvas to create a canvas of HTML layout
	 */
	print: function() {
		this.olMap.once('postcompose', function(event) {
			this.integratePrintValue();
			
			uri = event.context.canvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			var mapImg = document.createElement("img");
			
			mapImg.src = uri;
			var target = Ext.get("ckPrint-map").dom;
			target.appendChild(mapImg);
			
			html2canvas(this.pageDiv, {
				printControl: this,
				logging: true,
				allowTaint: true,
				onrendered: this.finishPrinting
			});
		}, this);
		this.olMap.renderSync();
	},
	
	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	finishPrinting: function(canvas) {
		switch(this.printControl.printParam.outputFormat) {
			case "jpg":
			case "png":
				uri = canvas.toDataURL('image/' + this.printControl.printParam.outputFormat).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				// Pop the download prompt
				var downloadLink = document.createElement("a");
				downloadLink.href = uri;
				downloadLink.download = "map." + this.printControl.printParam.outputFormat;
				document.body.appendChild(downloadLink);
				downloadLink.click();
				document.body.removeChild(downloadLink);
				break;
				
			case "pdf":
				var pdf = new jsPDF({
					orientation: this.printControl.printParam.orientation,
					format: this.printControl.printParam.format,
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
		this.printControl.olMap.setTarget(this.printControl.ckMap.getView().getEl().dom.firstChild);
		this.printControl.printDiv.parentNode.removeChild(this.printControl.printDiv);
		document.body.removeChild(this.printControl.layoutDiv);
		
		// Reset center, resolution and preview
		this.printControl.previewLayer.setVisible(true);
		this.printControl.olView.setCenter(this.printControl.oldCenter);
		this.printControl.olView.setResolution(this.printControl.oldRes);
		
		// Delete fake image
		this.printControl.ckMap.getView().getEl().dom.firstChild.removeChild(this.printControl.fakeMap);
	},
	
	/**
	 * Loop on all this.printValue members and put the values in the layout
	 */
	integratePrintValue: function() {
		var layout = this.pageDiv.innerHTML;
		for(var key in this.printValue) {
			 layout = layout.replace("{value:" + key + "}", this.printValue[key]);
		}
		this.pageDiv.innerHTML = layout;
	},
	
	
	cancel: function() {
		this.getView().openner.close();
	}
});
