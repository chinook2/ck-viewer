/**
 * An Action is a piece of reusable functionality that can be abstracted out of any particular component so that it
 * can be usefully shared among multiple components.  Actions let you share handlers, configuration options and UI
 * updates across any components that support the Action interface (primarily {@link Ext.toolbar.Toolbar},
 * {@link Ext.button.Button} and {@link Ext.menu.Menu} components).
 *
 * Ck.Action use a override of Ext.Component () to create and manage actions instance directly from json layout
 * with the 'action' property.
 *
 * Example : 
 * 
 *     {
 *     	"xtype": "ckmap",        
 *     	"region": "center",
 *     	"center": [260000, 5900000],
 *     	"zoom": 6,
 *     	"dockedItems": [{
 *     		"xtype": "cktoolbar",
 *     		"dock": "right",
 *     		"defaults": {
 *     			"scale": "large"
 *     		},
 *     		"items": [{
 *     			"action": "ckmapZoomin"
 *     		},{
 *     			"action": "ckmapZoomout"
 *     		}]
 *     	}]
 *     }
 * 
 * You can access a action by the global Array Ck.actions. 
 *
 * 	Ck.actions['ckmapZoomin'].doAction();
 *		Ck.actions['ckmapZoomout'].setDisabled(true);
 *
 * If you have to create 2 or more actions with different parameters you have to add a unique itemId property.
 *
 */
Ext.define('Ck.Action', {
	extend: 'Ext.Action',
	
	disabled: false,
	hidden: false,
	
	itemId: '',
	text: '',
	iconCls: '',
	
	/**
	 * @inheritdoc Ext.button.Button#tooltip
	 */
	tooltip: '',
	
	_map: null,
	
	/**
     * @inheritdoc Ck.Controller
	 */	
	ckReady: Ext.emptyFn,
	
	/**
     * @inheritdoc Ck.Controller
     */
	ckLoaded: Ext.emptyFn,
	
    constructor: function(config) {
		// Use global event to call function when map is ready.
		// ckmap isn't avaible when first pass here...
		Ext.on('ckmapReady', function(map) {
			this._map = map;
			this.ckReady(map);
		}, this);
		
		Ext.on('ckmapLoaded', function(map) {
			this._map = map;
			this.ckLoaded(map);
		}, this);
		
		config = Ext.applyIf(config || {}, {
			disabled: this.disabled,
			hidden: this.hidden,
			itemId: this.itemId,
			text: this.text,
			iconCls: this.iconCls,
			handler: this.doAction,
			
			tooltip: this.tooltip,
			toggleGroup: this.toggleGroup,
			toggleHandler: this.toggleAction,
			
			scope: this
		});
        this.callParent([config]);
    },
	
	/**
     * Called on button click.
	 */	
	doAction: Ext.emptyFn,
	
	/**
     * Called on button toggle.
	 */	
	toggleAction: Ext.emptyFn,
	
	/**
     * @inheritdoc Ck.Controller
	 */	
	getMap: function() {
		return this._map;
	}
});
