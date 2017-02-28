define([
  'backbone',
], function(Backbone) {
  return function(config) {
    return new Backbone.Model(config);
  }
});
