if (!Ext.manifest.ckClient) {
	Ext.manifest.ckClient = {};
}
if (!Ext.manifest.ckClient.i18n) {
	Ext.manifest.ckClient.i18n = {
        'en': {
            'action_close': 'Close',
			'action_save': 'Save',
			'action_validate': 'Validate',
			'action_update': 'Update',
			'action_cancel': 'Cancel',
			'action_import': 'Import',
			'action_clear': 'Clear',
			'action_copy': 'Copy',
			'action_filter': 'Filter',
			'edit': 'Edition',
			"name": "Name",
            'map' : 'Map',
			'map_accuracy': 'Accuracy',
			'map_northing': 'Northing',
			'map_northing_short': 'N',
			'map_easting': 'Easting',
			'map_easting_short': 'E',
			"type": "type",
			'measure_units': 'Measure Units',
			'measure_metric': 'Metric',
			'measure_imperial': 'Imperial',
			'measure_settings': 'Measurement settings',
			'measure_start': 'Click to start measuring (shift and hold click for free measure)',
			'measure_continue': 'Click to continue measuring',
			'measure_area': 'Mesure Area',
			'measure_area_msg': 'Click to continue measuring the area',
			'measure_length': 'Measure Length',
			'measure_length_msg': 'Click to continue measuring the length',
			'measure_radius': 'Measure Radius',
			'measure_radius_msg': 'Click to continue measuring the radius',
			'measure_clear':'Clear all measures',
			'opacity': 'Opacity',
			'coord_sys': 'Coord. Syst.',
			'snap': 'Snap',
			'snap_layers': 'Snap Layers',
			'snap_init_error': "Unable to initialize snapping.<br>Consider zoom in to enable measurements snapping.",
			'coordinates': 'Coordinates',
			'coordinates_mode': 'Coordinates Mode',
			'distance': 'Distance',
			'angle_unit_deg': 'Degrees',
			'angle_unit_rad': 'Radians',
			'angle_unit_grad': 'Grades',
			'length_unit_km': 'Kilometers',
			'length_unit_m': 'Meters',
			'length_unit_ft': 'Feet',
			'undo': 'Undo',
			'redo': 'Redo',
			'msg_confirm': 'Confirm',
			'zoom_to_office': 'Zoom to full extent',
			'zoom_on_layer': 'Zoom on layer',
			'zoom_box': 'Zoom by rectangle',
			'view_previous': 'Previous View',
			'view_next': 'Next View',
			'goto_open': 'Open Go to Coordinates',
			'goto_wintitle': 'Go to Coordinates',
			'goto_clear_marker': 'Clear Marker',
			'goto_go_to_position': 'Go to position',
			'goto_dec_title':'Coordinates (Dec)',
			'goto_dec_easting': "Easting (X)",
			'goto_dec_northing': "Northing (Y)",
			'goto_dm_title': 'Coordinates (DM)',
			'goto_dm_easting': "Easting (X)",
			'goto_dm_northing': "Northing (Y)",
			'goto_dms_title': 'Coordinates (DMS)',
			'goto_dms_easting': "Easting (X)",
			'goto_dms_northing': "Northing (Y)",
			'open_overview': 'Display overview',
			'mouse_position': "Mouse position",
			'feature_info': 'Feature Info',
			'select_in_progress': 'Selection in progress...',
			'select_attribute': 'Attribute',
			'select_value': 'Value',
			'lbl_projection': 'Projection'
        },
        'fr': {
            'action_close': 'Fermer',
			'action_save': 'Enregistrer',
			'action_validate': 'Valider',
			'action_update': 'Mettre à jour',
			'action_cancel': 'Annuler',
			'action_import': 'Importer',
			'action_clear': 'Effacer',
			'action_copy': 'Copier',
			'action_filter': 'Filtrer',
			'edit': 'Edition',
            'map' : 'Carte SIFOR',
			'map_accuracy': 'Précision',
			'map_northing': 'Latitude',
			'map_northing_short': 'Lat.',
			'map_easting': 'Longitude',
			'map_easting_short': 'Long.',
			"name": "Nom",
			"type": "type",
			'measure_units': 'Unités de mesure',
			'measure_metric': 'Métrique',
			'measure_imperial': 'Impérial',
			'measure_settings': 'Paramètres de mesure',
			'measure_start': 'Cliquer pour commencer la mesure (MAJ + maintenir le click pour mesure libre)',
			'measure_continue': 'Cliquer pour continuer la mesure',
			'measure_area': 'Mesure de superficie',
			'measure_area_msg': 'Cliquer pour continuer la mesure de superficie',
			'measure_length': 'Mesure de longueur',
			'measure_length_msg': 'Cliquer pour continuer la mesure de longueur',
			'measure_radius': 'Mesure de rayon',
			'measure_radius_msg': 'Cliquer pour continuer la mesure de rayon',
			'measure_clear':'Effacer toutes les mesures',
			'opacity': 'Opacité',
			'coord_sys': 'Syst. Coord.',
			'snap': 'Accrochage',
			'snap_layers': "Couches d'accrochage",
			'snap_init_error': "Impossible d'initialiser l'accrochage.<br>Veuillez zoomer pour activer l'accrochage de la mesure.",
			'coordinates': 'Coordonnées',
			'coordinates_mode': 'Mode de Coordonnées',
			'distance': 'Distance',
			'angle_unit_deg': 'Degrés',
			'angle_unit_rad': 'Radians',
			'angle_unit_grad': 'Grades',
			'length_unit_km': 'Kilomètres',
			'length_unit_m': 'Mètres',
			'length_unit_ft': 'Pieds',
			'undo': 'Annuler',
			'redo': 'Rétablir',
			'msg_confirm': 'Confirmer',
			'zoom_to_office': 'Zoom initial',
			'zoom_on_layer': 'Zoom sur la couche',
			'zoom_box': 'Zoom rectangle',
			'view_previous': 'Vue précédente',
			'view_next': 'Vue suivante',
			'goto_open': 'Chercher par coordonnées',
			'goto_wintitle': 'Chercher par coordonnées',
			'goto_clear_marker': 'Effacer le marqueur',
			'goto_go_to_position': 'Aller à la position',
			'goto_dec_title':'Coordonnées (Dec)',
			'goto_dec_easting': "Longitude (X)",
			'goto_dec_northing': "Latitude (Y)",
			'goto_dm_title': 'Coordonnées (DM)',
			'goto_dm_easting': "Longitude (X)",
			'goto_dm_northing': "Latitude (Y)",
			'goto_dms_title': 'Coordonnées (DMS)',
			'goto_dms_easting': "Longitude (X)",
			'goto_dms_northing': "Latitude (Y)",
			'open_overview': 'Aperçu',
			'mouse_position': "Position à la souris",
			'feature_info': "Information sur les données",
			'select_in_progress': 'Sélection en cours...',
			'select_attribute': 'Attribut',
			'select_value': 'Valeur',
			'lbl_projection': 'Projection'
		}
	}
}
Ext.define('Ck._Lang', {
	singleton: true,
	config: {
		currentLang: null,
		defaultLang: 'en'
	},
	getStrings: function(lang) {
        if (!lang || !Ext.isDefined(this.strings[lang]))
            lang=this.getDefaultLang();
        if (Ext.isString(this.strings[lang])) // got an aliase
            lang = this.strings[lang];
        return Ext.isDefined(this.strings[lang])
                ? this.strings[lang]
                : { };
    },
	t : function(label, lang) {
        var path = label.toLowerCase().split('.'),
            p = this.getStrings(lang); // strings
        for (var i = 0; i<path.length; i++) {
            if (Ext.isDefined( p[ path[i] ]))
                p = p[ path[i] ];
            else return '<<' + label + '>>';
        }
        return p;
    },
	constructor : function(config) {
        this.initConfig(config);
        if (!this.getCurrentLang())
            this.setCurrentLang( this.getDefaultLang());
    },
	strings: Ext.manifest.ckClient.i18n
});
var loc = 'en';
try {
	loc = LOCALE;
} catch (e) {
	// Do nothing, use the default value
}
Ck._Lang.setCurrentLang(loc.split('-')[0]);
Ck.text = function(label, lang) { return Ck._Lang.t(label, lang || Ck._Lang.getCurrentLang() || Ck._Lang.getDefaultLang());};
Ck.textFormat = function(label, variables) {
	var text = Ck.text(label);
	for (var k in variables) {
		text = text.replace('{' + k + '}', variables[k]);
	}
	return text;
}