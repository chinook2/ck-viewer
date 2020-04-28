/**
 * Defines I18n store. This is the store that holds translations of all strings
 * in multiple languages.
 */
Ext.define('Ck.Locale', {
    singleton: true,

    locale: null,
    defaultLocale: 'en',

    ckview: null,

    constructor: function () {
        // Override defaultLocale in app.json
        if(Ext.manifest.locale) {
            this.defaultLocale = Ext.manifest.locale;
        }
    },

    /**
     *
     * @param config
     */
    init: function (view) {
        this.ckview = view;
        var locale = this.defaultLocale;
        if(Ck.params.locale) locale = Ck.params.locale;
        
        var localeUrl = '/locale.json';
        if(Ext.manifest.localeUrl) {
            localeUrl = Ext.manifest.localeUrl;
        }
        
        var store = Ext.create('Ext.data.Store',{
            storeId: 'I18n',
            fields: ['en', 'fr', 'es'],
            autoLoad: true,
            proxy: {
                type: 'ajax',
                url: this.getFullUrl(localeUrl),
                noCache: false,
                limitParam: '',
                startParam: '',
                pageParam: '',
                reader: {
                    type: 'json',
                    rootProperty: 'data'
                }
            }
        });
        Ext.localeReady = false;
        if(store.isLoaded()){
            this.set(locale);
        } else {
            store.on('load', function(){
                this.set(locale);
            }, this);
        }
    },

    set: function (locale) {
        this.locale = locale;
        Ext.localeReady = true;
		/*
        // update the Ck.View page
        // TODO : Manage multiples views
        var v = Ext.query('.ck-view')[0];
        if(!v) {
            Ck.log("Enable to find a valid Ck.View to set Locale.");
            return;
        }

        if(v.tagName == 'BODY') {
            v = Ext.getCmp(v.firstChild.id);
        } else {
            v = Ext.getCmp(v.id);
        }
        */
        if(this.ckview) this.ckview.cascadeLocale(locale);

        // Update windows
        var aw = Ext.query('.x-window');
        aw.forEach(function(w){
            var win = Ext.getCmp(w.id);
            if(win) win.cascadeLocale(locale);
        })

        // Update globals tips
        var at = Ext.query('.x-tip');
        at.forEach(function(t){
            var tip = Ext.getCmp(t.id);
            if(tip) tip.cascadeLocale(locale);
        })

        Ext.GlobalEvents.fireEvent('cklocaleReady', this);
    },

    get: function () {
        return this.locale || this.defaultLocale;
    },


	/**
	 * Get the full URL of resource.
	 *
	 * - /name : static resource in application
	 * - name : static resource in ck-viewer package
	 *
	 * @param {string} name of the resource
	 * @return {string} the full Url
	 */
	getFullUrl: function(name) {
		var url = name;

		if(Ext.String.startsWith(name, '/')) {
            // Static resource in application
			url = 'resources' + name;
			url = url.replace('//', '/');
		}
        else {
            // Static resource in ck-viewer package
			url = Ck.getPath() + name;
		}
        
		// Security for url path
		url = url.replace(/\.\./g, '');

		return url;
	}    
});

