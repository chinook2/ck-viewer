/**
 * Base class for featureinfo actions.
 *
 * The ol.interaction.FeatureInfo is not used because ol does not support exotic featureinfoion (circle, polygon...).
 * However an ol.interaction.FeatureInfo is created to manage featureinfoed features properly.
 * So featureinfoions are made manually.
 * 
 * See : Ck.map.action.featureinfo.Point, Ck.map.action.featureinfo.Square ...
 */
Ext.define('Ck.map.action.FeatureInfo', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapFeatureInfo',
	
	toggleGroup: 'ckmapAction',
	tooltip: "Get feature info",
	iconCls: "fa fa-info-circle",
	
	itemId: 'featureinfo',
	
	/**
	 * Buffer around point click (in pixel)
	 */
	buffer: 5,
	
	/**
	 * Query visible layer only
	 */
	onlyVisible: true,
	
	/**
	 * 
	 */
	fieldIgnored: ["geometry", "shape", "boundedBy"],
	
	constructor: function(config) {
		Ext.define('FeatureInfoResult', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'featureid', type: 'int'},
				{name: 'field', type: 'string'},
				{name: 'value', type: 'string'}
			]
		});
		this.callParent([config]);
	},
	
	/**
	 * FeatureInfo on vector layer
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.draw = new Ck.Selection({
			type		: "Point",
			map			: map,
			callback	: this.displayInfo,
			scope		: this,
			highlight	: false
		});
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		this.draw.setActive(pressed);
	},
	
	/**
	 * Display features informations.
	 * @params {ol.Feature[][]}
	 */
	displayInfo: function(res) {
		this.res = res;
		if(this.res.length != 0) {
			this.createContainer();
			this.panel.removeAll();
			
			this.res.forEach(function(lyr) {
				this.panel.add(this.createTab(lyr));
			}, this);
			
			this.win.show();
		} else {
			// alert("Result empty!");
		}
	},
	
	/**
	 * Create panel with grid from one layer
	 * @param {Object} Result with members "features" and "layer"
	 * @return {Ext.grid.Panel}
	 */
	createTab: function(lyr) {
		var data = [];
		for(var i = 0; i < lyr.features.length; i++) {
			for(var f in lyr.features[i].values_) {
				if(this.fieldIgnored.indexOf(f) == -1) {
					data.push({
						featureid: i + 1,
						field: f,
						value: (Ext.isEmpty(lyr.features[i].values_[f]))? "" : lyr.features[i].values_[f].toString()
					});
				}
			}
		}
		
		var store = Ck.create("Ext.data.Store", {
			model: "FeatureInfoResult",
			groupField: "featureid",
			data: data
		});
		
		var grid = Ext.create('Ext.grid.Panel', {
			title: lyr.layer.get("title"),
			store: store,
			layout: "fit",
			scrollable: true,
			features: [{
				ftype: "groupingsummary",
				groupHeaderTpl: "Feature {featureid}",
				enableGroupingMenu: false,
				showSummaryRow: false,
				startCollapsed: true
			}],
			columns: [{
				text: 'Attribut',
				dataIndex: 'field',
				width: 150,
				menuDisabled: true,
				hideable: false
			},{
				text: 'Value',
				dataIndex: 'value',
				flex: 1,
				menuDisabled: true,
				hideable: false
			}]
		});
		
		return grid;
	},
	
	createContainer: function() {
		if(Ext.isEmpty(this.win)) {
			this.panel = Ck.create("Ext.tab.Panel", {
				layout: "fit"
			});
			
			this.win = Ck.create("Ext.Window", {
				width: 400,
				height: 400,
				layout: "fit",
				items: [this.panel],
				closeAction: "hide"
			});
		}
	}
});
