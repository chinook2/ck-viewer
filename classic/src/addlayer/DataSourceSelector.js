/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.addlayer.DataSourceSelector", {
	extend: "Ext.form.field.ComboBox",
	alias: "widget.ckaddlayer-datasourceselector",
	
	controller: "ckaddlayer.datasourceselector",
	
	cls: "ck-addlayer-datasourceselector",
	itemId: "addlayer-datasourceselector",
	height: "auto",
	
	queryMode: 'local',
	
	
	hideLabel: true,
	enableKeyEvents: true,
	triggerAction: 'all',
	editable: true,

	displayField: 'title',
	valueField: 'name',

	emptyText: 'Choose a server or type an URL...',

	/**
	 * @param {String} Options à passer au service getCapabilities
	 */
	loaderParams: '',

	service: 'WMS',
	
	store: {
		fields: ["name", "title", "url", "type"]
	},
	
	listeners: {
		keypress: "onKeyPress",
		select: "onServerSelect"
	}
});
