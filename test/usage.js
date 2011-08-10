const Struct = require('../Struct');
const M = Struct.Modifiers;

const SampleFormValues = Struct.defineClass('id', {
  cource : {
    required: true,
    validate: M.oneof.bind({list: ['k', 's', 'h']}),
    view: {k: 'kernel', s : 'software', h: 'horse'}
  },

  examinee : {
    validate: M.integer.bind({min: 0}).quiet,
    _default: 0,
    view: '%s people',
    required: function() {
      return (this.cource == 'k');
    },
  },

  exam_method: {
    validate: M.oneof.bind({list: ['p', 'w'] }),
    view: {p: 'PAPER', w : 'WEB'},
    required: function() {
      return (this.cource == 'k');
    }
  },

  exam_subject_type : {
    validate: M.oneof.bind({list: ['a', 'g', 'c', 't'] }),
    view: {a: 'adenine', g : 'guanine', c : 'cytosine', t: 'thymine'},
    required: function() {
      return (this.cource == 'k');
    }
  }
});


var a = new SampleFormValues({
  cource: 'k',
  examinee : 199,
  exam_method: 'w',
  exam_subject_type: 'a'
});
console.log(a.toView(true));

var a = new SampleFormValues({
  cource: 's'
});

console.log(a.toView(true));
console.log(a.toView(true, true));
