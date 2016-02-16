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

		// Prevent duplicate id between gridfield and grid (id / reference point to internal grid)
		if(this.initialConfig.id) {
			this.setId('gridfield' + '-' + this.getAutoId())
		}
		
		this.grid = Ext.create(Ext.applyIf({
			xtype: 'grid',
			scrollable: 'y'
		}, this.initialConfig));
		
		// Plugins are attached to the internal grid not the gridfield component
		this.plugins = null;
		// Reference is unique and attached to the underlaying grid (not the gridfield)
		this.reference = null;
		
		// Ensure clear invalid mark when updating grid
		this.grid.on({
			validateedit: function() {
				this.checkChange();
			},
			render: function() {
				this.grid.getStore().on('datachanged', function(store) {
					this.checkChange();
				}, this);
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
		
		this.on('resize', function(){
			var size = this.getSize();
			size.width-=2;
			size.height-=2;
			this.inputEl.setSize(this.getSize());
			this.grid.setSize(size);
		}, this);
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
					// TODO : add config option to trim or not
					if(Ext.isString(val)){
						val = Ext.String.trim(val);
					}
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
	
    reset: function() {
        var me = this;
        me.beforeReset();
		// Clear grid data
        me.grid.getStore().removeAll();
		//
        me.clearInvalid();
        // delete here so we reset back to the original state
        delete me.wasValid;
    },
	
	getStore: function() {
		return this.grid.getStore();
	},
	
	getErrors: function(value) {
		value = arguments.length ? (value == null ? [] : value) : this.processRawValue(this.getRawValue());

		if(!Ext.isArray(value)) {
			errors.push(this.blankText);
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

		//
		// Test all columns for required fields
		var grid = me.grid;
		grid.getStore().each(function(rec) {
			if(rec.data.dummy===true) return;
			grid.getColumns().forEach(function(col) {
				if(!col.dataIndex) return;
				var val = rec.data[col.dataIndex];

				if((!val) && (col.allowBlank===false)) {
					//isValid = false;
					errors.push(col.blankText || me.blankText);
					Ck.log((col.text || col.dataIndex) + ' in '+ me.name +' not Valid !');
					return false;
				}
			});
		});
		//
		
		return errors;
	},
	
	markInvalid: function(errors) {
		// Save the message and fire the 'invalid' event
		var me = this,
			ariaDom = me.ariaEl.dom,
			oldMsg = me.getActiveError(),
			active;
			
		me.setActiveErrors(Ext.Array.from(errors));
		active = me.getActiveError();
		if (oldMsg !== active) {
			me.setError(active);
			if (!me.ariaStaticRoles[me.ariaRole] && ariaDom) {
				ariaDom.setAttribute('aria-invalid', true);
			}
		}
		
		// Allow display message in popup warning (!me.dirty prevent fire when reset/removeAll form)
		if(me.invalidMsgText && !me.dirty) {
			Ext.MessageBox.show({
				title: 'Warning',
				msg: me.invalidMsgText,
				icon: Ext.MessageBox['WARNING'],
				buttons: Ext.MessageBox.OK,
				scope: this
			});
		}
		//
	}	
});
