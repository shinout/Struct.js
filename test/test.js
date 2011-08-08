const test = require('./shinout.test');
const Struct = require('../Struct');
const PriProp = require('../lib/PriProp/PriProp');

// property test
// descriptors: 
// modifier, enumerable, get, set, _default, error, noerror, configurable, immutable

const PropertyTest = (function() {
  const _ = Struct('id');

  function Klass() {
    _.construct(this);
  }

  var modifiers   = [undefined, _.Modifiers.string(3, 10), _.Modifiers.regex(/^[A-Z]+/)];
  var enumerables = [undefined, true, false];
  var gets        = [undefined, function() { return _(this).dummy }];
  var sets        = [undefined, function(v) { _(this).dummy                               = v;  }];
  var _defaults   = [undefined, null, false, true, "SHINOUT"];
  var errors      = [undefined, function(v, e){return [this, v, e]; }, 'ERRRR'];
  var noerrors    = [undefined, true, false];
  var immutables  = [undefined, true, false];

  function register(desc, keys) {
    var descs = {};
    descs['keys_' + keys.join('_')] = desc;
    _.defineStruct(descs);
  }

  modifiers.forEach(function(modifier, mk) {
    enumerables.forEach(function(enumerable, ek) {
      gets.forEach(function(get, gk) {
        sets.forEach(function(set, sk) {
          _defaults.forEach(function(_default, dk) {
            errors.forEach(function(error, rk) {
              noerrors.forEach(function(noerror, nk) {
                immutables.forEach(function(immutable, ok) {
                  register({
                    modifier   : modifier,
                    enumerable : enumerable,
                    get        : get,
                    set        : set,
                    _default   : _default,
                    error      : error,
                    noerror    : noerror,
                    immutable       : immutable
                  }, 
                  [
                     mk,
                     ek,
                     gk,
                     sk,
                     dk,
                     rk,
                     nk,
                     ok
                  ]
                  );
                });
              });
            });
          });
        });
      });
    });
  });

  function getKey(keys) {
    return 'keys_' + keys.join('_');
  }


  Klass.prototype.get = function(keys) {
    return this[getKey(keys)];
  };

  Klass.prototype.set = function(keys, v) {
    this[getKey(keys)] = v;
  };

  Klass.prototype.operateSeriesOfTest = function(name, keys, params) {
    // enumerable or not
    switch (keys[1]) {
      case 0: // undefined
      case 2: // false
        test('equal', Object.keys(this).indexOf(getKey(keys)), -1);
        break;
      case 1: // true
        test('notEqual', Object.keys(this).indexOf(getKey(keys)), -1);
        break;
    }


    test('deepEqual', this.get(keys), params.default_val, 'default value of ' + name);
    this.set(keys, params.value_to_set);
    test('deepEqual', this.get(keys), params.val_after_set, 'value after setting ' + params.value_to_set + ' : ' + name);
    this.set(keys, params.value_to_set_again);
    test('deepEqual', this.get(keys), params.val_after_set_again, 'value after setting (again) ' + params.value_to_set_again + ' : ' + name);
    test('result', name, true);
  };

  return Klass;

})();


/*
  var modifiers   = [undefined, _.Modifiers.string(3, 10), _.Modifiers.regex(/^[A-Z]+/)];
  var enumerables = [undefined, true, false];
  var gets        = [undefined, function() { return _(this).dummy }];
  var sets        = [undefined, function(v) { _(this).dummy                               = v;  }];
  var _defaults   = [undefined, null, false, true, "SHINOUT"];
  var errors      = [undefined, function(v, e){return [this, v, e]; }, 'ERRRR'];
  var noerrors    = [undefined, true, false];
  var immutables  = [undefined, true, false];
*/
const obj = new PropertyTest("id");

obj.operateSeriesOfTest('all undefined', [0,0,0,0,0,0,0,0], {
  default_val: undefined,
  value_to_set: 'hoge',
  val_after_set: 'hoge',
  value_to_set_again: 335,
  val_after_set_again: 335
});

