/**
 * Struct.js v0.0.1
 *
 * Copyright 2011, SHIN Suzuki 
 *
 */
if (typeof module == 'object' && module.exports === this) {
  const PriProp = require('./lib/PriProp/PriProp');
}

function Struct(keyname) {
  const _ = PriProp(keyname);
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
  var classFunction, Modifiers;
  Object.defineProperties(_, {
    defaults : {
      value: {},
      writable: false
    },

    parentDescs: {
      value: {},
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
        if (classFunction === undefined || v === undefined) {
          classFunction = v;
        }
      }
    },
    Modifiers : {
      get: function() {
        if (Modifiers === undefined) {
          Modifiers = require('./lib/Modifiers'); // only in common.js. If clientside, just load Modifier.js
        }
        return Modifiers;
      },
      set: function(v) {
        if (Modifiers === undefined) {
          Modifiers = v;
        }
      },
    }

  });
  return _;
}

Struct.prototype = new PriProp(); // inheritance

Struct.prototype.construct = function(obj) {
  PriProp.prototype.construct.call(this, obj);

  if (!this.classFunction) {
    this.classFunction = obj.constructor;
    Object.defineProperties(this.classFunction.prototype, this.parentDescs);
  }

  Object.defineProperties(obj, this.enumerableDescs);
};

Struct.prototype.defineStruct = function(descs) {
  this.classFunction = undefined;
  Object.keys(descs).forEach(function(propname) {
    var desc = descs[propname];
    if (typeof desc != 'object') {
      desc = {_default: desc};
    }
    this.defaults[propname] = desc._default;

    desc = {
      enumerable: desc.enumerable, 
      get : (typeof desc.get == 'function') ? desc.get : this.getter(propname, desc.required),
      set : (typeof desc.set == 'function') ? desc.set : this.setter(propname, desc.modifier, desc.error, desc.noerror, desc.once),
      configurable: !!(desc.configurable)
    };

    if (desc.enumerable) {
      this.enumerableDescs[propname] = desc;
    }
    else {
      this.parentDescs[propname] = desc;
    }
  }, this);

};

Struct.prototype.getter = function(propname, required) {
  const _ = this;
  return function() {
    var ret = _(this)[propname];
    if (required && ret === undefined) throw new Error(propname + ' is a required value, but still undefined.');
    if (ret === undefined) return _.defaults[propname];
    return ret;
  }
};

Struct.prototype.setter = function(propname, modifier, error, noerror, once) {
  once = !!once;
  noerror = !!noerror;
  const _ = this;
  if (typeof modifier == 'function') {
    if (noerror) {
      return function(v) {
        if (once && _(this)[propname] !== undefined) return;
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
        if (once && _(this)[propname] !== undefined) return;
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
        if (once && _(this)[propname] !== undefined) return;
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
        if (once && _(this)[propname] !== undefined) return;
        _(this)[propname] = modifier.call(this, v);
      };
    }
  }
  else {
    return function(v) {
      if (once && _(this)[propname] !== undefined) return;
      _(this)[propname] = v;
    };
  }
},

Object.freeze(Struct.prototype);

if (typeof module == 'object' && module.exports === this) { module.exports = Struct; }
