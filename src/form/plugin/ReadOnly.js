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

	target: '_blank',
	title: '',

	init: function(cmp) {
		// Apply only on subclass of component/box/field/{xtype}
		if(cmp.getXTypes().indexOf('/field/') == -1) return;

		if(cmp.suffix) this.suffix = cmp.suffix;
		if(cmp.prefix) this.prefix = cmp.prefix;
		if(cmp.fieldTpl) this.fieldTpl = cmp.fieldTpl;
		if(cmp.target) this.target = cmp.target;
		if(cmp.title) this.title = cmp.title;

		this.formController = cmp.lookupController();
		this.formViewModel = cmp.lookupViewModel();

		if(this.fieldTpl) this.template = new Ext.Template(this.fieldTpl);

		this.textEl = new Ext.Element(document.createElement('span')).addCls('ck-form-textfield-readonly');
		this.labelEl = new Ext.Element(document.createElement('label')).addCls('x-form-item-label x-form-item-label-default');
		this.textEl.appendTo(this.labelEl);
		this.labelEl.setVisibilityMode(Ext.Element.DISPLAY);

		cmp.on('afterrender', this.onRender, this, {delay: 50});
		cmp.on('change', this.onChange, this);

		this.formController.on('startEditing', this.setReadOnly, this);
		this.formController.on('stopEditing', this.setReadOnly, this);
	},

	destroy: function () {
		this.cmp.lookupController().clearListeners();
		this.callParent();
	},

	// private
	onRender : function(cmp){
		// Ajoute un span pour afficher le contenu en mode lecture (multiligne, lien, code html)
		if(cmp.triggerWrap) this.labelEl.insertAfter(cmp.triggerWrap);

		// Masque par défaut les input si form.readOnly est true
		this.setReadOnly();
	},

	onChange : function(cmp, newValue, oldValue, eOpts){
		this.setReadOnly();
	},

	setReadOnly: function() {
		var cmp = this.getCmp();
		if(!cmp.rendered) return;
		if(!cmp.triggerWrap) return;

		// r for readOnly is true when editing is false
		var r = !this.formViewModel.get("editing");

		if(cmp.readOnly) r = true;
		
		/*
		 if(this.join) {
		 this.disable(); // pas envoyer lors du submit
		 r = true; // non editable
		 }
		 */
		if(cmp.formulaField) {
			if(this.readOnly === true) cmp.disable(); // pas envoyer lors du submit
			r = true; // non editable
		}

		cmp.triggerWrap.setVisibilityMode(Ext.Element.DISPLAY);
		if(r){

			cmp.triggerWrap.hide();
			if(!cmp.hideLabel) cmp.setFieldLabel(cmp.initialConfig.fieldLabel);

			var val = cmp.getValue();
			if(cmp.displayField) val = cmp.getDisplayValue();
			
			if(val != '') {
				val = this.prefix + val + this.suffix;
				if(this.template) {
					val = this.template.apply({"value": val});
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
			if(cmp.allowBlank === false) {
				cmp.setFieldLabel(cmp.initialConfig.fieldLabel + ' <span class="' + Ext.baseCSSPrefix + 'required">*</span>');
			}
		}

		if(cmp.inputEl) {
			cmp.inputEl.dom.readOnly = r;
		}
	}
});
