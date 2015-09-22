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
		if(config.action) {
			var action = key = config.action;
			// Allow to add same action twice or more with a different itemId
			if(config.itemId) key += config.itemId;
			// Special test for actions to change Locale (init simpliest)
			if(config.toLocale) {
				config.itemId = key += '-' + config.toLocale;
			}
			if( Ck.actions[key] ) {
				config = Ck.actions[key];
			} else {
				config = Ext.create('widget.'+action, config);
				Ck.actions[key] = config;
			}
		}

		this.callParent([config]);
	},

	initComponent: function() {
		var me = this,
			configurator = me.getConfigurator(),
			localeConfig = configurator.configs.locale,
			locale = me.locale || Ext.locale;

		if(!localeConfig) {
			configurator.add({
				locale: locale
			});
		}
		// Wait for locale.json loaded
		if(Ext.localeReady) {
			me.setLocale(locale);
		}

		this.callParent();
	},


	updateLocale:function(newLocale, oldLocale) {
		if(!Ext.localeReady) return;
		this.doLocale();
	},

	cascadeLocale:function(locale) {
		var me = this;

		me.setLocale(locale);

		if(me.items) {
			if(!Ext.isArray(me.items)){
			/*	me.items.forEach(function (item) {
					if (item.cascadeLocale) {
						item.cascadeLocale(locale);
					}
				});
			} else {*/
				me.items.each(function (item) {
					if (item.cascadeLocale) {
						item.cascadeLocale(locale);
					}
				});
			}
		}

		if(me.dockedItems) {
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
			me.getMenu();
		}

		if(me.menu) {
			me.menu.cascadeLocale(locale);
		}

		// TODO : translate plugins here ?
		if(me.plugins) {}
		// TODO : translate actions here ?
		if(me.action) {}
	},

	_createLocaleSetter : function(property) {
		var me = this,
			configurator = me.getConfigurator(),
			config = configurator.configs[property],
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

		var translate = function(val, localeName) {
			var me = this,
				// toLocale : special to force a language (used with action cklocaleSet)
				locale = me.toLocale || me.getLocale(),
				store = Ext.getStore(me.localeStore),
				str,
				rec;
			if (store && val && me[localeName] !== locale) {
				rec = store.findRecord(me[localeName] || 'en', val, 0, false, true, true);
				str = rec ? rec.get(locale) : null;
				if(str) {
					me[localeName] = locale;
				}
			}

			if(Ext.Localisable.indexOf(val) == -1) {
				Ext.Localisable.push(val);
			}

			//<debug>
			Ext.log('  [' + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + me[localeName] + ' -> ' + locale + ') :: '+ localeName );
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
		var me = this,
			properties = Ext.Array.from(me.localeProperties),
			i = 0,
			length = properties.length,
			property, value, setter;

		for (; i < length; i++) {
			property = properties[i];
			// if((!me.hasOwnProperty(property)) && (me.config.bind && !me.config.bind.hasOwnProperty(property))) continue;

			value = me[property];
			setter = me._createLocaleSetter(property);
			if (value && value != '&#160;') {
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
	localeProperties: ['title', 'html']
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
	localeProperties: ["text", "header"]
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
				rec = store.findRecord(item[localeName] || 'en', val, 0, false, true, true);
				str = rec ? rec.get(locale) : null;
				if(str) {
					item[localeName] = locale;
					item.tooltip = str;
				}
			}

			// Update tooltip already rendered !
			me.ownerTree.getEl().select('.x-action-col-'+idx).set({
				"data-qtip": item.tooltip
			});

			// Keep all words to translate
			if(Ext.Localisable.indexOf(val) == -1) {
				Ext.Localisable.push(val);
			}

			//<debug>
			Ext.log("  *[" + me.getXType() + ']\t\t' + val + ' >> ' + str + '    (' + item[localeName] + ' -> ' + locale + ') :: '+ localeName );
			//</debug>
		});

	},
	setLocale: function(locale) {
		var me = this;
		me.callParent(arguments);

		// Translate actions (Array of items)
		if (me.items) {
			me._translateItems(locale);
		}
	}
});


Ext.define("Ext.overrides.form.field.Base", {
	override: "Ext.form.field.Base",
	localeProperties: "fieldLabel"
});
Ext.define("Ext.overrides.form.field.Text", {
	override: "Ext.form.field.Text",
	localeProperties: ["fieldLabel", "blankText", "minLengthText", "maxLengthText", "regexText"]
});


Ext.define("Ext.overrides.window.Window", {override: "Ext.window.Window",localeProperties: ["title", "html"]});

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

Ext.define("Ext.overrides.Action",  {
	override: "Ext.Action",
	localeProperties: ["text", "tooltip", "startMsg", "continueMsg"]
});

Ext.define("Ext.overrides.tip.ToolTip", {
	override: "Ext.tip.ToolTip",
	localeProperties: "html",
	setHtml: function(html){
		// Tooltip avec texte dynamique dans une action (mesure), la source est toujours en 'en'
		this['_htmlLocale'] = 'en';
		this.callParent(arguments);
	}
});

Ext.define("Ext.overrides.slider.Single",  {
	override: "Ext.slider.Single",
	localeProperties: ["tipPrefix"],
	setTipPrefix: function (txt) {
		this.tipPrefix = txt;
		if(!this.rendered) return;
		this.callParent(arguments);
	}
});


/*
 Ext.define("Ext.overrides.toolbar.TextItem", {override: "Ext.toolbar.TextItem",localeProperties: ["text", "html"]});
 Ext.define("Ext.overrides.form.field.Number", {override: "Ext.form.field.Number",localeProperties: ["fieldLabel", "minText", "maxText", "negativeText", "nanText", "blankText", "minLengthText", "maxLengthText"]});
 Ext.define("Ext.overrides.menu.Item", {override: "Ext.menu.Item",localeProperties: ["text", "tooltip"]});

 Ext.define("Ext.overrides.picker.Date", {override: "Ext.picker.Date",localeProperties: ["disabledDaysText", "disabledDatesText", "nextText", "prevText", "monthYearText", "todayTip", "format", "minText", "maxText", "todayText"],format: "m/d/Y"});


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
 Ext.define("Ext.overrides.form.field.ComboBox", {override: "Ext.form.field.ComboBox",localeProperties: ["fieldLabel"],_translateData: function(f, g) {
 var j = this, i = j.getStore(), h = Ext.getStore(j.localeStore);
 if (i && h) {
 i.each(function(b) {
 var c = b.get(j.displayField), d = h.findRecord(f, c, 0, false, true, true), a;
 if (d) {
 a = d.get(g);
 if (a) {
 b.set(j.displayField, a)
 }
 }
 });
 j.setValue(j.value)
 }
 },setLocale: function(h) {
 var l = this, k = l.getStore(), j = Ext.getStore(l.localeStore), i = l.getLocale() || "en", g = k && j && h !== i && true === l.translateData;
 l.callParent(arguments);
 if (g) {
 if (l.rendered) {
 l._translateData(i, h)
 } else {
 l.on({beforerender: {fn: function() {
 l._translateData(i, h)
 },single: true}})
 }
 }
 }});
 */