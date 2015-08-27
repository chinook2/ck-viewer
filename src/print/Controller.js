/**
 * The map controller allow to interact with the map. You can use the Ck.map.Model binding to control the map from a view
 * or you can use directly the map controller functions from another controller or a Ck.Action.
 * 
 * ### ckmap is the controller
 *
 * The events like ckmapReady, the Ck.Controller#getMap (and by inheritance getMap() of all the ck controllers) return a Ck.map.Controller.
 *
 * Example in Ck.map.action.ZoomIn :
 *
 *		var map = Ck.getMap();
 *		map.setZoom( map.getZoom() + 1 );
 *
 * Example in Ck.legend.Controller : 
 *
 *     var layers = this.getMap().getLayers()
 *
 * ### Events relay
 * 
 * The map controller relay also ol.Map events like addLayer.
 *
 */
Ext.define('Ck.print.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckprint',
	
	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		var toto = "toto";
		var v = this.getView();
		
		// v.add();
		this.control({
			"ckprint button#print": {
				click: this.print
			},
			"ckprint button#cancel": {
				click: this.cancel
			}
		});
		
	},
	
	print: function(btn) {
		if(!Ext.supports.Canvas) {
			Ext.Msg.show({
				title: "Print error",
				message: "Your browser doesn't support canvas and print tool need it. Use a modern browser.",
				icone: Ext.Msg.Error,
				buttons: Ext.Msg.OK
			})
		}
		
		var map = Ck.getMap().getOlMap();
		map.once('postcompose', function(event) {
			var canvas = event.context.canvas;			
			uri = canvas.toDataURL('image/png').replace(/^data:image\/[^;]/, 'data:application/octet-stream')
			
			var downloadLink = document.createElement("a");
			downloadLink.href = uri;
			downloadLink.download = "data.png";
			
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
		}, btn);
		map.renderSync();
	},
	
	cancel: function() {
		this.getView().openner.close();
	}
});
