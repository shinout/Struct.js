const Modifiers = {

  integer: function(min, max, strict) {
    var minI = (min === undefined) ? undefined : parseInt(min);
    if (minI !== undefined && isNaN(minI)) throw Modifiers.error({reason: 'min', val: min});
    var maxI = (max === undefined) ? undefined : parseInt(max);
    if (maxI !== undefined && isNaN(maxI)) throw Modifiers.error({reason: 'max', val: max});

    return Modifiers.Static.integer.bind({strict: !!strict, min:minI, max:maxI});
  },

  number: function(min, max, strict) {
    var minN = (min === undefined) ? undefined : Number(min);
    if (minN !== undefined && isNaN(minN)) throw Modifiers.error({reason: 'min', val: v});
    var maxN = (max === undefined) ? undefined : Number(max);
    if (maxN !== undefined && isNaN(maxN)) throw Modifiers.error({reason: 'max', val: v});

    return Modifiers.Static.number.bind({strict: !!strict, min:minN, max:maxN});
  },

  string: function(min, max, strict) {
    var minI = (min === undefined) ? undefined : parseInt(min);
    if (minI !== undefined && isNaN(minI)) throw Modifiers.error({reason: 'min', val: min});
    var maxI = (max === undefined) ? undefined : parseInt(max);
    if (maxI !== undefined && isNaN(maxI)) throw Modifiers.error({reason: 'max', val: max});

    return Modifiers.Static.string.bind({strict: !!strict, min:minI, max:maxI});
  },

	isNull: function(strict) {
		return Modifiers.Static.isNull.bind({strict: strict});
	},

 	isUndefined: function(strict) {
		return Modifiers.Static.isUndefined.bind({strict: strict});
	},

  regex: function(regex) {
    if (regex.constructor.name != 'RegExp') throw Modifiers.error({reason: 'not regex', val: regex});
    return Modifiers.Static.regex.bind({regex: regex});
  },

  func: function(fn) {
    return Modifiers.Static.func;
  },

  equal: function(val, strict) {
    return Modifiers.Static.equal.bind({val: val, strict: !!strict});
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
			Array.prototype.some.call(args, function(fn) {
				try {
					v = fn(v);
					return true;
				} catch (e) {}
			});
      return v;
    };
	},

  Static: {
    integer : function(v) {
      if (typeof v != 'Number') {
        if (this.strict) {
          throw Modifiers.error({reason: 'not number', val: v});
        }
        else {
          var vI = parseInt(v);
        }
      }
      else {
        vI = v;
      }
      if (isNaN(vI)) throw Modifiers.error({reason: 'NaN', val: v});
      if (this.min != null && vI < this.min) throw Modifiers.error({reason: 'min', val: v});
      if (this.max != null && vI > this.max) throw Modifiers.error({reason: 'max', val: v});
      return vI;
    },

    number : function(v) {
      if (typeof v != 'Number') {
        if (this.strict) {
          throw Modifiers.error({reason: 'not number', val: v});
        }
        else {
          var vI = Number(v);
        }
      }
      else {
        vI = v;
      }
      if (isNaN(vI)) throw Modifiers.error({reason: 'NaN', val: v});
      if (this.min != null && vI < this.min) throw Modifiers.error({reason: 'min', val: v});
      if (this.max != null && vI > this.max) throw Modifiers.error({reason: 'max', val: v});
      return vI;
    },

    string: function(v) {
      if (typeof v != 'string') {
        if (this.strict) {
          throw Modifiers.error({reason: 'not string', val: v});
        }
        else if (v != null) {
          v = v.toString();
        }
        else {
          v = '';
        }
      }
      var len = v.length;
      if (this.min != null && len < this.min) throw Modifiers.error({reason: 'min length', val: v});
      if (this.max != null && len > this.max) throw Modifiers.error({reason: 'max length', val: v});
      return v;
    },

		isNull: function(v) {
			return (this.strict && v === null) || (!this.strict && v == null);
		},

		isUndefined: function(v) {
			return (this.strict && v === undefined) || (!this.strict && v == undefined);
		},

    regex: function(v) {
      if (! v.toString().match(this.regex)) throw Modifiers.error({reason: 'invalid pattern', val : v});
      return v;
    },

    equal: function(v) {
      if (this.strict && this.val !== v) {
        throw Modifiers.error({reason: 'not strict equal', val: v});
      }
      else if (!this.strict && this.val != v) {
        throw Modifiers.error({reason: 'not equal', val: v});
      }
      return v;
    },

    func: function(fn) {
      if (typeof fn != 'function') {
        throw Modifiers.error({reason: 'not a function', val: fn});
      }
      return fn;
    }

  },

  error : function(info) {
    throw new Error(JSON.stringify(info));
  }
};

// for Node.js
if (typeof module == 'object' && module.exports === this) {
  const fs  = require('fs');
  const pth = require('path');
  Modifiers.path = function(type, normalize) {
    type = type.toLowerCase();
    switch (type) {
    case 'path':
    default: 
      return Modifiers.Static.path.bind({normalize: !!normalize});
    case 'file':
      return Modifiers.Static.file.bind({normalize: !!normalize});
    case 'dir':
      return Modifiers.Static.dir.bind({normalize: !!normalize});
    }
  };

  Modifiers.Static.file = function(path) {
    if (!fs.statSync(path).isFile()) {
      throw Modifiers.error({reason: 'not a file.', val : path});
    }
    return (this.normalize) ? pth.normalize(path) : path;
  };

  Modifiers.Static.dir = function(path) {
    if (!fs.statSync(path).isDirectory()) {
      throw Modifiers.error({reason: 'not a directory.', val : path});
    }
    return (this.normalize) ? pth.normalize(path) : path;
  };

  Modifiers.Static.path = function(path) {
    if (!pth.existsSync(path)) {
      throw Modifiers.error({reason: 'no such file or directory.', val : path});
    }
    return (this.normalize) ? pth.normalize(path) : path;
  };
}


Object.freeze(Modifiers);
if (typeof module == 'object' && module.exports === this) { module.exports = Modifiers; }

/**
 * how to write Modifiers:
 *
 **/
function test() {
  var mint = Modifiers.integer(4, 50);
  console.log(mint(44));
  console.log(mint("41"));
  try {
    console.log(mint("1"));
  }
  catch (e) {
    console.log(e.message);
  }

  var evry = Modifiers.every(Modifiers.integer(1, 12), function(v) {
    if (v % 2 == 0) {
      return v; 
    }
    throw new Error(v);
  });

  console.log(evry(6));


  var strcheck = Modifiers.string(4, 10);
  console.log(strcheck(3333));
  var strcheck = Modifiers.string(4, 10, true);
  try {
    console.log(strcheck(3333));
  }
  catch (e) {
    console.log(e.message);
  }

  var regcheck = Modifiers.regex(/^[a-zA-Z]+$/);
  console.log(regcheck('shinout'));
  try {
  console.log(regcheck('shinout310'));
  }
  catch (e) {
    console.log(e.message);
  }

  var eqcheck = Modifiers.equal('3');
  console.log(eqcheck(3));

  var eqcheck = Modifiers.equal('3', true);
  try {
    console.log(eqcheck(3));
  }
  catch (e) {
    console.log(e.message);
  }
}
 
if (process.argv[1] === __filename) { test(); }
