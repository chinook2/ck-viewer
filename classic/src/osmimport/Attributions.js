/**
 * View for the attributions panel for the OSM Import.
 * @author Florent RICHARD
 */

Ext.define("Ck.osmimport.Attributions", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportattributions",
	items: [{
		xtype: "panel",
		width: 600,
		margin: 10,
		layout: {type: "hbox", align: "middle"},
		items: [{
			xtype: "image",
			src: Ck.getPath() + "/icons/iconosm.png",
			alt: "OSM",
			width: 80,
			height: 80
		},{
			xtype: "component",
			html: '<p>© <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors</p>'
			    + '<p>OSM Data is under <a href="http://www.opendatacommons.org/licenses/odbl">Open Data Commons Open Database License</a> (ODbL)</p>'
			    + '<p>For more information, read the <a href="http://www.openstreetmap.org/copyright">OSM copyright page</a></p>'
		}]
	}],
	cls: "ck-osmimport-attributions"
});
