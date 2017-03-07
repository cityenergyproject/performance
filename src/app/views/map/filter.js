define([
  'jquery',
  'underscore',
  'backbone',
  'ionrangeslider',
  'views/charts/histogram',
  'text!templates/map_controls/filter_section_header.html',
  'text!templates/map_controls/filter.html',
  'text!templates/map_controls/filter_container.html'
], function($, _, Backbone, Ion, HistogramView, FilterSectionHeader, FilterTemplate, FilterContainer){

  var MapControlView = Backbone.View.extend({
    className: "map-control",
    $container: $('#map-controls'),

    initialize: function(options){
      this.layer = options.layer;
      this.allBuildings = options.allBuildings;
      this.state = options.state;

      this.listenTo(this.state, 'change:layer', this.onLayerChange);
      //this.listenTo(this.state, 'change:filters', this.render);
    },

    onLayerChange: function(){
      let fieldName = this.layer.field_name;
      let currentLayer = this.state.get('layer');
      let isCurrent = currentLayer == fieldName;

      this.$el.toggleClass('current', isCurrent);
      this.$section().toggleClass('current', this.$section().find('.current').length > 0);
    },

    close: function() {
      this.undelegateEvents();
      this.remove();
    },

    render: function(isUpdate){
      isUpdate = isUpdate || false;

      let template = _.template(FilterContainer);
      let fieldName = this.layer.field_name;
      let safeFieldName = fieldName.toLowerCase().replace(/\s/g, "-");
      let $el = $('#' + safeFieldName);
      let currentLayer = this.state.get('layer');
      let isCurrent = currentLayer == fieldName;
      let $section = this.$section();
      let filterRange = this.layer.filter_range;
      let rangeSliceCount = this.layer.range_slice_count;
      let colorStops = this.layer.color_range;
      let buildings = this.allBuildings;

      let buildingBucketManager = this.state.get('buildingBucketManager');
      let bucketCalculator = buildingBucketManager.get(buildings, fieldName, rangeSliceCount, filterRange);

      let extent = bucketCalculator.toExtent();
      let buckets = bucketCalculator.toBuckets();

      let buildingColorBucketManager = this.state.get('buildingColorBucketManager');
      let gradientCalculator = buildingColorBucketManager.get(buildings, fieldName, rangeSliceCount, colorStops);

      let gradientStops = gradientCalculator.toGradientStops();
      let histogram;
      let $filter;
      let filterTemplate = _.template(FilterTemplate);
      let stateFilters = this.state.get('filters');
      let filterState = _.findWhere(stateFilters, {field: fieldName}) || {min: extent[0], max: extent[1]};
      let filterRangeMin = (filterRange && filterRange.min) ? filterRange.min : extent[0];
      let filterRangeMax = (filterRange && filterRange.max) ? filterRange.max : extent[1];

      let bucketGradients = _.map(gradientStops, function(stop, bucketIndex){
        return {
          color: stop,
          count: buckets[bucketIndex] || 0
        };
      });

      if ($el.length === 0) {
        this.$el.html(template(_.defaults(this.layer, {description: null})));
        this.$el.find('.filter-wrapper').html(filterTemplate({id: fieldName}));
        this.$el.attr('id', safeFieldName);
      } else {
        this.$el = $el;
      }

      if (!this.$filter) {
        this.$slider = this.$el.find('.filter-wrapper').ionRangeSlider({
          type: 'double',
          hide_from_to: false,
          force_edges: true,
          grid: false,
          hide_min_max: true,
          step: (filterRangeMax < 1) ? 0.0001 : 1,
          prettify_enabled: !(fieldName.match(/year/) || fieldName.match(/energy_star/)), // TODO: don't hardcode this?
          prettify: this.onPrettifyHandler(filterRangeMin, filterRangeMax),
          onFinish: _.bind(this.onFilterFinish, this),
        });

        this.$filter = this.$slider.data("ionRangeSlider");
      }

      // if this is a slider update, skip
      // otherwise when user clicks on slider bar
      // will cause a stack overflow
      if (!isUpdate){
        this.$filter.update({
          from: filterState.min,
          to: filterState.max,
          min: filterRangeMin,
          max: filterRangeMax
        });
      }

      if (!this.histogram) {
        this.histogram = new HistogramView({gradients: bucketGradients, slices: rangeSliceCount, filterRange: [filterRangeMin, filterRangeMax], quantileScale: gradientCalculator.colorGradient().copy()});
      }

      this.$el.find('.chart').html(this.histogram.render());

      this.$el.toggleClass('current', isCurrent);

      if (isCurrent || $section.find('.current').length > 0) {
        $section.find('input').prop('checked', true);
      }

      $section.toggleClass('current', isCurrent || $section.find('.current').length > 0);

      if (!isUpdate){
       $section.find('.category-control-container').append(this.$el);
      } else {
        let positionInCategory;
        $section
          .find('.category-control-container > .map-control')
          .each((index, el) => {
            if ($(el).attr('id') === this.layer.field_name){
              positionInCategory = index;
            }
          });

        switch(positionInCategory){
          case 0:
            $section.find('.category-control-container').prepend(this.$el);
            break;
          default:
            $section
              .find(`.category-control-container > div:nth-child(${positionInCategory})`)
              .after(this.$el);
        }
      }

      return this;
    },
    onFilterFinish: function(rangeSlider) {
      let filters = this.state.get('filters');
      let fieldName = this.layer.field_name;

      filters = _.reject(filters, function(f){ return f.field == fieldName; });

      if (rangeSlider.from !== rangeSlider.min || rangeSlider.to !== rangeSlider.max){
        let newFilter = {field: fieldName};

        // Only include min or max in the filter if it is different from the rangeSlider extent.
        // This is important to the rangeSlider can clip the extreme values off, but we don't
        // want to use the rangeSlider extents to filter the data on the map.
        if (rangeSlider.from !== rangeSlider.min) newFilter.min = rangeSlider.from;
        if (rangeSlider.to   !== rangeSlider.max) newFilter.max = rangeSlider.to;

        filters.push(newFilter);
      }

      // fire event for other non Filter.js listeners
      this.state.set({filters: filters});
      this.render(true);
    },

    onPrettifyHandler: function(min, max) {
      return function(num) {
        switch(num) {
          case min: return num.toLocaleString();
          case max: return num.toLocaleString() + '+';
          default: return num.toLocaleString();
        }
      };
    },

    events: {
      'click' : 'showLayer',
      'click .more-info': 'toggleMoreInfo',
    },

    showLayer: function(){
      let fieldName = this.layer.field_name;
      this.state.set({layer: fieldName, sort: fieldName, order: 'desc'});
    },

    toggleMoreInfo: function(){
      this.$el.toggleClass('show-more-info');
      return this;
    },

    $section: function(){
      let sectionName = this.layer.section;
      let safeSectionName = sectionName.toLowerCase().replace(/\s/g, "-");
      let $sectionEl = $("#" + safeSectionName);
      let template = _.template(FilterSectionHeader);

      if ($sectionEl.length > 0) { return $sectionEl; }

      $sectionEl = $(template({category: sectionName})).appendTo(this.$container);

      return $sectionEl;
    }
  });

  return MapControlView;
});
