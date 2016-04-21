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
				if(col.xtype == 'datecolumn' && col.submitFormat && Ext.isDate(val)) {
					row[col.dataIndex] = Ext.Date.format(val, col.submitFormat);
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
	
	// Used by checkChange and validation
	isEqual: function(array1, array2) {
		var len1 = array1.length,
			len2 = array2.length,
			i;
			
		// Short circuit if the same array is passed twice
		if (array1 === array2) {
			return true;
		}
			
		if (len1 !== len2) {
			return false;
		}
		
		for (i = 0; i < len1; ++i) {
			// if (array1[i] !== array2[i]) {
				// return false;
			// }
			if (!Ext.Object.equals(array1[i], array2[i])) {
				return false;
			}
		}
		
		return true;		
	},
	
	isDirty: function() {
		var isDirty = false;
		this.grid.getStore().each( function (rec) {
			// Empty field when plugin gridediting is active to add new record to the grid...
			if(rec.data.dummy===true) return;			
			if(rec.dirty == true){
				isDirty = true;
			}
		});
		if (!isDirty){
			isDirty = (this.grid.getStore().removed.length > 0);
		}
		
		return isDirty;
	},

    reset: function() {
        var me = this;
        me.beforeReset();
		// Clear grid data (silent)
        me.grid.getStore().removeAll(true);
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
					var errText = col.blankText || ((col.text || col.dataIndex) + ' field is required');
					if(errors.indexOf(errText)  == -1) errors.push(errText);
					Ck.log('Field "'+ (col.text || col.dataIndex) +'" in grid "'+ me.name +'" not Valid !');
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
