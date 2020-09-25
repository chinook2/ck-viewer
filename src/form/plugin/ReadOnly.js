﻿/**
 * Plugin to add to a field to render it as read only
 */
Ext.define('Ck.form.plugin.ReadOnly', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.formreadonly',

	readOnly: false,

	// Gestion des liens ou pour ajouter une unitée : 32 m² avec suffix= m²
	config: {
		title			: "",
		suffix			: "",
		prefix			: "",
		target			: "_blank",
		fieldTpl		: "",
		template		: null,
		formController	: null,
		formViewModel	: null
	},

	init: function(cmp) {
		// Apply only on subclass of component/box/field/{xtype}
		if(cmp.getXTypes().indexOf('/field/') == -1) {
			return;
		}
		
		var config = {
			suffix			: cmp.suffix,
			prefix			: cmp.prefix,
			fieldTpl		: cmp.fieldTpl || cmp.tpl,
			target			: cmp.target,
			title			: cmp.title,
			formController	: cmp.lookupController(),
			formViewModel	: cmp.lookupViewModel()
		};

		this.setConfig(config);

		// Init Text/Label for readOnly after cmp rendered
		cmp.on('afterrender', this.onRenderCmp, this);

		// Update readOnly status on start/stop editing
		this.getFormController().on('startEditing', this.setReadOnly, this);
		this.getFormController().on('stopEditing', this.setReadOnly, this);
	},

	destroy: function () {
		this.cmp.lookupController().clearListeners();
		if(this.textEl) this.textEl.destroy();
		if(this.labelEl) this.labelEl.destroy();
		delete this.textEl;
		delete this.labelEl;
		
		this.callParent(arguments);
	},

	/**
	 * Replace input field with text field.
	 */
	onRenderCmp : function(cmp){
		// And span to display the read only contents (multiligne, lien, code html)
		this.textEl = new Ext.Element(document.createElement('span')).addCls('ck-form-textfield-readonly');
		this.labelEl = new Ext.Element(document.createElement('label')).addCls('x-form-item-label x-form-item-label-default');
		this.textEl.appendTo(this.labelEl);
		this.labelEl.setVisibilityMode(Ext.Element.DISPLAY);
		
		if(cmp.triggerWrap) {
			this.labelEl.insertAfter(cmp.triggerWrap);
		}
		if(cmp.isCheckbox) {
			this.labelEl.insertAfter(cmp.innerWrapEl);
		}

		// By default hide inputs if form.readOnly == true
		this.setReadOnly();
		
		// When update field need to update readonly label
		cmp.on('change', this.setReadOnly, this);
	},
	
	/**
	 * Called by 3 events :
	 * - when editing begins
	 * - for each field modification
	 * - when editing ends 
	 */
	setReadOnly: function() {
		var cmp = this.getCmp();
		// !cmp.triggerWrap
		if(!cmp.rendered || !this.labelEl || !this.labelEl.dom) {
			return;
		}
		
		// Set visibility mode
		if(cmp.triggerWrap) cmp.triggerWrap.setVisibilityMode(Ext.Element.DISPLAY);
		if(cmp.innerWrapEl) cmp.innerWrapEl.setVisibilityMode(Ext.Element.DISPLAY);
		
		// get("editing") set in startEditing or stopEditing form.Controller methods
		var readOnly = !this.getFormViewModel().get("editing");

		// Try to put readOnly by default when reset form (value==null)
		// In some case readOnly is binded with data record, reset > need to revert readOnly state
		if((cmp.getValue() === null) && (!Ext.isDefined(cmp.initialConfig.readOnly) || cmp.initialConfig.readOnly === false)) {
			cmp.readOnly = false;
		}
		
		// Force readOnly for field if it's explicitly set
		if(cmp.readOnly) {
			readOnly = true;
		}
		
		if(cmp.formulaField) {
			 // To prevent sending value when submitting
			if(this.readOnly === true) {
				cmp.disable();
			}
			readOnly = true;
		}

		if(readOnly) {
			if(cmp.triggerWrap) cmp.triggerWrap.hide();
			if(cmp.innerWrapEl) cmp.innerWrapEl.hide();

			if(!cmp.hideLabel) {
				cmp.setFieldLabel(cmp.initialConfig.fieldLabel);
			}

			var val = cmp.getValue();
			// For combobox
			if(cmp.displayField) {
				val = cmp.getDisplayValue() || cmp.getValue();
			}
			// For Datefields
			if(cmp.submitFormat) {
				val = cmp.getSubmitValue();
			}
			
			if(val !== null) {
				if(!Ext.isEmpty(val)) {
					val = this.getPrefix() + val + this.getSuffix();
					
					if(this.getTemplate()) {
						val = this.getTemplate().apply({"value": val});
					}
					
					// If value begin with "http:" but it's not a create <a> element
					var _http = /^http:/i;
					if(_http.test(val)) {
						var title = this.getTitle();
						val = "<a href='" + val + "' " + title + " target='" + this.getTarget() + "'>" + val + "</a>";
					}					
				}

				if(cmp.isCheckbox) {
					//cmp.readOnly = true;
					if (val) {
						val = '<span class="x-form-checkbox-default"></span>';
					} else {
						val = '<span class="x-form-checkbox-default"></span>';
					}
				}

				this.textEl.update(val);
				
				// Fix: resize fileuploadfield's ownerCt (Panel) after image loaded
				var img = this.textEl.down("img");
				if(img !== undefined && img) {
					img.on("load", function(e, target, opt) {
						var cmp = this.getCmp();
						cmp.ownerCt.setWidth(target.width);
						cmp.ownerCt.setHeight(target.height);
					}, this);										
				}
				
				// Allow to open link on mobile device
				if(val.indexOf("<a href") != -1 && Ck.isMobileDevice()) {
					this.textEl.dom.onclick = function(evt) {
						var url = evt.currentTarget.getElementsByTagName("a")[0].getAttribute("href");

						if(url) {
							var extension = url.split(".").pop();
							if(Ext.isEmpty(Ck.EXTENSION_MIMETYPE["extension"])) {
								navigator.app.loadUrl(url, {loadingDialog:"Wait, loading ressource", loadUrlTimeoutValue: 6000, openExternal: true});
								return false;
							}
						}						
					};
				}
			}		
			
			// Hide file fields buttons when read only mode
			if(cmp.getXTypes().indexOf("filefield") != -1 || cmp.getXTypes().indexOf("fileuploadfield") != -1) {
				var items = cmp.ownerCt.items;
				for(var i = 0; i < items.getCount(); i++) {
					if(items.getAt(i) != cmp) {
						items.getAt(i).setVisible(false);
					}
				}
			}
			
			// Hide numeric fields buttons when read only mode
			if(cmp.getXTypes().indexOf("numberfield") != -1) {
				var ownerCt = cmp.ownerCt;
				if(ownerCt.gpsButton === true) {
					var items = ownerCt.items;
					for(var i = 0; i < items.getCount(); i++) {
						if(items.getAt(i) != cmp) {
							items.getAt(i).setVisible(false);
						}
					}
				}
				
			}
			
			this.labelEl.show();
		} else {
			this.labelEl.hide();
			if(cmp.triggerWrap) cmp.triggerWrap.show();
			if(cmp.innerWrapEl) cmp.innerWrapEl.show();

			// Add a marker for required fields when editing
			if(cmp.allowBlank === false) {
				cmp.setFieldLabel(cmp.initialConfig.fieldLabel + ' <span class="' + Ext.baseCSSPrefix + 'required">*</span>');
			}
			
			// Show file fields buttons when not in read only mode
			if(cmp.getXTypes().indexOf("filefield") != -1 || cmp.getXTypes().indexOf("fileuploadfield") != -1) {
				// TODO : get the "52" from config
				cmp.ownerCt.setHeight(52);
				var items = cmp.ownerCt.items;
				for(var i = 0; i < items.getCount(); i++) {
					if(items.getAt(i) != cmp) {
						items.getAt(i).setVisible(true);
					}
				}
			}
			
			// Show numeric fields buttons when read only mode
			if(cmp.getXTypes().indexOf("numberfield") != -1) {
				var ownerCt = cmp.ownerCt;
				if(ownerCt.gpsButton === true) {
					var items = ownerCt.items;
					for(var i = 0; i < items.getCount(); i++) {
						if(items.getAt(i) != cmp) {
							items.getAt(i).setVisible(true);
						}
					}
				}
				
			}			
		}

		if(cmp.inputEl) {
			cmp.inputEl.dom.readOnly = readOnly;
		}
	},
	
	/***************************************************************************/
	/***************************** Getter / Setter *****************************/
	/***************************************************************************/
	setSuffix: function(value) {
		this.suffix = (Ext.isEmpty(value))? "" : value;
	},
	
	setPrefix: function(value) {
		this.prefix = (Ext.isEmpty(value))? "" : value;
	},
	
	setTarget: function(value) {
		this.target = (Ext.isEmpty(value))? "_blank" : value;
	},
	
	setTitle: function(value) {
		this.title = (Ext.isEmpty(value))? "" : value;
	},
	
	/**
	 * Automatically set the template
	 */
	setFieldTpl: function(value) {
		if(Ext.isEmpty(value)) {
			this.fieldTpl = "";
			this.setTemplate("");
		} else {
			this.fieldTpl = value;
			this.setTemplate(new Ext.Template(value));
		}
	},
	
	/**
	 * If title is set return "title='titleval'"
	 */
	getTitle: function() {
		var title = this.title;
		if(Ext.isEmpty(title)) {
			title = "";
		} else {
			title = "title='" + this.title + "'";
		}
		return title;
	}
});
