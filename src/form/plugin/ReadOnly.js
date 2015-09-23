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
	tpl: '',

	target: '_blank',
	title: '',

	init: function(cmp) {
		if(cmp.suffix) this.suffix = cmp.suffix;
		if(cmp.prefix) this.prefix = cmp.prefix;
		if(cmp.tpl) this.tpl = cmp.tpl;
		if(cmp.target) this.target = cmp.target;
		if(cmp.title) this.title = cmp.title;

		this.formController = cmp.lookupController();
		this.formViewModel = cmp.lookupViewModel();

		if(this.tpl) this.template = new Ext.Template(this.tpl);

		this.textEl = new Ext.Element(document.createElement('span')).addCls('ck-form-textfield-readonly');
		this.labelEl = new Ext.Element(document.createElement('label')).addCls('x-form-item-label x-form-item-label-default');
		this.textEl.appendTo(this.labelEl);
		this.labelEl.setVisibilityMode(Ext.Element.DISPLAY);

		cmp.on('afterrender', this.onRender, this);
		cmp.on('change', this.onChange, this);

		this.formController.on('startEditing', this.setReadOnly, this);
		this.formController.on('stopEditing', this.setReadOnly, this);
	},

	// private
	onRender : function(cmp){
		// Ajoute un span pour afficher le contenu en mode lecture (multiligne, lien, code html)
		this.labelEl.insertAfter(cmp.triggerWrap);

		// Masque par défaut les input si form.readOnly est true
		this.setReadOnly();
	},

	onChange : function(cmp, newValue, oldValue, eOpts){
		this.setReadOnly();
	},

	setReadOnly: function() {
		var cmp = this.getCmp();
		if(!cmp.rendered) return;

		// r for readOnly is true when editing is false
		var r = !this.formViewModel.get("editing");

		if(this.readOnly === true) r = true;
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
			// this.addCls('ck-forms-readonly');
			cmp.triggerWrap.hide();

			var val = cmp.getValue();
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
			// this.removeCls('ck-forms-readonly');
			this.labelEl.hide();
			cmp.triggerWrap.show();
		}

		if(cmp.inputEl) {
			cmp.inputEl.dom.readOnly = r;
		}
	}
});
