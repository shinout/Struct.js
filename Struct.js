/**
 * Struct.js v0.0.1
 *
 * Copyright 2011, SHIN Suzuki 
 *
 */

const Struct = function(keyname) {
  const _ = Struct.PriProp(keyname);
  if (_.__proto__) {
    _.__proto__ = Struct.prototype;
  }
  else {
    Object.keys(Struct.prototype).forEach(function(p) {
      Object.defineProperty(_, p, {
        value    : Struct.prototype[p],
        writable : false
      });
    }, this);
  }
  var classFunction;
  Object.defineProperties(_, {
    requires : {
      value: {},
      writable: false
    },

    defaults : {
      value: {},
      writable: false
    },

    defaultFuncs : {
      value: {},
      writable: false
    },

    views: {
      value: {},
      writable: false
    },

    parentProps: {
      value: [],
      writable: false
    },

    enumerableDescs: {
      value: {},
      writable: false
    },

    classFunction : {
      get: function() {
        return classFunction;
      },
      set: function(v) {
        if (classFunction === undefined) {
          classFunction = v;
        }
        else if (classFunction !== v) {
          throw new Error('cannot change classFunction.');
        }
      }
    },

    Modifiers : {
      value    : Struct.Modifiers,
      writable : false
    }
  });
  return _;
};

Struct.defineClass = function(keyname, desc, options) {
  const _ = Struct(keyname);
  function Klass(obj) {
    _.construct(this, obj, options);
  }
  _.defineStruct(Klass, desc);
  return Klass;
};

Struct.Modifiers = (typeof Modifiers == 'object')   ? Modifiers : require('./lib/Modifiers');
Struct.PriProp   = (typeof PriProp   == 'function') ? PriProp   : require('./lib/PriProp/PriProp');

Struct.prototype = new Struct.PriProp(); // inheritance

Struct.prototype.construct = function(obj, values, options) {
  options = options || {};

  Struct.PriProp.prototype.construct.call(this, obj);


  if (this.classFunction && this.classFunction != obj.constructor) {
    throw new Error('cannot call construct in a different constructor.');
  }

  // register enumerable structures
  Object.defineProperties(obj, this.enumerableDescs);

  // set values
  if (typeof values != 'object') values = {};

  this.getOwnPropertyNames().forEach(function(propname) {
    // considering {a: undefined}, and inherit properties.
    if (values.hasOwnProperty(propname) || values[propname] !== undefined) {
      obj[propname] = values[propname];
    }
  }, this);

  // requirement check
  Object.keys(this.requires).forEach(function(k) {
    if (typeof this.requires == 'function' && !this.requires()) return;
    obj[k]; // calling getter
  });

  if (options.seal) Object.seal(obj);
};

Struct.prototype.getOwnPropertyNames = function() {
  return Object.keys(this.defaults);
};

Struct.prototype.defineStruct = function(classFunction, descs) {

  if (!this.classFunction) {
    this.classFunction = classFunction;
    const _ = this;
    classFunction.getDefault = function(propname) {
      return (_.defaultFuncs[propname]) ? _.defaultFuncs[propname].toString() : _.defaults[propname];
    };

    classFunction.prototype.toObject = function(withParentProps, showUndefined) {
      var v, ret = {};
      Object.keys(_.enumerableDescs).forEach(function(propname) {
        v = this[propname];
        if (!showUndefined && v === undefined) return;
        ret[propname] = v;
      }, this);

      if (withParentProps) {
        _.parentProps.forEach(function(propname) {
          v = this[propname];
          if (!showUndefined && v === undefined) return;
          ret[propname] = v;
        }, this);
      }
      return ret;
    };

    classFunction.prototype.view = function(propname) {
      switch (typeof (_.views[propname])) {
      case 'object':
        return _.views[propname][this[propname]];
      case 'function':
        return _.views[propname](this[propname]);
      case 'string':
        return _.views[propname].replace('%s', this[propname].toString());
      default:
        return this[propname];
      }
    };

    classFunction.prototype.toView = function(withParentProps, showUndefined) {
      var v, ret = {};
      Object.keys(_.enumerableDescs).forEach(function(propname) {
        v = this.view(propname);
        if (!showUndefined && v === undefined) return;
        ret[propname] = v;
      }, this);

      if (withParentProps) {
        _.parentProps.forEach(function(propname) {
          v = this.view(propname);
          if (!showUndefined && v === undefined) return;
          ret[propname] = v;
        }, this);
      }
      return ret;
    };
  }

  Object.keys(descs).forEach(function(propname) {
    var desc = descs[propname];
    if (typeof desc != 'object') {
      desc = {_default: desc};
    }
    // this.defaults[propname] = desc._default;
    Object.defineProperty(this.defaults, propname, {
      value      : desc._default,
      enumerable : true,
      writable   : false
    });

    if (typeof desc.defaultFunc == 'function') {
      // this.defaultFuncs[propname] = desc.defaultFunc;
      Object.defineProperty(this.defaultFuncs, propname, {
        value   : desc.defaultFunc,
        enumerable: true,
        writable: false
      });
    }

    if (desc.view) {
      // this.views[propname] = desc.view;
      Object.defineProperty(this.views, propname, {
        value   : desc.view,
        enumerable: true,
        writable: false
      });
    }

    if (desc.required) {
      this.requires[propname] = (typeof desc.required == 'function') ? desc.required : true;
    }

    desc = {
      enumerable: desc.enumerable, 
      get : (typeof desc.get == 'function') ? desc.get : this.getter(propname, desc.required),
      set : (typeof desc.set == 'function') ? desc.set : this.setter(propname, desc.modifier, desc.error, desc.noerror, desc.immutable),
      configurable: !!(desc.configurable)
    };
    Object.freeze(desc);

    if (desc.enumerable) {
      // this.enumerableDescs[propname] = desc;
      Object.defineProperty(this.enumerableDescs, propname, {
        value      : desc,
        enumerable : true,
        writable   : false
      });
    }
    else {
      Object.defineProperty(this.classFunction.prototype, propname, desc);
      this.parentProps.push(propname);
    }
  }, this);

};

Struct.prototype.getter = function(propname, required) {
  const _ = this;
  return function() {
    var ret = _(this)[propname];
    if ( ((typeof required == 'function' && required()) || required === true) && ret === undefined ) {
      throw new Error(propname + ' is a required value, but still undefined.');
    }
    if (ret === undefined) {
      if (_.defaultFuncs[propname]) {
        return _.defaultFuncs[propname].call(this);
      }
      return _.defaults[propname];
    }
    return ret;
  }
};

Struct.prototype.setter = function(propname, modifier, error, noerror, immutable) {
  immutable = !!immutable;
  noerror = !!noerror;
  const _ = this;
  if (typeof modifier == 'function') {
    if (noerror) {
      return function(v) {
        if (immutable && _(this)[propname] !== undefined) return;
        try {
          v = modifier.call(this, v);
          _(this)[propname] = v;
        }
        catch (e) {
        }
      }
    }
    else if (typeof error == 'function') {
      return function(v) {
        if (immutable && _(this)[propname] !== undefined) return;
        try {
          v = modifier.call(this, v);
          _(this)[propname] = v;
        }
        catch (e) {
          throw error.call(this, v, e);
        }
      };
    }
    else if (error) {
      return function(v) {
        if (immutable && _(this)[propname] !== undefined) return;
        try {
          v = modifier.call(this, v);
          _(this)[propname] = v;
        }
        catch (e) {
          throw error;
        }
      };
    }
    else {
      return function(v) {
        if (immutable && _(this)[propname] !== undefined) return;
        _(this)[propname] = modifier.call(this, v);
      };
    }
  }
  else {
    return function(v) {
      if (immutable && _(this)[propname] !== undefined) return;
      _(this)[propname] = v;
    };
  }
},

Object.freeze(Struct.prototype);

if (typeof module == 'object' && module.exports === this) { module.exports = Struct; }
