/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.map.ScaleList", {
	extend: "Ext.form.field.ComboBox",
	alias: "widget.ckmap-scalelist",
	
	itemId: "map-scalelist",
	controller: "ckmap.scalelist",
	cls: "ckmap-scalelist",
	
	emptyText: Ck.text('scale_list_notavailable'),
	
	shadow: false,
	hideLabel: true,
	editable: false,
	
	triggerAction: 'all',
	queryMode: 'local',
	
	displayField: 'scale',
	valueField: 'res',
	
	config: {
		floatConfig: {
			alignTo: "ol-scale-line",
			alignPos: "tl",
			alignOff: null,
			alignEl: null
		}
	}
});
