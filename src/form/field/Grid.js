/**
 *
 *
 */
Ext.define('Ck.form.field.Grid', {
	extend: 'Ext.form.field.Base',
	alias: 'widget.gridfield',

	requires: [
		'Ext.XTemplate'
	],

	fieldSubTpl: [
		'<div id="{id}" class="{fieldCls}"></div>',
		{
			compiled: true,
			disableFormats: true
		}
	],

	inputCls: Ext.baseCSSPrefix + 'form-grid',

	allowBlank: true,
	blankText: 'This field is required',
	invalidCls: 'ck-form-gridfield-invalid',
	
	grid: null,
	
	// Internal data og grid
	data: null,
	
	initComponent: function() {

		this.grid = Ext.create(Ext.applyIf({
			xtype: 'grid'
		}, this.initialConfig));
		
		// Plugins are attached to the internal grid not the gridfield component
		this.plugins = null;

		/*
		this.on('resize', function(){
			//this.grid.setSize(this.getSize());
		}, this);
		*/
		
		/*
		this.relayEvents(this.grid, [
			'resize',
			'change'
		]);
		*/
		
		this.grid.on({
			validateedit: function() {
				this.checkChange();
			},
			scope: this
		});
		
		this.callParent(arguments);
	},
	
	beforeDestroy: function(){
		this.grid.destroy();
		this.callParent();
	},
	
	afterRender: function () {
		this.callParent(arguments);
		Ext.defer(function(){
			this.grid.render(this.inputEl);
		}, 50, this);
	},

	getValue: function(){
		var grid = this.grid;
        var dtg = [];
        grid.getStore().each( function (rec) {
			// Empty field when plugin gridediting is active to add new record to the grid...
			if(rec.data.dummy===true) return;
			
			var row = {};
			grid.getColumns().forEach(function(col) {
				if(!col.dataIndex) return;
				var val = rec.data[col.dataIndex];
				
				// Special formatting for date columns !
				if(col.xtype == 'datecolumn' && col.submitFormat){
					row[col.dataIndex] = val ? Ext.Date.format(val, col.submitFormat) : '';
				}else{
					row[col.dataIndex] = val;
				}
			});
			
			// Need to add extra data (all fields of 'rec' are not displayed in grid columns)
			dtg.push( Ext.applyIf(row, rec.data) );
        });
        return dtg;
	},
	
	getRawValue: function() {
		return this.getValue();
	},
	
	setValue: function (val) {
        if(!val) return;
		this.grid.getStore().loadData(val);
	},
	
    onChange: function(newVal, oldVal) {
        this.callParent(arguments);
        //this.autoSize();
    },
	
	
	getErrors: function(value) {
		value = arguments.length ? (value == null ? [] : value) : this.processRawValue(this.getRawValue());

		if(!Ext.isArray(value)) {
			errors.push(me.blankText);
			return errors;
		}
		
		var me = this,
			errors = me.callParent([value]),
			validator = me.validator,
			vtype = me.vtype,
			vtypes = Ext.form.field.VTypes,
			regex = me.regex,
			msg;

		if (Ext.isFunction(validator)) {
			msg = validator.call(me, value);
			if (msg !== true) {
				errors.push(msg);
			}
		}

		if (value.length==0) {
			if (!me.allowBlank) {
				errors.push(me.blankText);
			}
			// If we are not configured to validate blank values, there cannot be any additional errors
			if (!me.validateBlank) {
				return errors;
			}
		}

		if (vtype) {
			if (!vtypes[vtype](value, me)) {
				errors.push(me.vtypeText || vtypes[vtype +'Text']);
			}
		}

		if (regex && !regex.test(value)) {
			errors.push(me.regexText || me.invalidText);
		}

		return errors;
	}
});
