/**
 * Plugin for compatibility V1 on chained combobox (children)
 */
Ext.define('Ck.form.plugin.ChainedCombo', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.formchainedcombo',
    
    id: 'chainedcombo',
    pluginId: 'chainedcombo',

    child: false,
    store: null,

	config: {
		childs		    : null,
		formController	: null,
		formViewModel	: null
    },
    
	init: function(cmp) {
		// Apply only on subclass of component/box/field/{xtype}
		if(cmp.getXTypes().indexOf('/combobox/') == -1) {
			return;
		}
		
		var config = {
			childs			: cmp.childs,
			formController	: cmp.lookupController(),
			formViewModel	: cmp.lookupViewModel()
		};

		this.setConfig(config);
        
        cmp.on({
            afterrender: this.onRenderCmp,
            select: function(c,o,n){                
                this.updateChilds(true, true);
            },
            scope: this
        });

        this.child = this.isChild();

        this.store = cmp.getStore();
        this.store.on({
            beforeload: function() {
                // Child sans filtre > on ne charge pas le store
                if (Ext.Object.isEmpty( cmp.parentValue ) && this.child) {
                    return false;
                }
            },
            load: function() {
                // Les données sont chargées on active le combo
                cmp.setDisabled(false);

                // Si il y a des combo enfants il faut mettre à jour
                //if(cmp.value && cmp.value != '') this.updateChilds(true, false);
            },
            scope: this
        });        
	},

	destroy: function () {
		this.cmp.lookupController().clearListeners();
		this.callParent(arguments);
    },
    
	/**
	 * Replace input field with text field.
	 */
	onRenderCmp : function(cmp){
    },
 
    updateStore: function() {
        if(!this.store) return;

        var url = this.store.getProxy().getUrl();
        if(!url) return;

        var urlParams = url.split('?');
        if(urlParams.length != 2 ) return;

        var baseparams = Ext.Object.fromQueryString(urlParams[1]);

        baseparams.params = encodeURIComponent(Ext.encode(this.cmp.parentValue));

        url = urlParams[0] + '?' + Ext.Object.toQueryString(baseparams);
        this.store.getProxy().setUrl(url);

        // Charge les données en mode local automatiquement
        this.store.reload();
    },

    isChild: function() {
        var form = this.getFormController();
        if(!form) return false;
        if(form.childrens.indexOf(this.cmp.id) != -1) {
            return true;
        }
        return false;
    },

    updateChilds: function (reload, reset) {
        var childs = this.getChilds();
        if(!Ext.isArray(childs)) return;
        
        for(var i=0; i<childs.length;i++){
            var cbo = Ext.getCmp(childs[i]);
            if(!cbo) continue;

            var plugin = cbo.getPlugin('chainedcombo');
            if(!plugin) continue;            
            
            // resetChilds
            if(reset===true) cbo.setValue('');
            cbo.setDisabled(true);

            if(reload===true) {
                // Récup des paramètres parent + ajout paramètre en cours
                Ext.apply(cbo.parentValue, this.cmp.parentValue);
                cbo.parentValue[this.cmp.name] = this.cmp.getValue();
                
                plugin.updateStore();
            }
            
            // Applique aussi aux enfants des enfants...
            plugin.updateChilds(false, reset);
        }
    }
});
