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
	iconCls: "ckfont ck-info2",

	itemId: 'featureinfo',

	timerId: null,

	config: {
		/**
		 * False to keep heavy UI
		 */
		light: true,

		/**
		 * Number of feature needed. Limit per layer. If null no limit will be applied.
		 */
		limit: 1,

		/**
		 * Buffer around point click (in pixel)
		 */
		buffer: 5,

		/**
		 * Query visible layer only
		 */
		onlyVisible: true,

		/**
		 * Hide fields without Alias
		 */
		onlyFieldWithAlias: false,

		/**
		 *
		 */
		fieldIgnored: ["geom", "geometry", "shape", "boundedBy"],

		/**
		 * List of queryed layers
		 */
		layers: null,

		/**
		 * Capitalize first letter of field name
		 */
		capitalize: true,

		winWidth: 400,
		winHeight: 400,
		winCollapsible: true,
		winEmptyResult: true,

		selectionConfig: {}
	},

	constructor: function(config) {
		var s = Ext.data.schema.Schema.get();
		if (!s.hasEntity('FeatureInfoResult')) {
			Ext.define('FeatureInfoResult', {
				extend: 'Ext.data.Model',
				fields: [
					{name: 'groupby', type: 'string'},
					{name: 'field', type: 'string'},
					{name: 'value', type: 'string'}
				]
			});
		}

		this.callParent(arguments);
	},

	destroy: function () {

	},

	/**
	 * FeatureInfo on vector layer
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();

		var selConf = Ext.applyIf(this.getSelectionConfig(), {
			type			: "Point",
			map				: map,
			callback		: this.displayInfo,
			scope			: this,
			highlight		: false,
			layers			: this.getLayers(),
			buffer			: this.getBuffer(),
			limit			: this.getLimit(),
			beforeProcess	: this.beforeSelection
		})

		this.draw = new Ck.Selection(selConf);
		if (this.btn && this.btn.pressed) {
			this.draw.setActive(true);
		}
	},

	beforeSelection: function() {
		if(!Ext.isEmpty(this.timerId)) {
			clearTimeout(this.timerId);
			delete this.timerId;
		}
	},

	/**
	 *
	 */
	toggleAction: function(btn, pressed) {
		this.btn = btn;
		if(this.draw) this.draw.setActive(pressed);
		this.createContainer();

		// Action disable
		if(!pressed) {
			if(this.draw.getSelect()) {
				this.draw.getSelect().getFeatures().clear()
			}
		}
	},

	/**
	 * Display features informations.
	 * @params {ol.Feature[][]}
	 */
	displayInfo: function(res) {
		this.res = res;
		this.win.removeAll();
		var dInfo = false;

		if(this.res.length !== 0) {
			if(this.res.length < 2 && this.getLight()) {
				var t = this.createTab(this.res[0]);
				if (t) {
					this.win.add(t);
					dInfo = true;
				}
			} else {
				var tab = [];
				this.res.forEach(function(lyr) {
					var t = this.createTab(lyr);
					if (t) {
						tab.push(t);
						dInfo = true;
					}
				}, this);

				if (dInfo) {
					this.panel = Ck.create("Ext.tab.Panel", {
						layout: "fit",
						header: false,
						defaults: {
							width: "100%"
						},
						items: tab
					});
					this.win.add(this.panel);
				}
			}
		}

		if (!dInfo) {
			if (this.getWinEmptyResult() === false) {
				Ck.log("Empty result");
				return;
			}

			this.win.add({
				xtype: "panel",
				layout: "center",
				items: [{
					xtype: "label",
					text: "No results.",
					cls: "ck-big-text"
				}]
			});
		}

		if (this.getWinCollapsible() === true) {
			this.timerId = setTimeout(function() {
				this.collapse(Ext.Component.DIRECTION_TOP, 1000);
			}.bind(this.win), 1000);
		}

		this.win.show();
		this.win.expand(1000);
	},

	/**
	 * Create panel with grid from one layer
	 * @param {Object} Result with members "features" and "layer"
	 * @return {Ext.grid.Panel}
	 */
	createTab: function(lyr) {
		var field, alias, tpl, data = [];
		var col = lyr.layer.getExtension("columns") || {};
		var nameTpl = lyr.layer.getExtension("featureNameTpl");
		if(nameTpl) nameTpl = new Ext.XTemplate(nameTpl);
		for(var i = 0; i < lyr.features.length; i++) {
			var rawValues = lyr.features[i].getProperties() || {};

			var fName = 'Feature ' + (i+1);
			if (nameTpl) {
				fName = nameTpl.apply(rawValues) || '';
			}

			// Order fields
			var values = {};
			// List all alias in order
			for(var c in col) {
				if (rawValues.hasOwnProperty(c)) {
					values[c] = rawValues[c];
				}
			}
			// Add the others fields
			var diffValues = Ext.Array.toMap(Ext.Array.difference(
				Ext.Object.getKeys(rawValues),
				Ext.Object.getKeys(values)));
			for(var df in diffValues) {
				if(this.getFieldIgnored().indexOf(df) !== -1) {
					continue;
				}
				if (rawValues.hasOwnProperty(df)) {
					values[df] = rawValues[df];
				}
			}
			//

			for(var f in values) {
				alias = false;
				tpl = false;
				if (Ext.isObject(col[f])) {
					alias = col[f].alias || false;
					tpl = col[f].tpl || false;
				}

				field = alias || f;

				// Ignore fields without Alias when onlyFieldWithAlias is true
				if (!alias && this.getOnlyFieldWithAlias()) {
					continue;
				}

				var val = values[f] || '';

				if (tpl) {
					// Auto transform string to object for complex template (loop)
					var oVal = Ext.decode(val, true);
					if(oVal) values[f] = oVal;

					tpl = new Ext.XTemplate(tpl);
					val = tpl.apply(values) || '';
				}

				data.push({
					groupby: fName,
					field: (this.getCapitalize())? Ext.String.capitalize(field) : field,
					value: val.toString()
				});
			}
		}

		// No data > ignore tab
		if (data.length === 0) {
			return false;
		}

		var store = Ck.create("Ext.data.Store", {
			model: "FeatureInfoResult",
			groupField: "groupby",
			data: data
		});

		var title = lyr.layer.get("title");

		if(lyr.features.length < 2 && this.getLight()) {
			var ttpl = lyr.layer.getExtension("titleTpl");
			if(Ext.isString(ttpl)) {
				ttpl = new Ext.Template(ttpl);
				title = ttpl.apply(lyr.features[0].getProperties());
			}
		}

		var opt = {
			title: title,
			store: store,
			layout: "fit",
			scrollable: true,
			hideHeaders: this.getLight(),
			header: (this.getLight())? { padding: 0 } : true,
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
		};

		if(lyr.features.length > 1 && this.getLight()) {
			opt.features = [{
				ftype: "groupingsummary",
				groupHeaderTpl: "{name}",
				enableGroupingMenu: false,
				showSummaryRow: false,
				startCollapsed: true
			}];
		}

		var grid = Ext.create('Ext.grid.Panel', opt);

		return grid;
	},

	createContainer: function() {
		if(Ext.isEmpty(this.win)) {
			var opt = {
				height: this.getWinHeight(),
				width: this.getWinWidth(),
				minHeight: 250,
				minWidth: 300,
				layout: 'fit',
				y: 0,
				parentMap: this.getMap(),
				header: (this.getLight())? { padding: 0 } : true,
				closeAction: 'hide',
				collapsible: this.getWinCollapsible(),
				maximizable: !this.getLight(),
				items: []
			};

			opt.x = Ext.getBody().getSize().width - opt.width;

			this.win = Ck.create(this.classWindow, opt);
		}
	}
});
