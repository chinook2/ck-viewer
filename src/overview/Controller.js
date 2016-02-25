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
		
		if(this.getMap().overviewCollection.getLength() == 0) {
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
			})
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
			
			this.getView().on("render", this.initOverview, this);
		}
		
		this.getMap().on("loaded", this.initOverview, this);
		this.getMap().on("contextloading", this.removeOverview, this);
	},
	
	initOverview: function() {
		var size = this.getView().getSize();
		size = [size.width, size.height];
		var extent = this.getOlView().calculateExtent(this.getOlMap().getSize());
		var width = Math.abs(extent[2]) - Math.abs(extent[0]);
		var height = Math.abs(extent[3]) - Math.abs(extent[1]);
		
		extent = [
			extent[0] + (width * 0.25),
			extent[1] + (height * 0.25),
			extent[2] - (width * 0.25),
			extent[3] - (height * 0.25),
		]
		var uniqueRes = this.getOlView().getResolutionForExtent(extent, size);
		
		var opt = {
			collapsed	: false,
			collapsible	: false,
			target		: this.getView().getEl(),
			layers		: this.getMap().overviewCollection,
			view		: new ol.View({
				projection		: this.getOlView().getProjection(),
				resolutions		: [uniqueRes],
				maxResolution	: uniqueRes,
				minResolution	: uniqueRes
			})
		};
		
		this.ovControl = new ol.control.OverviewMap(opt);
		
		this.getOlMap().addControl(this.ovControl);
	},
	
	removeOverview: function() {
		this.getOlMap().removeControl(this.ovControl);
	}
});
