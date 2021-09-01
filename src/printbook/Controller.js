/**
 * The printbook controller manage map printbooking.
 *
 * Method call order : layouChange -> loadCss -> updatePreview -> [printbookButton#click] -> beforePrintbook -> preparePrintbook -> printbook -> finishPrint <br/>
 * Below the printbook steps :
 *
 * - Once a layout is chosen the .html file and, optionnaly, the .css file are loaded
 * - renderLayout method calculate mapSize (so preview size) from layout, format and resolution
 * - [user drag the preview where he want and click "Print"]
 * - beforePrintbook call the right printbook engine (client with jsPDF or server)
 * - peparePrintbook move olMap
 */
Ext.define('Ck.printbook.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckprintbook',

	config: {
		maskMsg: 'Printing in progress...'
	},

	defaultControls: {
        layout: true,
        title: true,
        preview: false,
        format: false,
        outputFormat: "pdf",
        orientation: true,
        comment: true,
        legend: true
    },
	
    params: {
        size:'A4',
        orientation:'P'
    },
    
	layoutName: 'default',

	/**
	 * List of parameters to configure the print (dpi, format, layout, resolution, )
	 */
	// printParam: {},
	
	/**
	 * List of values to integrate in the print layout
	 * @var {Object}
	 */
	printbookValue: {},

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
	printbookDiv: null,

	/**
	 * Printed map image. Delete it after each printing.
	 * @var {DOMElement}
	 */
	mapImg: null,

	bindings: {
        onChangeValue: {
			resolution: '{printbookParam.resolution}',
			format: '{printbookParam.format}',
			etablissement: '{printbookParam.etablissement}',
			niveau: '{printbookParam.niveau}',
			zone: '{printbookParam.zone}',
			thematics: '{printbookParam.thematics}',
			thematicsValues: '{printbookParam.thematicsValues}',
			//title: '{printbookParam.title}',
			dpi:  '{printbookParam.dpi}'
		}
	},
	
	ckLoaded: function(map) {
		
	},

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		// Init print value
		var fields = this.view.getForm().getFields();
		fields.each(function(field) {
			this.printbookValue[field.name] = field.getValue() || "";
		}, this);

		this.control({
			"ckprintbook button#printbook": {
				click: this.preparePrintbook,
				scope: this
			},
			"ckprintbook button#cancelPrintbook": {
				click: this.cancel,
				scope: this
			},
			"ckprintbook combo#pbEtablissementFilter": {
				change: this.onChangeValue
			},
			"ckprintbook combo#pbNiveauFilter": {
				change: this.onChangeValue
			},
			"ckprintbook combo#pbZoneFilter": {
				change: this.onChangeValue
			},
			"ckprintbook combo#pbThematics": {
				change: this.onChangeValue
			},
			"ckprintbook combo#tagThematicsFiltersValues": {
				change: this.onChangeValue
			},
			"ckprintbook #iterateField": {
				change: this.disabledFilter
			}
		});
	},
	
	/**
	 * Display preview when view is rendered
	 */
	 displayPreview: function() {

	},
	
	destroy: function () {
		this.mask = null;
	},

	
	/**
	 * Disabled zone filter when the iterate object is a zone
	 */
	 disabledFilter: function() {
		var component = Ext.ComponentQuery.query('#pbZoneFilter')[0];
		if(Ext.ComponentQuery.query('#iterateField')[0].getValue()['iterateField'] === "zone"){
			component.setValue("");
			component.setDisabled(true);
		}else{
			component.setValue("");
			component.setDisabled(false);
		}
	},

	/**
	 * Update preview box. Update view model data (binded data is refreshed too late)
	 * Don't do anything for bind triggering (first call)
	 */
	onChangeValue: function(newValue) {
		// Get all printbook fields
		var fields = this.view.getForm().getFields();

		// Get selected velues
		var filterSelect = newValue.getDisplayField();
		var filterSelectValue = newValue.getDisplayValue();

		// Update extraparams store
		fields.each(function(field) {
			if(field.getItemId() !== 'reportName' && field.getName() !== 'iterateField'){
				this.printbookValue[field.name] = field.getValue() || "";
				if (field.getDisplayField() != filterSelect){
					if (field.getStore().getProxy().type == 'ajax'){
						var extraParams = field.getStore().getProxy().getExtraParams();
						extraParams[filterSelect] =  '"' + filterSelectValue + '"';
						field.getStore().getProxy().setExtraParams(extraParams);
						field.getStore().load();
					}
				}
			}
		}, this);

		//this.set(newValue);
		//this.set("printbookparams.etablissement", newValue).getStore().load();
		//this.set("printbookparams.niveau").getStore().load();
		//this.set("printbookparams.zone").getStore().load();
		//this.set("printbookparams.thematics").getStore().load();
	},


	/**
	 * Prepare WMS params to set on WMS call on SQL_FILTER params
	 */
	beforeWMSCall: function() {

	},

	/**
	 * Render the HTML layout just to calculate some variables. Remove it after
	 *		- pageSize : printbooked page in CENTIMETERS (with margins) -> use to create pageCanvas
	 *		- mapSize : size of the map in METERS -> use to draw preview
	 *		- canvasSize : canvas size to printbook in PIXEL -> use for making div
	 * @param {String} The HTML string
	 */
	renderLayout: function(layoutHTML) {

	},

	/**
	 * 
	 */
	composeCanvas: function() {

	},

	/**
	 * Get the spatial iteration for the print : thanks to the nullable parameters
	 */
	 getIterateField: function(params) {
		if(params["zoneFilter"] !== null){
			var iterateObj = "pre_code_local_gmao";
		}else if(params["niveauFilter"] !== null){
			var iterateObj = "zone";
		}else if(params["etablissementFilter"] !== null){
			var iterateObj = "niveau";
		}else{
			var iterateObj = "etablissement";
		}
		return iterateObj;
	},

	/**
	 * Check how the document will be print
	 */
	 beforePrintbook: function(btn) {
		//Get forms values
		var params = this.getView().getForm().getValues();

		//TODO : Catch complementary parameters : because of bbox on combo value (du to specific problem but this part must be delete)
		params['etablissementFilter'] = Ext.ComponentQuery.query('#pbEtablissementFilter')[0].getDisplayValue()
		params['niveauFilter'] = Ext.ComponentQuery.query('#pbNiveauFilter')[0].getDisplayValue()
		params['zoneFilter'] = Ext.ComponentQuery.query('#pbZoneFilter')[0].getDisplayValue()
		
		//To get the level where we will iterate
		var iterateField = Ext.ComponentQuery.query('#iterateField')[0].getValue()['iterateField'];

		//To get all object to print
		this.printbook(params, iterateField);

		/* //Extract and downloads reports for users
		this.finishPrintingBook(iterateObjects); */

		// Close popup
		var win = this.getView().up('window');
		if(win) {
			this.getView().getForm().reset();
			win.close();
		}
	},

	/**
	 * Create a snapshot of the map and display it on the user interface. <br/>
	 * Move the ol.Map in an invisible div to zoom on the right extent <br/>
	 * Hide preview box to didn't printbook it <br/>
	 * Hide listener to call the printbook method when all layers are loaded
	 */
	preparePrintbook: function(params, iterateField) {
		Ext.Ajax.request({
			url: Ck.getOption('api') +  's=printbook&r=getIterateObj',
			method: 'GET',
			params: {
				etablissement : params['etablissementFilter'],
				niveau : params['niveauFilter'],
				zone : params['zoneFilter'],
				thematics : params['pbThematics'],
				thematics_values : params['tagThematicsValues'].join("', '"),
				iterate_field : iterateField
			},
			success: this.printbook
		})
	},

	/**
	 * Once all layers loaded, create an image of map and integrate it into the HTML layout <br/>
	 * Launch an html2canvas to create a canvas of HTML layout
	 */
	printbook: function(params, iterateField) {
		//prepare params
		params['iterate_field'] = iterateField;
		var outputParams = JSON.stringify(params);

		Ext.Ajax.request({
			//url: Ck.getOption('api') +  's=reports&r=get',
			url: Ck.getOption('api') +  's=reports&r=get' + '&view=locaux_all.default' + "&params=" + outputParams + "&version=1.1.1&context=" + Ck.getMap().originOwc.data.id + "&reportname=" + params['reportName'],
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},		
			contentType: "application/json",
			dataType: "json",
			success: function(response, opts) {
				var link=document.createElement('a');
				link.href= document.location.href + "admin/uploads/reports/" + params['reportName'] + ".pdf";
				link.download= params['reportName'] + ".pdf";
				link.click();
			},
			failure: function(response, opts) {
				console.log('server-side failure with status code ' + response.status);
			}
		})
	},

	/**
	 * Take a canvas and transform it to the desired format
	 * @param {DOMElement} The canvas of the layout
	 */
	finishPrintingBook: function(canvas) {
		
	},

	/**
	 * Loop on all this.printbookValue members and put the values in the layout
	 */
	integratePrintbookValue: function() {
		
	},

	get: function(id) {
		return this.getViewModel().get(id);
	},
	
	getStore: function(id) {
		return this.getViewModel().get(id);
	},

	set: function(id, value) {
		return this.getViewModel().set(id, value);
	},
	
	getStore: function(id) {
		return this.getViewModel().get(id);
	},
	
	cancel: function() {
		this.getView().getForm().reset();
		return this.getView().openner.close();
	},
});
