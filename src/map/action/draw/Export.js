/**
 */
Ext.define('Ck.map.action.draw.Export', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapDrawExport',	
	itemId: 'drawExport',
	iconCls: 'ckfont ck-draw-export',
	drawId: "default",
	requires: [
		'Ck.Draw'
	],
	 
	/**
	 * [ckLoaded description]
	 * @param  {Ck.map} map [description]
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: "default"
		});
	},
	
	/**
	 * [doAction description]
	 * @param  {Ext.button.Button} btn [description]
	 */
	doAction: function(btn) {
		var features=this.draw.getSource().getFeatures();
		var kml = new ol.format.KML({'extractStyles':true});
		var sKml = new ol.format.KML().writeFeatures(features, {
			  featureProjection: this.olMap.getView().getProjection()
		});
		this.download("export.kml",sKml);
	},

	download: function(filename, text) {
	  var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	  element.setAttribute('download', filename);

	  element.style.display = 'none';
	  document.body.appendChild(element);

	  element.click();

	  document.body.removeChild(element);
	}

	
});