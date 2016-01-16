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
		layout: "hbox",
		items: [{
			xtype: "image",
			src: Ck.getPath() + "/icons/iconosm.png",
			alt: "OSM",
			width: 80,
			height: 80,
			margin: "10 10 0 0"
		},{
			xtype: "component",
			height: 180,
			html: '<p>© <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors</p>'
			    + '<p>OSM is Open Data, licensed under <a href="http://www.opendatacommons.org/licenses/odbl">Open Data Commons Open Database License</a> (ODbL)</p>'
			    + '<p>You are free to copy, distribute, transmit and adapt our data, as long as you credit OpenStreetMap and its contributors. If you alter or build upon our data, you may distribute the result only under the same licence.</p>'
				+ '<p>For more information, read the <a href="http://www.openstreetmap.org/copyright">OSM copyright page</a></p>'
		}]
	}],
	cls: "ck-osmimport-attributions"
});
