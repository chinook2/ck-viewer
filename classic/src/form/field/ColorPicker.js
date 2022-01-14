/**
 * Created by frichard on 12/01/2022.
 * A color picker made from a combobox with predefined color values.
 */
Ext.define('Ck.form.field.ColorPicker', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.ckcolorpickerfield',
	store: Ext.create('Ext.data.Store', {
		fields: [{name: 'color'}]
	}),
	displayField: 'color',
	queryMode: "local",
	forceSelection: false,
	colors: [
		'000000',
		'993300',
		'333300',
		'003300',
		'003366',
		'000080',
		'333399',
		'333333',
		'800000',
		'FF6600',
		'808000',
		'008000',
		'008080',
		'0000FF',
		'666699',
		'808080',
		'FF0000',
		'FF9900',
		'99CC00',
		'339966',
		'33CCCC',
		'3366FF',
		'800080',
		'969696',
		'FF00FF',
		'FFCC00',
		'FFFF00',
		'00FF00',
		'00FFFF',
		'00CCFF',
		'993366',
		'C0C0C0',
		'FF99CC',
		'FFCC99',
		'FFFF99',
		'CCFFCC',
		'CCFFFF',
		'99CCFF',
		'CC99FF',
		'FFFFFF'
	],
	beforeBodyEl: [
        '<div class="' + Ext.baseCSSPrefix + 'colorpicker-field-swatch">' +
            '<div id="{id}-swatchEl" data-ref="swatchEl" class="' + Ext.baseCSSPrefix +
                    'colorpicker-field-swatch-inner"></div>' +
        '</div>'
    ],
	cls: 'ckcolorpicker',
	childEls: [
        'swatchEl'
    ],
	initComponent: function() {
		this.tpl = Ext.create('Ext.XTemplate', 
		   '<tpl for=".">', 
		   '<div class="x-boundlist-item"><div class="ckcolorpicker-prefix" style="background-color: {' + this.displayField + '}"></div>{'+ this.displayField + '}</div>', 
		   '</tpl>'
		);
		this.callParent();
		var me = this;
		for (var i=0; i<this.colors.length; i++) {
			this.store.add({color: '#'+this.colors[i]});
		}
		this.on('change', this.onColorChange);
	},
	regex: /^#[0-9a-fA-F]{6}$/,
	regexText: "CSS #RRGGBB ",
	onColorChange: function(cb, newValue, oldValue) {
		if (this.swatchEl && this.swatchEl.el) {
			this.swatchEl.el.setStyle('background', newValue);
		}
	},
	setValue: function(value) {
		this.callParent(arguments);
		this.onColorChange(this, value);
	},
	setRawValue: function(value) {
		this.callParent(arguments);
		this.onColorChange(this, value);
	},
	setInitValue: function(value) {
		this.callParent(arguments);
		this.onColorChange(this, value);
	}
});
