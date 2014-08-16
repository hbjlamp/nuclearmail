/**
 * @jsx React.DOM
 */

var _ = require('lodash');
var classToMixinFunction = require('./classToMixinFunction');

class StoreToStateMixin {
  constructor(component, config) {
    this._component = component;
    this._config = config;
    this._optionsByStateFieldName = {};
  }

  _onResult(stateFieldName, result) {
    var state = {};
    var fieldState = state[stateFieldName] =
      _.clone(this._component.state[stateFieldName]) || {};
    fieldState.isLoading = false;
    fieldState.result = result;
    this._component.setState(state);
  }

  _createsubscriptions(props, state) {
    _.forEach(this._config, (stateConfig, stateFieldName) => {
      var options = stateConfig.getOptions(props, state);
      this._callMethod(stateConfig, stateFieldName, options);
    });
  }

  _callMethod(stateConfig, stateFieldName, options) {
    this._optionsByStateFieldName[stateFieldName] = options;

    stateConfig.method(options)
      .then(this._onResult.bind(this, stateFieldName))
      ['catch'](error => console.error(error));
  }

  componentWillMount() {
    this._createsubscriptions(
      this._component.props,
      this._component.state
    );
  }

  componentWillUpdate(nextProps, nextState) {
    _.forEach(this._config, (stateConfig, stateFieldName) => {
      var newOptions = stateConfig.getOptions(nextProps, nextState);
      var oldOptions = this._optionsByStateFieldName[stateFieldName];

      if (!_.isEqual(newOptions, oldOptions)) {
        this._callMethod(this, stateConfig, stateFieldName, newOptions);
      }
    });
  }

  getInitialState() {
    return _.mapValues(this._config, (stateConfig, stateFieldName) => ({
      isLoading: true,
      result: null,
    }));
  }
}

module.exports = classToMixinFunction(StoreToStateMixin);
