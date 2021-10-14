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
	printValue: {title:''},
	
	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		var v = this.getView();
		v.findParentByType('window').addListener("beforeclose", this.beforeclose, this);
		v.findParentByType('window').addListener("afterlayout", this.initfirstload, this);
		
		var vm = this.getViewModel();
		this.ckMap = Ck.getMap();
		this.olMap = this.ckMap.getOlMap();
		this.olView = this.ckMap.getOlView();
		
		Ext.apply(this.printParam, vm.getData().printParam);
		
		this.loadResolutions();
		this.loadDefaultParam();
		
		var date = new Date();
		var monthaff = new Array("01","02","03","04","05","06","07","08","09","10","11","12");
		var dateaff = new Array("00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31");
		
		var dateaffiche = dateaff[date.getDate()]+"/"+monthaff[date.getMonth()]+"/"+date.getFullYear();
		
		this.printValue["nomcom"] = '';
		this.printValue["date"] = dateaffiche;
		this.printValue["projection"] = Ck.getMap().getOlView().getProjection().getCode();
		
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
				change: this.paramChange,
				afterrender:function(cmb,obj){
					this.printValue["scale"] = cmb.rawValue;
				}
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
			},
			"ckprint radiogroup#affleg": {
				change: this.paramChange
			},
			"ckprint checkbox#cpr": {
				change: this.paramChange
			},
			"ckprint checkbox#crtref": {
				change: this.paramChange
			},
			"ckprint checkbox#lstressel": {
				change: this.paramChange
			},
			"ckprint numberfield#rotate": {
				change: this.rotatemap
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
	
	initfirstload: function(){
		for($i=0; $i < 2; $i++){
			Ext.ComponentQuery.query('[itemId=openoverview]')[0].click(false);
		}
		this.loadCss(); 
	},
	
	/**
	 * Set default value for each item
	 */
	loadDefaultParam: function() {
		var printParam = this.printParam;

		var resCbx = this.getView().items.get("resolution");
		resCbx.setValue(printParam.resolution);
		/*
		var layCbx = this.getView().items.get("printLayout");
		layCbx.setValue(printParam.printLayout);
		*/
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
	
	rotatemap: function(item, newValue, oldValue){
		this.olView.setRotation(newValue * Math.PI / 180);
		this.updatePreview();
	},
	
	/**
	 * Update param for dpi, format and orientation then call this.updatePreview method
	 */
	paramChange: function(item, newValue, oldValue) {
		newValue = (Ext.isObject(newValue))? newValue[item.name] : newValue;
		this.printParam[item.name] = newValue;
		if(item.name == "resolution"){
			this.printValue["scale"] = item.rawValue;
		}
		if(item.name == "affleg"){
			if(newValue == "sprleg"){
				this.layoutChange('leg', "default-legend");
			}
		}
		if(item.name == "orientation"){
			if(newValue == "p"){
				printLayout = "default-layout";
			}else{
				printLayout = "default-layout1";
			}
			this.layoutChange(null, printLayout);
		}
		if(!Ext.isEmpty(oldValue)) {
			this.updatePreview();
		}
	},
	
	/**
	 * Load corresponding json print layout
	 */
	layoutChange: function(combo, newValue) {
		if(combo != 'leg'){
			this.printParam.printLayout = newValue;
		}
		Cks.get({
			url: Ck.getPath() + "/print/" + newValue + ".html",
			scope: this,
			success: function(response){
				if(combo != 'leg'){
					this.printLayout = response.responseText;
					this.loadCss();
				}else{
					this.printLegend = response.responseText;
					this.renderlengend();
				}
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
	
	renderlengend: function(){
		var parser=new DOMParser();
		htmlLayout = parser.parseFromString(this.printLegend, "text/html");
		var layoutlegDiv = document.createElement("div");
		layoutlegDiv.style.position = "absolute";
		layoutlegDiv.style.top = "0px";
		layoutlegDiv.style.zIndex = 100;
		layoutlegDiv.style.left = "101%"; 
		document.body.appendChild(layoutlegDiv);
		if(this.printParam.affleg == "sprleg"){
			var pageDiv = htmlLayout.getElementById("ckPrint-legend1");
			if(pageDiv){
				
				pageDiv.style.width = Math.floor((this.pageSize[0] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
				pageDiv.style.height = Math.floor((this.pageSize[1] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
					
				layoutlegDiv.appendChild(pageDiv);
				this.pageDivLeg = pageDiv;				
			}
		}
		this.layoutlegDiv = layoutlegDiv;
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
		
		document.body.appendChild(layoutDiv);
		
		if(pageDiv){
			pageDiv.style.width = Math.floor((this.pageSize[0] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
			pageDiv.style.height = Math.floor((this.pageSize[1] / Ck.CM_PER_INCH) * this.printParam.dpi).toString() + "px";
			
			layoutDiv.appendChild(pageDiv);
			
			this.pageDiv = pageDiv;
			var mapDiv = Ext.get("ckPrint-map").dom;
			var mapSize = [mapDiv.offsetWidth, mapDiv.offsetHeight];
		}else{
			var mapSize = [1, 1];
		}
		
		this.layoutDiv = layoutDiv;
			
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
		
		// if (this.feature) {
			// var center = this.feature.getGeometry().getExtent();
			// var center = [
				// (center[2] + center[0]) / 2,
				// (center[3] + center[1]) / 2
			// ];
			// this.previewLayer.getSource().clear();
		// } else {
			var center = olView.getCenter();
			this.previewLayer.getSource().clear();
		// }
		
		// correction rotation
		var rotation = this.olView.getRotation();
		var x0 = center[0];
		var y0 = center[1];
		var w = this.mapExtent[0];
		var h = this.mapExtent[1];
		
		var coordinate = [
			this.rotate([x0 - w / 2, y0 - h / 2], rotation, center),
			this.rotate([x0 + w / 2, y0 - h / 2], rotation, center),
			this.rotate([x0 + w / 2, y0 + h / 2], rotation, center),
			this.rotate([x0 - w / 2, y0 + h / 2], rotation, center)
		];
		// correction fin
		
		this.feature = new ol.Feature({
			geometry: new ol.geom.Polygon([coordinate])
		});
		
		this.moveInteraction.features_ = new ol.Collection([this.feature]);
		this.previewLayer.getSource().addFeature(this.feature);
	},
	
	
	/**
	 * Check how the document will be print
	 */
	beforePrint: function(btn) {
		varurl = Ck.getApi().replace('?','index.php');
		var extent = this.feature.getGeometry().getExtent();		
		this.printValue["nomcom"] = '';
		Ck.Ajax.request({
			url: varurl,
			params : {
				s:"recherche",
				r:"recupnomcomprint",
				minx:extent[0],
				miny:extent[1],
				maxx:extent[2],
				maxy:extent[3]
			},
			scope:this,
			success: function(res) {
				rep = Ext.decode(res.responseText);
				if(rep.nomcom.trim != ''){
					this.printValue["nomcom"] = rep.nomcom;
					this.beforePrintGo(btn);
				}
			}
		});
		
		
	},
	
	/**
	 * Check how the document will be print
	 */
	beforePrintGo: function(btn) {
		this.csvselection = [];
		this.listselection = [];
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
				Ext.MessageBox.show({
					title:"Préparation du téléchargement",
					msg: "Veuillez patienter...",
					width:300,
					wait:true,
					waitConfig: {interval:500},
					icon:'ext-mb-download' //custom class in msg-box.html
				
				});
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
			
			var listicoterit = sessionStorage.getItem('Ckterritico');
			if(listicoterit && listicoterit.trim() != ""){
				var resit = listicoterit.split(",");
				var targetidoterit = Ext.get("ckPrint-icopart").dom;
				icopart = "";
				for(i=0; i < resit.length; i++){
					icopart = "<div class='ckPrint-logo-part' style='background: rgba(255, 255, 255, 1);'><img src='resources/images/partenaires/"+resit[0]+"' style='height:100px;margin-left:2px;'></div>";
				}
				
				targetidoterit.innerHTML = icopart;
			}
			
			var strlstcpr = "";
			listlay = this.olMap.getLayers().getArray();
			for(i=0 ; i < listlay.length; i++) {
				if(Ext.isFunction(listlay[i].getLayers)){
					listlay2 = listlay[i].getLayers().getArray();
					for(t=0 ; t < listlay2.length; t++) {  
						if(listlay2[t].ckLayer){
							if(listlay2[t].getVisible() == true){
								if(listlay2[t].getExtension().attribution != ''){
									if(strlstcpr != "")strlstcpr += ", ";
									strlstcpr += listlay2[t].getExtension().attribution;
									break;
								}
								if(strlstcpr != "")break
							}
							if(strlstcpr != "")break
						}
						if(strlstcpr != "")break
					}
					if(strlstcpr != "")break
				}
				if(strlstcpr != "")break;
			}
			
			var targetidcpr = Ext.get("ckPrint-cpr").dom;
			targetidcpr.innerHTML = strlstcpr;
			
			if(this.printParam.affleg == "itgleg"){
				Ext.get("ckPrint-legend").dom.style.display = "block";
				listlay = this.olMap.getLayers().getArray();
				
				
				colcnt = "";
				var ittest = 0;
				var irgt = 0;
				var valw = 215;
				if(this.printParam.orientation == "p"){
					cntor = 8;
					valw = 215;
				}else{
					cntor = 48;
					valw = 180;
				}
				
				for(i=0 ; i < listlay.length; i++) {
					if(listlay[i].values_.title != 'Fond de Plan' && listlay[i].values_.title != 'PCRS Image'){
						if(Ext.isFunction(listlay[i].getLayers)){
							listlay2 = listlay[i].getLayers().getArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										if(ittest == 0){
											colcnt += "<div style='position:absolute;left:"+irgt+"px'><ul class='ulleg'>";
										}
										colcnt += "<li><div class='ckPrint-legimg' style='background: rgba(255, 255, 255, 0.83) url("+Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + listlay2[t].get("id")+") no-repeat scroll left 0px;'></div><div class='ckPrint-legtitle'>"+laytemp.getTitle()+"</div></li>";
										
										if(ittest == cntor){
											colcnt += "</ul></div>";
											ittest = 0;
											irgt = irgt + valw;
										}else{
											ittest = ittest + 1;
										}
									}
								}
							}
						}
					}else{
						if(Ext.isFunction(listlay[i].getLayers)){
							listlay2 = listlay[i].getLayers().getArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										if(ittest == 0){
											colcnt += "<div style='position:absolute;left:"+irgt+"px'><ul class='ulleg'>";
										}
										colcnt += "<li><div style='background: rgba(255, 255, 255, 0.83) no-repeat scroll left 0px;'></div><div class='ckPrint-legtitle'>"+laytemp.getTitle()+"</div></li>";
										
										if(ittest == cntor){
											colcnt += "</ul></div>";
											ittest = 0;
											irgt = irgt + valw;
										}else{
											ittest = ittest + 1;
										}
									}
								}
							}
						}
					}
				}
				
				colcnt += "</ul></div>";
				
				var targetleg = Ext.get("ckPrint-legend").dom;
				targetleg.innerHTML = colcnt;
				
			}else if(this.printParam.affleg == "sprleg"){
				if(this.printParam.orientation == "p"){
					Ext.get("ckPrint-title").dom.style.right = "0px";
				}
				listlay = this.olMap.getLayers().getArray();
				var ulct = document.createElement('ul');
				
				colcnt = "";
				var ittest = 0;
				var irgt = 0;
				var cntor = 74;
								
				for(i=0 ; i < listlay.length; i++) {
					if(listlay[i].values_.title != 'Fond de Plan' && listlay[i].values_.title != 'PCRS Image'){
						if(Ext.isFunction(listlay[i].getLayers)){
							listlay2 = listlay[i].getLayers().getArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										if(ittest == 0){
											colcnt += "<div style='position:absolute;left:"+irgt+"px'><ul class='ulleg'>";
										}
										
										colcnt += "<li><div class='ckPrint-legimg' style='background: rgba(255, 255, 255, 0.83) url("+Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + listlay2[t].get("id")+") no-repeat scroll left 0px;'></div><div class='ckPrint-legtitle'>"+laytemp.getTitle()+"</div></li>";
										
										if(ittest == cntor){
											colcnt += "</ul></div>";
											ittest = 0;
											irgt = irgt + 250;
										}else{
											ittest = ittest + 1;
										}
									}
								}
							}
						}
					}else{
						if(Ext.isFunction(listlay[i].getLayers)){
							listlay2 = listlay[i].getLayers().getArray();
							for(t=0 ; t < listlay2.length; t++) {  
								if(listlay2[t].ckLayer){
								laytemp = listlay2[t].ckLayer;
									if(listlay2[t].getVisible() == true){
										if(ittest == 0){
											colcnt += "<div style='position:absolute;left:"+irgt+"px'><ul class='ulleg'>";
										}
										colcnt += "<li><div style='background: rgba(255, 255, 255, 0.83) no-repeat scroll left 0px;'></div><div class='ckPrint-legtitle'>"+laytemp.getTitle()+"</div></li>";
										
										if(ittest == cntor){
											colcnt += "</ul></div>";
											ittest = 0;
											irgt = irgt + 250;
										}else{
											ittest = ittest + 1;
										}
									}
								}
							}
						}
					}
				}
				
				colcnt += "</ul></div>";
				// console.log(colcnt);
				var targetleg = Ext.get("ckPrint-cntleg1").dom;
				targetleg.innerHTML = colcnt;
				
				
				html2canvas(this.pageDivLeg, {
					printControl: this,
					logging: true,
					allowTaint: true,
					onrendered: this.finishPrintingleg
				});
			}else{
				if(this.printParam.orientation == "p"){
					Ext.get("ckPrint-title").dom.style.right = "0px";
				}
			}
			
			if(this.printParam.lstressel == true){
				var alistlay = Ck.resultLayer;
				var alistfeat = Ck.resultFeature;
				if(alistlay && alistlay.length > 0){
					var strsel = "";
					var astrsel = [];
					for(ctsel=0 ; ctsel < alistlay.length; ctsel++){
						var astrlaysel = [];
						var alistfeature = alistfeat[ctsel];
						var nomcouche = alistlay[ctsel]+" ("+alistfeature.length+")";
						strsel += alistlay[ctsel]+" ("+alistfeature.length+") \n";
						prop = alistfeature[0].getProperties();
						var atitlesel = [];
						for (var object1 in prop) {
							if(typeof(prop[object1]) === "string" && !Ext.isEmpty(prop[object1]) ){
								strsel += ";"+object1;
								atitlesel.push(object1);
							}
						}
						strsel += "\n";
						var alistsel = [];
						for(ctft=0; ctft < alistfeature.length; ctft++){
							proptmp = alistfeature[ctft].getProperties();
							var alistlignesel = [];
							for (var objtmp in proptmp) {
								if(typeof(proptmp[objtmp]) === "string"  && !Ext.isEmpty(proptmp[objtmp])){
									strsel += ";"+proptmp[objtmp];
									alistlignesel.push(proptmp[objtmp]);
								}
							}
							strsel += "\n";
							if(alistlignesel.length > 0){
								alistsel.push(alistlignesel);
							}
						}
						astrlaysel['couche'] = nomcouche;
						astrlaysel['entete'] = atitlesel;
						astrlaysel['listsel'] = alistsel;
						astrsel.push(astrlaysel);
					}
					this.csvselection = strsel;
					this.listselection = astrsel;
				}
			}
			
			if(this.printParam.cpr == true){
				var strlstcpr = "LISTE DES COPYRIGHT \n";
				var alstcpr = [];
				listlay = this.olMap.getLayers().getArray();
				for(i=0 ; i < listlay.length; i++) {
					if(Ext.isFunction(listlay[i].getLayers)){
						listlay2 = listlay[i].getLayers().getArray();
						for(t=0 ; t < listlay2.length; t++) {  
							if(listlay2[t].ckLayer){
								if(listlay2[t].getVisible() == true){
									if(listlay2[t].getExtension().attribution != ''){
										strlstcpr += "\n- "+listlay2[t].getExtension().attribution;
										alstcpr.push(listlay2[t].getExtension().attribution);
									}
								}
							}
						}
					}
				}
				this.strlstcpr = strlstcpr;
				this.alstcpr = alstcpr;
			}
			
			if(this.printParam.crtref == true){					
				Ext.get("ckPrint-ref").dom.style.display = "block";	
				mapref = this.olMap.getControls().getArray()[4].getOverviewMap();
				
				var printDivref = document.createElement("div");
				printDivref.style.width = "122px";
				printDivref.style.height = "122px";
				
				document.body.appendChild(printDivref);
				mapref.setTarget(printDivref);
				this.printDivref = printDivref;
				
				mapref.once('postcompose', function(event) { 
					uriref = event.context.canvas.toDataURL('image/jpg').replace(/^data:image\/[^;]/, 'data:application/octet-stream');
					var mapImg1 = document.createElement("img");
					mapImg1.style.width = "122px";
					mapImg1.style.height = "122px";
					mapImg1.src = uriref;
					
					var target1 = Ext.get("ckPrint-ref").dom;
					target1.innerHTML = "";
											
					mapref2 = this.olMap.getControls().getArray()[4].getOverviewMap();
					cwidth = mapref2.getOverlays().getArray()[0].getProperties().element.clientWidth;
					cheight = mapref2.getOverlays().getArray()[0].getProperties().element.clientHeight;
					if(cheight > 120)cheight = 120;
					if(cwidth > 121)cwidth = 120;
					
					if(cheight == 120){
						ctop = 0;
					}else{
						ctop = (122 - cheight )/ 2;
					}
					if(cwidth == 120){
						cleft = 0;
					}else{
						cleft = (122 - cwidth )/ 2;
					}
					var mapImg2 = document.createElement("div");
					mapImg2.style.width = cwidth+"px";
					mapImg2.style.height = cheight+"px";
					mapImg2.style.top = ctop+"px";
					mapImg2.style.left = cleft+"px";
					mapImg2.style.border = "1px solid red";
					mapImg2.style.position = "absolute";
					target1.appendChild(mapImg2);
					
					target1.appendChild(mapImg1);
					
				}, this);
			}
												
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
	
	finishPrintingleg: function(canvas){
		this.printControl.canvasleg = canvas;
	},
	
	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	finishPrinting: function(canvas) {
		if(this.printControl.printParam.affleg == "sprleg"){
			if(this.printControl.printParam.outputFormat != "pdf"){ 
				ckZipl = new CkZip();

				var files = [];
				var aFileParts = canvas.toDataURL('image/' + this.printControl.printParam.outputFormat).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				
				var byteString = atob(aFileParts.split(',')[1]);
				var ab = new ArrayBuffer(byteString.length);
				var ia = new Uint8Array(ab);
				for (var i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				var blob = new Blob([ia], { type: 'image/' + this.printControl.printParam.outputFormat });
				var oMyBlob = new File([blob], "carte." + this.printControl.printParam.outputFormat);
				files.push(oMyBlob);
				
				var aFilePartsleg = this.printControl.canvasleg.toDataURL('image/' + this.printControl.printParam.outputFormat).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				
				var byteStringleg = atob(aFilePartsleg.split(',')[1]);
				var ableg = new ArrayBuffer(byteStringleg.length);
				var ialeg = new Uint8Array(ableg);
				for (var ileg = 0; ileg < byteStringleg.length; ileg++) {
					ialeg[ileg] = byteStringleg.charCodeAt(ileg);
				}
				var blobleg = new Blob([ialeg], { type: 'image/' + this.printControl.printParam.outputFormat });
				var oMyBlobleg = new File([blobleg], "legende." + this.printControl.printParam.outputFormat);
				files.push(oMyBlobleg);
				
				if(this.printControl.printParam.cpr == true){
					var blobcp = new Blob([this.printControl.strlstcpr], { type: 'text/plain',endings:'native' });
					var oMyBlobcp = new File([blobcp], "copyright.txt");
					files.push(oMyBlobcp);
				}
				
				if(this.printControl.printParam.lstressel == true){	
					var alistlay = Ck.resultLayer;
					if(alistlay && alistlay.length > 0){				
						var blobsel = new Blob([this.printControl.csvselection], { type: 'text/csv'});
						var oMyBlobsel = new File([blobsel], "selection.csv");
						files.push(oMyBlobsel);
					}
				}	
							
				ckZipl.addFiles(files, function() {
					ckZipl.getBlobURL(function(blobURL) {
						var downloadLink = document.createElement("a");
						downloadLink.href = blobURL;
						downloadLink.download = "carte.zip";
						document.body.appendChild(downloadLink);
						downloadLink.click();
						document.body.removeChild(downloadLink);
						
						Ext.MessageBox.hide();
					},this);
				});
				if(this.printControl.printParam.lstressel == true){
					if(this.printControl.listselection.length == 0){
						Ext.Msg.alert('Sélection', 'Aucune couche n\'a été sélectionner');
					}
				}
			}else{
				var pdf = new jsPDF({
					orientation: this.printControl.printParam.orientation,
					format: this.printControl.printParam.format,
					unit: "cm"
				});
				var imgURL = canvas.toDataURL("image/jpeg");
				pdf.addImage({
					imageData: imgURL,
					format: 'jpeg',
					x: 0,
					y: 0,
					w: this.printControl.pageSize[0],
					h: this.printControl.pageSize[1]
				});
				
				var imgURL1 = this.printControl.canvasleg.toDataURL("image/jpeg");
				pdf.addPage();
				pdf.addImage({
					imageData: imgURL1,
					format: 'jpeg',
					x: 0,
					y: 0,
					w: this.printControl.pageSize[0],
					h: this.printControl.pageSize[1]
				});
				
				if(this.printControl.printParam.cpr == true){
					atmplstcpr = this.printControl.alstcpr;
					pdf.addPage();
					pdf.setFontSize(22);
					pdf.text(5, 2, "LISTE DES COPYRIGHT");
					actn = 2;
					for(i=0; i < atmplstcpr.length;i++){
						actn = actn + 1;
						pdf.setFontSize(12);
						pdf.text(1, actn, "- "+atmplstcpr[i]);
					}
					
				}
				
				if(this.printControl.printParam.lstressel == true){	
					atmpselist = this.printControl.listselection
					if(atmpselist && atmpselist.length > 0){
						for(s=0; s < atmpselist.length; s++){
							pdf.addPage();
							
							if(s == 0 ){
								pdf.setFontSize(16);
								pdf.text(4, 2, "LISTE DES RÉSULTATS DE LA SÉLECTION");
								pdf.setFontSize(12);
								pdf.text(1.5, 3, atmpselist[s]['couche']);
								pdf.autoTable({
									body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
									head: [atmpselist[s]['entete']],
									body: atmpselist[s]['listsel'],
									startY: 3.5,
									showHead: 'firstPage'
								});
							}else{
								pdf.setFontSize(12);
								pdf.text(1.5, 2, atmpselist[s]['couche']);
								pdf.autoTable({
									body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
									head: [atmpselist[s]['entete']],
									body: atmpselist[s]['listsel'],
									startY: 2.5,
									showHead: 'firstPage'
								});
							}
						}
					}
				}
				
				Ext.MessageBox.hide();
				// var ua = navigator.userAgent;
				// xchr = ua.indexOf("Chrome");
				
				// if(xchr == -1){
					// pdf.output('datauri');
				// }else{
					urlpdf = pdf.output('datauristring');
					this.printControl.open_data_uri_window(urlpdf);
				// }
				
				if(this.printControl.printParam.lstressel == true){
					if(this.printControl.listselection.length == 0){
						Ext.Msg.alert('Sélection', 'Aucune couche n\'a été sélectionner');
					}
				}
			}
		}else if(this.printControl.printParam.affleg != "sprleg" && this.printControl.printParam.cpr == true){
			if(this.printControl.printParam.outputFormat != "pdf"){ 
				ckZipl = new CkZip();

				var files = [];
				var aFileParts = canvas.toDataURL('image/' + this.printControl.printParam.outputFormat).replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				
				var byteString = atob(aFileParts.split(',')[1]);
				var ab = new ArrayBuffer(byteString.length);
				var ia = new Uint8Array(ab);
				for (var i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				var blob = new Blob([ia], { type: 'image/' + this.printControl.printParam.outputFormat });
				var oMyBlob = new File([blob], "carte." + this.printControl.printParam.outputFormat);
				files.push(oMyBlob);
								
				if(this.printControl.printParam.cpr == true){
					var blobcp = new Blob([this.printControl.strlstcpr], { type: 'text/plain',endings:'native' });
					var oMyBlobcp = new File([blobcp], "copyright.txt");
					files.push(oMyBlobcp);
				}
				
				if(this.printControl.printParam.lstressel == true){		
					var alistlay = Ck.resultLayer;
					if(alistlay && alistlay.length > 0){								
						var blobsel = new Blob([this.printControl.csvselection], { type: 'text/csv'});
						var oMyBlobsel = new File([blobsel], "selection.csv");
						files.push(oMyBlobsel);
					}
				}
							
				ckZipl.addFiles(files, function() {
					ckZipl.getBlobURL(function(blobURL) {
						var downloadLink = document.createElement("a");
						downloadLink.href = blobURL;
						downloadLink.download = "carte.zip";
						document.body.appendChild(downloadLink);
						downloadLink.click();
						document.body.removeChild(downloadLink);
						
						Ext.MessageBox.hide();
					},this);
				});
				if(this.printControl.printParam.lstressel == true){
					if(this.printControl.listselection.length == 0){
						Ext.Msg.alert('Sélection', 'Aucune couche n\'a été sélectionner');
					}
				}
			}else{
				var pdf = new jsPDF({
					orientation: this.printControl.printParam.orientation,
					format: this.printControl.printParam.format,
					unit: "cm"
				});
				var imgURL = canvas.toDataURL("image/jpeg");
				pdf.addImage({
					imageData: imgURL,
					format: 'jpeg',
					x: 0,
					y: 0,
					w: this.printControl.pageSize[0],
					h: this.printControl.pageSize[1]
				});
				
				atmplstcpr = this.printControl.alstcpr;
				pdf.addPage();
				pdf.setFontSize(22);
				pdf.text(5, 2, "LISTE DES COPYRIGHT");
				actn = 2;
				for(i=0; i < atmplstcpr.length;i++){
					actn = actn + 1;
					pdf.setFontSize(12);
					pdf.text(1, actn, "- "+atmplstcpr[i]);
				}
				
				if(this.printControl.printParam.lstressel == true){	
					atmpselist = this.printControl.listselection
					if(atmpselist && atmpselist.length > 0){
						for(s=0; s < atmpselist.length; s++){
							pdf.addPage();
							
							if(s == 0 ){
								pdf.setFontSize(16);
								pdf.text(4, 2, "LISTE DES RÉSULTATS DE LA SÉLECTION");
								pdf.setFontSize(12);
								pdf.text(1.5, 3, atmpselist[s]['couche']);
								pdf.autoTable({
									body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
									head: [atmpselist[s]['entete']],
									body: atmpselist[s]['listsel'],
									startY: 3.5,
									showHead: 'firstPage'
								});
							}else{
								pdf.setFontSize(12);
								pdf.text(1.5, 2, atmpselist[s]['couche']);
								pdf.autoTable({
									body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
									head: [atmpselist[s]['entete']],
									body: atmpselist[s]['listsel'],
									startY: 2.5,
									showHead: 'firstPage'
								});
							}
						}
					}
				}
				
				Ext.MessageBox.hide();
				// var ua = navigator.userAgent;
				// xchr = ua.indexOf("Chrome");
				
				// if(xchr == -1){
					// pdf.output('datauri');
				// }else{
					urlpdf = pdf.output('datauristring');
					this.printControl.open_data_uri_window(urlpdf);
				// }
				
				if(this.printControl.printParam.lstressel == true){
					if(this.printControl.listselection.length == 0){
						Ext.Msg.alert('Sélection', 'Aucune couche n\'a été sélectionner');
					}
				}
			}
		}else{
			Ext.MessageBox.hide();
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
					var imgURL = canvas.toDataURL("image/jpeg");
					pdf.addImage({
						imageData: imgURL,
						format: 'jpeg',
						x: 0,
						y: 0,
						w: this.printControl.pageSize[0],
						h: this.printControl.pageSize[1]
					});
					
					if(this.printControl.printParam.cpr == true){
						atmplstcpr = this.printControl.alstcpr;
						pdf.addPage();
						pdf.setFontSize(22);
						pdf.text(5, 2, "LISTE DES COPYRIGHT");
						actn = 2;
						for(i=0; i < atmplstcpr.length;i++){
							actn = actn + 1;
							pdf.setFontSize(12);
							pdf.text(1, actn, "- "+atmplstcpr[i]);
						}
						
					}
					
					if(this.printControl.printParam.lstressel == true){	
						atmpselist = this.printControl.listselection
						if(atmpselist && atmpselist.length > 0){
							for(s=0; s < atmpselist.length; s++){
								pdf.addPage();
								
								if(s == 0 ){
									pdf.setFontSize(16);
									pdf.text(4, 2, "LISTE DES RÉSULTATS DE LA SÉLECTION");
									pdf.setFontSize(12);
									pdf.text(1.5, 3, atmpselist[s]['couche']);
									pdf.autoTable({
										body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
										head: [atmpselist[s]['entete']],
										body: atmpselist[s]['listsel'],
										startY: 3.5,
										showHead: 'firstPage'
									});
								}else{
									pdf.setFontSize(12);
									pdf.text(1.5, 2, atmpselist[s]['couche']);
									pdf.autoTable({
										body: [[{content: 'Text', styles: {halign: 'center',fontSize:1}}]],
										head: [atmpselist[s]['entete']],
										body: atmpselist[s]['listsel'],
										startY: 2.5,
										showHead: 'firstPage'
									});
								}
							}
						}
					}
					// var ua = navigator.userAgent;
					// xchr = ua.indexOf("Chrome");
					
					// if(xchr == -1){
						// pdf.output('datauri');
					// }else{
						urlpdf = pdf.output('datauristring');
						this.printControl.open_data_uri_window(urlpdf);
					// }
					if(this.printControl.printParam.lstressel == true){
						if(this.printControl.listselection.length == 0){
							Ext.Msg.alert('Sélection', 'Aucune couche n\'a été sélectionner');
						}
					}
					break;
			}
		}
		
		// Replace the map at the right place and remove temp div
		this.printControl.olMap.setTarget(this.printControl.ckMap.getView().getEl().dom.firstChild);
		this.printControl.printDiv.parentNode.removeChild(this.printControl.printDiv);
		if(this.printControl.printParam.crtref == true){
			this.printControl.printDivref.parentNode.removeChild(this.printControl.printDivref);
		}
		
		document.body.removeChild(this.printControl.layoutDiv);
				
		// Reset center, resolution and preview
		this.printControl.previewLayer.setVisible(true);
		this.printControl.olView.setCenter(this.printControl.oldCenter);
		this.printControl.olView.setResolution(this.printControl.oldRes);
		
		// Delete fake image
		this.printControl.ckMap.getView().getEl().dom.firstChild.removeChild(this.printControl.fakeMap);
	},
	
	open_data_uri_window : function(url) {
		var url_with_name = url.replace("data:application/pdf;", "data:application/pdf;name=myname.pdf;")

		var html = '<html>' +
		'<style>html, body { padding: 0; margin: 0; } iframe { width: 100%; height: 100%; border: 0;}  </style>' +
		'<body>' +
		'<iframe type="application/pdf" src="' + url_with_name + '"></iframe>' +
		'</body></html>';
		a = window.open("about:blank", "Zupfnoter");
		a.document.write(html);
		a.document.close();
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
		var rotInput = this.getView().items.get("rotate");
		rotInput.setValue(0);
		this.olView.setRotation(0);
		this.previewLayer.getSource().clear();
		this.getView().openner.close();
	},
	
	beforeclose: function(){
		var rotInput = this.getView().items.get("rotate");
		rotInput.setValue(0);
		this.olView.setRotation(0);
		this.previewLayer.getSource().clear();
	},
	
    distance:function(pt1, pt2) {
        return Math.sqrt(
            Math.pow(pt1[0] - pt2[0], 2) +
            Math.pow(pt1[1] - pt2[1], 2)
        );
    },
	
    rotate: function(point, angle, origin) {
        //angle *= Math.PI / 180;
        var radius = this.distance(point, origin);
        var theta = angle + Math.atan2(point[1] - origin[1], point[0] - origin[0]);
        var x = origin[0] + (radius * Math.cos(theta));
        var y = origin[1] + (radius * Math.sin(theta));
        return [x, y];
    }
});
