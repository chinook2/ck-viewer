/**
 *
 */
Ext.define('Ck.legend.plugin.Action', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.action',

	disableClass: "ck-disablePlugin",

	init: function(cmp) {
		this.tree =  cmp;

		// Get the Action Column
		this.actionColumn = cmp.down('actioncolumn');
		if(!this.actionColumn) {
			Ck.log("No actionColumn found for Ck.legend.plugin.action.");
			return;
		}

		// Add tree reference to the actionColumn
		this.actionColumn.ownerTree = cmp;

		// Init the Action Column (items is wrong on init !)
		if(this.actionColumn.items && (this.actionColumn.items.length == 1) && (this.actionColumn.items[0].xtype == 'actioncolumn')) {
			this.actionColumn.items = [];
		}

		if(Ext.os.is.Desktop && this.tree.autoHideActions !== false) {
			// Show/Hide Actions icons
			var tview = this.tree.getView();
			if(!tview.hasListener('highlightitem') ) {
				tview.on({
					// Hide actions for first items show
					viewready: function(tree, eOpts ) {
						var el = tree.getEl();
						el.select('.x-action-col-cell').hide();
					},
					// Hide actions on collapse (global refresh)
					refresh: function(tree, eOpts) {
						var el = tree.getEl();
						el.select('.x-action-col-cell').hide();
					},
					// Hide actions on expand (first childs show)
					itemadd: function(records, index, node, eOpts ) {
						node.forEach(function(n){
							var rowEl = Ext.get(n);
							rowEl.down('.x-action-col-cell').hide();
						})
					},

					// Show actions when mouse enter item
					highlightitem: function(view, node, eOpts) {
						var rowEl = Ext.get(node);
						rowEl.down('.x-action-col-cell').show();
					},
					// Hide actions when mouse leave item
					unhighlightitem: function(view, node, eOpts) {
						var rowEl = Ext.get(node);
						rowEl.down('.x-action-col-cell').hide();
					},
					scope: this
				});
			}
		}

		this.setAction();
	},

	setAction: function(action) {
		if(!action) {
			action = {
				tooltip: this.tooltip,
				handler: this.handlerAction,
				// Disabled actions for groups
				// view, rowIndex, colIndex, item, record
				isDisabled: function(v, r, c, i, rec) {
					if(rec && !rec.get('layer')) return true;
					return false;
				},
				getClass: function(v, meta, rec) {
					if(rec && !rec.get('layer')) return this.disableClass;
					return this.iconCls;
				},
				scope: this
			};
		}

		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
		this.actionColumn.fireEvent('add', action);
	},

	// tree, rowIndex, colIndex, row, event, record
	handlerAction: function(tree, r, c, row, event, rec) {
		var layer = rec.get('layer');
		if(!layer) return;

		this.doAction(layer);
	},

	doAction: Ext.emptyFn,

	getMap: function() {
		return this.tree.getController().getMap();
	}

});
