/**
 * Controller what manage multiple-wms layer modification.
 * To addlayer the multi-wms layer easily we create a layer to host simple wms.
 * In short we manipulate an ol.source.Vector (of simple geom) instead of an ol.Wms of Multi[type]
 */
Ext.define('Ck.addlayer.wms.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.wms',
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent(arguments);
		this.selector = view.getComponent("addlayer-datasourceselector");
		this.capabilities = view.getComponent("addlayer-datasourcecapabilities");
		
		// Map select event and capabilities loading
		this.selector.on("select", this.onServerSelect, this);
		
		this.getView().relayEvents(this.capabilities, ["itemclick"]);
	},
	
	dataSourceChange: function(ob, recs, idx) {
		var dsc = Ext.getCmp(this.capabilitiesId);
		if(!dsc) return;

		dsc.loadDatasource(recs.data);
	},
	
	onServerSelect: function(cbx, rcd) {
		if(Ext.isEmpty(rcd.data.type)) {
			rcd.data.type = "WMS";
		}
		this.capabilities.getController().loadDataSource(rcd.data);
	}
});
