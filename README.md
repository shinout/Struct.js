Struct.js
==========
a helper to create getter/setter properties with validations, default values,
required or not, immutable or not, configurable or not and so on...
Runnable in any "modern" browsers and Node.js.
Struct inherits <a href="https://github.com/shinout/PriProp">PriProp</a>, 
which provides the way to define private properties in JavaScript.
Thus, you can handle private properties with Struct.

Change Log
----------------
* [0.0.1]: release

Sample
----------------
    /* 
     * When you use this library in client side scripting, load all the dependencies by the following order.
     * <script type="text/javascript" src="/path/to/PriProp.js"></script>
     * <script type="text/javascript" src="/path/to/Modifiers.js"></script>
     * <script type="text/javascript" src="/path/to/Struct.js"></script>
     */
    const Struct = require('/path/to/Struct');

    /* define Constructor */
    const SomeClass = (function() {
      // call Struct like this.
      const _ = Struct('id'); // _ is function with some properties.

      function SomeClass(values) {
        _.construct(this, values); // initiallize

        _(this).somePrivateValue = priv;  // set a private value (PriProp's way)
      }

      SomeClass.prototype.somePublicMethod = function() {
        return _(this).somePrivateValue; // get a private value PriProp's way
      };

      // define getter/setter properties
      _.defineStruct(SomeClass, {

        /**
         * property name: "name" 
         * throws an error if not string in setting a value
         * required : if it is undefined, an error is thrown after _.construct().
         */
        name : {
          modifier: _.Modifiers.string
          required: true
        },

        /**
         * property name : "phone"
         * the value should be string, with its length within 10 to 12,
         * and also should match the XX-XXXX-XXXX-like pattern.
         * if the validation failed, it doesn't throw an error (because of "quiet"), just set default value.
         * in this case, as the default value is not set, "undefined" is set in validation failure.
         *
         */
         phone : {
           modifier: _.Modifiers.every(
             _.Modifiers.string.bind({max:12, min: 10}),
             _.Modifiers.regex.bind({regex: /[0-9]{2,4}-[0-9]{2,4}-[0-9]{2,4}/})
           ).quiet
         }
      });

      return SomeClass;
    })();

    try {
      var obj = new SomeClass();
    }
    catch (e) {
      console.error(e.message); //  name is required, but not set.
    }

    var obj = new SomeClass({name: 'shinout'});
    console.log(obj.phone); // undefined

