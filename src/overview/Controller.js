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
Ext.define('Ck.overview.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckoverview',

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		this.callParent(arguments);
		this.view = this.getView();

		this.config = this.getView().getConfig();

		var ovLayer = this.getMap().overviewLayer;
		if (ovLayer) {
			//ovLayer
			this.ovLayers = [ovLayer];
		} else {
			this.ovLayers = this.getMap().getLayers(function(lyr) {
				return (lyr.getExtension && lyr.getExtension("overviewLayer") === true);
			});
		}

		if(this.ovLayers.length === 0) {
			this.getView().on("beforerender", function() {
				if(this.openner.close) {
					this.openner.close();
				}
				Ext.Msg.show({
					title: "Overview",
					message: "No layer associate to overview",
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.WARNING
				});
				return false;
			});
		} else {

			// Stylesheet creation for overview
			this.style = document.createElement("style");
			this.style.appendChild(document.createTextNode(""));
			document.head.appendChild(this.style);

			this.style.innerHTML = ".ck-overview .ol-overviewmap-map, .ck-overview .ol-overviewmap{ \
				width: " + this.config.ovWidth + "px; \
				height: " + this.config.ovHeight + "px; \
				border: 0px; \
				margin: 0px; \
				padding: 0px; \
			}";

			this.view.setWidth(this.config.ovWidth);
			this.view.setHeight(this.config.ovHeight);

			this.getView().on("render", this.attachOvControl, this);
		}
	},

	attachOvControl: function() {
		var view = new ol.View({
			//center: this.getMap().getView().getCenter(),
			projection: this.getMap().originOwc.getProjection()
		});

		var opt = {
			collapsed: false,
			collapsible: false,
			target: this.getView().getEl(),
			layers: this.ovLayers,
			view: view
		};

		this.ovControl = new ol.control.OverviewMap(opt);

		this.getOlMap().addControl(this.ovControl);
	}
});
