/**
 * Controller what manage multiple-wfs layer modification.
 * To addlayer the multi-wfs layer easily we create a layer to host simple wfs.
 * In short we manipulate an ol.source.Vector (of simple geom) instead of an ol.Wfs of Multi[type]
 */
Ext.define('Ck.addlayer.wfs.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.wfs',
	
	
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.olMap = Ck.getMap().getOlMap();
		this.selector = view.getComponent("ckaddlayer-wfs-datasourceselector");
		this.capabilities = view.getComponent("ckaddlayer-wfs-datasourcecapabilities");
		
		// Load defaults WFS server
		this.selector.getStore().loadData(view.sources);
		
		// Map select event and capabilities loading
		this.selector.getController().onServerSelect = this.onServerSelect.bind(this);
		
		this.callParent([view]);
	},
	
	dataSourceChange: function(ob, recs, idx) {
		var dsc = Ext.getCmp(this.capabilitiesId);
		if(!dsc) return;

		dsc.loadDatasource(recs.data);
	},
	
	onServerSelect: function(cbx, rcd) {
		if(Ext.isEmpty(rcd.data.type)) {
			rcd.data.type = "WFS";
		}
		this.capabilities.getController().loadDataSource(rcd.data);
	}
});
