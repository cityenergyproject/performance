define([
  'jquery',
  'underscore',
  'backbone',
  'collections/city_buildings',
  'text!templates/map/building_info.html'
], function($, _, Backbone, CityBuildings, BuildingInfoTemplate){

  var baseCartoCSS = [
    '{marker-fill: #CCC;' +
    'marker-fill-opacity: 0.9;' +
    'marker-line-color: #FFF;' +
    'marker-line-width: 0.5;' +
    'marker-line-opacity: 1;' +
    'marker-placement: point;' +
    'marker-multi-policy: largest;' +
    'marker-type: ellipse;' +
    'marker-allow-overlap: true;' +
    'marker-clip: false;}'
  ];

  var CartoStyleSheet = function(tableName, bucketCalculator) {
    this.tableName = tableName;
    this.bucketCalculator = bucketCalculator;
  };

  CartoStyleSheet.prototype.toCartoCSS = function(){
    var bucketCSS = this.bucketCalculator.toCartoCSS(),
        styles = baseCartoCSS.concat(bucketCSS),
        tableName = this.tableName;
    styles = _.reject(styles, function(s) { return !s; });
    styles = _.map(styles, function(s) { return "#" + tableName + " " + s; });
    return styles.join("\n");
  };

  var BuildingInfoPresenter = function(city, allBuildings, buildingId){
    this.city = city;
    this.allBuildings = allBuildings;
    this.buildingId = buildingId;
  };

  BuildingInfoPresenter.prototype.toLatLng = function() {
    var building = this.toBuilding();
    if (typeof building === 'undefined') return null;

    return {lat: building.get('lat'), lng: building.get('lng')};
  };

  BuildingInfoPresenter.prototype.toBuilding = function() {
    return this.allBuildings.find(function(building) {
      return building.get(this.city.get('property_id')) == this.buildingId;
    }, this);
  };

  BuildingInfoPresenter.prototype.toPopulatedLabels = function()  {
    var default_hidden = false;
    return _.map(this.city.get('popup_fields'), function(field) {
      var suppress = false;
      if (field.start_hidden) default_hidden = true;
      var building = this.toBuilding();
      var value = (typeof building === 'undefined') ? null : building.get(field.field);

      if (field.suppress_unless_field &&
          field.suppress_unless_values &&
          (typeof building !== 'undefined') &&
          (field.suppress_unless_values.indexOf(building.get(field.suppress_unless_field)) === -1)) {
        suppress = true; // do not display this field
      }

      // don't apply toLocaleString if it's a year, to prevent commas in year.
      return _.extend({
        value: field.isYear ? (value || 'N/A') : (value || 'N/A').toLocaleString(),
        default_hidden: default_hidden,
        suppress: suppress
      }, field);
    }, this);
  };

  var LayerView = Backbone.View.extend({
    initialize: function(options){
      this.state = options.state;
      this.leafletMap = options.leafletMap;
      this.mapElm = $(this.leafletMap._container);

      this.allBuildings = new CityBuildings(null, {});

      // Listen for all changes but filter in the handler for these
      // attributes: layer, filters, categories, and tableName
      //this.listenTo(this.state, 'change', this.changeStateChecker);

      this.listenTo(this.state, 'change:modified_buildings', this.render);

      // building has a different handler
      this.listenTo(this.state, 'change:building', this.onBuildingChange);
      this.listenTo(this.state, 'clear_map_popups', this.onClearPopups);
      //this.listenTo(this.allBuildings, 'sync', this.render);

      var self = this;
      this.leafletMap.on('popupclose', function(e) {
        self.state.set({building: null});
      });
      // register single handler for showing more attrs in popup
      $('body').on('click', '.show-hide-attrs', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var is_show = $(this).text().indexOf('more') > -1 ? true: false;
        if(is_show){
          $(this).text('less details...');
          $('.show-more-container').removeClass('hide').addClass('show');
        }
        else {
          $(this).text('more details...');
          $('.show-more-container').removeClass('show').addClass('hide');
        }

        self.leafletMap.eachLayer(function(layer){
            if (layer._tip) {
              self.adjustPopup(layer);
            }
        });
      });
    },

    // Keep popup in map view after showing more details
    adjustPopup: function(layer) {
      var container = $(layer._container);
      var latlng = layer.getLatLng();
      var mapSize = this.leafletMap.getSize();

      var pt = this.leafletMap.latLngToContainerPoint(latlng);
      var height = container.height();
      var top = pt.y - height;

      if (top < 0) {
        this.leafletMap.panBy([0, top]);
      }
    },

    onClearPopups: function() {
      var map = this.leafletMap;

      map.eachLayer(function(lyr) {
        if (lyr._tip) {
          map.removeLayer(lyr);
        }
      });
    },

    getBuildings: function() {
      return this.state.get('modified_buildings');
    },

    onBuildingChange: function() {
      if (!this.state.get('building')) return;
      var buildings = this.getBuildings();
      var template = _.template(BuildingInfoTemplate),
          presenter = new BuildingInfoPresenter(this.state.get('city'), buildings, this.state.get('building'));

      L.popup()
       .setLatLng(presenter.toLatLng())
       .setContent(template({labels: presenter.toPopulatedLabels()}))
       .openOn(this.leafletMap);

      setTimeout(function(){
        this.state.trigger('building_layer_popup_shown');
      }.bind(this),1);
    },

    onFeatureClick: function(event, latlng, _unused, data){
      var propertyId = this.state.get('city').get('property_id'),
          buildingId = data[propertyId];

      var current = this.state.get('building');

      // Need to unset building if current is same
      // as buildingId or the popup will not appear
      if (current === buildingId) {
        this.state.unset('building', {silent: true});
      }

      this.state.set({building: buildingId});
    },

    onFeatureOver: function(){
      this.mapElm.css('cursor', "help");
    },
    onFeatureOut: function(){
      this.mapElm.css('cursor', '');
    },

    onStateChange: function(){
      console.log('>>>>>> State Change');
      // TODO: should not be mutating the buildings model.
      _.extend(this.allBuildings, this.state.pick('tableName', 'cartoDbUser'));
      this.allBuildings.fetch();
    },

    buildingsModified: function() {
      console.log('>>>>> BUILDINGS MOD')
    },

    changeStateChecker: function() {
      // this.buildings = this.allBuildings.toFilter(this.allBuildings, this.state.get('categories'), this.state.get('filters'));
      // filters change
      if (this.state._previousAttributes.filters !== this.state.attributes.filters) {
        return this.onStateChange();
      }
      // layer change
      if (this.state._previousAttributes.layer !== this.state.attributes.layer) {
        return this.onStateChange();
      }
      // catergory change
      if (this.state._previousAttributes.categories !== this.state.attributes.categories) {
        return this.onStateChange();
      }
      // tableName change
      if (this.state._previousAttributes.tableName !== this.state.attributes.tableName) {
        return this.onStateChange();
      }

    },


    toCartoSublayer: function(){
      // Need to pass allbuildings here so ColorBucketCalculator functions properly
      var buildings = this.state.get('allbuildings');
      var buildingColorBucketManager = this.state.get('buildingColorBucketManager');

      var state = this.state;
      var city = state.get('city');
      var fieldName = state.get('layer');
      var cityLayer = _.findWhere(city.get('map_layers'), {field_name: fieldName});
      var buckets = cityLayer.range_slice_count;
      var colorStops = cityLayer.color_range;
      var calculator = buildingColorBucketManager.get(buildings, fieldName, buckets, colorStops);
      var stylesheet = new CartoStyleSheet(buildings.tableName, calculator);

      return {
        sql: buildings.toSql(state.get('categories'), state.get('filters'), true),
        cartocss: stylesheet.toCartoCSS(),
        interactivity: this.state.get('city').get('property_id')
      };
    },

    render: function(){
      if(this.cartoLayer) {
        this.cartoLayer.getSubLayer(0).set(this.toCartoSublayer()).show();
        return this;
      }

      // skip if we are loading `cartoLayer`
      if (this.cartoLoading) return;

      var buildings = this.getBuildings();

      this.cartoLoading = true;
      cartodb.createLayer(this.leafletMap, {
        user_name: buildings.cartoDbUser,
        type: 'cartodb',
        sublayers: [this.toCartoSublayer()]
      },{https: true}).addTo(this.leafletMap).on('done', this.onCartoLoad, this);

      return this;
    },
    onCartoLoad: function(layer) {
      this.cartoLoading = false;
      var sub = layer.getSubLayer(0);
      this.cartoLayer = layer;
      sub.setInteraction(true);
      sub.on('featureClick', this.onFeatureClick, this);
      sub.on('featureOver', this.onFeatureOver, this);
      sub.on('featureOut', this.onFeatureOut, this);
      this.onBuildingChange();
    }
  });

  return LayerView;

});
