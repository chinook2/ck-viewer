/**
 * Defines I18n store. This is the store that holds translations of all strings
 * in multiple languages.
 */
Ext.define('Ck.Locale', {
    singleton: true,

    locale: null,
    defaultLocale: 'en',

    /**
     *
     * @param config
     */
    constructor: function (config) {
        var locale = this.defaultLocale;
        if(Ext.manifest.locale) locale = Ext.manifest.locale;
        if(Ck.params.locale) locale = Ck.params.locale;

        var store = Ext.create('Ext.data.Store',{
            storeId: 'I18n',
            fields: ['en', 'fr', 'es'],
            autoLoad: true,
            proxy: {
                type: 'ajax',
                url: Ck.getPath() + '/locale.json',
                noCache: false,
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
            //this.locale = Ext.locale = locale;
            store.on('load', function(){
                this.set(locale);
            }, this);
        }
    },

    set: function (locale) {
        this.locale = Ext.locale = locale;
        Ext.localeReady = true;

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
        if(v) v.cascadeLocale(locale);

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
    },

    get: function () {
        return this.locale;
    }
});

