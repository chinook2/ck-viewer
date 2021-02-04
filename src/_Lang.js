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
	strings: {
        'en': {
            'action_close': 'Close',
			'action_save': 'Save',
			'action_validate': 'Validate',
			'action_update': 'Update',
			'action_cancel': 'Cancel',
			'edit': 'Edition',
			"name": "Name",
            'map' : 'Map',
			'map_accuracy': 'Accuracy',
			'map_northing': 'Northing',
			'map_easting': 'Easting',
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
			'topo_report_title': 'Topology Report',
			'topo_report_error_parcel_intersec': 'ERROR - Parcel intersections',
			'topo_report_warning_parcel_intersec': 'Warning - Parcel intersections',
			'topo_report_warning_parcel_topo': 'Warning - Parcel Topology',
			'topo_report_warning_parcel_area': 'Warning - Parcel Area',
			'topo_report_parcel_moved': 'Parcel moved',
			'topo_report_parcel_moved_delta_n': 'delta N',
			'topo_report_parcel_moved_delta_e': 'delta E',
			'topo_report_adjust_computed': 'ADJUSTMENT COMPUTED',
			'topo_report_adjust_setting': 'Adjustment Settings',
			'topo_report_linear_units': 'Linear Units: meters',
			'topo_report_coordsystem': 'Coordinate System: ITRF2005',
			'topo_report_no_transform_method': 'Without transformation method.',
			'topo_report_transform_method_helmert': 'Method: Helmert',
			'topo_report_angle_rotation': 'rotation angle',
			'topo_report_scale_factor': 'scale factor',
			'topo_report_shift_param': 'shift parameters',
			'topo_report_transform_method_least': 'Method: Least Squares',
			'topo_report_residual_x': 'Residual DX',
			'topo_report_residual_y': 'Residual DY',
			'topo_report_residual_table_header': '| Link   | Residual X | Residual Y |',
			'topo_report_max_coord_shift': 'Max coordinate shift at point ',
			'topo_report_average_shift': 'Average coordinate shift',
			'topo_report_adjust': 'ADJUSTMENT',
			'topo_report_no_adjust': 'NO ADJUSTMENT',
			'topo_report_points': 'POINTS',
			'topo_report_traverses': 'TRAVERSES',
			'topo_report_coord_survey': 'coordinates (survey)',
			'topo_report_coord_computed': 'coordinates (computed)',
			'topo_report_length_survey': 'Survey length',
			'topo_report_length_computed': 'Computed length',
			'topo_report_point_type_isolated': 'isolated',
			'topo_report_point_type_close point': 'close point',
			'topo_report_point_type_close line': 'close line',
			'topo_report_point_type_snap': 'snap',
			'createedit_parcel': 'Create/Edit parcel',
			'edit_parcel': 'Edit parcel',
			'parcel': 'Parcel',
			'points': 'Points',
			'traverses': 'Traverses',
			'coord_sys': 'Coord. Syst.',
			'snap': 'Snap',
			'snap_layers': 'Snap Layers',
			'edit_point_n_survey': "N (Survey)",
			'edit_point_e_survey': "E (Survey)",
			'edit_point_crs_survey': "CRS (Survey)",
			'edit_point_n_computed': "N (Computed)",
			'edit_point_e_computed': "E (Computed)",
			'edit_point_crs_computed': "CRS (Computed)",
			"bearing_dist": "Bearing distance",
			'bearing_dist_mode':'Bearing / Distance mode',
			'coordinates': 'Coordinates',
			'coordinates_mode': 'Coordinates Mode',
			'distance': 'Distance',
			'add_point_in': 'Add point in',
			'add_point': 'Add point',
			'add_point_tooltip': 'Add point by clicking on map',
			'add_part_tooltip': 'Add other ring side to current polygon',
			'add_interior_ring': 'Add interior ring (inside current polygon)',
			'add_point_select_temp_parcel': 'Add points by selection temporary parcel on map.',
			'activate_multipolygon': 'Activate MultiPolygon mode',
			'line_id': 'Id',
			'line_from': 'From',
			'line_to': 'To',
			'line_direction': 'Direction',
			'line_survey_length': 'Survey length',
			'line_survey_length_required': 'Survey length mandatory',
			'line_gis_length': 'GIS length',
			'parcel_number': "Parcel No.",
			'parcel_suid': 'SUID',
			'parcel_survey_area': "Survey Area",
			'parcel_survey_area_required': "Survey Area is mandatory.",
			'parcel_gis_area': "GIS Area",
			'parcel_legal_area': "Legal Area",
			'parcel_part': 'Part',
			'parcel_ring': 'Ring',
			'angle_unit_deg': 'Degreds',
			'angle_unit_rad': 'Radians',
			'angle_unit_grad': 'Grades',
			'length_unit_km': 'Kilometers',
			'length_unit_m': 'Meters',
			'length_unit_ft': 'Feet',
			'validate_mini_one_su': 'At least one spatial Unit should be specified.',
			'validate_jobarea_required': 'Job Area is required',
			'validate_jobarea_contains_source_parcels': "Job Area shall contain all source parcels.",
			'validate_the_parcel': "The  Parcel",
			'validate_parcel_need_mini_3_points': ' need at least 3 points',
			'validate_parcel_has_no_segment': " has no traverse.",
			'validate_parcel_has_no_accuracy':" has no accuracy.",
			'validate_parcel_has_no_survey_area': " has no survey area",
			'validate_parcel_mini_area': "Minimum area of a parcel is ",
			'validate_parcel_maxi_area': "Maximum area of a parcel is ",
			'validate_errors': 'Error(s)',
			'validate_warnings': 'Warning(s)',
			'validate_parcel_survey_area_equal_gis_area':'Survey area of created parcel{0} ({1} ha) should be approximately be the same (+/- {2}%) as GIS Area ({3} ha).',
			'validate_parcel_legal_area_equal_gis_area': 'Legal area of created parcel{0} ({1} ha) should be approximately be the same  (+/- {2}%) as GIS Area ({3} ha).',
			'validate_parcel_legal_area_equal_survey_area': 'Legal area of create parcel{0} ({1} ha) should be approximately be the same (+/- {2}%) as Survey area ({3} ha).',
			'validate_parcel_self_intersect':'Parcel self-intersection{0} detected.',
			'validate_parcel_overlap_accuracy_a': 'Parcel{0} overlaps parcel no.{1} with same accuracy A.',
			'validate_parcel_overlap_accuracy_n': 'Parcel{0} (accuracy {1}) overlaps parcel No.{2} with accuracy {3}.',
			'validate_parcel_not_in_jobarea': "Parcel{0} intersects or is outside job area.",
			'validate_parcel_overlap_otherlayer': "Parcel{0} overlaps other layer: ",
			'validate_point_not_snapped': "Point {0} is not snapped (closed point) {1}.",
			'validate_point_dangle': 'Point {0} in {1} in dangle.',
			'validate_parcel_in_district': 'Parcel{0} should be in "{1}" District but overlaps "{2}".',
			'validate_parcel_in_county': 'Parcel{0} should be in "{1}" County but overlaps "{2}".',
			'validate_parcel_zonal_office': 'Parcel{0} should be in "{1}" Zonal Office (or minimum 50% of the area).',
			'validate_parcel_zonal_office_2': 'Parcel{0} should be in "{1}" Zonal Office but only {2}% of the parcel overlap.',
			'validate_parcel_zonal_office_3': 'Parcel{0} should be in "{1}" Zonal Office but only {2}% of the parcel overlap (minimum 50%).',
			'validate_segment_survey_length': "Traverse {0} in {1} has no survey length.",
			'zoom_to_parcel': 'Zoom to parcel',
			'undo': 'Undo',
			'redo': 'Redo',
			'jobarea_draw': 'Draw Job Area',
			'jobarea_creating': 'Creating job area...',
			'jobarea_remove': 'Remove Job Area',
			'jobarea_remove_confirm_msg': 'Are you sure to delete the Job Area?',
			'jobarea_error': "Job Area Error",
			'jobarea_warning': "Job Area Warning",
			'jobarea_selfintersect': "Job Area is not valid (self intersection)!",
			'jobarea_overlap': "Job Area is not valid (intersect current Job Area)!",
			'jobarea_intersect': "Job Area intersect another Job Area with transaction number: ",
			'jobarea_contain_allsourceparcels': "Job Area must contain all sources parcels.",
			'jobarea_unable_check_parcelsource_inside': "Unable to check if Spatial Units source are inside Job Area.",
			'jobarea_unable_check_caddistrict': "Unable to check if Job Area is inside cadastral district.",
			'jobarea_outside_caddistrict': "Job Area is outside cadastral district.",
			'suedit_move': 'Move Parcel',
			'suedit_move_select': 'Select parcel to move.',
			'suedit_move_help': 'Start dragging selected parcel',
			'suedit_remove': 'Remove Parcel',
			'msg_confirm': 'Confirm',
			'suedit_remove_confirm_msg': 'Are you sure to clear parcel geometry ?',
			'zoom_to_office': 'Zoom to full extent',
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
			'identify_parcel': "Identify parcels"
        },
        'fr': {
            'action_close': 'Fermer',
			'action_save': 'Enregistrer',
			'action_validate': 'Valider',
			'action_update': 'Mettre à jour',
			'action_cancel': 'Annuler',
			'edit': 'Edition',
            'map' : 'Carte SIFOR',
			'map_accuracy': 'Précision',
			'map_northing': 'Latitude',
			'map_easting': 'Longitude',
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
			'topo_report_title': 'Rapport Topologique',
			'topo_report_error_parcel_intersec': 'ERREUR - Intersection entre parcelles',
			'topo_report_warning_parcel_intersec': 'Avertissement - Intersection entre parcelles',
			'topo_report_warning_parcel_topo': 'Avertissement - Topologie de parcelle',
			'topo_report_warning_parcel_area': 'Avertissement - Superficie de parcelle',
			'topo_report_parcel_moved': 'Parcelle déplacée',
			'topo_report_parcel_moved_delta_n': 'delta N',
			'topo_report_parcel_moved_delta_e': 'delta E',
			'topo_report_adjust_computed': 'AJUSTEMENT CALCULE',
			'topo_report_adjust_setting': "Paramètres d'Adjustement",
			'topo_report_linear_units': 'Unité de longueur: mètres',
			'topo_report_coordsystem': 'Système de coordonnées: ITRF2005',
			'topo_report_no_transform_method': 'Sans méthode de transformation.',
			'topo_report_transform_method_helmert': 'Méthode: Helmert',
			'topo_report_angle_rotation': 'angle de rotation',
			'topo_report_scale_factor': "facteur d'échelle",
			'topo_report_shift_param': 'paramètre de déplacement',
			'topo_report_transform_method_least': 'Méthode: moindres carrés',
			'topo_report_residual_x': 'Résidu DX',
			'topo_report_residual_y': 'Résidu DY',
			'topo_report_residual_table_header': '| Lien   | Résidu X | Résidu Y |',
			'topo_report_max_coord_shift': 'Déplacement de coordonnées max au point ',
			'topo_report_average_shift': 'Déplacement de coordonnées moyen',
			'topo_report_adjust': 'AJUSTEMENT',
			'topo_report_no_adjust': "PAS D' AJUSTEMENT",
			'topo_report_points': 'POINTS',
			'topo_report_traverses': 'SEGMENTS',
			'topo_report_coord_survey': 'coordonnées (de levé)',
			'topo_report_coord_computed': 'coordonnées (calculé)',
			'topo_report_length_survey': 'Longueur de levé',
			'topo_report_length_computed': 'Longueur calculée',
			'topo_report_point_type_isolated': 'isolé',
			'topo_report_point_type_close point': 'point à proximité',
			'topo_report_point_type_close line': 'segment à proximité',
			'topo_report_point_type_snap': 'accrochage',
			'createedit_parcel': 'Créer/Editer la parcelle',
			'edit_parcel': 'Editer la parcelle',
			'parcel': 'Parcelle',
			'points': 'Points',
			'traverses': 'Segments',
			'coord_sys': 'Syst. Coord.',
			'snap': 'Accrochage',
			'snap_layers': "Couches d'accrochage",
			'edit_point_name': "Nom",
			'edit_point_n_survey': "N (Levé)",
			'edit_point_e_survey': "E (Levé)",
			'edit_point_crs_survey': "CRS (Levé)",
			'edit_point_n_computed': "N (Calculé)",
			'edit_point_e_computed': "E (Calculé)",
			'edit_point_crs_computed': "CRS (Calculé)",
			"bearing_dist": "Distance de relèvement",
			'bearing_dist_mode':'Mode distance/relèvement',
			'coordinates': 'Coordonnées',
			'coordinates_mode': 'Mode de Coordonnées',
			'distance': 'Distance',
			'add_point_in': 'Ajouter un point dans',
			'add_point': 'Ajouter un point',
			'add_point_tooltip': 'Ajouter un point en cliquant sur la carte',
			'add_part_tooltip': 'Ajouter un autre polygon à côté du polygone actuel',
			'add_interior_ring': 'Ajouter un anneau intérieur (dans le polygone actuel)',
			'add_point_select_temp_parcel': 'Ajouter des points en sélectionnant une parcelle temporaire sur la carte.',
			'activate_multipolygon': 'Activer le mode MultiPolygone',
			'line_id': 'Id',
			'line_from': 'Depuis',
			'line_to': 'Vers',
			'line_direction': 'Direction',
			'line_survey_length': 'Longueur de levé',
			'line_survey_length_required': 'Longueur de levé obligatoire',
			'line_gis_length': 'Longueur SIG',
			'parcel_number': "No. Parcelle",
			'parcel_suid': 'SUID',
			'parcel_survey_area': "Superficie de levé",
			'parcel_survey_area_required': "Superficie de levé obligatoire.",
			'parcel_gis_area': "Superficie SIG",
			'parcel_legal_area': "Superficie légale",
			'parcel_part': 'Partie',
			'parcel_ring': 'Anneau',
			'angle_unit_deg': 'Degrés',
			'angle_unit_rad': 'Radians',
			'angle_unit_grad': 'Grades',
			'length_unit_km': 'Kilomètres',
			'length_unit_m': 'Mètres',
			'length_unit_ft': 'Pieds',
			'validate_mini_one_su': 'Au moins une parcelle doit être ajoutée',
			'validate_jobarea_required': "L'aire de travail est requise.",
			'validate_jobarea_contains_source_parcels': "L'aire de travail doit contenir toutes les parcelles source.",
			'validate_the_parcel': "La Parcelle",
			'validate_parcel_need_mini_3_points': ' nécessite au moins 3 points',
			'validate_parcel_has_no_segment': " n'a pas de segment.",
			'validate_parcel_has_no_accuracy':" n'a pas de précision.",
			'validate_parcel_has_no_survey_area': " n'a pas de superficie de levé.",
			'validate_parcel_mini_area': "La superficie minimum d'une parcelle est ",
			'validate_parcel_maxi_area': "La superficie maximum d'une parcelle est ",
			'validate_errors': 'Erreur(s)',
			'validate_warnings': 'Avertissement(s)',
			'validate_parcel_survey_area_equal_gis_area':'La superficie de levé de la parcelle créée{0} ({1} ha) doit être approximativement la même (+/- {2}%) que la superficie SIG ({3} ha).',
			'validate_parcel_legal_area_equal_gis_area': 'La superficie légale de la parcelle créée{0} ({1} ha) doit être approximativement la même (+/- {2}%) que la superficie SIG ({3} ha).',
			'validate_parcel_legal_area_equal_survey_area': 'La superficie légale de la parcelle créée{0} ({1} ha) doit être approximativement la même (+/- {2}%) que la superficie de levé ({3} ha).',
			'validate_parcel_self_intersect':'Auto-intersection de la parcelle{0} détectée.',
			'validate_parcel_overlap_accuracy_a': 'La parcelle{0} chevauche la parcelle No.{1} avec la même précision A.',
			'validate_parcel_overlap_accuracy_n': 'La parcelle{0} (précision {1}) chevauche la parcelle No.{2} avec une précision {3}.',
			'validate_parcel_not_in_jobarea': "La parcelle{0} croise ou est en-dehors de l'aire de travail.",
			'validate_parcel_overlap_otherlayer': "'La parcelle{0} chevauche d'autre couches: ",
			'validate_point_not_snapped': "Le Point {0} n'est pas accroché (point à proximité) {1}.",
			'validate_point_dangle': 'Le Point {0} dans {1} est dans le vide.',
			'validate_parcel_in_district': 'La parcelle{0} doit être dans "{1}" District mais chevauche "{2}".',
			'validate_parcel_in_county': 'La parcelle{0} doit être dans "{1}" County mais chevauche "{2}".',
			'validate_parcel_zonal_office': 'La parcelle{0} doit être dans "{1}" le bureau (ou minimum 50% de la superficie).',
			'validate_parcel_zonal_office_2': 'La parcelle{0} doit être dans "{1}" le bureau mais seulement {2}% de la parcelle chevauche.',
			'validate_parcel_zonal_office_3': 'La parcelle{0} doit être dans "{1}" le bureau mais seulement {2}% de la parcelle chevauche (minimum 50%).',
			'validate_segment_survey_length': "Le segment {0} dans {1} n'a pas de longueur de levé.",
			'zoom_to_parcel': 'Zoomer sur la parcelle',
			'undo': 'Annuler',
			'redo': 'Rétablir',
			'jobarea_draw': 'Nouvelle zone de travail',
			'jobarea_creating': 'Création de la zone de travail...',
			'jobarea_remove': 'Supprimer la zone de travail',
			'jobarea_remove_confirm_msg': 'Êtes-vous sur de vouloir supprimer la zone de travail?',
			'jobarea_error': "Erreur avec la zone de travail",
			'jobarea_warning': "Avertissement sur la zone de travail",
			'jobarea_selfintersect': "Zone de travail invalide (auto-intersection)!",
			'jobarea_overlap': "Zone de travail invalide (intersection avec la zone de travail courante)!",
			'jobarea_intersect': "La zone de travail est en intersection avec une autre zone de travail de la transaction n°: ",
			'jobarea_contain_allsourceparcels': "La zone de travail doit contenir toutes les parcelles source.",
			'jobarea_unable_check_parcelsource_inside': "Impossible de vérifier si les parcelles sources sont dans la zone de travail.",
			'jobarea_unable_check_caddistrict': "Impossible de vérifier sir la zone de trvail est dans le district.",
			'jobarea_outside_caddistrict': "La zone de travail est à l'extérieur du district.",
			'suedit_move': 'Déplacer la parcelle',
			'suedit_move_select': 'Sélectionner la parcelle à déplacer.',
			'suedit_move_help': 'Commencer à déplacer la parcelle sélectionnée',
			'suedit_remove': 'Supprimer la parcelle',
			'msg_confirm': 'Confirmer',
			'suedit_remove_confirm_msg': 'Êtes-vous sur de supprimer la géométrie de la parcelle ?',
			'zoom_to_office': 'Zoom initial',
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
			'identify_parcel': "Identifier les parcelles",
			
        }
    }
});
Ck._Lang.setCurrentLang((LOCALE || 'en').split('-')[0]);
Ck.text = function(label, lang) { return Ck._Lang.t(label, lang || Ck._Lang.getCurrentLang() || Ck._Lang.getDefaultLang());};
Ck.textFormat = function(label, variables) {
	var text = Ck.text(label);
	for (let k in variables) {
		text = text.replace('{' + k + '}', variables[k]);
	}
	return text;
}