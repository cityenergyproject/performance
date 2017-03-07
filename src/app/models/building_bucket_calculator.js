define([
  'underscore',
  'd3'
], function(_, d3) {
  var BuildingBucketCalculator = function(buildings, fieldName, buckets, filterRange) {
    this.buildings = buildings;
    this.fieldName = fieldName;
    this.buckets = buckets;
    this.filterRange = filterRange || {};

    this.memoized = {};
  };

  BuildingBucketCalculator.prototype.getScale = function() {
    var extent = this.toExtent(),
        maxBuckets = this.buckets - 1;

    var scale = d3.scale.linear().domain(extent).rangeRound([0, maxBuckets]);

    // stuff maxBuckets into scale, for future reference
    scale._maxBuckets = maxBuckets;

    return scale;
  };

  BuildingBucketCalculator.prototype.toExtent = function() {
    if (this.memoized.toExtent) return this.memoized.toExtent;

    var fieldValues = this.buildings.pluck(this.fieldName),
        extent = d3.extent(fieldValues),
        min = this.filterRange.min,
        max = this.filterRange.max;

    this.memoized.toExtent = [min || extent[0], max || extent[1]];

    return this.memoized.toExtent;
  };

  // Allow for extent & scale to be passed in,
  // speeds up the "toBuckets" function
  BuildingBucketCalculator.prototype.toBucket = function(value, extent, scale) {
    extent = extent || this.toExtent();
    scale = scale || this.getScale();

    return _.min([_.max([scale(value), 0]), scale._maxBuckets]);
  };

  BuildingBucketCalculator.prototype.toBuckets = function() {
    if (this.memoized.toBuckets) return this.memoized.toBuckets;
    var self = this;

    var scale =  this.getScale();
    var extent = scale.domain();

    this.memoized.toBuckets = this.buildings.reduce((memo, building) => {
      var value = building.get(self.fieldName);
      if (!value) {return memo;}
      var scaled = self.toBucket(value, extent, scale);
      memo[scaled] = memo[scaled] + 1 || 1;
      return memo;
    }, {});

    return this.memoized.toBuckets;
  };

  // Manage the creation of bucket calculator
  var BuildingBucketManager = function() {
    this.memoized = {};
  }

  BuildingBucketManager.prototype.get = function(buildings, fieldName, buckets, filterRange) {
    if (this.memoized.hasOwnProperty(fieldName)) return this.memoized[fieldName];
    this.memoized[fieldName] = new BuildingBucketCalculator(buildings, fieldName, buckets, filterRange);

    return this.memoized[fieldName];
  }

  BuildingBucketManager.prototype.clear = function() {
    this.memoized = {};
  }

  return BuildingBucketManager;
});
