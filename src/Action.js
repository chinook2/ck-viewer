/**
 * An Action is a piece of reusable functionality that can be abstracted out of any particular component so that it
 * can be usefully shared among multiple components.  Actions let you share handlers, configuration options and UI
 * updates across any components that support the Action interface (primarily {@link Ext.toolbar.Toolbar},
 * {@link Ext.button.Button} and {@link Ext.menu.Menu} components).
 *
 * Ck.Action use a override of Ext.Component to create and manage actions instance directly from json layout
 * with the 'action' property.
 *
 * Ck.Action is a base class for all the actions. See subclasses like Ck.map.action.ZoomIn, Ck.map.action.ZoomOut...
 * Subclasses implement the doAction or toggleAction methods to add the logic.
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
 * 	Ck.actions['ckmapZoomout'].setDisabled(true);
 *
 * If you add 2 or more actions with differents parameters you have to add a unique itemId property.
 *
 */
Ext.define('Ck.Action', {
	extend: 'Ext.Action',

	disabled: false,
	hidden: false,

	itemId: '',
	text: '',
	iconCls: '',

	config: {
		/**
		 * @var {Ck.map.Controller}
		 */
		map: null,
		
		/**
		 * @var {Ck.map.Controller}
		 */
		olMap: null,
		
		/**
		 * @var {Ck.map.Controller}
		 */
		olView: null
	},
	
	/**
	 * @cfg {String/Object} tooltip
	 * The tooltip for the button - can be a string to be used as innerHTML (html tags are accepted) or
	 * QuickTips config object.
	 */
	tooltip: '',

	/**
	 * @cfg {String} toggleGroup
	 * The group this toggle button is a member of (only 1 per group can be pressed). If a toggleGroup
	 * is specified, the {@link #enableToggle} configuration will automatically be set to true.
	 */
	toggleGroup: '',

	

	/**
	 * @inheritdoc Ck.Controller
	 */
	ckReady: Ext.emptyFn,

	/**
	 * @inheritdoc Ck.Controller
	 */
	ckLoaded: Ext.emptyFn,

	constructor: function(config) {
		this.initConfig(config)
		// If init action after app load (in new popup like edit) map is here, try to init it
		this.setMap(Ck.getMap());
		
		// Use global event to call function when map is ready.
		// ckmap isn't avaible when first pass here...
		Ext.on('ckmapReady', function(map) {
			this.setMap(map);
			this.ckReady(map);
		}, this);

		Ext.on('ckmapLoaded', function(map) {
			this.setMap(map);
			this.ckLoaded(map);
			
			// Instanciate draw to load shapes from localStorage
			this.draw = Ck.Draw.getInstance({
				map: map,
				id: Ck.map.action.draw.Action.drawId
			});
			
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
			
			listeners: {
				render: this.render,
				destroy: this.destroy,
				hide: this.hide,
				scope: this
			},

			scope: this
		});
		Ck.actions.push(this);
		this.callParent(arguments);
	},
	
	render: Ext.emptyFn,
	destroy: Ext.emptyFn,
	hide: Ext.emptyFn,

    /**
     * A function called when the button is clicked (can be used instead of click event).
     *
	 * Implemented by sub classes.
     *
     * @param {Ext.button.Button} button This button.
     * @param {Ext.event.Event} e The click event.
     */
	doAction: Ext.emptyFn,

    /**
     * Function called when a Action with 'toggleGroup' set is clicked.
	 *
	 * Implemented by sub classes.
	 *
     * @param {Ext.button.Button} toggleHandler.button This button.
     * @param {Boolean} toggleHandler.state The next state of the Button, true means pressed.
     */
	toggleAction: Ext.emptyFn,
	
    setTooltip : function(text){
        this.initialConfig.tooltip = text;
        //this.callEach('setTooltip', [text]);
		// Need test if setTooltip exist
        Ext.suspendLayouts();
		this.each(function(item){
			if(Ext.isFunction(item.setTooltip)) {
				item.setTooltip(text);
			}
		});
        Ext.resumeLayouts(true);		
	},
	
	/**
	 * @param {Ck.map.Controller}
	 */
	setMap: function(map) {
		if(map !== false) {
			this._map = map;
			this.setOlMap(map.getOlMap());
			this.setOlView(map.getOlView());
		}
	}
});
