/**
 * The draw controller manage drawing over map.
 */

Ext.define('Ck.draw2.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckdraw2',
	
	/**
	 * List of parameters for configuration
	 */
	defaultParam: {},

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		/*var v = this.getView();
		var vm = this.getViewModel();
		this.ckMap = Ck.getMap();
		this.olMap = this.ckMap.getOlMap();
		this.olView = this.ckMap.getOlView();
		
		Ext.apply(this.defaultParam, vm.getData().defaultParam);
		
		this.loadDefaultParam();
		
		
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
		});*/
	},
	
	/**
	 * Set default value for each item
	 */
	loadDefaultParam: function() {
		var defaultParam = this.defaultParam;

		/*var resCbx = this.getView().items.get("resolution");
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
		oriRG.setValue({"orientation": printParam.orientation});*/
	}

});