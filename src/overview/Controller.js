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
				Ck.Msg.show({
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
	
   /**
    * Initialize the control.OverviewMap. Calculate the extent, first from the owc
	*/
	initOverview: function() {
		var extent = this.getMap().originOwc.getExtent();
		
		if(!Ext.isArray(extent)) {
			// Wrong way to calculate. Depend of current view 
			var extent = this.getOlView().calculateExtent(this.getOlMap().getSize());
		}

		var width = Math.abs(extent[2]) - Math.abs(extent[0]);
		var height = Math.abs(extent[3]) - Math.abs(extent[1]);
		
		var size = this.getView().getSize();
		size = [size.width, size.height];
		
		var res = [this.getOlView().getResolutionForExtent(extent, size)];
		
		for(var i = 1; i < this.config.nbRes; i++) {
			res.push(res[0] / (Math.pow(2, i)));
		}
		
		var opt = {
			collapsed	: false,
			collapsible	: false,
			target		: this.getView().getEl(),
			layers		: this.getMap().overviewCollection,
			view		: new ol.View({
				projection		: this.getOlView().getProjection(),
				resolutions		: res,
				maxResolution	: res[res.length - 1],
				minResolution	: res[0]
			})
		};
		
		this.ovControl = new ol.control.OverviewMap(opt);
		
		this.getOlMap().addControl(this.ovControl);
	},
	
	removeOverview: function() {
		this.getOlMap().removeControl(this.ovControl);
	}
});
