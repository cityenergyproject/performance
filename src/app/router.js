// Filename: router.js
//
define([
  'jquery',
  'deparam',
  'underscore',
  'backbone',
  'models/city',
  'models/building_color_bucket_calculator',
  'models/building_bucket_calculator',
  'collections/city_buildings',
  'views/layout/header',
  'views/layout/footer',
  'views/map/map',
  'views/map/address_search_autocomplete',
  'views/map/year_control',
  'views/building_comparison/building_comparison',
  'views/layout/activity_indicator',
], function($, deparam, _, Backbone, CityModel, BuildingColorBucketManager, BuildingBucketManager, CityBuildings, HeaderView, FooterView, MapView, AddressSearchView, YearControlView, BuildingComparisonView, ActivityIndicator) {
  var RouterState = Backbone.Model.extend({
    queryFields: ['filters', 'categories', 'layer', 'metrics', 'sort', 'order', 'lat', 'lng', 'zoom', 'building'],
    defaults: {
      metrics: [],
      categories: {},
      filters: []
    },

    toQuery: function(){
      let attributes = this.pick(this.queryFields);
      let query = $.param(attributes);
      return `?${query}`;
    },

    toUrl: function(){
      let year = this.get('year');
      let path;

      if (year) {
        path = `/${year}${this.toQuery()}`;
      } else {
        path = `/${year}`;
      }

      return path;
    },

    asBuildings: function() {
      return new CityBuildings(null, this.pick('tableName', 'cartoDbUser'));
    }
  });

  var StateBuilder = function(city, year, layer) {
    this.city = city;
    this.year = year;
    this.layer = layer;
  };

  StateBuilder.prototype.toYear = function() {
    let currentYear = this.year;
    let availableYears = _.chain(this.city.years).keys().sort();
    let defaultYear = availableYears.last().value();

    return availableYears.contains(currentYear).value() ? currentYear : defaultYear;
  };

  StateBuilder.prototype.toLayer = function(year) {
    let currentLayer = this.layer;
    let availableLayers = _.chain(this.city.map_layers).pluck('field_name');
    let defaultLayer = this.city.years[year].default_layer;

    return availableLayers.contains(currentLayer).value() ? currentLayer : defaultLayer;
  };

  StateBuilder.prototype.toState = function() {
    let year = this.toYear();
    let layer = this.toLayer(year);

    return {
      url_name: this.city.url_name,
      year: year,
      cartoDbUser: this.city.cartoDbUser,
      tableName: this.city.years[year].table_name,
      layer: layer,
      sort: layer,
      order: 'desc',
      categories: this.city.categoryDefaults || [],
      buildingColorBucketManager: new BuildingColorBucketManager(),
      buildingBucketManager: new BuildingBucketManager()
    };
  };

  var Router = Backbone.Router.extend({
    state: new RouterState({}),
    routes:{
        '': 'root',
        ':year': 'year',
        ':year/': 'year',
        ':year?:params': 'year',
        ':year/?:params': 'year',
    },

    initialize: function(){
      // check to see if configuration file is there....
      if (typeof EP_CONFIG === 'undefined') throw new Error('Missing configuration file!');

      var activityIndicator = new ActivityIndicator({state: this.state});
      // // var headerView = new HeaderView({state: this.state});
      var yearControlView = new YearControlView({state: this.state});
      var mapView = new MapView({state: this.state});
      var addressSearchView = new AddressSearchView({mapView: mapView, state: this.state});
      //var comparisonView = new BuildingComparisonView({state: this.state});
      // // var footerView = new FooterView({state: this.state});

      this.state.on('change', this.onChange, this);
      this.createCityModel();
    },
    onChange: function(){
      var changed = _.keys(this.state.changed);

      this.navigate(this.state.toUrl(), {trigger: false, replace: true});

      // year changes load new data from Carto
      if (_.contains(changed, 'year') && this.yearsDirty()) {
        console.log('>>> Change: Year >>>');
        this.onYearChange();
      } else {

        // Filter & category changes modify current building data...
        if (this.state._previousAttributes.filters !== this.state.attributes.filters) {
          console.log('>>> Change: Filters >>>');
          this.onBuildingModifiersChange();
        }

        if (this.state._previousAttributes.categories !== this.state.attributes.categories) {
          console.log('>>> Change: Categories >>>');
          this.onBuildingModifiersChange();
        }
      }
    },

    yearsDirty: function() {
      var current = this.state.get('year');
      var previous = this.state.previous('year');

      // skip undefined since it's most likely the
      // user came to the site w/o a hash state
      if (typeof previous === 'undefined') return false;

      // Mostly likely will never occur
      if (previous === current) return false;

      return true;
    },

    onYearChange: function() {
      this.createCityModel();
    },

    createCityModel: function(){
      var city = CityModel(EP_CONFIG);
      this.onCityCreation(city, EP_CONFIG);
    },

    onCityCreation: function(city, results) {
      var year = this.state.get('year'),
          layer = this.state.get('layer'),
          newState = new StateBuilder(results, year, layer).toState(),
          defaultMapState = {lat: city.get('center')[0], lng: city.get('center')[1], zoom: city.get('zoom')},
          mapState = this.state.pick('lat', 'lng', 'zoom');

      _.defaults(mapState, defaultMapState);
      // set this to silent because we need to load buildings
      this.state.set(_.extend({city: city}, newState, mapState));

      this.fetchBuildings();
    },

    fetchBuildings: function() {
      this.state.trigger('showActivityLoader');
      this.allBuildings = this.state.asBuildings();

      this.allBuildings.sqlReturnFields(EP_CONFIG.fields_to_return || '*');

      this.listenToOnce(this.allBuildings, 'sync', this.onBuildingsSync, this);

      this.allBuildings.fetch();
    },

    modifyBuildings: function(buildings) {
      if (!buildings) return null;

      var b = buildings.toFilter(buildings, this.state.get('categories'), this.state.get('filters'));
      return new CityBuildings(b, this.state.pick('tableName', 'cartoDbUser'));
    },

    onBuildingModifiersChange: function() {
      var buildings = this.state.get('allbuildings');
      if (!buildings) return;

      this.state.set({
        modified_buildings: this.modifyBuildings(buildings)
      });
    },

    onBuildingsSync: function() {
      this.state.set({
        allbuildings: this.allBuildings,
        modified_buildings: this.modifyBuildings(this.allBuildings)
      });

      this.state.trigger('hideActivityLoader');
    },

    root: function () {
      //this.navigate('/', {trigger: true, replace: true});
    },

    year: function(year, params){
      params = params ? deparam(params) : {};
      this.state.set(_.extend({}, params, {year: year}));
    }
  });

  return Router;
});
