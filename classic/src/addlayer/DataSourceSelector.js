/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.addlayer.DataSourceSelector", {
	extend: "Ext.form.field.ComboBox",
	alias: "widget.ckaddlayer-datasourceselector",
	
	itemId: "addlayer-datasourceselector",
	controller: "ckaddlayer.datasourceselector",
	
	cls: "ck-addlayer-datasourceselector",
	emptyText: 'Choose a server or type an URL...',
	
	hideLabel: true,
	editable: true,
	
	enableKeyEvents: true,
	triggerAction: 'all',
	queryMode: 'local',
	displayField: 'title',
	valueField: 'name',

	/**
	 * @param {String} Options à passer au service getCapabilities
	 */
	loaderParams: '',

	service: 'WMS',
	
	store: {
		fields: ["name", "title", "url", "service"]
	},
	
	listeners: {
		keypress: "onKeyPress"
	}
});
