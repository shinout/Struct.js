const Modifiers = {
  /* validators */

  integer: function(v) {
    var min = Modifiers.numberize(this.min, undefined);
    var max = Modifiers.numberize(this.max, undefined);
    var strict = !!this.strict;

    if (typeof v != 'number') {
      if (strict) {
        return Modifiers.error.call(this, {reason: 'not number', val: v});
      }
      else {
        var vI = parseInt(v);
      }
    }
    else {
      vI = v;
    }
    if (isNaN(vI)) return Modifiers.error.call(this, {reason: 'NaN', val: v});
    if (min != null && vI < min) return Modifiers.error({reason: 'min', val: v});
    if (max != null && vI > max) return Modifiers.error.call(this, {reason: 'max', val: v});
    return vI;
  },

  number: function(v) {
    var min = Modifiers.numberize(this.min, undefined);
    var max = Modifiers.numberize(this.max, undefined);
    var strict = !!this.strict;

    if (typeof v != 'number') {
      if (strict) {
        return Modifiers.error.call(this, {reason: 'not number', val: v});
      }
      else {
        var vI = Number(v);
      }
    }
    else {
      vI = v;
    }
    if (isNaN(vI)) return Modifiers.error.call(this, {reason: 'NaN', val: v});
    if (min != null && vI < min) return Modifiers.error.call(this, {reason: 'min', val: v});
    if (max != null && vI > max) return Modifiers.error.call(this, {reason: 'max', val: v});
    return vI;
  },

  string: function(v) {
    var min = Modifiers.numberize(this.min, undefined);
    var max = Modifiers.numberize(this.max, undefined);
    if (typeof v != 'string') {
      if (this.strict) {
        return Modifiers.error.call(this, {reason: 'not string', val: v});
      }
      else if (v != null) {
        v = v.toString();
      }
      else {
        v = '';
      }
    }
    var len = v.length;
    if (min != null && len < min) return Modifiers.error.call(this, {reason: 'min length', val: v});
    if (max != null && len > max) return Modifiers.error.call(this, {reason: 'max length', val: v});
    return v;
  },

  boolean: function(v) {
		if (this.strict && (v !== false || v !== true)) return Modifiers.error.call(this, {reason: 'not boolean', val: v});
		if (this.zerostr) return  v != 0;
		return !!v;
	},

  array: function(v) {
    if (! (v instanceof Array))
      return Modifiers.error.call(this, {reason: 'not array', val: v});

    var min = Modifiers.numberize(this.min, undefined);
    var max = Modifiers.numberize(this.max, undefined);
    var len = v.length;
    if (min != null && len < min) return Modifiers.error.call(this, {reason: 'min length', val: v});
    if (max != null && len > max) return Modifiers.error.call(this, {reason: 'max length', val: v});
		return v;
	},

  equal: function(v) {
    if (this.strict && this.value !== v) {
      throw Modifiers.error.call(this, {reason: 'not strict equal', val: v});
    }
    else if (!this.strict && this.value != v) {
      throw Modifiers.error.call(this, {reason: 'not equal', val: v});
    }
    return v;
  },

  isNull: function(v) {
    if ((this.strict && v === null) || (!this.strict && v == null)) return v;
    return Modifiers.error.call(this, {reason: 'not null', val : v});
  },

  isUndefined: function(v) {
    if ((this.strict && v === undefined) || (!this.strict && v == undefined)) return v;
    return Modifiers.error.call(this, {reason: 'not undefined', val : v});
  },

  regex: function(v) {
    if (! v.toString().match(this.pattern)) throw Modifiers.error.call(this, {reason: 'invalid pattern', val : v});
    return v;
  },

  func: function(fn) {
    if (typeof fn != 'function') return Modifiers.error.call(this, {reason: 'not a function', val: fn});
    return fn;
  },

  oneof: function(v) {
    if (this.list instanceof Array && this.list.indexOf(v) < 0) {
      return Modifiers.error.call(this, {reason: 'not in a list', val: v});
    }
    else if (!this.list) {
      return Modifiers.error.call(this, {reason: 'list is not given', val: v});
    }
    return v;
  },

  /* mapping arguments to the context */

  mappers: {
  // arg[0]        arg[1] arg[2] arg[3] ....
    integer     : ['min', 'max', 'strict'],
    number      : ['min', 'max', 'strict'],
    string      : ['min', 'max', 'strict'],
    equal       : ['value', 'strict'],
    isNull      : ['strict'],
    isUndefined : ['strict'],
    regex       : ['pattern'],
    oneof       : ['list']
  },

  /* filters */

  noerror : function(fn) {
    return function(v) {
      try {
        v = fn(v);
        return v;
      }
      catch (e) {
        return undefined;
      }
    }

  },

  every: function() {
    var args = arguments;
    return function(v) {
      Array.prototype.forEach.call(args, function(fn) {
        if (typeof fn == 'function') {
          v = fn(v);
        }
      });
      return v;
    };
  },

  some: function() {
    var args = arguments;
    return function(v) {
      var errs = [];
      var ret = Array.prototype.some.call(args, function(fn) {
        try {
          v = fn(v);
          return true;
        } catch (e) {
          errs.push(e.message);
          return false;
        }
      });
      if (!ret) return Modifiers.error.call(this, {reason: 'none of conditions matched in "some".', val : v, errors: errs});
      return v;
    };
  },


  /* modifiers without raising errors */

  numberize: function(v, _default) {
    var vN = Number(v);
    return (isNaN(vN) || v == null || v === false || v == '') ? _default : vN;
  },


  /* methods to enable context chaining */

  bind: function() {
    var key = Array.prototype.shift.call(arguments);
    if (typeof Modifiers[key] != 'function') return Modifiers.error.call(this, {reason: 'no method', val: key});
    var ob = arguments[0];
    if (Modifiers.mappers[key] instanceof Array && (ob == null || (typeof ob != 'object') || (ob.constructor != Object))) {
      var context = {};
      Array.prototype.forEach.call(arguments, function(v, k) {
        var arg = Modifiers.mappers[key][k];
        if (arg) context[arg] = v;
      });
      return Modifiers[key].bind(context);
    }

    return Modifiers[key].bind(arguments[0] || {});
  },

  empty: function() {
  },


  /* utilities */

  error : function(info) {
    if (this.quiet) {
      return undefined;
    }
    throw new Error(JSON.stringify(info));
  }
};
Modifiers.set = Modifiers.bind;

// for Node.js
if (typeof exports == 'object' && exports === this) {
  const fs  = require('fs');
  const pth = require('path');

  Modifiers.mappers.file = ['normalize'];

  Modifiers.file = function(path) {
    path = Modifiers.string(path);
    try {
      if (!fs.statSync(path).isFile()) {
        return Modifiers.error.call(this, {reason: 'not a file.', val : path});
      }
      return (this.normalize) ? pth.normalize(path) : path;
    }
    catch (e) {
      return Modifiers.error.call(this, {reason: 'no such file or directory.', val: path});
    }
  };

  Modifiers.mappers.dir = ['normalize'];
  Modifiers.dir = function(path) {
    path = Modifiers.string(path);
    try {
      if (!fs.statSync(path).isDirectory()) {
        return Modifiers.error.call(this, {reason: 'not a directory.', val : path});
      }
      return (this.normalize) ? pth.normalize(path) : path;
    }
    catch (e) {
      return Modifiers.error.call(this, {reason: 'no such file or directory.', val: path});
    }
  };

  Modifiers.mappers.path = ['type', 'normalize'];
  Modifiers.path = function(path) {
    switch (this.type) {
    case 'path':
    default: 
      path = Modifiers.string(path);
      if (!pth.existsSync(path)) {
        return Modifiers.error.call(this, {reason: 'no such file or directory.', val : path});
      }
      return (this.normalize) ? pth.normalize(path) : path;
    case 'file':
      return Modifiers.file.call(this, path);
    case 'dir':
      return Modifiers.dir.call(this, path);
    }
  };
}

Modifiers.empty.prototype = Modifiers;

/* extension of each method */
const ModifierExtensions = Object.create(Object.prototype, {
  quiet: {
    get: function() {
      return this.bind({quiet: true});
    },
    set: function(){},
    enumerable: true
  },
  strict: {
    get: function() {
      return this.bind({strict: true});
    },
    set: function(){},
    enumerable: true
  }
});

/* ModifierExtensions inherits Function.prototype */
Object.getOwnPropertyNames(Function.prototype).forEach(function(k) {
  ModifierExtensions[k] = Function.prototype[k];
});

/* ModifierExtensions overrides Function.prototype.bind */
ModifierExtensions.bind = function(obj) {
  if (!this.bound) {
    var boundFunc = Function.prototype.bind.apply(this, arguments);
    Modifiers.extend(boundFunc);
    boundFunc.bound = obj;
    return boundFunc;
  }
  else {
    Object.keys(obj).forEach(function(k) {
      this.bound[k] = obj[k];
    }, this);
    return this;
  }
};
ModifierExtensions.set = ModifierExtensions.bind;

Object.freeze(ModifierExtensions);

Modifiers.extend = function(fn) {
  if (fn.__proto__) {
    fn.__proto__ = ModifierExtensions;
  }
  else {
    Object.getOwnPropertyNames(ModifierExtensions).forEach(function(p) {
      Object.defineProperty(fn, p, {
        value    : ModifierExtensions[p],
        writable : false
      });
    }, this);
  }
};

Object.keys(Modifiers).forEach(function(k) {
  if (typeof Modifiers[k] == 'function') {
    Modifiers.extend(Modifiers[k]);
  }
});

Object.freeze(Modifiers);



function ModifiersTest() {
  console.log(Modifiers.string.bind({min: 11}).quiet('eeeeeeeeeeeeee'));
  console.log('QUIET', Modifiers.bind('string', {min:8, max:14}).quiet);
  console.log('QUIET', Modifiers.bind('string', {min:8, max:14}).__proto__);
  console.log('QUIET', Modifiers.bind('string', {min:8, max:14}).__proto__);
  console.log(Modifiers.integer(33));
  console.log(Modifiers.bind('integer')(13));

  try {
    console.log(Modifiers.bind('integer', 14)(13));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.set('integer', {max: 11})(13));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.integer.set({max: 11, strict: true})("1"));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.integer.call({max: 11, strict: true}, 33));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.integer.bind({max: 11}).strict("3"));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.integer.bind({max: 11}).quiet.strict("3"));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.number.bind({max: 11.3, strict: true, quiet: true})(11.9));
  } catch (e) { console.log(e.message); }

  try {
  console.log(Modifiers.noerror(Modifiers.bind('number', null, 11.3))(11.9));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('string', {min:8, max:14})('shinout'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('regex', /a/)('shinout'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('regex', {pattern: /a/})('shinout'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.boolean.bind({strict: true})(''));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.boolean.bind({strict: true}).quiet(''));
  } catch (e) { console.log(e.message); }

	console.log("0 is ", Modifiers.boolean(0));
	console.log("0 with zerostr is ", Modifiers.boolean.bind({zerostr: true})(0));
	console.log("'' is ", Modifiers.boolean(''));
	console.log("'' with zerostr is ", Modifiers.boolean.bind({zerostr: true})(''));
	console.log("'0' is ", Modifiers.boolean('0'));
	console.log("'0' with zerostr is ", Modifiers.boolean.bind({zerostr: true})('0'));
	console.log("'0.00' is ", Modifiers.boolean('0.00'));
	console.log("'0.00' with zerostr is ", Modifiers.boolean.bind({zerostr: true})('0.00'));

  try {
    console.log(Modifiers.equal.bind({value: 133})('133'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.equal.bind({value: 133, strict: true})('133'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('equal', 133, true)('133'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('isNull')(undefined));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('isUndefined')(null));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('isUndefined', true)(null));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('oneof', ['male', 'female'])('man'));
  } catch (e) { console.log(e.message); }

  try {
    console.log(Modifiers.bind('oneof', [])('man'));
  } catch (e) { console.log(e.message); }

  console.log(Modifiers.bind('oneof', ['male', 'female'])('female'));

  console.log(Modifiers.regex.set({pattern: /^get[A-Za-z0-9]+$/}));

  console.log(
    Modifiers.every(
      Modifiers.string,
      Modifiers.bind('regex', {pattern: /^get[A-Za-z0-9]+$/})
    )('getConfig')
  );

  console.log(
    Modifiers.some(
      Modifiers.string,
      Modifiers.bind('regex', {pattern: /^get[A-Za-z0-9]+$/})
    )('getConfig##')
  );

  if (typeof exports === "object") {
    try {
      console.log(Modifiers.bind('path')('Modifiers.js'));
    } catch (e) { console.log(e.message); }

    try {
      console.log(Modifiers.bind('path')('Modifiers.css'));
    } catch (e) { console.log(e.message); }

    try {
      console.log(Modifiers.dir('Modifiers.js'));
    } catch (e) { console.log(e.message); }

    try {
      console.log(Modifiers.path('././Modifiers.js'));
    } catch (e) { console.log(e.message); }

    try {
      console.log(Modifiers.bind('path', null, true)('././Modifiers.js'));
    } catch (e) { console.log(e.message); }
  }
  else {
    console.log(module.exports);
  }
}

if (typeof process == 'object' && process.argv[1] === __filename) { ModifiersTest(); }
if (typeof exports === "object" && this === exports) module.exports = Modifiers;
