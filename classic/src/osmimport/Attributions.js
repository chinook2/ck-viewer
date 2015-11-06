/**
 * View for the attributions panel for the OSM Import.
 * @author Florent RICHARD
 */

Ext.define("Ck.osmimport.Attributions", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportattributions",
	items: [{
		bind: {
			html: '<p>Attributions: OpenStreetMap Contributors</p>'
		}
	}],
	cls: "ck-osmimport-attributions"
});
