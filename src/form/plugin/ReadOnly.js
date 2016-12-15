/**
 *
 */
Ext.define('Ck.form.plugin.ReadOnly', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.formreadonly',

	readOnly: false,

	// Gestion des liens ou pour ajouter une unitée : 32 m² avec suffix= m²
	suffix: '',
	prefix: '',
	fieldTpl: '',

	formatter: '',

	target: '_blank',
	title: '',

	init: function(cmp) {
		var xtypes = cmp.getXTypes();

		if(xtypes.indexOf('field') != -1) {
			this.formController = cmp.lookupController();
			this.formViewModel = cmp.lookupViewModel();

			// Apply only on subclass of component/box/field/{xtype}
			if(xtypes.indexOf('/field/') != -1) {
				if(cmp.suffix) this.suffix = cmp.suffix;
				if(cmp.prefix) this.prefix = cmp.prefix;
				if(cmp.fieldTpl) this.fieldTpl = cmp.fieldTpl;
				if(cmp.target) this.target = cmp.target;
				if(cmp.title) this.title = cmp.title;
				if(cmp.formatter) this.formatter = cmp.formatter;

				if(this.fieldTpl) this.template = new Ext.Template(this.fieldTpl);

				// Init Text/Label for readOnly after cmp rendered
				cmp.on('afterrender', this.onRenderCmp, this);

				// Update readOnly status on start/stop editing
				this.formController.on('startEditing', this.setReadOnly, this);
				this.formController.on('stopEditing', this.setReadOnly, this);

				// When reset field (sometimes field is mark readOnly by contexte, need to update status - on Window)
				this.formController.on('afterreset', this.setReadOnly, this);
			} else {
				if(xtypes.indexOf('/fieldcontainer') != -1) {
					// Init Text/Label for readOnly after cmp rendered
					cmp.on('afterrender', this.addRequiredMarker, this);
				}
			}
		}
	},

	destroy: function () {
		if(this.cmp){
			var ctrl = this.cmp.lookupController();
			if(ctrl) ctrl.clearListeners();
		}

		if(this.textEl) this.textEl.destroy();
		if(this.labelEl) this.labelEl.destroy();
		delete this.textEl;
		delete this.labelEl;

		this.callParent();
	},

	// private
	onRenderCmp : function(cmp){
		// Ck.log("onRenderCmp for : " + cmp.name);

		// Ajoute un span pour afficher le contenu en mode lecture (multiligne, lien, code html)
		this.textEl = new Ext.Element(document.createElement('span')).addCls('ck-form-textfield-readonly');
		this.labelEl = new Ext.Element(document.createElement('label')).addCls('x-form-item-label x-form-item-label-default');
		this.textEl.appendTo(this.labelEl);
		this.labelEl.setVisibilityMode(Ext.Element.DISPLAY);

		if(cmp.triggerWrap) this.labelEl.insertAfter(cmp.triggerWrap);

		// Masque par défaut les input si form.readOnly est true
		this.setReadOnly();

		// When update field need to update readonly label
		cmp.on('change', this.setReadOnly, this);
	},

	/**
	 * Change the rendering of according the field is readonly or not
	 * r variable indicates if the field is readOnly or not
	 */
	setReadOnly: function() {
		var cmp = this.getCmp();

		// Field have to be rendered
		if(!cmp.rendered) {
			return;
		}

		if(!this.labelEl || !this.labelEl.dom) {
			// Ck.log("readOnly setReadOnly cancel for : " + cmp.name);
			return;
		}

		// Begin of calcul to check if it's readOnly or not
		var r = !this.formViewModel.get("editing");

		// Force readOnly if specified in form
		if(Ext.isBoolean(cmp.initialConfig.readOnly)) {
			r = cmp.initialConfig.readOnly;
		}

		// ReadOnly can be bind need to get value
		if(cmp.bind && cmp.bind.readOnly){
			r = cmp.bind.readOnly.getValue();
		}

		if(cmp.formulaField) {
			if(this.readOnly === true) {
				cmp.disable(); // No value sent when submitting
			}
			r = true;
		}

		// The field must have a trigger wrap (element which encapsulates the field) or to be a checkbox
		if(cmp.triggerWrap) {
			cmp.triggerWrap.setVisibilityMode(Ext.Element.DISPLAY);
			if(r) {

				cmp.triggerWrap.hide();
				if(!cmp.hideLabel) cmp.setFieldLabel(cmp.initialConfig.fieldLabel);

				var val = cmp.getValue();
				// For combobox
				if(cmp.displayField) val = cmp.getDisplayValue();
				// For Datefields
				if(cmp.submitFormat) val = cmp.getSubmitValue();

				if(val==null) val = '';

				if(val != '') {
					val = this.prefix + val + this.suffix;
					if(this.template) {
						val = this.template.apply({"value": val});
					}

					if(this.formatter && Ext.util.Format[this.formatter]) {
						val = Ext.util.Format[this.formatter](val);
					}
				}
				var title = '';
				if(this.title) title = "title='"+this.title+"'";

				var _http = /^http:/i;
				if(_http.test(val)) val = "<a href='"+val+"' "+ title +" target='"+ this.target +"'>"+val+"</a>";

				this.textEl.update(val);
				this.labelEl.show();

			} else {
				this.labelEl.hide();
				cmp.triggerWrap.show();

				// Add a marker for required fields when editing
				this.addRequiredMarker();
			}

			if(cmp.inputEl) {
				cmp.inputEl.dom.readOnly = r;
			}
		} else if(cmp.xtype == "checkbox") {
			cmp.setDisabled(r);
			if(r) {
				var dom = cmp.getEl().dom;
				dom.classList.remove("x-item-disabled");
				// Add listener because Ext re-render field with x-item-disabled on setValue
				cmp.disableTrigger = cmp.on({
					destroyable: true,
					change: function(cbx) {
						var dom = cbx.getEl().dom;
						dom.classList.remove("x-item-disabled");
					}
				});
			} else if(cmp.disableTrigger) {
				Ext.destroy(cmp.disableTrigger);
				delete cmp.disableTrigger;
			}
		}
	},

	/**
	 * Add red asterix to mark field as mandatory
	 * Special process for fieldcontainer
	 */
	addRequiredMarker: function() {
		var cmp = this.getCmp();

		if(!cmp.hideLabel) {
			var s = '';
			if (cmp.allowBlank === false) {
				s = ' <span class="ck-form-required">*</span>';
			}
			cmp.setFieldLabel(cmp.initialConfig.fieldLabel + s);
		}
	}
});
