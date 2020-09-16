/**
 * Component override that implements custom setters that run texts through translate
 * function for preperties listed in localeProperties array.
 *
 * Override for "action" config parameter.
 */
// http://extjs.eu/ext-examples/#ext-localization-concept
Ext.Localisable = [];
Ext.define('Ext.overrides.Component', {
	override: 'Ext.Component',

	/**
	 * @cfg {string/Array} [localeProperties=html] A string or array of strings
	 * of properties on the component to be localized.
	 */
	localeProperties: 'html',


	/**
	 * @cfg {string} localeStore storeId of the store that holds strings
	 * translated in multiple languages.
	 */
	localeStore: 'I18n',

	constructor: function(config) {
		config = config || {};
		if(config.ckAction) {
			var key = config.ckAction;
			var action = key;
			
			// Allow to add same action twice or more with a different itemId
			if(config.itemId) key += config.itemId;
			// Special test for actions to change Locale (init simpliest)
			if(config.toLocale) {
				config.itemId = key += '-' + config.toLocale;
			}

			if( Ck.actions[key] ) {
				config = Ck.actions[key];
			} else {
				try {
					config = Ext.create('widget.'+action, config);
					Ck.actions[key] = config;
				} catch (e) {
					Ck.log("Enable to init action '"+ action +"'");
				}					
			}
		}

		this.callParent([config]);

		// Register actions on render & Unregister on destroy
		this.on({
			render: function () {
				if(key) Ck.actions[key] = config;
			},
			destroy: function () {
				if(key) delete Ck.actions[key];
			}
		});
	},

	
	initComponent: function() {
		var me = this;
		var configurator, localeConfig;
		if(me.getConfigurator) {
			configurator = me.getConfigurator();
			localeConfig = configurator.configs.locale;
		}
		// For Ext 6.2
		else if(me.self.getConfigurator) {
			configurator = me.self.getConfigurator();
			localeConfig = configurator.configs.locale;
		}
		//
		
		//var locale = me.locale || Ck.Locale.get();
		var locale = Ck.Locale.get();

		if(!localeConfig && configurator) {
			configurator.add({
				locale: locale
			});
		}

		// Wait for locale.json loaded
		//if(me.setLocale) {
			if(Ext.localeReady) {
				me.cascadeLocale(locale);
			} else {
				Ext.on('cklocaleReady', function() {
					me.cascadeLocale(Ck.Locale.get());
				}, this);
			}
		//}
		this.callParent();
	},


	updateLocale:function(newLocale, oldLocale) {
		if(!Ext.localeReady) return;
		this.doLocale();
	},
	/* Search for parent component:
		 * - if Innola as parent but not Ck as parent => don't apply cascade (ensure we don't apply translate where not necessary)
		 * - if Innola as parent and Ck as parent => apply cascade (means inside a map Ck-laSpatialUnit panel)
		 * - element directly in body (window, tooltip, menu, ...) are often protected (because they have a parent Innola )
		 */
	isLocaleToBeApplied: function() {
		if (this.__proto__.$className.startsWith('Innola')) {
			return false;
		}
		
		var parentInnola = this.findParentBy(function(parent) {
			return parent.__proto__.$className.startsWith('Innola');
		});
		var parentCk =  this.findParentBy(function(parent) {
			return parent.__proto__.$className.startsWith('Ck');
		});
		if (parentInnola && !parentCk) {
			return false;
		}
		return true;
	},
	cascadeLocale:function(locale) {
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;
		var me = this;
		
		//<debug>
		//console.log('cascadeLocale::['+ me.getXType() +'] ' + me.id + ' (' + locale + ')');
		//</debug>
		if(me.setLocale) {
			me.setLocale(locale);
		}

		if(me.items) {
			if(Ext.isFunction(me.items.forEach)){
				me.items.forEach(function (item) {
					if (item.cascadeLocale) {
						item.cascadeLocale(locale);
					}
				});
			} else if (Ext.isFunction(me.items.each)) {
				me.items.each(function (item) {
					if (item.cascadeLocale) {
						item.cascadeLocale(locale);
					}
				});
			}
		}

		if(me.dockedItems && me.dockedItems.each) {
			me.dockedItems.each(function(item){
				if(item.cascadeLocale) {
					item.cascadeLocale(locale);
				}
			});
		}

		if(Ext.Date && Ext.Date.setLocale) {
			Ext.Date.setLocale(locale);
		}

		if(me.getMenu) {
			// me.getMenu();
		}

		if(me.menu && me.menu.cascadeLocale) {
			me.menu.cascadeLocale(locale);
		}

		// TODO : translate plugins here ?
		if(me.plugins) {}
		// TODO : translate actions here ?
		if(me.action) {}
		
	},

	_createLocaleSetter : function(property) {
		var me = this;
		var configurator;
		if(me.getConfigurator) {
			configurator = me.getConfigurator();
		}
		// For Ext 6.2
		else if(me.self.getConfigurator) {
			configurator = me.self.getConfigurator();
		}
		
		var config = configurator.configs[property],
			setName,
			localeName,
			oldSetter,
			newSetter;

		if (!config) {
			config = configurator.configs[property] = new Ext.Config(property);
		}

		setName = config.names.set;
		localeName = config.names.internal + 'Locale';

		oldSetter = this[setName] || function(value) {
			this[config.name] = value;
		};

		translate = function(val, localeName) {
			var me = this,
				// toLocale : special to force a language (used with action cklocaleSet)
				toLocale = me.toLocale || me.getLocale(),
				store = Ext.getStore(me.localeStore),
				str,
				rec;
			var fromLocale = me[localeName] || Ck.Locale.defaultLocale;

			if (store && val && fromLocale !== toLocale) {
				rec = store.findRecord(fromLocale, val, 0, false, true, true);
				str = rec ? rec.get(toLocale) : null;
				if(str) {
					me[localeName] = toLocale;
				}
			}
			
			if(Ext.Localisable.indexOf(val) == -1) {
				Ext.Localisable.push(val);
			}

			//<debug>
			//Ck.log("  [" + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + fromLocale + ' -> ' + toLocale + ') :: '+ localeName );
			//console.log("  [" + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + fromLocale + ' -> ' + toLocale + ') :: '+ localeName );
			//</debug>
			return str ? str : val;
		};

		if (oldSetter && oldSetter.isLocaleSetter) {
			newSetter = oldSetter;
		} else {
			newSetter = this[setName] = function(value) {
				var me = this,
					val = Ext.isObject(value) ? value.text : value;
				if(val){
					val = translate.call(me, val, localeName);
				}
				return oldSetter.call(me, val);
			};
			newSetter.isLocaleSetter = true;
		}
		return newSetter;
	},

	doLocale : function() {
		
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;
		var me = this,
			properties = Ext.Array.from(me.localeProperties),
			i = 0,
			length = properties.length,
			property,setter;

		for (; i < length; i++) {
			var value = null;
			property = properties[i];
			// if((!me.hasOwnProperty(property)) && (me.config.bind && !me.config.bind.hasOwnProperty(property))) continue;

			if (me.hasOwnProperty(property)) {
				value = me[property];
			} else if (me.config && me.config.hasOwnProperty(property)) {
				value = me.config[property];
			}

			setter = me._createLocaleSetter(property);
			if ((value == '' && this.xtypes.indexOf('textfield') > -1 && ['emptyText'].indexOf(property) > -1) || // ensure to keep some default value at ''
				(value && value != '&#160;')) {
				setter.call(me, value);
			}
		}
	}
	
} /*,
 function(){
 var cProto = Ext.Component.prototype,
 localeStore = cProto.localeStore;
 Ext.apply(Ext.Date, {
 setLocale:function(locale) {
 var me = this,
 store = Ext.getStore(localeStore),
 monthNames,
 monthNumbers,
 dayNames,
 defaultFormat = me.defaultFormat,
 rec;
 if(locale && locale !== me.locale && store && store.getCount()) {
 Ext.Array.each(me.monthNames, function(m, i){
 var rec, month;
 rec = store.findRecord(me.locale || 'en', m, 0, false, true, true);
 if(rec) {
 month = rec.get(locale);
 }
 if(month) {
 monthNames.push(month);
 monthNumbers[month] = i;
 monthNumbers[month.substring(0, 3)] = i;
 }
 });
 me.monthNames = monthNames;
 me.monthNumbers = monthNumbers;
 Ext.Array.each(me.dayNames, function(d, i){
 var rec, day;
 rec = store.findRecord(me.locale || 'en', d, 0, false, true, true);
 if(rec) {
 day = rec.get(locale) || null;
 }
 if(day) {
 dayNames.push(day);
 }
 });
 rec = store.findRecord(me.locale || 'en', defaultFormat, 0, false, true, true);
 if(rec) {
 defaultFormat = rec.get(locale);
 }
 if(defaultFormat){
 me.defaultFormat = defaultFormat;
 }
 me.dayNames = dayNames;
 me.locale = locale || 'en';
 }
 },
 getLocale:function() {
 return this.locale || 'en';
 }
 });
 }*/
);


Ext.define('Ext.overrides.panel.Panel', {
	override: 'Ext.panel.Panel',
	localeProperties: ['title', 'html']
});
Ext.define('Ext.overrides.panel.Title', {
	override: 'Ext.panel.Title',
	localeProperties: ['text','title', 'html']
});
Ext.define('Ext.overrides.panel.Tool', {
	override: 'Ext.panel.Tool',
	localeProperties: ["text", "tooltip"],
	_translateItems: function(locale) {
		var me = this,
			store = Ext.getStore(me.localeStore),
			str,
			rec;

		var localeName = '_tooltipLocale';
		var item = this;
		var val = item.tooltip;
		if (store && val && item[localeName] !== locale) {
			rec = store.findRecord(item[localeName] || Ck.Locale.defaultLocale, val, 0, false, true, true);
			str = rec ? rec.get(locale) : null;
			if (str) {
				item[localeName] = locale;
				item.tooltip = str;
			}
		}

		// Update tooltip already rendered !
		var el = me.getEl();
		if (el) {
			el.select('.x-tool').set({
				"data-qtip": item.tooltip
			});
		}


		// Keep all words to translate
		if(Ext.Localisable.indexOf(val) == -1) {
			Ext.Localisable.push(val);
		}

		//<debug>
		// Ck.log("  *[" + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + item[localeName] + ' -> ' + locale + ') :: '+ localeName );
		//</debug>
	},

	setLocale: function(locale) {
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;
		var me = this;
		me._translateItems(locale);
		
		// Translate new added actions
		me.on('add', me._translateItems, this, {
			args: [locale]
		});
	}
});
Ext.define("Ext.overrides.button.Button", {
	override: "Ext.button.Button",
	localeProperties: ["text", "tooltip"],
	setTooltip: function(b) {
		arguments.callee.$previous.apply(this, arguments);
		this.tooltip = b;
	}
});

Ext.define("Ext.overrides.grid.column.Column",  {
	override: "Ext.grid.column.Column",
	localeProperties: ["text"]
});

Ext.define("Ext.overrides.grid.column.Action",  {
	override: "Ext.grid.column.Action",
	localeProperties: ["text", "tooltip"],
	_translateItems: function(locale) {
		var me = this,
			//locale = me.getLocale(),
			store = Ext.getStore(me.localeStore),
			str,
			rec;

		var localeName = '_tooltipLocale';
		me.items.forEach(function (item, idx) {
			var val = item.tooltip;
			if (store && val && item[localeName] !== locale) {
				rec = store.findRecord(item[localeName] || Ck.Locale.defaultLocale, val, 0, false, true, true);
				str = rec ? rec.get(locale) : null;
				if (str) {
					item[localeName] = locale;
					item.tooltip = str;
				}
			}

			// Update tooltip already rendered !
			var el = me.ownerTree.getEl();
			if (el) {
				el.select('.x-action-col-' + idx).set({
					"data-qtip": item.tooltip
				});
			}


			// Keep all words to translate
			if(Ext.Localisable.indexOf(val) == -1) {
				Ext.Localisable.push(val);
			}

			//<debug>
			// Ck.log("  *[" + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + item[localeName] + ' -> ' + locale + ') :: '+ localeName );
			//</debug>
		});
	},

	setLocale: function(locale) {
		var me = this;
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;

		// Translate existing actions (Array of items)
		if (me.items) {
			me._translateItems(locale);
		}

		// Translate new added actions
		me.on('add', me._translateItems, this, {
			args: [locale]
		});
	}
});

Ext.define("Ext.overrides.form.Label", {
	override: "Ext.form.field.Label",
	localeProperties: ["html","text"],
	setHtml: function(html){
		// Label avec texte dynamique, la source est toujours en 'en'
		this['_htmlLocale'] = Ck.Locale.defaultLocale;
		this.callParent(arguments);
	}	
});
Ext.define("Ext.overrides.form.field.Base", {
	override: "Ext.form.field.Base",
	localeProperties: "fieldLabel"
});
Ext.define("Ext.overrides.form.field.Radio", {
	override: "Ext.form.field.Radio",
	localeProperties: ["fieldLabel","boxLabel"]
});
Ext.define("Ext.overrides.form.field.Text", {
	override: "Ext.form.field.Text",
	localeProperties: ["fieldLabel", "blankText", "minLengthText", "maxLengthText", "emptyText"] // Still some issue with regexText and Innola
});


Ext.define("Ext.overrides.window.Window", {override: "Ext.window.Window",localeProperties: ["title"]});
Ext.define("Ext.overrides.form.Label", {override: "Ext.form.Label",localeProperties: ["text", "html"]});
/*
Ext.define("Ext.overrides.window.Toast", {
	override: "Ext.window.Toast",
	localeProperties: ['html'],
	// HACK hot fix de ouf !
	// version courte : le setHtml lance des méthodes d'affichage (via this.update())
	// avant la fin du initComponent/constructor et plante tout. un toast.show() après qui se charge de l'affichage...
	// version longue : le résultat de 6h de debuggage !!
	setHtml: function(html){
		this.html = html;
		if(!this.rendered) return;
		this.callParent(arguments);
	}
});

*/Ext.define("Ext.overrides.Action",  {
	override: "Ext.Action",
	localeProperties: ["text", "tooltip", "startMsg", "continueMsg"]
});

Ext.define("Ext.overrides.tip.ToolTip", {
	override: "Ext.tip.ToolTip",
	localeProperties: "html",
	setHtml: function(html){
		// Tooltip avec texte dynamique dans une action (mesure), la source est toujours en 'en'
		this['_htmlLocale'] = Ck.Locale.defaultLocale;
		this.callParent(arguments);
	}
});

Ext.define("Ext.overrides.slider.Single",  {
	override: "Ext.slider.Single",
	localeProperties: ["tipPrefix"],
	setTipPrefix: function (txt) {
		this.tipPrefix = txt;
		if(!this.rendered) return;
		//this.callParent(arguments);
	}
});
Ext.define("Ext.overrides.tree.View", {
	override: "Ext.tree.View",
	
});


/*
 Ext.define("Ext.overrides.toolbar.TextItem", {override: "Ext.toolbar.TextItem",localeProperties: ["text", "html"]});
 Ext.define("Ext.overrides.form.field.Number", {override: "Ext.form.field.Number",localeProperties: ["fieldLabel", "minText", "maxText", "negativeText", "nanText", "blankText", "minLengthText", "maxLengthText"]});
*/
Ext.define("Ext.overrides.menu.Item", {override: "Ext.menu.Item",localeProperties: ["text", "tooltip"]});
Ext.define("Ext.overrides.LoadMask", {
	override: "Ext.LoadMask",
	//localeProperties: ["msg"],
	initRenderData: function() {
        var result = this.callParent(arguments);
 
        result.msg = this._translate(this.msg) || '';
 
        return result;
    },
	syncMaskState: function() {
        var me = this,
            ownerCt = me.ownerCt,
            el = me.el;
 
        if (me.isVisible()) {
            // Allow dynamic setting of msgWrapCls
            if (me.hasOwnProperty('msgWrapCls')) {
                el.dom.className = me.msgWrapCls;
            }
 
            if (me.useMsg) {
                me.msgTextEl.setHtml(me._translate(me.msg));
                me.ariaEl.dom.setAttribute('aria-valuetext', me._translate(me.msg));
            }
            else {
                // Only the mask is visible if useMsg is false
                me.msgWrapEl.hide();
            }
 
            if (me.shim || Ext.useShims) {
                el.enableShim(null, true);
            }
            else {
                // Just in case me.shim was changed since last time we were shown (by
                // Component#setLoading())
                el.disableShim();
            }
 
            // If owner contains focus, focus this.
            // Component level onHide processing takes care of focus reversion on hide.
            if (ownerCt.el.contains(Ext.Element.getActiveElement())) {
                me.focus();
            }
 
            me.sizeMask();
        }
    },
	_translate: function(msg) {
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;
		var newMsg = msg;
		try {
			var me = this,
				//locale = me.getLocale(),
				store = Ext.getStore(me.localeStore),
				str,
				rec;

			var val = msg;
			if (store && val) {
				rec = store.findRecord(Ck.Locale.defaultLocale, val, 0, false, true, true);
				str = rec ? rec.get(Ck.Locale.get()) : null;
				if (str) {
					newMsg = str;
				}
			}
		} catch(e) {
			
		}
		return newMsg;
	}
});
/* Ext.define("Ext.overrides.picker.Date", {override: "Ext.picker.Date",localeProperties: ["disabledDaysText", "disabledDatesText", "nextText", "prevText", "monthYearText", "todayTip", "format", "minText", "maxText", "todayText"],format: "m/d/Y"});
 Ext.define("Ext.overrides.toolbar.Paging", {override: "Ext.toolbar.Paging",localeProperties: ["afterPageText", "displayMsg", "emptyMsg"],setLocale: function(e) {
 var f = this, d = f.calledFromRender;
 f.callParent(arguments);
 if (f.rendered) {
 f.calledFromRender = true;
 f.onLoad();
 f.calledFromRender = d
 }
 }});
 Ext.define("Ext.overrides.form.field.Date", {override: "Ext.form.field.Date",localeProperties: ["format", "fieldLabel"],setLocale: function(d) {
 var c = this;
 c.callParent(arguments);
 if (c.picker) {
 c.picker.setLocale(d)
 }
 }});
 */
Ext.define("Ext.overrides.form.field.ComboBox", {
	override: "Ext.form.field.ComboBox",
	localeProperties: ["fieldLabel"],
	_translateData: function(f, g) {
		var j = this, i = j.getStore(), h = Ext.getStore(j.localeStore);
		if (i && h) {
			i.each(function(b) {
				var c = b.get(j.displayField), 
					d = h.findRecord(f, c, 0, false, true, true), 
					a;
				if (d) {
					a = d.get(g);
					if (a) {
						b.set(j.displayField, a)
					}
				}
			});
			j.setValue(j.value)
		}
	},
	setLocale: function(h) {
		// Don't apply for Innola component
		if (!this.isLocaleToBeApplied()) return;
		
		var l = this, 
			k = l.getStore(), 
			j = Ext.getStore(l.localeStore), 
			i = l.getLocale() || "en", 
			g = k && j && h !== i && l._translateData;
		l.callParent(arguments);
		if (g) {
			if (l.rendered) {
				l._translateData(i, h)
			} else {
				l.on({
					beforerender: {
						fn: function() {
							l._translateData(i, h)
						},
						single: true
					}
				});
			}
		}
	}
});
 