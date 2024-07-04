/**
 * auth0-js v9.26.1
 * Author: Auth0
 * Date: 2024-07-04
 * License: MIT
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.CordovaAuth0Plugin = factory());
}(this, (function () { 'use strict';

  var version = { raw: '9.26.1' };

  var toString = Object.prototype.toString;

  function attribute(o, attr, type, text) {
    type = type === 'array' ? 'object' : type;
    if (o && typeof o[attr] !== type) {
      throw new Error(text);
    }
  }

  function variable(o, type, text) {
    if (typeof o !== type) {
      throw new Error(text);
    }
  }

  function value(o, values, text) {
    if (values.indexOf(o) === -1) {
      throw new Error(text);
    }
  }

  function check(o, config, attributes) {
    if (!config.optional || o) {
      variable(o, config.type, config.message);
    }
    if (config.type === 'object' && attributes) {
      var keys = Object.keys(attributes);

      for (var index = 0; index < keys.length; index++) {
        var a = keys[index];
        if (!attributes[a].optional || o[a]) {
          if (!attributes[a].condition || attributes[a].condition(o)) {
            attribute(o, a, attributes[a].type, attributes[a].message);
            if (attributes[a].values) {
              value(o[a], attributes[a].values, attributes[a].value_message);
            }
          }
        }
      }
    }
  }

  /**
   * Wrap `Array.isArray` Polyfill for IE9
   * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
   *
   * @param {Array} array
   * @private
   */
  function isArray(array) {
    if (this.supportsIsArray()) {
      return Array.isArray(array);
    }

    return toString.call(array) === '[object Array]';
  }

  function supportsIsArray() {
    return Array.isArray != null;
  }

  var assert = {
    check: check,
    attribute: attribute,
    variable: variable,
    value: value,
    isArray: isArray,
    supportsIsArray: supportsIsArray
  };

  /* eslint-disable no-continue */

  function get() {
    if (!Object.assign) {
      return objectAssignPolyfill;
    }

    return Object.assign;
  }

  function objectAssignPolyfill(target) {
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert first argument to object');
    }

    var to = Object(target);
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      if (nextSource === undefined || nextSource === null) {
        continue;
      }

      var keysArray = Object.keys(Object(nextSource));
      for (
        var nextIndex = 0, len = keysArray.length;
        nextIndex < len;
        nextIndex++
      ) {
        var nextKey = keysArray[nextIndex];
        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        if (desc !== undefined && desc.enumerable) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
    return to;
  }

  var objectAssign = {
    get: get,
    objectAssignPolyfill: objectAssignPolyfill
  };

  /* eslint-disable no-param-reassign */

  function pick(object, keys) {
    return keys.reduce(function(prev, key) {
      if (object[key]) {
        prev[key] = object[key];
      }
      return prev;
    }, {});
  }

  function getKeysNotIn(obj, allowedKeys) {
    var notAllowed = [];
    for (var key in obj) {
      if (allowedKeys.indexOf(key) === -1) {
        notAllowed.push(key);
      }
    }
    return notAllowed;
  }

  function objectValues(obj) {
    var values = [];
    for (var key in obj) {
      values.push(obj[key]);
    }
    return values;
  }

  function extend() {
    var params = objectValues(arguments);
    params.unshift({});
    return objectAssign.get().apply(undefined, params);
  }

  function merge(object, keys) {
    return {
      base: keys ? pick(object, keys) : object,
      with: function(object2, keys2) {
        object2 = keys2 ? pick(object2, keys2) : object2;
        return extend(this.base, object2);
      }
    };
  }

  function blacklist(object, blacklistedKeys) {
    return Object.keys(object).reduce(function(p, key) {
      if (blacklistedKeys.indexOf(key) === -1) {
        p[key] = object[key];
      }
      return p;
    }, {});
  }

  function camelToSnake(str) {
    var newKey = '';
    var index = 0;
    var code;
    var wasPrevNumber = true;
    var wasPrevUppercase = true;

    while (index < str.length) {
      code = str.charCodeAt(index);
      if (
        (!wasPrevUppercase && code >= 65 && code <= 90) ||
        (!wasPrevNumber && code >= 48 && code <= 57)
      ) {
        newKey += '_';
        newKey += str[index].toLowerCase();
      } else {
        newKey += str[index].toLowerCase();
      }
      wasPrevNumber = code >= 48 && code <= 57;
      wasPrevUppercase = code >= 65 && code <= 90;
      index++;
    }

    return newKey;
  }

  function snakeToCamel(str) {
    var parts = str.split('_');
    return parts.reduce(function(p, c) {
      return p + c.charAt(0).toUpperCase() + c.slice(1);
    }, parts.shift());
  }

  function toSnakeCase(object, exceptions) {
    if (typeof object !== 'object' || assert.isArray(object) || object === null) {
      return object;
    }
    exceptions = exceptions || [];

    return Object.keys(object).reduce(function(p, key) {
      var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
      p[newKey] = toSnakeCase(object[key]);
      return p;
    }, {});
  }

  function toCamelCase(object, exceptions, options) {
    if (typeof object !== 'object' || assert.isArray(object) || object === null) {
      return object;
    }

    exceptions = exceptions || [];
    options = options || {};
    return Object.keys(object).reduce(function(p, key) {
      var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;

      p[newKey] = toCamelCase(object[newKey] || object[key], [], options);

      if (options.keepOriginal) {
        p[key] = toCamelCase(object[key], [], options);
      }
      return p;
    }, {});
  }

  function getLocationFromUrl(href) {
    var match = href.match(
      /^(https?:|file:|chrome-extension:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
    );
    return (
      match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
      }
    );
  }

  function getOriginFromUrl(url) {
    if (!url) {
      return undefined;
    }
    var parsed = getLocationFromUrl(url);
    if (!parsed) {
      return null;
    }
    var origin = parsed.protocol + '//' + parsed.hostname;
    if (parsed.port) {
      origin += ':' + parsed.port;
    }
    return origin;
  }

  function trim(options, key) {
    var trimmed = extend(options);
    if (options[key]) {
      trimmed[key] = options[key].trim();
    }
    return trimmed;
  }

  function trimMultiple(options, keys) {
    return keys.reduce(trim, options);
  }

  function trimUserDetails(options) {
    return trimMultiple(options, ['username', 'email', 'phoneNumber']);
  }

  /**
   * Updates the value of a property on the given object, using a deep path selector.
   * @param {object} obj The object to set the property value on
   * @param {string|array} path The path to the property that should have its value updated. e.g. 'prop1.prop2.prop3' or ['prop1', 'prop2', 'prop3']
   * @param {any} value The value to set
   * @ignore
   */
  function updatePropertyOn(obj, path, value) {
    if (typeof path === 'string') {
      path = path.split('.');
    }

    var next = path[0];

    if (obj.hasOwnProperty(next)) {
      if (path.length === 1) {
        obj[next] = value;
      } else {
        updatePropertyOn(obj[next], path.slice(1), value);
      }
    }
  }

  var objectHelper = {
    toSnakeCase: toSnakeCase,
    toCamelCase: toCamelCase,
    blacklist: blacklist,
    merge: merge,
    pick: pick,
    getKeysNotIn: getKeysNotIn,
    extend: extend,
    getOriginFromUrl: getOriginFromUrl,
    getLocationFromUrl: getLocationFromUrl,
    trimUserDetails: trimUserDetails,
    updatePropertyOn: updatePropertyOn
  };

  function redirect(url) {
    getWindow().location = url;
  }

  function getDocument() {
    return getWindow().document;
  }

  function getWindow() {
    return window;
  }

  function getOrigin() {
    var location = getWindow().location;
    var origin = location.origin;

    if (!origin) {
      origin = objectHelper.getOriginFromUrl(location.href);
    }

    return origin;
  }

  var windowHandler = {
    redirect: redirect,
    getDocument: getDocument,
    getWindow: getWindow,
    getOrigin: getOrigin
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var urlJoin = createCommonjsModule(function (module) {
  (function (name, context, definition) {
    if ( module.exports) module.exports = definition();
    else context[name] = definition();
  })('urljoin', commonjsGlobal, function () {

    function normalize (strArray) {
      var resultArray = [];
      if (strArray.length === 0) { return ''; }

      if (typeof strArray[0] !== 'string') {
        throw new TypeError('Url must be a string. Received ' + strArray[0]);
      }

      // If the first part is a plain protocol, we combine it with the next part.
      if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
        var first = strArray.shift();
        strArray[0] = first + strArray[0];
      }

      // There must be two or three slashes in the file protocol, two slashes in anything else.
      if (strArray[0].match(/^file:\/\/\//)) {
        strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1:///');
      } else {
        strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1://');
      }

      for (var i = 0; i < strArray.length; i++) {
        var component = strArray[i];

        if (typeof component !== 'string') {
          throw new TypeError('Url must be a string. Received ' + component);
        }

        if (component === '') { continue; }

        if (i > 0) {
          // Removing the starting slashes for each component but the first.
          component = component.replace(/^[\/]+/, '');
        }
        if (i < strArray.length - 1) {
          // Removing the ending slashes for each component but the last.
          component = component.replace(/[\/]+$/, '');
        } else {
          // For the last component we will combine multiple slashes to a single one.
          component = component.replace(/[\/]+$/, '/');
        }

        resultArray.push(component);

      }

      var str = resultArray.join('/');
      // Each input component is now separated by a single slash except the possible first plain protocol part.

      // remove trailing slash before parameters or hash
      str = str.replace(/\/(\?|&|#[^!])/g, '$1');

      // replace ? in parameters with &
      var parts = str.split('?');
      str = parts.shift() + (parts.length > 0 ? '?': '') + parts.join('&');

      return str;
    }

    return function () {
      var input;

      if (typeof arguments[0] === 'object') {
        input = arguments[0];
      } else {
        input = [].slice.call(arguments);
      }

      return normalize(input);
    };

  });
  });

  /** @type {import('.')} */
  var esErrors = Error;

  /** @type {import('./eval')} */
  var _eval = EvalError;

  /** @type {import('./range')} */
  var range = RangeError;

  /** @type {import('./ref')} */
  var ref = ReferenceError;

  /** @type {import('./syntax')} */
  var syntax = SyntaxError;

  /** @type {import('./type')} */
  var type = TypeError;

  /** @type {import('./uri')} */
  var uri = URIError;

  /* eslint complexity: [2, 18], max-statements: [2, 33] */
  var shams = function hasSymbols() {
  	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
  	if (typeof Symbol.iterator === 'symbol') { return true; }

  	var obj = {};
  	var sym = Symbol('test');
  	var symObj = Object(sym);
  	if (typeof sym === 'string') { return false; }

  	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
  	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

  	// temp disabled per https://github.com/ljharb/object.assign/issues/17
  	// if (sym instanceof Symbol) { return false; }
  	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
  	// if (!(symObj instanceof Symbol)) { return false; }

  	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
  	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

  	var symVal = 42;
  	obj[sym] = symVal;
  	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
  	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

  	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

  	var syms = Object.getOwnPropertySymbols(obj);
  	if (syms.length !== 1 || syms[0] !== sym) { return false; }

  	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

  	if (typeof Object.getOwnPropertyDescriptor === 'function') {
  		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
  		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
  	}

  	return true;
  };

  var origSymbol = typeof Symbol !== 'undefined' && Symbol;


  var hasSymbols = function hasNativeSymbols() {
  	if (typeof origSymbol !== 'function') { return false; }
  	if (typeof Symbol !== 'function') { return false; }
  	if (typeof origSymbol('foo') !== 'symbol') { return false; }
  	if (typeof Symbol('bar') !== 'symbol') { return false; }

  	return shams();
  };

  var test = {
  	__proto__: null,
  	foo: {}
  };

  var $Object = Object;

  /** @type {import('.')} */
  var hasProto = function hasProto() {
  	// @ts-expect-error: TS errors on an inherited property for some reason
  	return { __proto__: test }.foo === test.foo
  		&& !(test instanceof $Object);
  };

  /* eslint no-invalid-this: 1 */

  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
  var toStr = Object.prototype.toString;
  var max = Math.max;
  var funcType = '[object Function]';

  var concatty = function concatty(a, b) {
      var arr = [];

      for (var i = 0; i < a.length; i += 1) {
          arr[i] = a[i];
      }
      for (var j = 0; j < b.length; j += 1) {
          arr[j + a.length] = b[j];
      }

      return arr;
  };

  var slicy = function slicy(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
          arr[j] = arrLike[i];
      }
      return arr;
  };

  var joiny = function (arr, joiner) {
      var str = '';
      for (var i = 0; i < arr.length; i += 1) {
          str += arr[i];
          if (i + 1 < arr.length) {
              str += joiner;
          }
      }
      return str;
  };

  var implementation = function bind(that) {
      var target = this;
      if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slicy(arguments, 1);

      var bound;
      var binder = function () {
          if (this instanceof bound) {
              var result = target.apply(
                  this,
                  concatty(args, arguments)
              );
              if (Object(result) === result) {
                  return result;
              }
              return this;
          }
          return target.apply(
              that,
              concatty(args, arguments)
          );

      };

      var boundLength = max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
          boundArgs[i] = '$' + i;
      }

      bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

      if (target.prototype) {
          var Empty = function Empty() {};
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
      }

      return bound;
  };

  var functionBind = Function.prototype.bind || implementation;

  var call = Function.prototype.call;
  var $hasOwn = Object.prototype.hasOwnProperty;


  /** @type {import('.')} */
  var hasown = functionBind.call(call, $hasOwn);

  var undefined$1;









  var $Function = Function;

  // eslint-disable-next-line consistent-return
  var getEvalledConstructor = function (expressionSyntax) {
  	try {
  		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
  	} catch (e) {}
  };

  var $gOPD = Object.getOwnPropertyDescriptor;
  if ($gOPD) {
  	try {
  		$gOPD({}, '');
  	} catch (e) {
  		$gOPD = null; // this is IE 8, which has a broken gOPD
  	}
  }

  var throwTypeError = function () {
  	throw new type();
  };
  var ThrowTypeError = $gOPD
  	? (function () {
  		try {
  			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
  			arguments.callee; // IE 8 does not throw here
  			return throwTypeError;
  		} catch (calleeThrows) {
  			try {
  				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
  				return $gOPD(arguments, 'callee').get;
  			} catch (gOPDthrows) {
  				return throwTypeError;
  			}
  		}
  	}())
  	: throwTypeError;

  var hasSymbols$1 = hasSymbols();
  var hasProto$1 = hasProto();

  var getProto = Object.getPrototypeOf || (
  	hasProto$1
  		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
  		: null
  );

  var needsEval = {};

  var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined$1 : getProto(Uint8Array);

  var INTRINSICS = {
  	__proto__: null,
  	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
  	'%Array%': Array,
  	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
  	'%ArrayIteratorPrototype%': hasSymbols$1 && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
  	'%AsyncFromSyncIteratorPrototype%': undefined$1,
  	'%AsyncFunction%': needsEval,
  	'%AsyncGenerator%': needsEval,
  	'%AsyncGeneratorFunction%': needsEval,
  	'%AsyncIteratorPrototype%': needsEval,
  	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
  	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
  	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
  	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
  	'%Boolean%': Boolean,
  	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
  	'%Date%': Date,
  	'%decodeURI%': decodeURI,
  	'%decodeURIComponent%': decodeURIComponent,
  	'%encodeURI%': encodeURI,
  	'%encodeURIComponent%': encodeURIComponent,
  	'%Error%': esErrors,
  	'%eval%': eval, // eslint-disable-line no-eval
  	'%EvalError%': _eval,
  	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
  	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
  	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
  	'%Function%': $Function,
  	'%GeneratorFunction%': needsEval,
  	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
  	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
  	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
  	'%isFinite%': isFinite,
  	'%isNaN%': isNaN,
  	'%IteratorPrototype%': hasSymbols$1 && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
  	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
  	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 || !getProto ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
  	'%Math%': Math,
  	'%Number%': Number,
  	'%Object%': Object,
  	'%parseFloat%': parseFloat,
  	'%parseInt%': parseInt,
  	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
  	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
  	'%RangeError%': range,
  	'%ReferenceError%': ref,
  	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
  	'%RegExp%': RegExp,
  	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
  	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 || !getProto ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
  	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
  	'%String%': String,
  	'%StringIteratorPrototype%': hasSymbols$1 && getProto ? getProto(''[Symbol.iterator]()) : undefined$1,
  	'%Symbol%': hasSymbols$1 ? Symbol : undefined$1,
  	'%SyntaxError%': syntax,
  	'%ThrowTypeError%': ThrowTypeError,
  	'%TypedArray%': TypedArray,
  	'%TypeError%': type,
  	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
  	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
  	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
  	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
  	'%URIError%': uri,
  	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
  	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
  	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
  };

  if (getProto) {
  	try {
  		null.error; // eslint-disable-line no-unused-expressions
  	} catch (e) {
  		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
  		var errorProto = getProto(getProto(e));
  		INTRINSICS['%Error.prototype%'] = errorProto;
  	}
  }

  var doEval = function doEval(name) {
  	var value;
  	if (name === '%AsyncFunction%') {
  		value = getEvalledConstructor('async function () {}');
  	} else if (name === '%GeneratorFunction%') {
  		value = getEvalledConstructor('function* () {}');
  	} else if (name === '%AsyncGeneratorFunction%') {
  		value = getEvalledConstructor('async function* () {}');
  	} else if (name === '%AsyncGenerator%') {
  		var fn = doEval('%AsyncGeneratorFunction%');
  		if (fn) {
  			value = fn.prototype;
  		}
  	} else if (name === '%AsyncIteratorPrototype%') {
  		var gen = doEval('%AsyncGenerator%');
  		if (gen && getProto) {
  			value = getProto(gen.prototype);
  		}
  	}

  	INTRINSICS[name] = value;

  	return value;
  };

  var LEGACY_ALIASES = {
  	__proto__: null,
  	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
  	'%ArrayPrototype%': ['Array', 'prototype'],
  	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
  	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
  	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
  	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
  	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
  	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
  	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
  	'%BooleanPrototype%': ['Boolean', 'prototype'],
  	'%DataViewPrototype%': ['DataView', 'prototype'],
  	'%DatePrototype%': ['Date', 'prototype'],
  	'%ErrorPrototype%': ['Error', 'prototype'],
  	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
  	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
  	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
  	'%FunctionPrototype%': ['Function', 'prototype'],
  	'%Generator%': ['GeneratorFunction', 'prototype'],
  	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
  	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
  	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
  	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
  	'%JSONParse%': ['JSON', 'parse'],
  	'%JSONStringify%': ['JSON', 'stringify'],
  	'%MapPrototype%': ['Map', 'prototype'],
  	'%NumberPrototype%': ['Number', 'prototype'],
  	'%ObjectPrototype%': ['Object', 'prototype'],
  	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
  	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
  	'%PromisePrototype%': ['Promise', 'prototype'],
  	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
  	'%Promise_all%': ['Promise', 'all'],
  	'%Promise_reject%': ['Promise', 'reject'],
  	'%Promise_resolve%': ['Promise', 'resolve'],
  	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
  	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
  	'%RegExpPrototype%': ['RegExp', 'prototype'],
  	'%SetPrototype%': ['Set', 'prototype'],
  	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
  	'%StringPrototype%': ['String', 'prototype'],
  	'%SymbolPrototype%': ['Symbol', 'prototype'],
  	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
  	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
  	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
  	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
  	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
  	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
  	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
  	'%URIErrorPrototype%': ['URIError', 'prototype'],
  	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
  	'%WeakSetPrototype%': ['WeakSet', 'prototype']
  };



  var $concat = functionBind.call(Function.call, Array.prototype.concat);
  var $spliceApply = functionBind.call(Function.apply, Array.prototype.splice);
  var $replace = functionBind.call(Function.call, String.prototype.replace);
  var $strSlice = functionBind.call(Function.call, String.prototype.slice);
  var $exec = functionBind.call(Function.call, RegExp.prototype.exec);

  /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
  var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
  var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
  var stringToPath = function stringToPath(string) {
  	var first = $strSlice(string, 0, 1);
  	var last = $strSlice(string, -1);
  	if (first === '%' && last !== '%') {
  		throw new syntax('invalid intrinsic syntax, expected closing `%`');
  	} else if (last === '%' && first !== '%') {
  		throw new syntax('invalid intrinsic syntax, expected opening `%`');
  	}
  	var result = [];
  	$replace(string, rePropName, function (match, number, quote, subString) {
  		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
  	});
  	return result;
  };
  /* end adaptation */

  var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
  	var intrinsicName = name;
  	var alias;
  	if (hasown(LEGACY_ALIASES, intrinsicName)) {
  		alias = LEGACY_ALIASES[intrinsicName];
  		intrinsicName = '%' + alias[0] + '%';
  	}

  	if (hasown(INTRINSICS, intrinsicName)) {
  		var value = INTRINSICS[intrinsicName];
  		if (value === needsEval) {
  			value = doEval(intrinsicName);
  		}
  		if (typeof value === 'undefined' && !allowMissing) {
  			throw new type('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
  		}

  		return {
  			alias: alias,
  			name: intrinsicName,
  			value: value
  		};
  	}

  	throw new syntax('intrinsic ' + name + ' does not exist!');
  };

  var getIntrinsic = function GetIntrinsic(name, allowMissing) {
  	if (typeof name !== 'string' || name.length === 0) {
  		throw new type('intrinsic name must be a non-empty string');
  	}
  	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
  		throw new type('"allowMissing" argument must be a boolean');
  	}

  	if ($exec(/^%?[^%]*%?$/, name) === null) {
  		throw new syntax('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
  	}
  	var parts = stringToPath(name);
  	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

  	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
  	var intrinsicRealName = intrinsic.name;
  	var value = intrinsic.value;
  	var skipFurtherCaching = false;

  	var alias = intrinsic.alias;
  	if (alias) {
  		intrinsicBaseName = alias[0];
  		$spliceApply(parts, $concat([0, 1], alias));
  	}

  	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
  		var part = parts[i];
  		var first = $strSlice(part, 0, 1);
  		var last = $strSlice(part, -1);
  		if (
  			(
  				(first === '"' || first === "'" || first === '`')
  				|| (last === '"' || last === "'" || last === '`')
  			)
  			&& first !== last
  		) {
  			throw new syntax('property names with quotes must have matching quotes');
  		}
  		if (part === 'constructor' || !isOwn) {
  			skipFurtherCaching = true;
  		}

  		intrinsicBaseName += '.' + part;
  		intrinsicRealName = '%' + intrinsicBaseName + '%';

  		if (hasown(INTRINSICS, intrinsicRealName)) {
  			value = INTRINSICS[intrinsicRealName];
  		} else if (value != null) {
  			if (!(part in value)) {
  				if (!allowMissing) {
  					throw new type('base intrinsic for ' + name + ' exists, but the property is not available.');
  				}
  				return void undefined$1;
  			}
  			if ($gOPD && (i + 1) >= parts.length) {
  				var desc = $gOPD(value, part);
  				isOwn = !!desc;

  				// By convention, when a data property is converted to an accessor
  				// property to emulate a data property that does not suffer from
  				// the override mistake, that accessor's getter is marked with
  				// an `originalValue` property. Here, when we detect this, we
  				// uphold the illusion by pretending to see that original data
  				// property, i.e., returning the value rather than the getter
  				// itself.
  				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
  					value = desc.get;
  				} else {
  					value = value[part];
  				}
  			} else {
  				isOwn = hasown(value, part);
  				value = value[part];
  			}

  			if (isOwn && !skipFurtherCaching) {
  				INTRINSICS[intrinsicRealName] = value;
  			}
  		}
  	}
  	return value;
  };

  /** @type {import('.')} */
  var $defineProperty = getIntrinsic('%Object.defineProperty%', true) || false;
  if ($defineProperty) {
  	try {
  		$defineProperty({}, 'a', { value: 1 });
  	} catch (e) {
  		// IE 8 has a broken defineProperty
  		$defineProperty = false;
  	}
  }

  var esDefineProperty = $defineProperty;

  var $gOPD$1 = getIntrinsic('%Object.getOwnPropertyDescriptor%', true);

  if ($gOPD$1) {
  	try {
  		$gOPD$1([], 'length');
  	} catch (e) {
  		// IE 8 has a broken gOPD
  		$gOPD$1 = null;
  	}
  }

  var gopd = $gOPD$1;

  /** @type {import('.')} */
  var defineDataProperty = function defineDataProperty(
  	obj,
  	property,
  	value
  ) {
  	if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
  		throw new type('`obj` must be an object or a function`');
  	}
  	if (typeof property !== 'string' && typeof property !== 'symbol') {
  		throw new type('`property` must be a string or a symbol`');
  	}
  	if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
  		throw new type('`nonEnumerable`, if provided, must be a boolean or null');
  	}
  	if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
  		throw new type('`nonWritable`, if provided, must be a boolean or null');
  	}
  	if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
  		throw new type('`nonConfigurable`, if provided, must be a boolean or null');
  	}
  	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
  		throw new type('`loose`, if provided, must be a boolean');
  	}

  	var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
  	var nonWritable = arguments.length > 4 ? arguments[4] : null;
  	var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
  	var loose = arguments.length > 6 ? arguments[6] : false;

  	/* @type {false | TypedPropertyDescriptor<unknown>} */
  	var desc = !!gopd && gopd(obj, property);

  	if (esDefineProperty) {
  		esDefineProperty(obj, property, {
  			configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
  			enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
  			value: value,
  			writable: nonWritable === null && desc ? desc.writable : !nonWritable
  		});
  	} else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
  		// must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
  		obj[property] = value; // eslint-disable-line no-param-reassign
  	} else {
  		throw new syntax('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
  	}
  };

  var hasPropertyDescriptors = function hasPropertyDescriptors() {
  	return !!esDefineProperty;
  };

  hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
  	// node v0.6 has a bug where array lengths can be Set but not Defined
  	if (!esDefineProperty) {
  		return null;
  	}
  	try {
  		return esDefineProperty([], 'length', { value: 1 }).length !== 1;
  	} catch (e) {
  		// In Firefox 4-22, defining length on an array throws an exception.
  		return true;
  	}
  };

  var hasPropertyDescriptors_1 = hasPropertyDescriptors;

  var hasDescriptors = hasPropertyDescriptors_1();



  var $floor = getIntrinsic('%Math.floor%');

  /** @type {import('.')} */
  var setFunctionLength = function setFunctionLength(fn, length) {
  	if (typeof fn !== 'function') {
  		throw new type('`fn` is not a function');
  	}
  	if (typeof length !== 'number' || length < 0 || length > 0xFFFFFFFF || $floor(length) !== length) {
  		throw new type('`length` must be a positive 32-bit integer');
  	}

  	var loose = arguments.length > 2 && !!arguments[2];

  	var functionLengthIsConfigurable = true;
  	var functionLengthIsWritable = true;
  	if ('length' in fn && gopd) {
  		var desc = gopd(fn, 'length');
  		if (desc && !desc.configurable) {
  			functionLengthIsConfigurable = false;
  		}
  		if (desc && !desc.writable) {
  			functionLengthIsWritable = false;
  		}
  	}

  	if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
  		if (hasDescriptors) {
  			defineDataProperty(/** @type {Parameters<define>[0]} */ (fn), 'length', length, true, true);
  		} else {
  			defineDataProperty(/** @type {Parameters<define>[0]} */ (fn), 'length', length);
  		}
  	}
  	return fn;
  };

  var callBind = createCommonjsModule(function (module) {






  var $apply = getIntrinsic('%Function.prototype.apply%');
  var $call = getIntrinsic('%Function.prototype.call%');
  var $reflectApply = getIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);


  var $max = getIntrinsic('%Math.max%');

  module.exports = function callBind(originalFunction) {
  	if (typeof originalFunction !== 'function') {
  		throw new type('a function is required');
  	}
  	var func = $reflectApply(functionBind, $call, arguments);
  	return setFunctionLength(
  		func,
  		1 + $max(0, originalFunction.length - (arguments.length - 1)),
  		true
  	);
  };

  var applyBind = function applyBind() {
  	return $reflectApply(functionBind, $apply, arguments);
  };

  if (esDefineProperty) {
  	esDefineProperty(module.exports, 'apply', { value: applyBind });
  } else {
  	module.exports.apply = applyBind;
  }
  });
  var callBind_1 = callBind.apply;

  var $indexOf = callBind(getIntrinsic('String.prototype.indexOf'));

  var callBound = function callBoundIntrinsic(name, allowMissing) {
  	var intrinsic = getIntrinsic(name, !!allowMissing);
  	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
  		return callBind(intrinsic);
  	}
  	return intrinsic;
  };

  var _nodeResolve_empty = {};

  var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': _nodeResolve_empty
  });

  var utilInspect = getCjsExportFromNamespace(_nodeResolve_empty$1);

  var hasMap = typeof Map === 'function' && Map.prototype;
  var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
  var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
  var mapForEach = hasMap && Map.prototype.forEach;
  var hasSet = typeof Set === 'function' && Set.prototype;
  var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
  var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
  var setForEach = hasSet && Set.prototype.forEach;
  var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
  var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
  var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
  var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
  var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
  var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
  var booleanValueOf = Boolean.prototype.valueOf;
  var objectToString = Object.prototype.toString;
  var functionToString = Function.prototype.toString;
  var $match = String.prototype.match;
  var $slice = String.prototype.slice;
  var $replace$1 = String.prototype.replace;
  var $toUpperCase = String.prototype.toUpperCase;
  var $toLowerCase = String.prototype.toLowerCase;
  var $test = RegExp.prototype.test;
  var $concat$1 = Array.prototype.concat;
  var $join = Array.prototype.join;
  var $arrSlice = Array.prototype.slice;
  var $floor$1 = Math.floor;
  var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
  var gOPS = Object.getOwnPropertySymbols;
  var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
  var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
  // ie, `has-tostringtag/shams
  var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
      ? Symbol.toStringTag
      : null;
  var isEnumerable = Object.prototype.propertyIsEnumerable;

  var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
      [].__proto__ === Array.prototype // eslint-disable-line no-proto
          ? function (O) {
              return O.__proto__; // eslint-disable-line no-proto
          }
          : null
  );

  function addNumericSeparator(num, str) {
      if (
          num === Infinity
          || num === -Infinity
          || num !== num
          || (num && num > -1000 && num < 1000)
          || $test.call(/e/, str)
      ) {
          return str;
      }
      var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
      if (typeof num === 'number') {
          var int = num < 0 ? -$floor$1(-num) : $floor$1(num); // trunc(num)
          if (int !== num) {
              var intStr = String(int);
              var dec = $slice.call(str, intStr.length + 1);
              return $replace$1.call(intStr, sepRegex, '$&_') + '.' + $replace$1.call($replace$1.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
          }
      }
      return $replace$1.call(str, sepRegex, '$&_');
  }


  var inspectCustom = utilInspect.custom;
  var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

  var objectInspect = function inspect_(obj, options, depth, seen) {
      var opts = options || {};

      if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
          throw new TypeError('option "quoteStyle" must be "single" or "double"');
      }
      if (
          has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
              ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
              : opts.maxStringLength !== null
          )
      ) {
          throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
      }
      var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
      if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
          throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
      }

      if (
          has(opts, 'indent')
          && opts.indent !== null
          && opts.indent !== '\t'
          && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
      ) {
          throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
      }
      if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
          throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
      }
      var numericSeparator = opts.numericSeparator;

      if (typeof obj === 'undefined') {
          return 'undefined';
      }
      if (obj === null) {
          return 'null';
      }
      if (typeof obj === 'boolean') {
          return obj ? 'true' : 'false';
      }

      if (typeof obj === 'string') {
          return inspectString(obj, opts);
      }
      if (typeof obj === 'number') {
          if (obj === 0) {
              return Infinity / obj > 0 ? '0' : '-0';
          }
          var str = String(obj);
          return numericSeparator ? addNumericSeparator(obj, str) : str;
      }
      if (typeof obj === 'bigint') {
          var bigIntStr = String(obj) + 'n';
          return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
      }

      var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
      if (typeof depth === 'undefined') { depth = 0; }
      if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
          return isArray$1(obj) ? '[Array]' : '[Object]';
      }

      var indent = getIndent(opts, depth);

      if (typeof seen === 'undefined') {
          seen = [];
      } else if (indexOf(seen, obj) >= 0) {
          return '[Circular]';
      }

      function inspect(value, from, noIndent) {
          if (from) {
              seen = $arrSlice.call(seen);
              seen.push(from);
          }
          if (noIndent) {
              var newOpts = {
                  depth: opts.depth
              };
              if (has(opts, 'quoteStyle')) {
                  newOpts.quoteStyle = opts.quoteStyle;
              }
              return inspect_(value, newOpts, depth + 1, seen);
          }
          return inspect_(value, opts, depth + 1, seen);
      }

      if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
          var name = nameOf(obj);
          var keys = arrObjKeys(obj, inspect);
          return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
      }
      if (isSymbol(obj)) {
          var symString = hasShammedSymbols ? $replace$1.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
          return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
      }
      if (isElement(obj)) {
          var s = '<' + $toLowerCase.call(String(obj.nodeName));
          var attrs = obj.attributes || [];
          for (var i = 0; i < attrs.length; i++) {
              s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
          }
          s += '>';
          if (obj.childNodes && obj.childNodes.length) { s += '...'; }
          s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
          return s;
      }
      if (isArray$1(obj)) {
          if (obj.length === 0) { return '[]'; }
          var xs = arrObjKeys(obj, inspect);
          if (indent && !singleLineValues(xs)) {
              return '[' + indentedJoin(xs, indent) + ']';
          }
          return '[ ' + $join.call(xs, ', ') + ' ]';
      }
      if (isError(obj)) {
          var parts = arrObjKeys(obj, inspect);
          if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
              return '{ [' + String(obj) + '] ' + $join.call($concat$1.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
          }
          if (parts.length === 0) { return '[' + String(obj) + ']'; }
          return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
      }
      if (typeof obj === 'object' && customInspect) {
          if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
              return utilInspect(obj, { depth: maxDepth - depth });
          } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
              return obj.inspect();
          }
      }
      if (isMap(obj)) {
          var mapParts = [];
          if (mapForEach) {
              mapForEach.call(obj, function (value, key) {
                  mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
              });
          }
          return collectionOf('Map', mapSize.call(obj), mapParts, indent);
      }
      if (isSet(obj)) {
          var setParts = [];
          if (setForEach) {
              setForEach.call(obj, function (value) {
                  setParts.push(inspect(value, obj));
              });
          }
          return collectionOf('Set', setSize.call(obj), setParts, indent);
      }
      if (isWeakMap(obj)) {
          return weakCollectionOf('WeakMap');
      }
      if (isWeakSet(obj)) {
          return weakCollectionOf('WeakSet');
      }
      if (isWeakRef(obj)) {
          return weakCollectionOf('WeakRef');
      }
      if (isNumber(obj)) {
          return markBoxed(inspect(Number(obj)));
      }
      if (isBigInt(obj)) {
          return markBoxed(inspect(bigIntValueOf.call(obj)));
      }
      if (isBoolean(obj)) {
          return markBoxed(booleanValueOf.call(obj));
      }
      if (isString(obj)) {
          return markBoxed(inspect(String(obj)));
      }
      // note: in IE 8, sometimes `global !== window` but both are the prototypes of each other
      /* eslint-env browser */
      if (typeof window !== 'undefined' && obj === window) {
          return '{ [object Window] }';
      }
      if (
          (typeof globalThis !== 'undefined' && obj === globalThis)
          || (typeof commonjsGlobal !== 'undefined' && obj === commonjsGlobal)
      ) {
          return '{ [object globalThis] }';
      }
      if (!isDate(obj) && !isRegExp(obj)) {
          var ys = arrObjKeys(obj, inspect);
          var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
          var protoTag = obj instanceof Object ? '' : 'null prototype';
          var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr$1(obj), 8, -1) : protoTag ? 'Object' : '';
          var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
          var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat$1.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
          if (ys.length === 0) { return tag + '{}'; }
          if (indent) {
              return tag + '{' + indentedJoin(ys, indent) + '}';
          }
          return tag + '{ ' + $join.call(ys, ', ') + ' }';
      }
      return String(obj);
  };

  function wrapQuotes(s, defaultStyle, opts) {
      var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
      return quoteChar + s + quoteChar;
  }

  function quote(s) {
      return $replace$1.call(String(s), /"/g, '&quot;');
  }

  function isArray$1(obj) { return toStr$1(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isDate(obj) { return toStr$1(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isRegExp(obj) { return toStr$1(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isError(obj) { return toStr$1(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isString(obj) { return toStr$1(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isNumber(obj) { return toStr$1(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isBoolean(obj) { return toStr$1(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

  // Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
  function isSymbol(obj) {
      if (hasShammedSymbols) {
          return obj && typeof obj === 'object' && obj instanceof Symbol;
      }
      if (typeof obj === 'symbol') {
          return true;
      }
      if (!obj || typeof obj !== 'object' || !symToString) {
          return false;
      }
      try {
          symToString.call(obj);
          return true;
      } catch (e) {}
      return false;
  }

  function isBigInt(obj) {
      if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
          return false;
      }
      try {
          bigIntValueOf.call(obj);
          return true;
      } catch (e) {}
      return false;
  }

  var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
  function has(obj, key) {
      return hasOwn.call(obj, key);
  }

  function toStr$1(obj) {
      return objectToString.call(obj);
  }

  function nameOf(f) {
      if (f.name) { return f.name; }
      var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
      if (m) { return m[1]; }
      return null;
  }

  function indexOf(xs, x) {
      if (xs.indexOf) { return xs.indexOf(x); }
      for (var i = 0, l = xs.length; i < l; i++) {
          if (xs[i] === x) { return i; }
      }
      return -1;
  }

  function isMap(x) {
      if (!mapSize || !x || typeof x !== 'object') {
          return false;
      }
      try {
          mapSize.call(x);
          try {
              setSize.call(x);
          } catch (s) {
              return true;
          }
          return x instanceof Map; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakMap(x) {
      if (!weakMapHas || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakMapHas.call(x, weakMapHas);
          try {
              weakSetHas.call(x, weakSetHas);
          } catch (s) {
              return true;
          }
          return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakRef(x) {
      if (!weakRefDeref || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakRefDeref.call(x);
          return true;
      } catch (e) {}
      return false;
  }

  function isSet(x) {
      if (!setSize || !x || typeof x !== 'object') {
          return false;
      }
      try {
          setSize.call(x);
          try {
              mapSize.call(x);
          } catch (m) {
              return true;
          }
          return x instanceof Set; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakSet(x) {
      if (!weakSetHas || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakSetHas.call(x, weakSetHas);
          try {
              weakMapHas.call(x, weakMapHas);
          } catch (s) {
              return true;
          }
          return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isElement(x) {
      if (!x || typeof x !== 'object') { return false; }
      if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
          return true;
      }
      return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
  }

  function inspectString(str, opts) {
      if (str.length > opts.maxStringLength) {
          var remaining = str.length - opts.maxStringLength;
          var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
          return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
      }
      // eslint-disable-next-line no-control-regex
      var s = $replace$1.call($replace$1.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
      return wrapQuotes(s, 'single', opts);
  }

  function lowbyte(c) {
      var n = c.charCodeAt(0);
      var x = {
          8: 'b',
          9: 't',
          10: 'n',
          12: 'f',
          13: 'r'
      }[n];
      if (x) { return '\\' + x; }
      return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
  }

  function markBoxed(str) {
      return 'Object(' + str + ')';
  }

  function weakCollectionOf(type) {
      return type + ' { ? }';
  }

  function collectionOf(type, size, entries, indent) {
      var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
      return type + ' (' + size + ') {' + joinedEntries + '}';
  }

  function singleLineValues(xs) {
      for (var i = 0; i < xs.length; i++) {
          if (indexOf(xs[i], '\n') >= 0) {
              return false;
          }
      }
      return true;
  }

  function getIndent(opts, depth) {
      var baseIndent;
      if (opts.indent === '\t') {
          baseIndent = '\t';
      } else if (typeof opts.indent === 'number' && opts.indent > 0) {
          baseIndent = $join.call(Array(opts.indent + 1), ' ');
      } else {
          return null;
      }
      return {
          base: baseIndent,
          prev: $join.call(Array(depth + 1), baseIndent)
      };
  }

  function indentedJoin(xs, indent) {
      if (xs.length === 0) { return ''; }
      var lineJoiner = '\n' + indent.prev + indent.base;
      return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
  }

  function arrObjKeys(obj, inspect) {
      var isArr = isArray$1(obj);
      var xs = [];
      if (isArr) {
          xs.length = obj.length;
          for (var i = 0; i < obj.length; i++) {
              xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
          }
      }
      var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
      var symMap;
      if (hasShammedSymbols) {
          symMap = {};
          for (var k = 0; k < syms.length; k++) {
              symMap['$' + syms[k]] = syms[k];
          }
      }

      for (var key in obj) { // eslint-disable-line no-restricted-syntax
          if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
          if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
          if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
              // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
              continue; // eslint-disable-line no-restricted-syntax, no-continue
          } else if ($test.call(/[^\w$]/, key)) {
              xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
          } else {
              xs.push(key + ': ' + inspect(obj[key], obj));
          }
      }
      if (typeof gOPS === 'function') {
          for (var j = 0; j < syms.length; j++) {
              if (isEnumerable.call(obj, syms[j])) {
                  xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
              }
          }
      }
      return xs;
  }

  var $WeakMap = getIntrinsic('%WeakMap%', true);
  var $Map = getIntrinsic('%Map%', true);

  var $weakMapGet = callBound('WeakMap.prototype.get', true);
  var $weakMapSet = callBound('WeakMap.prototype.set', true);
  var $weakMapHas = callBound('WeakMap.prototype.has', true);
  var $mapGet = callBound('Map.prototype.get', true);
  var $mapSet = callBound('Map.prototype.set', true);
  var $mapHas = callBound('Map.prototype.has', true);

  /*
  * This function traverses the list returning the node corresponding to the given key.
  *
  * That node is also moved to the head of the list, so that if it's accessed again we don't need to traverse the whole list. By doing so, all the recently used nodes can be accessed relatively quickly.
  */
  /** @type {import('.').listGetNode} */
  var listGetNode = function (list, key) { // eslint-disable-line consistent-return
  	/** @type {typeof list | NonNullable<(typeof list)['next']>} */
  	var prev = list;
  	/** @type {(typeof list)['next']} */
  	var curr;
  	for (; (curr = prev.next) !== null; prev = curr) {
  		if (curr.key === key) {
  			prev.next = curr.next;
  			// eslint-disable-next-line no-extra-parens
  			curr.next = /** @type {NonNullable<typeof list.next>} */ (list.next);
  			list.next = curr; // eslint-disable-line no-param-reassign
  			return curr;
  		}
  	}
  };

  /** @type {import('.').listGet} */
  var listGet = function (objects, key) {
  	var node = listGetNode(objects, key);
  	return node && node.value;
  };
  /** @type {import('.').listSet} */
  var listSet = function (objects, key, value) {
  	var node = listGetNode(objects, key);
  	if (node) {
  		node.value = value;
  	} else {
  		// Prepend the new node to the beginning of the list
  		objects.next = /** @type {import('.').ListNode<typeof value>} */ ({ // eslint-disable-line no-param-reassign, no-extra-parens
  			key: key,
  			next: objects.next,
  			value: value
  		});
  	}
  };
  /** @type {import('.').listHas} */
  var listHas = function (objects, key) {
  	return !!listGetNode(objects, key);
  };

  /** @type {import('.')} */
  var sideChannel = function getSideChannel() {
  	/** @type {WeakMap<object, unknown>} */ var $wm;
  	/** @type {Map<object, unknown>} */ var $m;
  	/** @type {import('.').RootNode<unknown>} */ var $o;

  	/** @type {import('.').Channel} */
  	var channel = {
  		assert: function (key) {
  			if (!channel.has(key)) {
  				throw new type('Side channel does not contain ' + objectInspect(key));
  			}
  		},
  		get: function (key) { // eslint-disable-line consistent-return
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapGet($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapGet($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listGet($o, key);
  				}
  			}
  		},
  		has: function (key) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapHas($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapHas($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listHas($o, key);
  				}
  			}
  			return false;
  		},
  		set: function (key, value) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if (!$wm) {
  					$wm = new $WeakMap();
  				}
  				$weakMapSet($wm, key, value);
  			} else if ($Map) {
  				if (!$m) {
  					$m = new $Map();
  				}
  				$mapSet($m, key, value);
  			} else {
  				if (!$o) {
  					// Initialize the linked list as an empty node, so that we don't have to special-case handling of the first node: we can always refer to it as (previous node).next, instead of something like (list).head
  					$o = { key: {}, next: null };
  				}
  				listSet($o, key, value);
  			}
  		}
  	};
  	return channel;
  };

  var replace = String.prototype.replace;
  var percentTwenties = /%20/g;

  var Format = {
      RFC1738: 'RFC1738',
      RFC3986: 'RFC3986'
  };

  var formats = {
      'default': Format.RFC3986,
      formatters: {
          RFC1738: function (value) {
              return replace.call(value, percentTwenties, '+');
          },
          RFC3986: function (value) {
              return String(value);
          }
      },
      RFC1738: Format.RFC1738,
      RFC3986: Format.RFC3986
  };

  var has$1 = Object.prototype.hasOwnProperty;
  var isArray$2 = Array.isArray;

  var hexTable = (function () {
      var array = [];
      for (var i = 0; i < 256; ++i) {
          array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
      }

      return array;
  }());

  var compactQueue = function compactQueue(queue) {
      while (queue.length > 1) {
          var item = queue.pop();
          var obj = item.obj[item.prop];

          if (isArray$2(obj)) {
              var compacted = [];

              for (var j = 0; j < obj.length; ++j) {
                  if (typeof obj[j] !== 'undefined') {
                      compacted.push(obj[j]);
                  }
              }

              item.obj[item.prop] = compacted;
          }
      }
  };

  var arrayToObject = function arrayToObject(source, options) {
      var obj = options && options.plainObjects ? Object.create(null) : {};
      for (var i = 0; i < source.length; ++i) {
          if (typeof source[i] !== 'undefined') {
              obj[i] = source[i];
          }
      }

      return obj;
  };

  var merge$1 = function merge(target, source, options) {
      /* eslint no-param-reassign: 0 */
      if (!source) {
          return target;
      }

      if (typeof source !== 'object') {
          if (isArray$2(target)) {
              target.push(source);
          } else if (target && typeof target === 'object') {
              if ((options && (options.plainObjects || options.allowPrototypes)) || !has$1.call(Object.prototype, source)) {
                  target[source] = true;
              }
          } else {
              return [target, source];
          }

          return target;
      }

      if (!target || typeof target !== 'object') {
          return [target].concat(source);
      }

      var mergeTarget = target;
      if (isArray$2(target) && !isArray$2(source)) {
          mergeTarget = arrayToObject(target, options);
      }

      if (isArray$2(target) && isArray$2(source)) {
          source.forEach(function (item, i) {
              if (has$1.call(target, i)) {
                  var targetItem = target[i];
                  if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                      target[i] = merge(targetItem, item, options);
                  } else {
                      target.push(item);
                  }
              } else {
                  target[i] = item;
              }
          });
          return target;
      }

      return Object.keys(source).reduce(function (acc, key) {
          var value = source[key];

          if (has$1.call(acc, key)) {
              acc[key] = merge(acc[key], value, options);
          } else {
              acc[key] = value;
          }
          return acc;
      }, mergeTarget);
  };

  var assign = function assignSingleSource(target, source) {
      return Object.keys(source).reduce(function (acc, key) {
          acc[key] = source[key];
          return acc;
      }, target);
  };

  var decode = function (str, decoder, charset) {
      var strWithoutPlus = str.replace(/\+/g, ' ');
      if (charset === 'iso-8859-1') {
          // unescape never throws, no try...catch needed:
          return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
      }
      // utf-8
      try {
          return decodeURIComponent(strWithoutPlus);
      } catch (e) {
          return strWithoutPlus;
      }
  };

  var limit = 1024;

  /* eslint operator-linebreak: [2, "before"] */

  var encode = function encode(str, defaultEncoder, charset, kind, format) {
      // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
      // It has been adapted here for stricter adherence to RFC 3986
      if (str.length === 0) {
          return str;
      }

      var string = str;
      if (typeof str === 'symbol') {
          string = Symbol.prototype.toString.call(str);
      } else if (typeof str !== 'string') {
          string = String(str);
      }

      if (charset === 'iso-8859-1') {
          return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
              return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
          });
      }

      var out = '';
      for (var j = 0; j < string.length; j += limit) {
          var segment = string.length >= limit ? string.slice(j, j + limit) : string;
          var arr = [];

          for (var i = 0; i < segment.length; ++i) {
              var c = segment.charCodeAt(i);
              if (
                  c === 0x2D // -
                  || c === 0x2E // .
                  || c === 0x5F // _
                  || c === 0x7E // ~
                  || (c >= 0x30 && c <= 0x39) // 0-9
                  || (c >= 0x41 && c <= 0x5A) // a-z
                  || (c >= 0x61 && c <= 0x7A) // A-Z
                  || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
              ) {
                  arr[arr.length] = segment.charAt(i);
                  continue;
              }

              if (c < 0x80) {
                  arr[arr.length] = hexTable[c];
                  continue;
              }

              if (c < 0x800) {
                  arr[arr.length] = hexTable[0xC0 | (c >> 6)]
                      + hexTable[0x80 | (c & 0x3F)];
                  continue;
              }

              if (c < 0xD800 || c >= 0xE000) {
                  arr[arr.length] = hexTable[0xE0 | (c >> 12)]
                      + hexTable[0x80 | ((c >> 6) & 0x3F)]
                      + hexTable[0x80 | (c & 0x3F)];
                  continue;
              }

              i += 1;
              c = 0x10000 + (((c & 0x3FF) << 10) | (segment.charCodeAt(i) & 0x3FF));

              arr[arr.length] = hexTable[0xF0 | (c >> 18)]
                  + hexTable[0x80 | ((c >> 12) & 0x3F)]
                  + hexTable[0x80 | ((c >> 6) & 0x3F)]
                  + hexTable[0x80 | (c & 0x3F)];
          }

          out += arr.join('');
      }

      return out;
  };

  var compact = function compact(value) {
      var queue = [{ obj: { o: value }, prop: 'o' }];
      var refs = [];

      for (var i = 0; i < queue.length; ++i) {
          var item = queue[i];
          var obj = item.obj[item.prop];

          var keys = Object.keys(obj);
          for (var j = 0; j < keys.length; ++j) {
              var key = keys[j];
              var val = obj[key];
              if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                  queue.push({ obj: obj, prop: key });
                  refs.push(val);
              }
          }
      }

      compactQueue(queue);

      return value;
  };

  var isRegExp$1 = function isRegExp(obj) {
      return Object.prototype.toString.call(obj) === '[object RegExp]';
  };

  var isBuffer = function isBuffer(obj) {
      if (!obj || typeof obj !== 'object') {
          return false;
      }

      return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
  };

  var combine = function combine(a, b) {
      return [].concat(a, b);
  };

  var maybeMap = function maybeMap(val, fn) {
      if (isArray$2(val)) {
          var mapped = [];
          for (var i = 0; i < val.length; i += 1) {
              mapped.push(fn(val[i]));
          }
          return mapped;
      }
      return fn(val);
  };

  var utils = {
      arrayToObject: arrayToObject,
      assign: assign,
      combine: combine,
      compact: compact,
      decode: decode,
      encode: encode,
      isBuffer: isBuffer,
      isRegExp: isRegExp$1,
      maybeMap: maybeMap,
      merge: merge$1
  };

  var has$2 = Object.prototype.hasOwnProperty;

  var arrayPrefixGenerators = {
      brackets: function brackets(prefix) {
          return prefix + '[]';
      },
      comma: 'comma',
      indices: function indices(prefix, key) {
          return prefix + '[' + key + ']';
      },
      repeat: function repeat(prefix) {
          return prefix;
      }
  };

  var isArray$3 = Array.isArray;
  var push = Array.prototype.push;
  var pushToArray = function (arr, valueOrArray) {
      push.apply(arr, isArray$3(valueOrArray) ? valueOrArray : [valueOrArray]);
  };

  var toISO = Date.prototype.toISOString;

  var defaultFormat = formats['default'];
  var defaults = {
      addQueryPrefix: false,
      allowDots: false,
      allowEmptyArrays: false,
      arrayFormat: 'indices',
      charset: 'utf-8',
      charsetSentinel: false,
      delimiter: '&',
      encode: true,
      encodeDotInKeys: false,
      encoder: utils.encode,
      encodeValuesOnly: false,
      format: defaultFormat,
      formatter: formats.formatters[defaultFormat],
      // deprecated
      indices: false,
      serializeDate: function serializeDate(date) {
          return toISO.call(date);
      },
      skipNulls: false,
      strictNullHandling: false
  };

  var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
      return typeof v === 'string'
          || typeof v === 'number'
          || typeof v === 'boolean'
          || typeof v === 'symbol'
          || typeof v === 'bigint';
  };

  var sentinel = {};

  var stringify = function stringify(
      object,
      prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      encoder,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      sideChannel$1
  ) {
      var obj = object;

      var tmpSc = sideChannel$1;
      var step = 0;
      var findFlag = false;
      while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
          // Where object last appeared in the ref tree
          var pos = tmpSc.get(object);
          step += 1;
          if (typeof pos !== 'undefined') {
              if (pos === step) {
                  throw new RangeError('Cyclic object value');
              } else {
                  findFlag = true; // Break while
              }
          }
          if (typeof tmpSc.get(sentinel) === 'undefined') {
              step = 0;
          }
      }

      if (typeof filter === 'function') {
          obj = filter(prefix, obj);
      } else if (obj instanceof Date) {
          obj = serializeDate(obj);
      } else if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
          obj = utils.maybeMap(obj, function (value) {
              if (value instanceof Date) {
                  return serializeDate(value);
              }
              return value;
          });
      }

      if (obj === null) {
          if (strictNullHandling) {
              return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
          }

          obj = '';
      }

      if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
          if (encoder) {
              var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
              return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
          }
          return [formatter(prefix) + '=' + formatter(String(obj))];
      }

      var values = [];

      if (typeof obj === 'undefined') {
          return values;
      }

      var objKeys;
      if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
          // we need to join elements in
          if (encodeValuesOnly && encoder) {
              obj = utils.maybeMap(obj, encoder);
          }
          objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
      } else if (isArray$3(filter)) {
          objKeys = filter;
      } else {
          var keys = Object.keys(obj);
          objKeys = sort ? keys.sort(sort) : keys;
      }

      var encodedPrefix = encodeDotInKeys ? prefix.replace(/\./g, '%2E') : prefix;

      var adjustedPrefix = commaRoundTrip && isArray$3(obj) && obj.length === 1 ? encodedPrefix + '[]' : encodedPrefix;

      if (allowEmptyArrays && isArray$3(obj) && obj.length === 0) {
          return adjustedPrefix + '[]';
      }

      for (var j = 0; j < objKeys.length; ++j) {
          var key = objKeys[j];
          var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

          if (skipNulls && value === null) {
              continue;
          }

          var encodedKey = allowDots && encodeDotInKeys ? key.replace(/\./g, '%2E') : key;
          var keyPrefix = isArray$3(obj)
              ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, encodedKey) : adjustedPrefix
              : adjustedPrefix + (allowDots ? '.' + encodedKey : '[' + encodedKey + ']');

          sideChannel$1.set(object, step);
          var valueSideChannel = sideChannel();
          valueSideChannel.set(sentinel, sideChannel$1);
          pushToArray(values, stringify(
              value,
              keyPrefix,
              generateArrayPrefix,
              commaRoundTrip,
              allowEmptyArrays,
              strictNullHandling,
              skipNulls,
              encodeDotInKeys,
              generateArrayPrefix === 'comma' && encodeValuesOnly && isArray$3(obj) ? null : encoder,
              filter,
              sort,
              allowDots,
              serializeDate,
              format,
              formatter,
              encodeValuesOnly,
              charset,
              valueSideChannel
          ));
      }

      return values;
  };

  var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
      if (!opts) {
          return defaults;
      }

      if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
          throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
      }

      if (typeof opts.encodeDotInKeys !== 'undefined' && typeof opts.encodeDotInKeys !== 'boolean') {
          throw new TypeError('`encodeDotInKeys` option can only be `true` or `false`, when provided');
      }

      if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
          throw new TypeError('Encoder has to be a function.');
      }

      var charset = opts.charset || defaults.charset;
      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }

      var format = formats['default'];
      if (typeof opts.format !== 'undefined') {
          if (!has$2.call(formats.formatters, opts.format)) {
              throw new TypeError('Unknown format option provided.');
          }
          format = opts.format;
      }
      var formatter = formats.formatters[format];

      var filter = defaults.filter;
      if (typeof opts.filter === 'function' || isArray$3(opts.filter)) {
          filter = opts.filter;
      }

      var arrayFormat;
      if (opts.arrayFormat in arrayPrefixGenerators) {
          arrayFormat = opts.arrayFormat;
      } else if ('indices' in opts) {
          arrayFormat = opts.indices ? 'indices' : 'repeat';
      } else {
          arrayFormat = defaults.arrayFormat;
      }

      if ('commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
          throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
      }

      var allowDots = typeof opts.allowDots === 'undefined' ? opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;

      return {
          addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
          allowDots: allowDots,
          allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
          arrayFormat: arrayFormat,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
          commaRoundTrip: opts.commaRoundTrip,
          delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
          encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
          encodeDotInKeys: typeof opts.encodeDotInKeys === 'boolean' ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
          encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
          encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
          filter: filter,
          format: format,
          formatter: formatter,
          serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
          skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
          sort: typeof opts.sort === 'function' ? opts.sort : null,
          strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
      };
  };

  var stringify_1 = function (object, opts) {
      var obj = object;
      var options = normalizeStringifyOptions(opts);

      var objKeys;
      var filter;

      if (typeof options.filter === 'function') {
          filter = options.filter;
          obj = filter('', obj);
      } else if (isArray$3(options.filter)) {
          filter = options.filter;
          objKeys = filter;
      }

      var keys = [];

      if (typeof obj !== 'object' || obj === null) {
          return '';
      }

      var generateArrayPrefix = arrayPrefixGenerators[options.arrayFormat];
      var commaRoundTrip = generateArrayPrefix === 'comma' && options.commaRoundTrip;

      if (!objKeys) {
          objKeys = Object.keys(obj);
      }

      if (options.sort) {
          objKeys.sort(options.sort);
      }

      var sideChannel$1 = sideChannel();
      for (var i = 0; i < objKeys.length; ++i) {
          var key = objKeys[i];

          if (options.skipNulls && obj[key] === null) {
              continue;
          }
          pushToArray(keys, stringify(
              obj[key],
              key,
              generateArrayPrefix,
              commaRoundTrip,
              options.allowEmptyArrays,
              options.strictNullHandling,
              options.skipNulls,
              options.encodeDotInKeys,
              options.encode ? options.encoder : null,
              options.filter,
              options.sort,
              options.allowDots,
              options.serializeDate,
              options.format,
              options.formatter,
              options.encodeValuesOnly,
              options.charset,
              sideChannel$1
          ));
      }

      var joined = keys.join(options.delimiter);
      var prefix = options.addQueryPrefix === true ? '?' : '';

      if (options.charsetSentinel) {
          if (options.charset === 'iso-8859-1') {
              // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
              prefix += 'utf8=%26%2310003%3B&';
          } else {
              // encodeURIComponent('✓')
              prefix += 'utf8=%E2%9C%93&';
          }
      }

      return joined.length > 0 ? prefix + joined : '';
  };

  var has$3 = Object.prototype.hasOwnProperty;
  var isArray$4 = Array.isArray;

  var defaults$1 = {
      allowDots: false,
      allowEmptyArrays: false,
      allowPrototypes: false,
      allowSparse: false,
      arrayLimit: 20,
      charset: 'utf-8',
      charsetSentinel: false,
      comma: false,
      decodeDotInKeys: false,
      decoder: utils.decode,
      delimiter: '&',
      depth: 5,
      duplicates: 'combine',
      ignoreQueryPrefix: false,
      interpretNumericEntities: false,
      parameterLimit: 1000,
      parseArrays: true,
      plainObjects: false,
      strictNullHandling: false
  };

  var interpretNumericEntities = function (str) {
      return str.replace(/&#(\d+);/g, function ($0, numberStr) {
          return String.fromCharCode(parseInt(numberStr, 10));
      });
  };

  var parseArrayValue = function (val, options) {
      if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
          return val.split(',');
      }

      return val;
  };

  // This is what browsers will submit when the ✓ character occurs in an
  // application/x-www-form-urlencoded body and the encoding of the page containing
  // the form is iso-8859-1, or when the submitted form has an accept-charset
  // attribute of iso-8859-1. Presumably also with other charsets that do not contain
  // the ✓ character, such as us-ascii.
  var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

  // These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
  var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

  var parseValues = function parseQueryStringValues(str, options) {
      var obj = { __proto__: null };

      var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
      cleanStr = cleanStr.replace(/%5B/gi, '[').replace(/%5D/gi, ']');
      var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
      var parts = cleanStr.split(options.delimiter, limit);
      var skipIndex = -1; // Keep track of where the utf8 sentinel was found
      var i;

      var charset = options.charset;
      if (options.charsetSentinel) {
          for (i = 0; i < parts.length; ++i) {
              if (parts[i].indexOf('utf8=') === 0) {
                  if (parts[i] === charsetSentinel) {
                      charset = 'utf-8';
                  } else if (parts[i] === isoSentinel) {
                      charset = 'iso-8859-1';
                  }
                  skipIndex = i;
                  i = parts.length; // The eslint settings do not allow break;
              }
          }
      }

      for (i = 0; i < parts.length; ++i) {
          if (i === skipIndex) {
              continue;
          }
          var part = parts[i];

          var bracketEqualsPos = part.indexOf(']=');
          var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

          var key, val;
          if (pos === -1) {
              key = options.decoder(part, defaults$1.decoder, charset, 'key');
              val = options.strictNullHandling ? null : '';
          } else {
              key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset, 'key');
              val = utils.maybeMap(
                  parseArrayValue(part.slice(pos + 1), options),
                  function (encodedVal) {
                      return options.decoder(encodedVal, defaults$1.decoder, charset, 'value');
                  }
              );
          }

          if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
              val = interpretNumericEntities(val);
          }

          if (part.indexOf('[]=') > -1) {
              val = isArray$4(val) ? [val] : val;
          }

          var existing = has$3.call(obj, key);
          if (existing && options.duplicates === 'combine') {
              obj[key] = utils.combine(obj[key], val);
          } else if (!existing || options.duplicates === 'last') {
              obj[key] = val;
          }
      }

      return obj;
  };

  var parseObject = function (chain, val, options, valuesParsed) {
      var leaf = valuesParsed ? val : parseArrayValue(val, options);

      for (var i = chain.length - 1; i >= 0; --i) {
          var obj;
          var root = chain[i];

          if (root === '[]' && options.parseArrays) {
              obj = options.allowEmptyArrays && leaf === '' ? [] : [].concat(leaf);
          } else {
              obj = options.plainObjects ? Object.create(null) : {};
              var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
              var decodedRoot = options.decodeDotInKeys ? cleanRoot.replace(/%2E/g, '.') : cleanRoot;
              var index = parseInt(decodedRoot, 10);
              if (!options.parseArrays && decodedRoot === '') {
                  obj = { 0: leaf };
              } else if (
                  !isNaN(index)
                  && root !== decodedRoot
                  && String(index) === decodedRoot
                  && index >= 0
                  && (options.parseArrays && index <= options.arrayLimit)
              ) {
                  obj = [];
                  obj[index] = leaf;
              } else if (decodedRoot !== '__proto__') {
                  obj[decodedRoot] = leaf;
              }
          }

          leaf = obj;
      }

      return leaf;
  };

  var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
      if (!givenKey) {
          return;
      }

      // Transform dot notation to bracket notation
      var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

      // The regex chunks

      var brackets = /(\[[^[\]]*])/;
      var child = /(\[[^[\]]*])/g;

      // Get the parent

      var segment = options.depth > 0 && brackets.exec(key);
      var parent = segment ? key.slice(0, segment.index) : key;

      // Stash the parent if it exists

      var keys = [];
      if (parent) {
          // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
          if (!options.plainObjects && has$3.call(Object.prototype, parent)) {
              if (!options.allowPrototypes) {
                  return;
              }
          }

          keys.push(parent);
      }

      // Loop through children appending to the array until we hit depth

      var i = 0;
      while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
          i += 1;
          if (!options.plainObjects && has$3.call(Object.prototype, segment[1].slice(1, -1))) {
              if (!options.allowPrototypes) {
                  return;
              }
          }
          keys.push(segment[1]);
      }

      // If there's a remainder, just add whatever is left

      if (segment) {
          keys.push('[' + key.slice(segment.index) + ']');
      }

      return parseObject(keys, val, options, valuesParsed);
  };

  var normalizeParseOptions = function normalizeParseOptions(opts) {
      if (!opts) {
          return defaults$1;
      }

      if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
          throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
      }

      if (typeof opts.decodeDotInKeys !== 'undefined' && typeof opts.decodeDotInKeys !== 'boolean') {
          throw new TypeError('`decodeDotInKeys` option can only be `true` or `false`, when provided');
      }

      if (opts.decoder !== null && typeof opts.decoder !== 'undefined' && typeof opts.decoder !== 'function') {
          throw new TypeError('Decoder has to be a function.');
      }

      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }
      var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;

      var duplicates = typeof opts.duplicates === 'undefined' ? defaults$1.duplicates : opts.duplicates;

      if (duplicates !== 'combine' && duplicates !== 'first' && duplicates !== 'last') {
          throw new TypeError('The duplicates option must be either combine, first, or last');
      }

      var allowDots = typeof opts.allowDots === 'undefined' ? opts.decodeDotInKeys === true ? true : defaults$1.allowDots : !!opts.allowDots;

      return {
          allowDots: allowDots,
          allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults$1.allowEmptyArrays,
          allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
          allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults$1.allowSparse,
          arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
          comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
          decodeDotInKeys: typeof opts.decodeDotInKeys === 'boolean' ? opts.decodeDotInKeys : defaults$1.decodeDotInKeys,
          decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
          delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
          // eslint-disable-next-line no-implicit-coercion, no-extra-parens
          depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults$1.depth,
          duplicates: duplicates,
          ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
          interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$1.interpretNumericEntities,
          parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$1.parameterLimit,
          parseArrays: opts.parseArrays !== false,
          plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$1.plainObjects,
          strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
      };
  };

  var parse = function (str, opts) {
      var options = normalizeParseOptions(opts);

      if (str === '' || str === null || typeof str === 'undefined') {
          return options.plainObjects ? Object.create(null) : {};
      }

      var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
      var obj = options.plainObjects ? Object.create(null) : {};

      // Iterate over the keys and setup the new object

      var keys = Object.keys(tempObj);
      for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
          obj = utils.merge(obj, newObj, options);
      }

      if (options.allowSparse === true) {
          return obj;
      }

      return utils.compact(obj);
  };

  var lib = {
      formats: formats,
      parse: parse,
      stringify: stringify_1
  };

  function PopupHandler(webAuth) {
    this.webAuth = webAuth;
    this._current_popup = null;
    this.options = null;
  }

  PopupHandler.prototype.preload = function(options) {
    var _this = this;
    var _window = windowHandler.getWindow();

    var url = options.url || 'about:blank';
    var popupOptions = options.popupOptions || {};

    popupOptions.location = 'yes';
    delete popupOptions.width;
    delete popupOptions.height;

    var windowFeatures = lib.stringify(popupOptions, {
      encode: false,
      delimiter: ','
    });

    if (this._current_popup && !this._current_popup.closed) {
      return this._current_popup;
    }

    this._current_popup = _window.open(url, '_blank', windowFeatures);

    this._current_popup.kill = function(success) {
      _this._current_popup.success = success;
      this.close();
      _this._current_popup = null;
    };

    return this._current_popup;
  };

  PopupHandler.prototype.load = function(url, _, options, cb) {
    var _this = this;
    this.url = url;
    this.options = options;
    if (!this._current_popup) {
      options.url = url;
      this.preload(options);
    } else {
      this._current_popup.location.href = url;
    }

    this.transientErrorHandler = function(event) {
      _this.errorHandler(event, cb);
    };

    this.transientStartHandler = function(event) {
      _this.startHandler(event, cb);
    };

    this.transientExitHandler = function() {
      _this.exitHandler(cb);
    };

    this._current_popup.addEventListener('loaderror', this.transientErrorHandler);
    this._current_popup.addEventListener('loadstart', this.transientStartHandler);
    this._current_popup.addEventListener('exit', this.transientExitHandler);
  };

  PopupHandler.prototype.errorHandler = function(event, cb) {
    if (!this._current_popup) {
      return;
    }

    this._current_popup.kill(true);

    cb({ error: 'window_error', errorDescription: event.message });
  };

  PopupHandler.prototype.unhook = function() {
    this._current_popup.removeEventListener(
      'loaderror',
      this.transientErrorHandler
    );
    this._current_popup.removeEventListener(
      'loadstart',
      this.transientStartHandler
    );
    this._current_popup.removeEventListener('exit', this.transientExitHandler);
  };

  PopupHandler.prototype.exitHandler = function(cb) {
    if (!this._current_popup) {
      return;
    }

    // when the modal is closed, this event is called which ends up removing the
    // event listeners. If you move this before closing the modal, it will add ~1 sec
    // delay between the user being redirected to the callback and the popup gets closed.
    this.unhook();

    if (!this._current_popup.success) {
      cb({ error: 'window_closed', errorDescription: 'Browser window closed' });
    }
  };

  PopupHandler.prototype.startHandler = function(event, cb) {
    var _this = this;

    if (!this._current_popup) {
      return;
    }

    var callbackUrl = urlJoin(
      'https:',
      this.webAuth.baseOptions.domain,
      '/mobile'
    );

    if (event.url && !(event.url.indexOf(callbackUrl + '#') === 0)) {
      return;
    }

    var parts = event.url.split('#');

    if (parts.length === 1) {
      return;
    }

    var opts = { hash: parts.pop() };

    if (this.options.nonce) {
      opts.nonce = this.options.nonce;
    }

    this.webAuth.parseHash(opts, function(error, result) {
      if (error || result) {
        _this._current_popup.kill(true);
        cb(error, result);
      }
    });
  };

  function PluginHandler(webAuth) {
    this.webAuth = webAuth;
  }

  PluginHandler.prototype.processParams = function(params) {
    params.redirectUri = urlJoin('https://' + params.domain, 'mobile');
    delete params.owp;
    return params;
  };

  PluginHandler.prototype.getPopupHandler = function() {
    return new PopupHandler(this.webAuth);
  };

  function CordovaPlugin() {
    this.webAuth = null;
    this.version = version.raw;
    this.extensibilityPoints = ['popup.authorize', 'popup.getPopupHandler'];
  }

  CordovaPlugin.prototype.setWebAuth = function(webAuth) {
    this.webAuth = webAuth;
  };

  CordovaPlugin.prototype.supports = function(extensibilityPoint) {
    var _window = windowHandler.getWindow();
    return (
      (!!_window.cordova || !!_window.electron) &&
      this.extensibilityPoints.indexOf(extensibilityPoint) > -1
    );
  };

  CordovaPlugin.prototype.init = function() {
    return new PluginHandler(this.webAuth);
  };

  return CordovaPlugin;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZG92YS1hdXRoMC1wbHVnaW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy92ZXJzaW9uLmpzIiwiLi4vc3JjL2hlbHBlci9hc3NlcnQuanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC1hc3NpZ24uanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC5qcyIsIi4uL3NyYy9oZWxwZXIvd2luZG93LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3VybC1qb2luL2xpYi91cmwtam9pbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9lcy1lcnJvcnMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZXMtZXJyb3JzL2V2YWwuanMiLCIuLi9ub2RlX21vZHVsZXMvZXMtZXJyb3JzL3JhbmdlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzLWVycm9ycy9yZWYuanMiLCIuLi9ub2RlX21vZHVsZXMvZXMtZXJyb3JzL3N5bnRheC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lcy1lcnJvcnMvdHlwZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9lcy1lcnJvcnMvdXJpLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2hhcy1zeW1ib2xzL3NoYW1zLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2hhcy1zeW1ib2xzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2hhcy1wcm90by9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9mdW5jdGlvbi1iaW5kL2ltcGxlbWVudGF0aW9uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Z1bmN0aW9uLWJpbmQvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvaGFzb3duL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2dldC1pbnRyaW5zaWMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZXMtZGVmaW5lLXByb3BlcnR5L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2dvcGQvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZGVmaW5lLWRhdGEtcHJvcGVydHkvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvaGFzLXByb3BlcnR5LWRlc2NyaXB0b3JzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NldC1mdW5jdGlvbi1sZW5ndGgvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvY2FsbC1iaW5kL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NhbGwtYmluZC9jYWxsQm91bmQuanMiLCIuLi9ub2RlX21vZHVsZXMvb2JqZWN0LWluc3BlY3QvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvc2lkZS1jaGFubmVsL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi9mb3JtYXRzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi91dGlscy5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvc3RyaW5naWZ5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi9wYXJzZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvaW5kZXguanMiLCIuLi9wbHVnaW5zL2NvcmRvdmEvcG9wdXAtaGFuZGxlci5qcyIsIi4uL3BsdWdpbnMvY29yZG92YS9wbHVnaW4taGFuZGxlci5qcyIsIi4uL3BsdWdpbnMvY29yZG92YS9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHsgcmF3OiAnOS4yNi4xJyB9O1xuIiwidmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZnVuY3Rpb24gYXR0cmlidXRlKG8sIGF0dHIsIHR5cGUsIHRleHQpIHtcbiAgdHlwZSA9IHR5cGUgPT09ICdhcnJheScgPyAnb2JqZWN0JyA6IHR5cGU7XG4gIGlmIChvICYmIHR5cGVvZiBvW2F0dHJdICE9PSB0eXBlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRleHQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhcmlhYmxlKG8sIHR5cGUsIHRleHQpIHtcbiAgaWYgKHR5cGVvZiBvICE9PSB0eXBlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRleHQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlKG8sIHZhbHVlcywgdGV4dCkge1xuICBpZiAodmFsdWVzLmluZGV4T2YobykgPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRleHQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrKG8sIGNvbmZpZywgYXR0cmlidXRlcykge1xuICBpZiAoIWNvbmZpZy5vcHRpb25hbCB8fCBvKSB7XG4gICAgdmFyaWFibGUobywgY29uZmlnLnR5cGUsIGNvbmZpZy5tZXNzYWdlKTtcbiAgfVxuICBpZiAoY29uZmlnLnR5cGUgPT09ICdvYmplY3QnICYmIGF0dHJpYnV0ZXMpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpO1xuXG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGtleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgYSA9IGtleXNbaW5kZXhdO1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzW2FdLm9wdGlvbmFsIHx8IG9bYV0pIHtcbiAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2FdLmNvbmRpdGlvbiB8fCBhdHRyaWJ1dGVzW2FdLmNvbmRpdGlvbihvKSkge1xuICAgICAgICAgIGF0dHJpYnV0ZShvLCBhLCBhdHRyaWJ1dGVzW2FdLnR5cGUsIGF0dHJpYnV0ZXNbYV0ubWVzc2FnZSk7XG4gICAgICAgICAgaWYgKGF0dHJpYnV0ZXNbYV0udmFsdWVzKSB7XG4gICAgICAgICAgICB2YWx1ZShvW2FdLCBhdHRyaWJ1dGVzW2FdLnZhbHVlcywgYXR0cmlidXRlc1thXS52YWx1ZV9tZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwIGBBcnJheS5pc0FycmF5YCBQb2x5ZmlsbCBmb3IgSUU5XG4gKiBzb3VyY2U6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2lzQXJyYXlcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaXNBcnJheShhcnJheSkge1xuICBpZiAodGhpcy5zdXBwb3J0c0lzQXJyYXkoKSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFycmF5KTtcbiAgfVxuXG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGFycmF5KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuZnVuY3Rpb24gc3VwcG9ydHNJc0FycmF5KCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSAhPSBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNoZWNrOiBjaGVjayxcbiAgYXR0cmlidXRlOiBhdHRyaWJ1dGUsXG4gIHZhcmlhYmxlOiB2YXJpYWJsZSxcbiAgdmFsdWU6IHZhbHVlLFxuICBpc0FycmF5OiBpc0FycmF5LFxuICBzdXBwb3J0c0lzQXJyYXk6IHN1cHBvcnRzSXNBcnJheVxufTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnRpbnVlICovXG5cbmZ1bmN0aW9uIGdldCgpIHtcbiAgaWYgKCFPYmplY3QuYXNzaWduKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnblBvbHlmaWxsO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5hc3NpZ247XG59XG5cbmZ1bmN0aW9uIG9iamVjdEFzc2lnblBvbHlmaWxsKHRhcmdldCkge1xuICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgZmlyc3QgYXJndW1lbnQgdG8gb2JqZWN0Jyk7XG4gIH1cblxuICB2YXIgdG8gPSBPYmplY3QodGFyZ2V0KTtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAobmV4dFNvdXJjZSA9PT0gdW5kZWZpbmVkIHx8IG5leHRTb3VyY2UgPT09IG51bGwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHZhciBrZXlzQXJyYXkgPSBPYmplY3Qua2V5cyhPYmplY3QobmV4dFNvdXJjZSkpO1xuICAgIGZvciAoXG4gICAgICB2YXIgbmV4dEluZGV4ID0gMCwgbGVuID0ga2V5c0FycmF5Lmxlbmd0aDtcbiAgICAgIG5leHRJbmRleCA8IGxlbjtcbiAgICAgIG5leHRJbmRleCsrXG4gICAgKSB7XG4gICAgICB2YXIgbmV4dEtleSA9IGtleXNBcnJheVtuZXh0SW5kZXhdO1xuICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG5leHRTb3VyY2UsIG5leHRLZXkpO1xuICAgICAgaWYgKGRlc2MgIT09IHVuZGVmaW5lZCAmJiBkZXNjLmVudW1lcmFibGUpIHtcbiAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdG87XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZ2V0OiBnZXQsXG4gIG9iamVjdEFzc2lnblBvbHlmaWxsOiBvYmplY3RBc3NpZ25Qb2x5ZmlsbFxufTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1yZXN0cmljdGVkLXN5bnRheCAqL1xuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IG9iamVjdEFzc2lnbiBmcm9tICcuL29iamVjdC1hc3NpZ24nO1xuXG5mdW5jdGlvbiBwaWNrKG9iamVjdCwga2V5cykge1xuICByZXR1cm4ga2V5cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwga2V5KSB7XG4gICAgaWYgKG9iamVjdFtrZXldKSB7XG4gICAgICBwcmV2W2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gZ2V0S2V5c05vdEluKG9iaiwgYWxsb3dlZEtleXMpIHtcbiAgdmFyIG5vdEFsbG93ZWQgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChhbGxvd2VkS2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICBub3RBbGxvd2VkLnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vdEFsbG93ZWQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFZhbHVlcyhvYmopIHtcbiAgdmFyIHZhbHVlcyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFsdWVzLnB1c2gob2JqW2tleV0pO1xuICB9XG4gIHJldHVybiB2YWx1ZXM7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgdmFyIHBhcmFtcyA9IG9iamVjdFZhbHVlcyhhcmd1bWVudHMpO1xuICBwYXJhbXMudW5zaGlmdCh7fSk7XG4gIHJldHVybiBvYmplY3RBc3NpZ24uZ2V0KCkuYXBwbHkodW5kZWZpbmVkLCBwYXJhbXMpO1xufVxuXG5mdW5jdGlvbiBtZXJnZShvYmplY3QsIGtleXMpIHtcbiAgcmV0dXJuIHtcbiAgICBiYXNlOiBrZXlzID8gcGljayhvYmplY3QsIGtleXMpIDogb2JqZWN0LFxuICAgIHdpdGg6IGZ1bmN0aW9uKG9iamVjdDIsIGtleXMyKSB7XG4gICAgICBvYmplY3QyID0ga2V5czIgPyBwaWNrKG9iamVjdDIsIGtleXMyKSA6IG9iamVjdDI7XG4gICAgICByZXR1cm4gZXh0ZW5kKHRoaXMuYmFzZSwgb2JqZWN0Mik7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBibGFja2xpc3Qob2JqZWN0LCBibGFja2xpc3RlZEtleXMpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkucmVkdWNlKGZ1bmN0aW9uKHAsIGtleSkge1xuICAgIGlmIChibGFja2xpc3RlZEtleXMuaW5kZXhPZihrZXkpID09PSAtMSkge1xuICAgICAgcFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGNhbWVsVG9TbmFrZShzdHIpIHtcbiAgdmFyIG5ld0tleSA9ICcnO1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgY29kZTtcbiAgdmFyIHdhc1ByZXZOdW1iZXIgPSB0cnVlO1xuICB2YXIgd2FzUHJldlVwcGVyY2FzZSA9IHRydWU7XG5cbiAgd2hpbGUgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIGNvZGUgPSBzdHIuY2hhckNvZGVBdChpbmRleCk7XG4gICAgaWYgKFxuICAgICAgKCF3YXNQcmV2VXBwZXJjYXNlICYmIGNvZGUgPj0gNjUgJiYgY29kZSA8PSA5MCkgfHxcbiAgICAgICghd2FzUHJldk51bWJlciAmJiBjb2RlID49IDQ4ICYmIGNvZGUgPD0gNTcpXG4gICAgKSB7XG4gICAgICBuZXdLZXkgKz0gJ18nO1xuICAgICAgbmV3S2V5ICs9IHN0cltpbmRleF0udG9Mb3dlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3S2V5ICs9IHN0cltpbmRleF0udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgd2FzUHJldk51bWJlciA9IGNvZGUgPj0gNDggJiYgY29kZSA8PSA1NztcbiAgICB3YXNQcmV2VXBwZXJjYXNlID0gY29kZSA+PSA2NSAmJiBjb2RlIDw9IDkwO1xuICAgIGluZGV4Kys7XG4gIH1cblxuICByZXR1cm4gbmV3S2V5O1xufVxuXG5mdW5jdGlvbiBzbmFrZVRvQ2FtZWwoc3RyKSB7XG4gIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgnXycpO1xuICByZXR1cm4gcGFydHMucmVkdWNlKGZ1bmN0aW9uKHAsIGMpIHtcbiAgICByZXR1cm4gcCArIGMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjLnNsaWNlKDEpO1xuICB9LCBwYXJ0cy5zaGlmdCgpKTtcbn1cblxuZnVuY3Rpb24gdG9TbmFrZUNhc2Uob2JqZWN0LCBleGNlcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSAnb2JqZWN0JyB8fCBhc3NlcnQuaXNBcnJheShvYmplY3QpIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbiAgZXhjZXB0aW9ucyA9IGV4Y2VwdGlvbnMgfHwgW107XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkucmVkdWNlKGZ1bmN0aW9uKHAsIGtleSkge1xuICAgIHZhciBuZXdLZXkgPSBleGNlcHRpb25zLmluZGV4T2Yoa2V5KSA9PT0gLTEgPyBjYW1lbFRvU25ha2Uoa2V5KSA6IGtleTtcbiAgICBwW25ld0tleV0gPSB0b1NuYWtlQ2FzZShvYmplY3Rba2V5XSk7XG4gICAgcmV0dXJuIHA7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gdG9DYW1lbENhc2Uob2JqZWN0LCBleGNlcHRpb25zLCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSAnb2JqZWN0JyB8fCBhc3NlcnQuaXNBcnJheShvYmplY3QpIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBleGNlcHRpb25zID0gZXhjZXB0aW9ucyB8fCBbXTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLnJlZHVjZShmdW5jdGlvbihwLCBrZXkpIHtcbiAgICB2YXIgbmV3S2V5ID0gZXhjZXB0aW9ucy5pbmRleE9mKGtleSkgPT09IC0xID8gc25ha2VUb0NhbWVsKGtleSkgOiBrZXk7XG5cbiAgICBwW25ld0tleV0gPSB0b0NhbWVsQ2FzZShvYmplY3RbbmV3S2V5XSB8fCBvYmplY3Rba2V5XSwgW10sIG9wdGlvbnMpO1xuXG4gICAgaWYgKG9wdGlvbnMua2VlcE9yaWdpbmFsKSB7XG4gICAgICBwW2tleV0gPSB0b0NhbWVsQ2FzZShvYmplY3Rba2V5XSwgW10sIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSwge30pO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhdGlvbkZyb21VcmwoaHJlZikge1xuICB2YXIgbWF0Y2ggPSBocmVmLm1hdGNoKFxuICAgIC9eKGh0dHBzPzp8ZmlsZTp8Y2hyb21lLWV4dGVuc2lvbjopXFwvXFwvKChbXjovPyNdKikoPzo6KFswLTldKykpPykoWy9dezAsMX1bXj8jXSopKFxcP1teI10qfCkoIy4qfCkkL1xuICApO1xuICByZXR1cm4gKFxuICAgIG1hdGNoICYmIHtcbiAgICAgIGhyZWY6IGhyZWYsXG4gICAgICBwcm90b2NvbDogbWF0Y2hbMV0sXG4gICAgICBob3N0OiBtYXRjaFsyXSxcbiAgICAgIGhvc3RuYW1lOiBtYXRjaFszXSxcbiAgICAgIHBvcnQ6IG1hdGNoWzRdLFxuICAgICAgcGF0aG5hbWU6IG1hdGNoWzVdLFxuICAgICAgc2VhcmNoOiBtYXRjaFs2XSxcbiAgICAgIGhhc2g6IG1hdGNoWzddXG4gICAgfVxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRPcmlnaW5Gcm9tVXJsKHVybCkge1xuICBpZiAoIXVybCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgdmFyIHBhcnNlZCA9IGdldExvY2F0aW9uRnJvbVVybCh1cmwpO1xuICBpZiAoIXBhcnNlZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZhciBvcmlnaW4gPSBwYXJzZWQucHJvdG9jb2wgKyAnLy8nICsgcGFyc2VkLmhvc3RuYW1lO1xuICBpZiAocGFyc2VkLnBvcnQpIHtcbiAgICBvcmlnaW4gKz0gJzonICsgcGFyc2VkLnBvcnQ7XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn1cblxuZnVuY3Rpb24gdHJpbShvcHRpb25zLCBrZXkpIHtcbiAgdmFyIHRyaW1tZWQgPSBleHRlbmQob3B0aW9ucyk7XG4gIGlmIChvcHRpb25zW2tleV0pIHtcbiAgICB0cmltbWVkW2tleV0gPSBvcHRpb25zW2tleV0udHJpbSgpO1xuICB9XG4gIHJldHVybiB0cmltbWVkO1xufVxuXG5mdW5jdGlvbiB0cmltTXVsdGlwbGUob3B0aW9ucywga2V5cykge1xuICByZXR1cm4ga2V5cy5yZWR1Y2UodHJpbSwgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIHRyaW1Vc2VyRGV0YWlscyhvcHRpb25zKSB7XG4gIHJldHVybiB0cmltTXVsdGlwbGUob3B0aW9ucywgWyd1c2VybmFtZScsICdlbWFpbCcsICdwaG9uZU51bWJlciddKTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9uIHRoZSBnaXZlbiBvYmplY3QsIHVzaW5nIGEgZGVlcCBwYXRoIHNlbGVjdG9yLlxuICogQHBhcmFtIHtvYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHNldCB0aGUgcHJvcGVydHkgdmFsdWUgb25cbiAqIEBwYXJhbSB7c3RyaW5nfGFycmF5fSBwYXRoIFRoZSBwYXRoIHRvIHRoZSBwcm9wZXJ0eSB0aGF0IHNob3VsZCBoYXZlIGl0cyB2YWx1ZSB1cGRhdGVkLiBlLmcuICdwcm9wMS5wcm9wMi5wcm9wMycgb3IgWydwcm9wMScsICdwcm9wMicsICdwcm9wMyddXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldFxuICogQGlnbm9yZVxuICovXG5mdW5jdGlvbiB1cGRhdGVQcm9wZXJ0eU9uKG9iaiwgcGF0aCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgIHBhdGggPSBwYXRoLnNwbGl0KCcuJyk7XG4gIH1cblxuICB2YXIgbmV4dCA9IHBhdGhbMF07XG5cbiAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShuZXh0KSkge1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMSkge1xuICAgICAgb2JqW25leHRdID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVByb3BlcnR5T24ob2JqW25leHRdLCBwYXRoLnNsaWNlKDEpLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdG9TbmFrZUNhc2U6IHRvU25ha2VDYXNlLFxuICB0b0NhbWVsQ2FzZTogdG9DYW1lbENhc2UsXG4gIGJsYWNrbGlzdDogYmxhY2tsaXN0LFxuICBtZXJnZTogbWVyZ2UsXG4gIHBpY2s6IHBpY2ssXG4gIGdldEtleXNOb3RJbjogZ2V0S2V5c05vdEluLFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgZ2V0T3JpZ2luRnJvbVVybDogZ2V0T3JpZ2luRnJvbVVybCxcbiAgZ2V0TG9jYXRpb25Gcm9tVXJsOiBnZXRMb2NhdGlvbkZyb21VcmwsXG4gIHRyaW1Vc2VyRGV0YWlsczogdHJpbVVzZXJEZXRhaWxzLFxuICB1cGRhdGVQcm9wZXJ0eU9uOiB1cGRhdGVQcm9wZXJ0eU9uXG59O1xuIiwiaW1wb3J0IG9iamVjdEhlbHBlciBmcm9tICcuL29iamVjdCc7XG5cbmZ1bmN0aW9uIHJlZGlyZWN0KHVybCkge1xuICBnZXRXaW5kb3coKS5sb2NhdGlvbiA9IHVybDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jdW1lbnQoKSB7XG4gIHJldHVybiBnZXRXaW5kb3coKS5kb2N1bWVudDtcbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93KCkge1xuICByZXR1cm4gd2luZG93O1xufVxuXG5mdW5jdGlvbiBnZXRPcmlnaW4oKSB7XG4gIHZhciBsb2NhdGlvbiA9IGdldFdpbmRvdygpLmxvY2F0aW9uO1xuICB2YXIgb3JpZ2luID0gbG9jYXRpb24ub3JpZ2luO1xuXG4gIGlmICghb3JpZ2luKSB7XG4gICAgb3JpZ2luID0gb2JqZWN0SGVscGVyLmdldE9yaWdpbkZyb21VcmwobG9jYXRpb24uaHJlZik7XG4gIH1cblxuICByZXR1cm4gb3JpZ2luO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHJlZGlyZWN0OiByZWRpcmVjdCxcbiAgZ2V0RG9jdW1lbnQ6IGdldERvY3VtZW50LFxuICBnZXRXaW5kb3c6IGdldFdpbmRvdyxcbiAgZ2V0T3JpZ2luOiBnZXRPcmlnaW5cbn07XG4iLCIoZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZGVmaW5pdGlvbik7XG4gIGVsc2UgY29udGV4dFtuYW1lXSA9IGRlZmluaXRpb24oKTtcbn0pKCd1cmxqb2luJywgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZSAoc3RyQXJyYXkpIHtcbiAgICB2YXIgcmVzdWx0QXJyYXkgPSBbXTtcbiAgICBpZiAoc3RyQXJyYXkubGVuZ3RoID09PSAwKSB7IHJldHVybiAnJzsgfVxuXG4gICAgaWYgKHR5cGVvZiBzdHJBcnJheVswXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1VybCBtdXN0IGJlIGEgc3RyaW5nLiBSZWNlaXZlZCAnICsgc3RyQXJyYXlbMF0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBmaXJzdCBwYXJ0IGlzIGEgcGxhaW4gcHJvdG9jb2wsIHdlIGNvbWJpbmUgaXQgd2l0aCB0aGUgbmV4dCBwYXJ0LlxuICAgIGlmIChzdHJBcnJheVswXS5tYXRjaCgvXlteLzpdKzpcXC8qJC8pICYmIHN0ckFycmF5Lmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBmaXJzdCA9IHN0ckFycmF5LnNoaWZ0KCk7XG4gICAgICBzdHJBcnJheVswXSA9IGZpcnN0ICsgc3RyQXJyYXlbMF07XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgbXVzdCBiZSB0d28gb3IgdGhyZWUgc2xhc2hlcyBpbiB0aGUgZmlsZSBwcm90b2NvbCwgdHdvIHNsYXNoZXMgaW4gYW55dGhpbmcgZWxzZS5cbiAgICBpZiAoc3RyQXJyYXlbMF0ubWF0Y2goL15maWxlOlxcL1xcL1xcLy8pKSB7XG4gICAgICBzdHJBcnJheVswXSA9IHN0ckFycmF5WzBdLnJlcGxhY2UoL14oW14vOl0rKTpcXC8qLywgJyQxOi8vLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHJBcnJheVswXSA9IHN0ckFycmF5WzBdLnJlcGxhY2UoL14oW14vOl0rKTpcXC8qLywgJyQxOi8vJyk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvbXBvbmVudCA9IHN0ckFycmF5W2ldO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVXJsIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICcgKyBjb21wb25lbnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9uZW50ID09PSAnJykgeyBjb250aW51ZTsgfVxuXG4gICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgLy8gUmVtb3ZpbmcgdGhlIHN0YXJ0aW5nIHNsYXNoZXMgZm9yIGVhY2ggY29tcG9uZW50IGJ1dCB0aGUgZmlyc3QuXG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5yZXBsYWNlKC9eW1xcL10rLywgJycpO1xuICAgICAgfVxuICAgICAgaWYgKGkgPCBzdHJBcnJheS5sZW5ndGggLSAxKSB7XG4gICAgICAgIC8vIFJlbW92aW5nIHRoZSBlbmRpbmcgc2xhc2hlcyBmb3IgZWFjaCBjb21wb25lbnQgYnV0IHRoZSBsYXN0LlxuICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnQucmVwbGFjZSgvW1xcL10rJC8sICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZvciB0aGUgbGFzdCBjb21wb25lbnQgd2Ugd2lsbCBjb21iaW5lIG11bHRpcGxlIHNsYXNoZXMgdG8gYSBzaW5nbGUgb25lLlxuICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnQucmVwbGFjZSgvW1xcL10rJC8sICcvJyk7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdEFycmF5LnB1c2goY29tcG9uZW50KTtcblxuICAgIH1cblxuICAgIHZhciBzdHIgPSByZXN1bHRBcnJheS5qb2luKCcvJyk7XG4gICAgLy8gRWFjaCBpbnB1dCBjb21wb25lbnQgaXMgbm93IHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzbGFzaCBleGNlcHQgdGhlIHBvc3NpYmxlIGZpcnN0IHBsYWluIHByb3RvY29sIHBhcnQuXG5cbiAgICAvLyByZW1vdmUgdHJhaWxpbmcgc2xhc2ggYmVmb3JlIHBhcmFtZXRlcnMgb3IgaGFzaFxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXC8oXFw/fCZ8I1teIV0pL2csICckMScpO1xuXG4gICAgLy8gcmVwbGFjZSA/IGluIHBhcmFtZXRlcnMgd2l0aCAmXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KCc/Jyk7XG4gICAgc3RyID0gcGFydHMuc2hpZnQoKSArIChwYXJ0cy5sZW5ndGggPiAwID8gJz8nOiAnJykgKyBwYXJ0cy5qb2luKCcmJyk7XG5cbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQ7XG5cbiAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1swXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlucHV0ID0gYXJndW1lbnRzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dCA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplKGlucHV0KTtcbiAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuJyl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IEVycm9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi9ldmFsJyl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IEV2YWxFcnJvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4vcmFuZ2UnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gUmFuZ2VFcnJvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4vcmVmJyl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmVyZW5jZUVycm9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi9zeW50YXgnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gU3ludGF4RXJyb3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGUnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gVHlwZUVycm9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi91cmknKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gVVJJRXJyb3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludCBjb21wbGV4aXR5OiBbMiwgMThdLCBtYXgtc3RhdGVtZW50czogWzIsIDMzXSAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoYXNTeW1ib2xzKCkge1xuXHRpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAhPT0gJ2Z1bmN0aW9uJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09ICdzeW1ib2wnKSB7IHJldHVybiB0cnVlOyB9XG5cblx0dmFyIG9iaiA9IHt9O1xuXHR2YXIgc3ltID0gU3ltYm9sKCd0ZXN0Jyk7XG5cdHZhciBzeW1PYmogPSBPYmplY3Qoc3ltKTtcblx0aWYgKHR5cGVvZiBzeW0gPT09ICdzdHJpbmcnKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ltKSAhPT0gJ1tvYmplY3QgU3ltYm9sXScpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ltT2JqKSAhPT0gJ1tvYmplY3QgU3ltYm9sXScpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0Ly8gdGVtcCBkaXNhYmxlZCBwZXIgaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9vYmplY3QuYXNzaWduL2lzc3Vlcy8xN1xuXHQvLyBpZiAoc3ltIGluc3RhbmNlb2YgU3ltYm9sKSB7IHJldHVybiBmYWxzZTsgfVxuXHQvLyB0ZW1wIGRpc2FibGVkIHBlciBodHRwczovL2dpdGh1Yi5jb20vV2ViUmVmbGVjdGlvbi9nZXQtb3duLXByb3BlcnR5LXN5bWJvbHMvaXNzdWVzLzRcblx0Ly8gaWYgKCEoc3ltT2JqIGluc3RhbmNlb2YgU3ltYm9sKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHQvLyBpZiAodHlwZW9mIFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdC8vIGlmIChTdHJpbmcoc3ltKSAhPT0gU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN5bSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0dmFyIHN5bVZhbCA9IDQyO1xuXHRvYmpbc3ltXSA9IHN5bVZhbDtcblx0Zm9yIChzeW0gaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4LCBuby11bnJlYWNoYWJsZS1sb29wXG5cdGlmICh0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgJiYgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggIT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyA9PT0gJ2Z1bmN0aW9uJyAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmxlbmd0aCAhPT0gMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHR2YXIgc3ltcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqKTtcblx0aWYgKHN5bXMubGVuZ3RoICE9PSAxIHx8IHN5bXNbMF0gIT09IHN5bSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRpZiAoIU9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmosIHN5bSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0dmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgc3ltKTtcblx0XHRpZiAoZGVzY3JpcHRvci52YWx1ZSAhPT0gc3ltVmFsIHx8IGRlc2NyaXB0b3IuZW51bWVyYWJsZSAhPT0gdHJ1ZSkgeyByZXR1cm4gZmFsc2U7IH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9yaWdTeW1ib2wgPSB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2w7XG52YXIgaGFzU3ltYm9sU2hhbSA9IHJlcXVpcmUoJy4vc2hhbXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoYXNOYXRpdmVTeW1ib2xzKCkge1xuXHRpZiAodHlwZW9mIG9yaWdTeW1ib2wgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2YgU3ltYm9sICE9PSAnZnVuY3Rpb24nKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAodHlwZW9mIG9yaWdTeW1ib2woJ2ZvbycpICE9PSAnc3ltYm9sJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiBTeW1ib2woJ2JhcicpICE9PSAnc3ltYm9sJykgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRyZXR1cm4gaGFzU3ltYm9sU2hhbSgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRlc3QgPSB7XG5cdF9fcHJvdG9fXzogbnVsbCxcblx0Zm9vOiB7fVxufTtcblxudmFyICRPYmplY3QgPSBPYmplY3Q7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuJyl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhhc1Byb3RvKCkge1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yOiBUUyBlcnJvcnMgb24gYW4gaW5oZXJpdGVkIHByb3BlcnR5IGZvciBzb21lIHJlYXNvblxuXHRyZXR1cm4geyBfX3Byb3RvX186IHRlc3QgfS5mb28gPT09IHRlc3QuZm9vXG5cdFx0JiYgISh0ZXN0IGluc3RhbmNlb2YgJE9iamVjdCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQgbm8taW52YWxpZC10aGlzOiAxICovXG5cbnZhciBFUlJPUl9NRVNTQUdFID0gJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgJztcbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgbWF4ID0gTWF0aC5tYXg7XG52YXIgZnVuY1R5cGUgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXG52YXIgY29uY2F0dHkgPSBmdW5jdGlvbiBjb25jYXR0eShhLCBiKSB7XG4gICAgdmFyIGFyciA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycltpXSA9IGFbaV07XG4gICAgfVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICBhcnJbaiArIGEubGVuZ3RoXSA9IGJbal07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycjtcbn07XG5cbnZhciBzbGljeSA9IGZ1bmN0aW9uIHNsaWN5KGFyckxpa2UsIG9mZnNldCkge1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gb2Zmc2V0IHx8IDAsIGogPSAwOyBpIDwgYXJyTGlrZS5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICAgIGFycltqXSA9IGFyckxpa2VbaV07XG4gICAgfVxuICAgIHJldHVybiBhcnI7XG59O1xuXG52YXIgam9pbnkgPSBmdW5jdGlvbiAoYXJyLCBqb2luZXIpIHtcbiAgICB2YXIgc3RyID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGFycltpXTtcbiAgICAgICAgaWYgKGkgKyAxIDwgYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgc3RyICs9IGpvaW5lcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiaW5kKHRoYXQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcztcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJyB8fCB0b1N0ci5hcHBseSh0YXJnZXQpICE9PSBmdW5jVHlwZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEVSUk9SX01FU1NBR0UgKyB0YXJnZXQpO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IHNsaWN5KGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgYm91bmQ7XG4gICAgdmFyIGJpbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIGNvbmNhdHR5KGFyZ3MsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgIGNvbmNhdHR5KGFyZ3MsIGFyZ3VtZW50cylcbiAgICAgICAgKTtcblxuICAgIH07XG5cbiAgICB2YXIgYm91bmRMZW5ndGggPSBtYXgoMCwgdGFyZ2V0Lmxlbmd0aCAtIGFyZ3MubGVuZ3RoKTtcbiAgICB2YXIgYm91bmRBcmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib3VuZExlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJvdW5kQXJnc1tpXSA9ICckJyArIGk7XG4gICAgfVxuXG4gICAgYm91bmQgPSBGdW5jdGlvbignYmluZGVyJywgJ3JldHVybiBmdW5jdGlvbiAoJyArIGpvaW55KGJvdW5kQXJncywgJywnKSArICcpeyByZXR1cm4gYmluZGVyLmFwcGx5KHRoaXMsYXJndW1lbnRzKTsgfScpKGJpbmRlcik7XG5cbiAgICBpZiAodGFyZ2V0LnByb3RvdHlwZSkge1xuICAgICAgICB2YXIgRW1wdHkgPSBmdW5jdGlvbiBFbXB0eSgpIHt9O1xuICAgICAgICBFbXB0eS5wcm90b3R5cGUgPSB0YXJnZXQucHJvdG90eXBlO1xuICAgICAgICBib3VuZC5wcm90b3R5cGUgPSBuZXcgRW1wdHkoKTtcbiAgICAgICAgRW1wdHkucHJvdG90eXBlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYm91bmQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgfHwgaW1wbGVtZW50YXRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGw7XG52YXIgJGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgYmluZCA9IHJlcXVpcmUoJ2Z1bmN0aW9uLWJpbmQnKTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4nKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gYmluZC5jYWxsKGNhbGwsICRoYXNPd24pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdW5kZWZpbmVkO1xuXG52YXIgJEVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzJyk7XG52YXIgJEV2YWxFcnJvciA9IHJlcXVpcmUoJ2VzLWVycm9ycy9ldmFsJyk7XG52YXIgJFJhbmdlRXJyb3IgPSByZXF1aXJlKCdlcy1lcnJvcnMvcmFuZ2UnKTtcbnZhciAkUmVmZXJlbmNlRXJyb3IgPSByZXF1aXJlKCdlcy1lcnJvcnMvcmVmJyk7XG52YXIgJFN5bnRheEVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3N5bnRheCcpO1xudmFyICRUeXBlRXJyb3IgPSByZXF1aXJlKCdlcy1lcnJvcnMvdHlwZScpO1xudmFyICRVUklFcnJvciA9IHJlcXVpcmUoJ2VzLWVycm9ycy91cmknKTtcblxudmFyICRGdW5jdGlvbiA9IEZ1bmN0aW9uO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29uc2lzdGVudC1yZXR1cm5cbnZhciBnZXRFdmFsbGVkQ29uc3RydWN0b3IgPSBmdW5jdGlvbiAoZXhwcmVzc2lvblN5bnRheCkge1xuXHR0cnkge1xuXHRcdHJldHVybiAkRnVuY3Rpb24oJ1widXNlIHN0cmljdFwiOyByZXR1cm4gKCcgKyBleHByZXNzaW9uU3ludGF4ICsgJykuY29uc3RydWN0b3I7JykoKTtcblx0fSBjYXRjaCAoZSkge31cbn07XG5cbnZhciAkZ09QRCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG5pZiAoJGdPUEQpIHtcblx0dHJ5IHtcblx0XHQkZ09QRCh7fSwgJycpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0JGdPUEQgPSBudWxsOyAvLyB0aGlzIGlzIElFIDgsIHdoaWNoIGhhcyBhIGJyb2tlbiBnT1BEXG5cdH1cbn1cblxudmFyIHRocm93VHlwZUVycm9yID0gZnVuY3Rpb24gKCkge1xuXHR0aHJvdyBuZXcgJFR5cGVFcnJvcigpO1xufTtcbnZhciBUaHJvd1R5cGVFcnJvciA9ICRnT1BEXG5cdD8gKGZ1bmN0aW9uICgpIHtcblx0XHR0cnkge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tY2FsbGVyLCBuby1yZXN0cmljdGVkLXByb3BlcnRpZXNcblx0XHRcdGFyZ3VtZW50cy5jYWxsZWU7IC8vIElFIDggZG9lcyBub3QgdGhyb3cgaGVyZVxuXHRcdFx0cmV0dXJuIHRocm93VHlwZUVycm9yO1xuXHRcdH0gY2F0Y2ggKGNhbGxlZVRocm93cykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly8gSUUgOCB0aHJvd3Mgb24gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihhcmd1bWVudHMsICcnKVxuXHRcdFx0XHRyZXR1cm4gJGdPUEQoYXJndW1lbnRzLCAnY2FsbGVlJykuZ2V0O1xuXHRcdFx0fSBjYXRjaCAoZ09QRHRocm93cykge1xuXHRcdFx0XHRyZXR1cm4gdGhyb3dUeXBlRXJyb3I7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KCkpXG5cdDogdGhyb3dUeXBlRXJyb3I7XG5cbnZhciBoYXNTeW1ib2xzID0gcmVxdWlyZSgnaGFzLXN5bWJvbHMnKSgpO1xudmFyIGhhc1Byb3RvID0gcmVxdWlyZSgnaGFzLXByb3RvJykoKTtcblxudmFyIGdldFByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IChcblx0aGFzUHJvdG9cblx0XHQ/IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Ll9fcHJvdG9fXzsgfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXByb3RvXG5cdFx0OiBudWxsXG4pO1xuXG52YXIgbmVlZHNFdmFsID0ge307XG5cbnZhciBUeXBlZEFycmF5ID0gdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnIHx8ICFnZXRQcm90byA/IHVuZGVmaW5lZCA6IGdldFByb3RvKFVpbnQ4QXJyYXkpO1xuXG52YXIgSU5UUklOU0lDUyA9IHtcblx0X19wcm90b19fOiBudWxsLFxuXHQnJUFnZ3JlZ2F0ZUVycm9yJSc6IHR5cGVvZiBBZ2dyZWdhdGVFcnJvciA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBBZ2dyZWdhdGVFcnJvcixcblx0JyVBcnJheSUnOiBBcnJheSxcblx0JyVBcnJheUJ1ZmZlciUnOiB0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQXJyYXlCdWZmZXIsXG5cdCclQXJyYXlJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzICYmIGdldFByb3RvID8gZ2V0UHJvdG8oW11bU3ltYm9sLml0ZXJhdG9yXSgpKSA6IHVuZGVmaW5lZCxcblx0JyVBc3luY0Zyb21TeW5jSXRlcmF0b3JQcm90b3R5cGUlJzogdW5kZWZpbmVkLFxuXHQnJUFzeW5jRnVuY3Rpb24lJzogbmVlZHNFdmFsLFxuXHQnJUFzeW5jR2VuZXJhdG9yJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0l0ZXJhdG9yUHJvdG90eXBlJSc6IG5lZWRzRXZhbCxcblx0JyVBdG9taWNzJSc6IHR5cGVvZiBBdG9taWNzID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEF0b21pY3MsXG5cdCclQmlnSW50JSc6IHR5cGVvZiBCaWdJbnQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50LFxuXHQnJUJpZ0ludDY0QXJyYXklJzogdHlwZW9mIEJpZ0ludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50NjRBcnJheSxcblx0JyVCaWdVaW50NjRBcnJheSUnOiB0eXBlb2YgQmlnVWludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnVWludDY0QXJyYXksXG5cdCclQm9vbGVhbiUnOiBCb29sZWFuLFxuXHQnJURhdGFWaWV3JSc6IHR5cGVvZiBEYXRhVmlldyA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBEYXRhVmlldyxcblx0JyVEYXRlJSc6IERhdGUsXG5cdCclZGVjb2RlVVJJJSc6IGRlY29kZVVSSSxcblx0JyVkZWNvZGVVUklDb21wb25lbnQlJzogZGVjb2RlVVJJQ29tcG9uZW50LFxuXHQnJWVuY29kZVVSSSUnOiBlbmNvZGVVUkksXG5cdCclZW5jb2RlVVJJQ29tcG9uZW50JSc6IGVuY29kZVVSSUNvbXBvbmVudCxcblx0JyVFcnJvciUnOiAkRXJyb3IsXG5cdCclZXZhbCUnOiBldmFsLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV2YWxcblx0JyVFdmFsRXJyb3IlJzogJEV2YWxFcnJvcixcblx0JyVGbG9hdDMyQXJyYXklJzogdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBGbG9hdDMyQXJyYXksXG5cdCclRmxvYXQ2NEFycmF5JSc6IHR5cGVvZiBGbG9hdDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRmxvYXQ2NEFycmF5LFxuXHQnJUZpbmFsaXphdGlvblJlZ2lzdHJ5JSc6IHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBGaW5hbGl6YXRpb25SZWdpc3RyeSxcblx0JyVGdW5jdGlvbiUnOiAkRnVuY3Rpb24sXG5cdCclR2VuZXJhdG9yRnVuY3Rpb24lJzogbmVlZHNFdmFsLFxuXHQnJUludDhBcnJheSUnOiB0eXBlb2YgSW50OEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEludDhBcnJheSxcblx0JyVJbnQxNkFycmF5JSc6IHR5cGVvZiBJbnQxNkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEludDE2QXJyYXksXG5cdCclSW50MzJBcnJheSUnOiB0eXBlb2YgSW50MzJBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBJbnQzMkFycmF5LFxuXHQnJWlzRmluaXRlJSc6IGlzRmluaXRlLFxuXHQnJWlzTmFOJSc6IGlzTmFOLFxuXHQnJUl0ZXJhdG9yUHJvdG90eXBlJSc6IGhhc1N5bWJvbHMgJiYgZ2V0UHJvdG8gPyBnZXRQcm90byhnZXRQcm90byhbXVtTeW1ib2wuaXRlcmF0b3JdKCkpKSA6IHVuZGVmaW5lZCxcblx0JyVKU09OJSc6IHR5cGVvZiBKU09OID09PSAnb2JqZWN0JyA/IEpTT04gOiB1bmRlZmluZWQsXG5cdCclTWFwJSc6IHR5cGVvZiBNYXAgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogTWFwLFxuXHQnJU1hcEl0ZXJhdG9yUHJvdG90eXBlJSc6IHR5cGVvZiBNYXAgPT09ICd1bmRlZmluZWQnIHx8ICFoYXNTeW1ib2xzIHx8ICFnZXRQcm90byA/IHVuZGVmaW5lZCA6IGdldFByb3RvKG5ldyBNYXAoKVtTeW1ib2wuaXRlcmF0b3JdKCkpLFxuXHQnJU1hdGglJzogTWF0aCxcblx0JyVOdW1iZXIlJzogTnVtYmVyLFxuXHQnJU9iamVjdCUnOiBPYmplY3QsXG5cdCclcGFyc2VGbG9hdCUnOiBwYXJzZUZsb2F0LFxuXHQnJXBhcnNlSW50JSc6IHBhcnNlSW50LFxuXHQnJVByb21pc2UlJzogdHlwZW9mIFByb21pc2UgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogUHJvbWlzZSxcblx0JyVQcm94eSUnOiB0eXBlb2YgUHJveHkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogUHJveHksXG5cdCclUmFuZ2VFcnJvciUnOiAkUmFuZ2VFcnJvcixcblx0JyVSZWZlcmVuY2VFcnJvciUnOiAkUmVmZXJlbmNlRXJyb3IsXG5cdCclUmVmbGVjdCUnOiB0eXBlb2YgUmVmbGVjdCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBSZWZsZWN0LFxuXHQnJVJlZ0V4cCUnOiBSZWdFeHAsXG5cdCclU2V0JSc6IHR5cGVvZiBTZXQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogU2V0LFxuXHQnJVNldEl0ZXJhdG9yUHJvdG90eXBlJSc6IHR5cGVvZiBTZXQgPT09ICd1bmRlZmluZWQnIHx8ICFoYXNTeW1ib2xzIHx8ICFnZXRQcm90byA/IHVuZGVmaW5lZCA6IGdldFByb3RvKG5ldyBTZXQoKVtTeW1ib2wuaXRlcmF0b3JdKCkpLFxuXHQnJVNoYXJlZEFycmF5QnVmZmVyJSc6IHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBTaGFyZWRBcnJheUJ1ZmZlcixcblx0JyVTdHJpbmclJzogU3RyaW5nLFxuXHQnJVN0cmluZ0l0ZXJhdG9yUHJvdG90eXBlJSc6IGhhc1N5bWJvbHMgJiYgZ2V0UHJvdG8gPyBnZXRQcm90bygnJ1tTeW1ib2wuaXRlcmF0b3JdKCkpIDogdW5kZWZpbmVkLFxuXHQnJVN5bWJvbCUnOiBoYXNTeW1ib2xzID8gU3ltYm9sIDogdW5kZWZpbmVkLFxuXHQnJVN5bnRheEVycm9yJSc6ICRTeW50YXhFcnJvcixcblx0JyVUaHJvd1R5cGVFcnJvciUnOiBUaHJvd1R5cGVFcnJvcixcblx0JyVUeXBlZEFycmF5JSc6IFR5cGVkQXJyYXksXG5cdCclVHlwZUVycm9yJSc6ICRUeXBlRXJyb3IsXG5cdCclVWludDhBcnJheSUnOiB0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50OEFycmF5LFxuXHQnJVVpbnQ4Q2xhbXBlZEFycmF5JSc6IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50OENsYW1wZWRBcnJheSxcblx0JyVVaW50MTZBcnJheSUnOiB0eXBlb2YgVWludDE2QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogVWludDE2QXJyYXksXG5cdCclVWludDMyQXJyYXklJzogdHlwZW9mIFVpbnQzMkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFVpbnQzMkFycmF5LFxuXHQnJVVSSUVycm9yJSc6ICRVUklFcnJvcixcblx0JyVXZWFrTWFwJSc6IHR5cGVvZiBXZWFrTWFwID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFdlYWtNYXAsXG5cdCclV2Vha1JlZiUnOiB0eXBlb2YgV2Vha1JlZiA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBXZWFrUmVmLFxuXHQnJVdlYWtTZXQlJzogdHlwZW9mIFdlYWtTZXQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogV2Vha1NldFxufTtcblxuaWYgKGdldFByb3RvKSB7XG5cdHRyeSB7XG5cdFx0bnVsbC5lcnJvcjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnNcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L3Byb3Bvc2FsLXNoYWRvd3JlYWxtL3B1bGwvMzg0I2lzc3VlY29tbWVudC0xMzY0MjY0MjI5XG5cdFx0dmFyIGVycm9yUHJvdG8gPSBnZXRQcm90byhnZXRQcm90byhlKSk7XG5cdFx0SU5UUklOU0lDU1snJUVycm9yLnByb3RvdHlwZSUnXSA9IGVycm9yUHJvdG87XG5cdH1cbn1cblxudmFyIGRvRXZhbCA9IGZ1bmN0aW9uIGRvRXZhbChuYW1lKSB7XG5cdHZhciB2YWx1ZTtcblx0aWYgKG5hbWUgPT09ICclQXN5bmNGdW5jdGlvbiUnKSB7XG5cdFx0dmFsdWUgPSBnZXRFdmFsbGVkQ29uc3RydWN0b3IoJ2FzeW5jIGZ1bmN0aW9uICgpIHt9Jyk7XG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJyVHZW5lcmF0b3JGdW5jdGlvbiUnKSB7XG5cdFx0dmFsdWUgPSBnZXRFdmFsbGVkQ29uc3RydWN0b3IoJ2Z1bmN0aW9uKiAoKSB7fScpO1xuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclQXN5bmNHZW5lcmF0b3JGdW5jdGlvbiUnKSB7XG5cdFx0dmFsdWUgPSBnZXRFdmFsbGVkQ29uc3RydWN0b3IoJ2FzeW5jIGZ1bmN0aW9uKiAoKSB7fScpO1xuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclQXN5bmNHZW5lcmF0b3IlJykge1xuXHRcdHZhciBmbiA9IGRvRXZhbCgnJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lJyk7XG5cdFx0aWYgKGZuKSB7XG5cdFx0XHR2YWx1ZSA9IGZuLnByb3RvdHlwZTtcblx0XHR9XG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJyVBc3luY0l0ZXJhdG9yUHJvdG90eXBlJScpIHtcblx0XHR2YXIgZ2VuID0gZG9FdmFsKCclQXN5bmNHZW5lcmF0b3IlJyk7XG5cdFx0aWYgKGdlbiAmJiBnZXRQcm90bykge1xuXHRcdFx0dmFsdWUgPSBnZXRQcm90byhnZW4ucHJvdG90eXBlKTtcblx0XHR9XG5cdH1cblxuXHRJTlRSSU5TSUNTW25hbWVdID0gdmFsdWU7XG5cblx0cmV0dXJuIHZhbHVlO1xufTtcblxudmFyIExFR0FDWV9BTElBU0VTID0ge1xuXHRfX3Byb3RvX186IG51bGwsXG5cdCclQXJyYXlCdWZmZXJQcm90b3R5cGUlJzogWydBcnJheUJ1ZmZlcicsICdwcm90b3R5cGUnXSxcblx0JyVBcnJheVByb3RvdHlwZSUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUFycmF5UHJvdG9fZW50cmllcyUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZScsICdlbnRyaWVzJ10sXG5cdCclQXJyYXlQcm90b19mb3JFYWNoJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ2ZvckVhY2gnXSxcblx0JyVBcnJheVByb3RvX2tleXMlJzogWydBcnJheScsICdwcm90b3R5cGUnLCAna2V5cyddLFxuXHQnJUFycmF5UHJvdG9fdmFsdWVzJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ3ZhbHVlcyddLFxuXHQnJUFzeW5jRnVuY3Rpb25Qcm90b3R5cGUlJzogWydBc3luY0Z1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFzeW5jR2VuZXJhdG9yJSc6IFsnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICdwcm90b3R5cGUnXSxcblx0JyVBc3luY0dlbmVyYXRvclByb3RvdHlwZSUnOiBbJ0FzeW5jR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJywgJ3Byb3RvdHlwZSddLFxuXHQnJUJvb2xlYW5Qcm90b3R5cGUlJzogWydCb29sZWFuJywgJ3Byb3RvdHlwZSddLFxuXHQnJURhdGFWaWV3UHJvdG90eXBlJSc6IFsnRGF0YVZpZXcnLCAncHJvdG90eXBlJ10sXG5cdCclRGF0ZVByb3RvdHlwZSUnOiBbJ0RhdGUnLCAncHJvdG90eXBlJ10sXG5cdCclRXJyb3JQcm90b3R5cGUlJzogWydFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVFdmFsRXJyb3JQcm90b3R5cGUlJzogWydFdmFsRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclRmxvYXQzMkFycmF5UHJvdG90eXBlJSc6IFsnRmxvYXQzMkFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUZsb2F0NjRBcnJheVByb3RvdHlwZSUnOiBbJ0Zsb2F0NjRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVGdW5jdGlvblByb3RvdHlwZSUnOiBbJ0Z1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUdlbmVyYXRvciUnOiBbJ0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUdlbmVyYXRvclByb3RvdHlwZSUnOiBbJ0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQ4QXJyYXlQcm90b3R5cGUlJzogWydJbnQ4QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSW50MTZBcnJheVByb3RvdHlwZSUnOiBbJ0ludDE2QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSW50MzJBcnJheVByb3RvdHlwZSUnOiBbJ0ludDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSlNPTlBhcnNlJSc6IFsnSlNPTicsICdwYXJzZSddLFxuXHQnJUpTT05TdHJpbmdpZnklJzogWydKU09OJywgJ3N0cmluZ2lmeSddLFxuXHQnJU1hcFByb3RvdHlwZSUnOiBbJ01hcCcsICdwcm90b3R5cGUnXSxcblx0JyVOdW1iZXJQcm90b3R5cGUlJzogWydOdW1iZXInLCAncHJvdG90eXBlJ10sXG5cdCclT2JqZWN0UHJvdG90eXBlJSc6IFsnT2JqZWN0JywgJ3Byb3RvdHlwZSddLFxuXHQnJU9ialByb3RvX3RvU3RyaW5nJSc6IFsnT2JqZWN0JywgJ3Byb3RvdHlwZScsICd0b1N0cmluZyddLFxuXHQnJU9ialByb3RvX3ZhbHVlT2YlJzogWydPYmplY3QnLCAncHJvdG90eXBlJywgJ3ZhbHVlT2YnXSxcblx0JyVQcm9taXNlUHJvdG90eXBlJSc6IFsnUHJvbWlzZScsICdwcm90b3R5cGUnXSxcblx0JyVQcm9taXNlUHJvdG9fdGhlbiUnOiBbJ1Byb21pc2UnLCAncHJvdG90eXBlJywgJ3RoZW4nXSxcblx0JyVQcm9taXNlX2FsbCUnOiBbJ1Byb21pc2UnLCAnYWxsJ10sXG5cdCclUHJvbWlzZV9yZWplY3QlJzogWydQcm9taXNlJywgJ3JlamVjdCddLFxuXHQnJVByb21pc2VfcmVzb2x2ZSUnOiBbJ1Byb21pc2UnLCAncmVzb2x2ZSddLFxuXHQnJVJhbmdlRXJyb3JQcm90b3R5cGUlJzogWydSYW5nZUVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVJlZmVyZW5jZUVycm9yUHJvdG90eXBlJSc6IFsnUmVmZXJlbmNlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclUmVnRXhwUHJvdG90eXBlJSc6IFsnUmVnRXhwJywgJ3Byb3RvdHlwZSddLFxuXHQnJVNldFByb3RvdHlwZSUnOiBbJ1NldCcsICdwcm90b3R5cGUnXSxcblx0JyVTaGFyZWRBcnJheUJ1ZmZlclByb3RvdHlwZSUnOiBbJ1NoYXJlZEFycmF5QnVmZmVyJywgJ3Byb3RvdHlwZSddLFxuXHQnJVN0cmluZ1Byb3RvdHlwZSUnOiBbJ1N0cmluZycsICdwcm90b3R5cGUnXSxcblx0JyVTeW1ib2xQcm90b3R5cGUlJzogWydTeW1ib2wnLCAncHJvdG90eXBlJ10sXG5cdCclU3ludGF4RXJyb3JQcm90b3R5cGUlJzogWydTeW50YXhFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVUeXBlZEFycmF5UHJvdG90eXBlJSc6IFsnVHlwZWRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVUeXBlRXJyb3JQcm90b3R5cGUlJzogWydUeXBlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclVWludDhBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQ4QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVWludDhDbGFtcGVkQXJyYXlQcm90b3R5cGUlJzogWydVaW50OENsYW1wZWRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVaW50MTZBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQxNkFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVVpbnQzMkFycmF5UHJvdG90eXBlJSc6IFsnVWludDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVVJJRXJyb3JQcm90b3R5cGUlJzogWydVUklFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVXZWFrTWFwUHJvdG90eXBlJSc6IFsnV2Vha01hcCcsICdwcm90b3R5cGUnXSxcblx0JyVXZWFrU2V0UHJvdG90eXBlJSc6IFsnV2Vha1NldCcsICdwcm90b3R5cGUnXVxufTtcblxudmFyIGJpbmQgPSByZXF1aXJlKCdmdW5jdGlvbi1iaW5kJyk7XG52YXIgaGFzT3duID0gcmVxdWlyZSgnaGFzb3duJyk7XG52YXIgJGNvbmNhdCA9IGJpbmQuY2FsbChGdW5jdGlvbi5jYWxsLCBBcnJheS5wcm90b3R5cGUuY29uY2F0KTtcbnZhciAkc3BsaWNlQXBwbHkgPSBiaW5kLmNhbGwoRnVuY3Rpb24uYXBwbHksIEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xudmFyICRyZXBsYWNlID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG52YXIgJHN0clNsaWNlID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFN0cmluZy5wcm90b3R5cGUuc2xpY2UpO1xudmFyICRleGVjID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFJlZ0V4cC5wcm90b3R5cGUuZXhlYyk7XG5cbi8qIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iLzQuMTcuMTUvZGlzdC9sb2Rhc2guanMjTDY3MzUtTDY3NDQgKi9cbnZhciByZVByb3BOYW1lID0gL1teJS5bXFxdXSt8XFxbKD86KC0/XFxkKyg/OlxcLlxcZCspPyl8KFtcIiddKSgoPzooPyFcXDIpW15cXFxcXXxcXFxcLikqPylcXDIpXFxdfCg/PSg/OlxcLnxcXFtcXF0pKD86XFwufFxcW1xcXXwlJCkpL2c7XG52YXIgcmVFc2NhcGVDaGFyID0gL1xcXFwoXFxcXCk/L2c7IC8qKiBVc2VkIHRvIG1hdGNoIGJhY2tzbGFzaGVzIGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHN0cmluZ1RvUGF0aCA9IGZ1bmN0aW9uIHN0cmluZ1RvUGF0aChzdHJpbmcpIHtcblx0dmFyIGZpcnN0ID0gJHN0clNsaWNlKHN0cmluZywgMCwgMSk7XG5cdHZhciBsYXN0ID0gJHN0clNsaWNlKHN0cmluZywgLTEpO1xuXHRpZiAoZmlyc3QgPT09ICclJyAmJiBsYXN0ICE9PSAnJScpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdpbnZhbGlkIGludHJpbnNpYyBzeW50YXgsIGV4cGVjdGVkIGNsb3NpbmcgYCVgJyk7XG5cdH0gZWxzZSBpZiAobGFzdCA9PT0gJyUnICYmIGZpcnN0ICE9PSAnJScpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdpbnZhbGlkIGludHJpbnNpYyBzeW50YXgsIGV4cGVjdGVkIG9wZW5pbmcgYCVgJyk7XG5cdH1cblx0dmFyIHJlc3VsdCA9IFtdO1xuXHQkcmVwbGFjZShzdHJpbmcsIHJlUHJvcE5hbWUsIGZ1bmN0aW9uIChtYXRjaCwgbnVtYmVyLCBxdW90ZSwgc3ViU3RyaW5nKSB7XG5cdFx0cmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gcXVvdGUgPyAkcmVwbGFjZShzdWJTdHJpbmcsIHJlRXNjYXBlQ2hhciwgJyQxJykgOiBudW1iZXIgfHwgbWF0Y2g7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufTtcbi8qIGVuZCBhZGFwdGF0aW9uICovXG5cbnZhciBnZXRCYXNlSW50cmluc2ljID0gZnVuY3Rpb24gZ2V0QmFzZUludHJpbnNpYyhuYW1lLCBhbGxvd01pc3NpbmcpIHtcblx0dmFyIGludHJpbnNpY05hbWUgPSBuYW1lO1xuXHR2YXIgYWxpYXM7XG5cdGlmIChoYXNPd24oTEVHQUNZX0FMSUFTRVMsIGludHJpbnNpY05hbWUpKSB7XG5cdFx0YWxpYXMgPSBMRUdBQ1lfQUxJQVNFU1tpbnRyaW5zaWNOYW1lXTtcblx0XHRpbnRyaW5zaWNOYW1lID0gJyUnICsgYWxpYXNbMF0gKyAnJSc7XG5cdH1cblxuXHRpZiAoaGFzT3duKElOVFJJTlNJQ1MsIGludHJpbnNpY05hbWUpKSB7XG5cdFx0dmFyIHZhbHVlID0gSU5UUklOU0lDU1tpbnRyaW5zaWNOYW1lXTtcblx0XHRpZiAodmFsdWUgPT09IG5lZWRzRXZhbCkge1xuXHRcdFx0dmFsdWUgPSBkb0V2YWwoaW50cmluc2ljTmFtZSk7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnICYmICFhbGxvd01pc3NpbmcpIHtcblx0XHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdpbnRyaW5zaWMgJyArIG5hbWUgKyAnIGV4aXN0cywgYnV0IGlzIG5vdCBhdmFpbGFibGUuIFBsZWFzZSBmaWxlIGFuIGlzc3VlIScpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRhbGlhczogYWxpYXMsXG5cdFx0XHRuYW1lOiBpbnRyaW5zaWNOYW1lLFxuXHRcdFx0dmFsdWU6IHZhbHVlXG5cdFx0fTtcblx0fVxuXG5cdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludHJpbnNpYyAnICsgbmFtZSArICcgZG9lcyBub3QgZXhpc3QhJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEdldEludHJpbnNpYyhuYW1lLCBhbGxvd01pc3NpbmcpIHtcblx0aWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdpbnRyaW5zaWMgbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycpO1xuXHR9XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSAmJiB0eXBlb2YgYWxsb3dNaXNzaW5nICE9PSAnYm9vbGVhbicpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignXCJhbGxvd01pc3NpbmdcIiBhcmd1bWVudCBtdXN0IGJlIGEgYm9vbGVhbicpO1xuXHR9XG5cblx0aWYgKCRleGVjKC9eJT9bXiVdKiU/JC8sIG5hbWUpID09PSBudWxsKSB7XG5cdFx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcignYCVgIG1heSBub3QgYmUgcHJlc2VudCBhbnl3aGVyZSBidXQgYXQgdGhlIGJlZ2lubmluZyBhbmQgZW5kIG9mIHRoZSBpbnRyaW5zaWMgbmFtZScpO1xuXHR9XG5cdHZhciBwYXJ0cyA9IHN0cmluZ1RvUGF0aChuYW1lKTtcblx0dmFyIGludHJpbnNpY0Jhc2VOYW1lID0gcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzWzBdIDogJyc7XG5cblx0dmFyIGludHJpbnNpYyA9IGdldEJhc2VJbnRyaW5zaWMoJyUnICsgaW50cmluc2ljQmFzZU5hbWUgKyAnJScsIGFsbG93TWlzc2luZyk7XG5cdHZhciBpbnRyaW5zaWNSZWFsTmFtZSA9IGludHJpbnNpYy5uYW1lO1xuXHR2YXIgdmFsdWUgPSBpbnRyaW5zaWMudmFsdWU7XG5cdHZhciBza2lwRnVydGhlckNhY2hpbmcgPSBmYWxzZTtcblxuXHR2YXIgYWxpYXMgPSBpbnRyaW5zaWMuYWxpYXM7XG5cdGlmIChhbGlhcykge1xuXHRcdGludHJpbnNpY0Jhc2VOYW1lID0gYWxpYXNbMF07XG5cdFx0JHNwbGljZUFwcGx5KHBhcnRzLCAkY29uY2F0KFswLCAxXSwgYWxpYXMpKTtcblx0fVxuXG5cdGZvciAodmFyIGkgPSAxLCBpc093biA9IHRydWU7IGkgPCBwYXJ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHNbaV07XG5cdFx0dmFyIGZpcnN0ID0gJHN0clNsaWNlKHBhcnQsIDAsIDEpO1xuXHRcdHZhciBsYXN0ID0gJHN0clNsaWNlKHBhcnQsIC0xKTtcblx0XHRpZiAoXG5cdFx0XHQoXG5cdFx0XHRcdChmaXJzdCA9PT0gJ1wiJyB8fCBmaXJzdCA9PT0gXCInXCIgfHwgZmlyc3QgPT09ICdgJylcblx0XHRcdFx0fHwgKGxhc3QgPT09ICdcIicgfHwgbGFzdCA9PT0gXCInXCIgfHwgbGFzdCA9PT0gJ2AnKVxuXHRcdFx0KVxuXHRcdFx0JiYgZmlyc3QgIT09IGxhc3Rcblx0XHQpIHtcblx0XHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ3Byb3BlcnR5IG5hbWVzIHdpdGggcXVvdGVzIG11c3QgaGF2ZSBtYXRjaGluZyBxdW90ZXMnKTtcblx0XHR9XG5cdFx0aWYgKHBhcnQgPT09ICdjb25zdHJ1Y3RvcicgfHwgIWlzT3duKSB7XG5cdFx0XHRza2lwRnVydGhlckNhY2hpbmcgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGludHJpbnNpY0Jhc2VOYW1lICs9ICcuJyArIHBhcnQ7XG5cdFx0aW50cmluc2ljUmVhbE5hbWUgPSAnJScgKyBpbnRyaW5zaWNCYXNlTmFtZSArICclJztcblxuXHRcdGlmIChoYXNPd24oSU5UUklOU0lDUywgaW50cmluc2ljUmVhbE5hbWUpKSB7XG5cdFx0XHR2YWx1ZSA9IElOVFJJTlNJQ1NbaW50cmluc2ljUmVhbE5hbWVdO1xuXHRcdH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuXHRcdFx0aWYgKCEocGFydCBpbiB2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKCFhbGxvd01pc3NpbmcpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYmFzZSBpbnRyaW5zaWMgZm9yICcgKyBuYW1lICsgJyBleGlzdHMsIGJ1dCB0aGUgcHJvcGVydHkgaXMgbm90IGF2YWlsYWJsZS4nKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdm9pZCB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoJGdPUEQgJiYgKGkgKyAxKSA+PSBwYXJ0cy5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIGRlc2MgPSAkZ09QRCh2YWx1ZSwgcGFydCk7XG5cdFx0XHRcdGlzT3duID0gISFkZXNjO1xuXG5cdFx0XHRcdC8vIEJ5IGNvbnZlbnRpb24sIHdoZW4gYSBkYXRhIHByb3BlcnR5IGlzIGNvbnZlcnRlZCB0byBhbiBhY2Nlc3NvclxuXHRcdFx0XHQvLyBwcm9wZXJ0eSB0byBlbXVsYXRlIGEgZGF0YSBwcm9wZXJ0eSB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tXG5cdFx0XHRcdC8vIHRoZSBvdmVycmlkZSBtaXN0YWtlLCB0aGF0IGFjY2Vzc29yJ3MgZ2V0dGVyIGlzIG1hcmtlZCB3aXRoXG5cdFx0XHRcdC8vIGFuIGBvcmlnaW5hbFZhbHVlYCBwcm9wZXJ0eS4gSGVyZSwgd2hlbiB3ZSBkZXRlY3QgdGhpcywgd2Vcblx0XHRcdFx0Ly8gdXBob2xkIHRoZSBpbGx1c2lvbiBieSBwcmV0ZW5kaW5nIHRvIHNlZSB0aGF0IG9yaWdpbmFsIGRhdGFcblx0XHRcdFx0Ly8gcHJvcGVydHksIGkuZS4sIHJldHVybmluZyB0aGUgdmFsdWUgcmF0aGVyIHRoYW4gdGhlIGdldHRlclxuXHRcdFx0XHQvLyBpdHNlbGYuXG5cdFx0XHRcdGlmIChpc093biAmJiAnZ2V0JyBpbiBkZXNjICYmICEoJ29yaWdpbmFsVmFsdWUnIGluIGRlc2MuZ2V0KSkge1xuXHRcdFx0XHRcdHZhbHVlID0gZGVzYy5nZXQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZVtwYXJ0XTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXNPd24gPSBoYXNPd24odmFsdWUsIHBhcnQpO1xuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlW3BhcnRdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaXNPd24gJiYgIXNraXBGdXJ0aGVyQ2FjaGluZykge1xuXHRcdFx0XHRJTlRSSU5TSUNTW2ludHJpbnNpY1JlYWxOYW1lXSA9IHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xudmFyICRkZWZpbmVQcm9wZXJ0eSA9IEdldEludHJpbnNpYygnJU9iamVjdC5kZWZpbmVQcm9wZXJ0eSUnLCB0cnVlKSB8fCBmYWxzZTtcbmlmICgkZGVmaW5lUHJvcGVydHkpIHtcblx0dHJ5IHtcblx0XHQkZGVmaW5lUHJvcGVydHkoe30sICdhJywgeyB2YWx1ZTogMSB9KTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIElFIDggaGFzIGEgYnJva2VuIGRlZmluZVByb3BlcnR5XG5cdFx0JGRlZmluZVByb3BlcnR5ID0gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAkZGVmaW5lUHJvcGVydHk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZXRJbnRyaW5zaWMgPSByZXF1aXJlKCdnZXQtaW50cmluc2ljJyk7XG5cbnZhciAkZ09QRCA9IEdldEludHJpbnNpYygnJU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IlJywgdHJ1ZSk7XG5cbmlmICgkZ09QRCkge1xuXHR0cnkge1xuXHRcdCRnT1BEKFtdLCAnbGVuZ3RoJyk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBJRSA4IGhhcyBhIGJyb2tlbiBnT1BEXG5cdFx0JGdPUEQgPSBudWxsO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gJGdPUEQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkZGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCdlcy1kZWZpbmUtcHJvcGVydHknKTtcblxudmFyICRTeW50YXhFcnJvciA9IHJlcXVpcmUoJ2VzLWVycm9ycy9zeW50YXgnKTtcbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcblxudmFyIGdvcGQgPSByZXF1aXJlKCdnb3BkJyk7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuJyl9ICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmluZURhdGFQcm9wZXJ0eShcblx0b2JqLFxuXHRwcm9wZXJ0eSxcblx0dmFsdWVcbikge1xuXHRpZiAoIW9iaiB8fCAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYG9iamAgbXVzdCBiZSBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbmAnKTtcblx0fVxuXHRpZiAodHlwZW9mIHByb3BlcnR5ICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgcHJvcGVydHkgIT09ICdzeW1ib2wnKSB7XG5cdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2Bwcm9wZXJ0eWAgbXVzdCBiZSBhIHN0cmluZyBvciBhIHN5bWJvbGAnKTtcblx0fVxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgdHlwZW9mIGFyZ3VtZW50c1szXSAhPT0gJ2Jvb2xlYW4nICYmIGFyZ3VtZW50c1szXSAhPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdgbm9uRW51bWVyYWJsZWAsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgYm9vbGVhbiBvciBudWxsJyk7XG5cdH1cblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIHR5cGVvZiBhcmd1bWVudHNbNF0gIT09ICdib29sZWFuJyAmJiBhcmd1bWVudHNbNF0gIT09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYG5vbldyaXRhYmxlYCwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYSBib29sZWFuIG9yIG51bGwnKTtcblx0fVxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgdHlwZW9mIGFyZ3VtZW50c1s1XSAhPT0gJ2Jvb2xlYW4nICYmIGFyZ3VtZW50c1s1XSAhPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdgbm9uQ29uZmlndXJhYmxlYCwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYSBib29sZWFuIG9yIG51bGwnKTtcblx0fVxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDYgJiYgdHlwZW9mIGFyZ3VtZW50c1s2XSAhPT0gJ2Jvb2xlYW4nKSB7XG5cdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2Bsb29zZWAsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgYm9vbGVhbicpO1xuXHR9XG5cblx0dmFyIG5vbkVudW1lcmFibGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMyA/IGFyZ3VtZW50c1szXSA6IG51bGw7XG5cdHZhciBub25Xcml0YWJsZSA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ID8gYXJndW1lbnRzWzRdIDogbnVsbDtcblx0dmFyIG5vbkNvbmZpZ3VyYWJsZSA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ID8gYXJndW1lbnRzWzVdIDogbnVsbDtcblx0dmFyIGxvb3NlID0gYXJndW1lbnRzLmxlbmd0aCA+IDYgPyBhcmd1bWVudHNbNl0gOiBmYWxzZTtcblxuXHQvKiBAdHlwZSB7ZmFsc2UgfCBUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjx1bmtub3duPn0gKi9cblx0dmFyIGRlc2MgPSAhIWdvcGQgJiYgZ29wZChvYmosIHByb3BlcnR5KTtcblxuXHRpZiAoJGRlZmluZVByb3BlcnR5KSB7XG5cdFx0JGRlZmluZVByb3BlcnR5KG9iaiwgcHJvcGVydHksIHtcblx0XHRcdGNvbmZpZ3VyYWJsZTogbm9uQ29uZmlndXJhYmxlID09PSBudWxsICYmIGRlc2MgPyBkZXNjLmNvbmZpZ3VyYWJsZSA6ICFub25Db25maWd1cmFibGUsXG5cdFx0XHRlbnVtZXJhYmxlOiBub25FbnVtZXJhYmxlID09PSBudWxsICYmIGRlc2MgPyBkZXNjLmVudW1lcmFibGUgOiAhbm9uRW51bWVyYWJsZSxcblx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdHdyaXRhYmxlOiBub25Xcml0YWJsZSA9PT0gbnVsbCAmJiBkZXNjID8gZGVzYy53cml0YWJsZSA6ICFub25Xcml0YWJsZVxuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGxvb3NlIHx8ICghbm9uRW51bWVyYWJsZSAmJiAhbm9uV3JpdGFibGUgJiYgIW5vbkNvbmZpZ3VyYWJsZSkpIHtcblx0XHQvLyBtdXN0IGZhbGwgYmFjayB0byBbW1NldF1dLCBhbmQgd2FzIG5vdCBleHBsaWNpdGx5IGFza2VkIHRvIG1ha2Ugbm9uLWVudW1lcmFibGUsIG5vbi13cml0YWJsZSwgb3Igbm9uLWNvbmZpZ3VyYWJsZVxuXHRcdG9ialtwcm9wZXJ0eV0gPSB2YWx1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ1RoaXMgZW52aXJvbm1lbnQgZG9lcyBub3Qgc3VwcG9ydCBkZWZpbmluZyBhIHByb3BlcnR5IGFzIG5vbi1jb25maWd1cmFibGUsIG5vbi13cml0YWJsZSwgb3Igbm9uLWVudW1lcmFibGUuJyk7XG5cdH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAkZGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCdlcy1kZWZpbmUtcHJvcGVydHknKTtcblxudmFyIGhhc1Byb3BlcnR5RGVzY3JpcHRvcnMgPSBmdW5jdGlvbiBoYXNQcm9wZXJ0eURlc2NyaXB0b3JzKCkge1xuXHRyZXR1cm4gISEkZGVmaW5lUHJvcGVydHk7XG59O1xuXG5oYXNQcm9wZXJ0eURlc2NyaXB0b3JzLmhhc0FycmF5TGVuZ3RoRGVmaW5lQnVnID0gZnVuY3Rpb24gaGFzQXJyYXlMZW5ndGhEZWZpbmVCdWcoKSB7XG5cdC8vIG5vZGUgdjAuNiBoYXMgYSBidWcgd2hlcmUgYXJyYXkgbGVuZ3RocyBjYW4gYmUgU2V0IGJ1dCBub3QgRGVmaW5lZFxuXHRpZiAoISRkZWZpbmVQcm9wZXJ0eSkge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cdHRyeSB7XG5cdFx0cmV0dXJuICRkZWZpbmVQcm9wZXJ0eShbXSwgJ2xlbmd0aCcsIHsgdmFsdWU6IDEgfSkubGVuZ3RoICE9PSAxO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gSW4gRmlyZWZveCA0LTIyLCBkZWZpbmluZyBsZW5ndGggb24gYW4gYXJyYXkgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBoYXNQcm9wZXJ0eURlc2NyaXB0b3JzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xudmFyIGRlZmluZSA9IHJlcXVpcmUoJ2RlZmluZS1kYXRhLXByb3BlcnR5Jyk7XG52YXIgaGFzRGVzY3JpcHRvcnMgPSByZXF1aXJlKCdoYXMtcHJvcGVydHktZGVzY3JpcHRvcnMnKSgpO1xudmFyIGdPUEQgPSByZXF1aXJlKCdnb3BkJyk7XG5cbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcbnZhciAkZmxvb3IgPSBHZXRJbnRyaW5zaWMoJyVNYXRoLmZsb29yJScpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzZXRGdW5jdGlvbkxlbmd0aChmbiwgbGVuZ3RoKSB7XG5cdGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYGZuYCBpcyBub3QgYSBmdW5jdGlvbicpO1xuXHR9XG5cdGlmICh0eXBlb2YgbGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBsZW5ndGggPCAwIHx8IGxlbmd0aCA+IDB4RkZGRkZGRkYgfHwgJGZsb29yKGxlbmd0aCkgIT09IGxlbmd0aCkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdgbGVuZ3RoYCBtdXN0IGJlIGEgcG9zaXRpdmUgMzItYml0IGludGVnZXInKTtcblx0fVxuXG5cdHZhciBsb29zZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmICEhYXJndW1lbnRzWzJdO1xuXG5cdHZhciBmdW5jdGlvbkxlbmd0aElzQ29uZmlndXJhYmxlID0gdHJ1ZTtcblx0dmFyIGZ1bmN0aW9uTGVuZ3RoSXNXcml0YWJsZSA9IHRydWU7XG5cdGlmICgnbGVuZ3RoJyBpbiBmbiAmJiBnT1BEKSB7XG5cdFx0dmFyIGRlc2MgPSBnT1BEKGZuLCAnbGVuZ3RoJyk7XG5cdFx0aWYgKGRlc2MgJiYgIWRlc2MuY29uZmlndXJhYmxlKSB7XG5cdFx0XHRmdW5jdGlvbkxlbmd0aElzQ29uZmlndXJhYmxlID0gZmFsc2U7XG5cdFx0fVxuXHRcdGlmIChkZXNjICYmICFkZXNjLndyaXRhYmxlKSB7XG5cdFx0XHRmdW5jdGlvbkxlbmd0aElzV3JpdGFibGUgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRpZiAoZnVuY3Rpb25MZW5ndGhJc0NvbmZpZ3VyYWJsZSB8fCBmdW5jdGlvbkxlbmd0aElzV3JpdGFibGUgfHwgIWxvb3NlKSB7XG5cdFx0aWYgKGhhc0Rlc2NyaXB0b3JzKSB7XG5cdFx0XHRkZWZpbmUoLyoqIEB0eXBlIHtQYXJhbWV0ZXJzPGRlZmluZT5bMF19ICovIChmbiksICdsZW5ndGgnLCBsZW5ndGgsIHRydWUsIHRydWUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoLyoqIEB0eXBlIHtQYXJhbWV0ZXJzPGRlZmluZT5bMF19ICovIChmbiksICdsZW5ndGgnLCBsZW5ndGgpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZm47XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmluZCA9IHJlcXVpcmUoJ2Z1bmN0aW9uLWJpbmQnKTtcbnZhciBHZXRJbnRyaW5zaWMgPSByZXF1aXJlKCdnZXQtaW50cmluc2ljJyk7XG52YXIgc2V0RnVuY3Rpb25MZW5ndGggPSByZXF1aXJlKCdzZXQtZnVuY3Rpb24tbGVuZ3RoJyk7XG5cbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcbnZhciAkYXBwbHkgPSBHZXRJbnRyaW5zaWMoJyVGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHklJyk7XG52YXIgJGNhbGwgPSBHZXRJbnRyaW5zaWMoJyVGdW5jdGlvbi5wcm90b3R5cGUuY2FsbCUnKTtcbnZhciAkcmVmbGVjdEFwcGx5ID0gR2V0SW50cmluc2ljKCclUmVmbGVjdC5hcHBseSUnLCB0cnVlKSB8fCBiaW5kLmNhbGwoJGNhbGwsICRhcHBseSk7XG5cbnZhciAkZGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCdlcy1kZWZpbmUtcHJvcGVydHknKTtcbnZhciAkbWF4ID0gR2V0SW50cmluc2ljKCclTWF0aC5tYXglJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2FsbEJpbmQob3JpZ2luYWxGdW5jdGlvbikge1xuXHRpZiAodHlwZW9mIG9yaWdpbmFsRnVuY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYSBmdW5jdGlvbiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cdHZhciBmdW5jID0gJHJlZmxlY3RBcHBseShiaW5kLCAkY2FsbCwgYXJndW1lbnRzKTtcblx0cmV0dXJuIHNldEZ1bmN0aW9uTGVuZ3RoKFxuXHRcdGZ1bmMsXG5cdFx0MSArICRtYXgoMCwgb3JpZ2luYWxGdW5jdGlvbi5sZW5ndGggLSAoYXJndW1lbnRzLmxlbmd0aCAtIDEpKSxcblx0XHR0cnVlXG5cdCk7XG59O1xuXG52YXIgYXBwbHlCaW5kID0gZnVuY3Rpb24gYXBwbHlCaW5kKCkge1xuXHRyZXR1cm4gJHJlZmxlY3RBcHBseShiaW5kLCAkYXBwbHksIGFyZ3VtZW50cyk7XG59O1xuXG5pZiAoJGRlZmluZVByb3BlcnR5KSB7XG5cdCRkZWZpbmVQcm9wZXJ0eShtb2R1bGUuZXhwb3J0cywgJ2FwcGx5JywgeyB2YWx1ZTogYXBwbHlCaW5kIH0pO1xufSBlbHNlIHtcblx0bW9kdWxlLmV4cG9ydHMuYXBwbHkgPSBhcHBseUJpbmQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZXRJbnRyaW5zaWMgPSByZXF1aXJlKCdnZXQtaW50cmluc2ljJyk7XG5cbnZhciBjYWxsQmluZCA9IHJlcXVpcmUoJy4vJyk7XG5cbnZhciAkaW5kZXhPZiA9IGNhbGxCaW5kKEdldEludHJpbnNpYygnU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mJykpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNhbGxCb3VuZEludHJpbnNpYyhuYW1lLCBhbGxvd01pc3NpbmcpIHtcblx0dmFyIGludHJpbnNpYyA9IEdldEludHJpbnNpYyhuYW1lLCAhIWFsbG93TWlzc2luZyk7XG5cdGlmICh0eXBlb2YgaW50cmluc2ljID09PSAnZnVuY3Rpb24nICYmICRpbmRleE9mKG5hbWUsICcucHJvdG90eXBlLicpID4gLTEpIHtcblx0XHRyZXR1cm4gY2FsbEJpbmQoaW50cmluc2ljKTtcblx0fVxuXHRyZXR1cm4gaW50cmluc2ljO1xufTtcbiIsInZhciBoYXNNYXAgPSB0eXBlb2YgTWFwID09PSAnZnVuY3Rpb24nICYmIE1hcC5wcm90b3R5cGU7XG52YXIgbWFwU2l6ZURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yICYmIGhhc01hcCA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTWFwLnByb3RvdHlwZSwgJ3NpemUnKSA6IG51bGw7XG52YXIgbWFwU2l6ZSA9IGhhc01hcCAmJiBtYXBTaXplRGVzY3JpcHRvciAmJiB0eXBlb2YgbWFwU2l6ZURlc2NyaXB0b3IuZ2V0ID09PSAnZnVuY3Rpb24nID8gbWFwU2l6ZURlc2NyaXB0b3IuZ2V0IDogbnVsbDtcbnZhciBtYXBGb3JFYWNoID0gaGFzTWFwICYmIE1hcC5wcm90b3R5cGUuZm9yRWFjaDtcbnZhciBoYXNTZXQgPSB0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nICYmIFNldC5wcm90b3R5cGU7XG52YXIgc2V0U2l6ZURlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yICYmIGhhc1NldCA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoU2V0LnByb3RvdHlwZSwgJ3NpemUnKSA6IG51bGw7XG52YXIgc2V0U2l6ZSA9IGhhc1NldCAmJiBzZXRTaXplRGVzY3JpcHRvciAmJiB0eXBlb2Ygc2V0U2l6ZURlc2NyaXB0b3IuZ2V0ID09PSAnZnVuY3Rpb24nID8gc2V0U2l6ZURlc2NyaXB0b3IuZ2V0IDogbnVsbDtcbnZhciBzZXRGb3JFYWNoID0gaGFzU2V0ICYmIFNldC5wcm90b3R5cGUuZm9yRWFjaDtcbnZhciBoYXNXZWFrTWFwID0gdHlwZW9mIFdlYWtNYXAgPT09ICdmdW5jdGlvbicgJiYgV2Vha01hcC5wcm90b3R5cGU7XG52YXIgd2Vha01hcEhhcyA9IGhhc1dlYWtNYXAgPyBXZWFrTWFwLnByb3RvdHlwZS5oYXMgOiBudWxsO1xudmFyIGhhc1dlYWtTZXQgPSB0eXBlb2YgV2Vha1NldCA9PT0gJ2Z1bmN0aW9uJyAmJiBXZWFrU2V0LnByb3RvdHlwZTtcbnZhciB3ZWFrU2V0SGFzID0gaGFzV2Vha1NldCA/IFdlYWtTZXQucHJvdG90eXBlLmhhcyA6IG51bGw7XG52YXIgaGFzV2Vha1JlZiA9IHR5cGVvZiBXZWFrUmVmID09PSAnZnVuY3Rpb24nICYmIFdlYWtSZWYucHJvdG90eXBlO1xudmFyIHdlYWtSZWZEZXJlZiA9IGhhc1dlYWtSZWYgPyBXZWFrUmVmLnByb3RvdHlwZS5kZXJlZiA6IG51bGw7XG52YXIgYm9vbGVhblZhbHVlT2YgPSBCb29sZWFuLnByb3RvdHlwZS52YWx1ZU9mO1xudmFyIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBmdW5jdGlvblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyICRtYXRjaCA9IFN0cmluZy5wcm90b3R5cGUubWF0Y2g7XG52YXIgJHNsaWNlID0gU3RyaW5nLnByb3RvdHlwZS5zbGljZTtcbnZhciAkcmVwbGFjZSA9IFN0cmluZy5wcm90b3R5cGUucmVwbGFjZTtcbnZhciAkdG9VcHBlckNhc2UgPSBTdHJpbmcucHJvdG90eXBlLnRvVXBwZXJDYXNlO1xudmFyICR0b0xvd2VyQ2FzZSA9IFN0cmluZy5wcm90b3R5cGUudG9Mb3dlckNhc2U7XG52YXIgJHRlc3QgPSBSZWdFeHAucHJvdG90eXBlLnRlc3Q7XG52YXIgJGNvbmNhdCA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQ7XG52YXIgJGpvaW4gPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbnZhciAkYXJyU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgJGZsb29yID0gTWF0aC5mbG9vcjtcbnZhciBiaWdJbnRWYWx1ZU9mID0gdHlwZW9mIEJpZ0ludCA9PT0gJ2Z1bmN0aW9uJyA/IEJpZ0ludC5wcm90b3R5cGUudmFsdWVPZiA6IG51bGw7XG52YXIgZ09QUyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgc3ltVG9TdHJpbmcgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09ICdzeW1ib2wnID8gU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZyA6IG51bGw7XG52YXIgaGFzU2hhbW1lZFN5bWJvbHMgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09ICdvYmplY3QnO1xuLy8gaWUsIGBoYXMtdG9zdHJpbmd0YWcvc2hhbXNcbnZhciB0b1N0cmluZ1RhZyA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLnRvU3RyaW5nVGFnICYmICh0eXBlb2YgU3ltYm9sLnRvU3RyaW5nVGFnID09PSBoYXNTaGFtbWVkU3ltYm9scyA/ICdvYmplY3QnIDogJ3N5bWJvbCcpXG4gICAgPyBTeW1ib2wudG9TdHJpbmdUYWdcbiAgICA6IG51bGw7XG52YXIgaXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxudmFyIGdQTyA9ICh0eXBlb2YgUmVmbGVjdCA9PT0gJ2Z1bmN0aW9uJyA/IFJlZmxlY3QuZ2V0UHJvdG90eXBlT2YgOiBPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHx8IChcbiAgICBbXS5fX3Byb3RvX18gPT09IEFycmF5LnByb3RvdHlwZSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXByb3RvXG4gICAgICAgID8gZnVuY3Rpb24gKE8pIHtcbiAgICAgICAgICAgIHJldHVybiBPLl9fcHJvdG9fXzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b1xuICAgICAgICB9XG4gICAgICAgIDogbnVsbFxuKTtcblxuZnVuY3Rpb24gYWRkTnVtZXJpY1NlcGFyYXRvcihudW0sIHN0cikge1xuICAgIGlmIChcbiAgICAgICAgbnVtID09PSBJbmZpbml0eVxuICAgICAgICB8fCBudW0gPT09IC1JbmZpbml0eVxuICAgICAgICB8fCBudW0gIT09IG51bVxuICAgICAgICB8fCAobnVtICYmIG51bSA+IC0xMDAwICYmIG51bSA8IDEwMDApXG4gICAgICAgIHx8ICR0ZXN0LmNhbGwoL2UvLCBzdHIpXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIHZhciBzZXBSZWdleCA9IC9bMC05XSg/PSg/OlswLTldezN9KSsoPyFbMC05XSkpL2c7XG4gICAgaWYgKHR5cGVvZiBudW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIHZhciBpbnQgPSBudW0gPCAwID8gLSRmbG9vcigtbnVtKSA6ICRmbG9vcihudW0pOyAvLyB0cnVuYyhudW0pXG4gICAgICAgIGlmIChpbnQgIT09IG51bSkge1xuICAgICAgICAgICAgdmFyIGludFN0ciA9IFN0cmluZyhpbnQpO1xuICAgICAgICAgICAgdmFyIGRlYyA9ICRzbGljZS5jYWxsKHN0ciwgaW50U3RyLmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgcmV0dXJuICRyZXBsYWNlLmNhbGwoaW50U3RyLCBzZXBSZWdleCwgJyQmXycpICsgJy4nICsgJHJlcGxhY2UuY2FsbCgkcmVwbGFjZS5jYWxsKGRlYywgLyhbMC05XXszfSkvZywgJyQmXycpLCAvXyQvLCAnJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICRyZXBsYWNlLmNhbGwoc3RyLCBzZXBSZWdleCwgJyQmXycpO1xufVxuXG52YXIgdXRpbEluc3BlY3QgPSByZXF1aXJlKCcuL3V0aWwuaW5zcGVjdCcpO1xudmFyIGluc3BlY3RDdXN0b20gPSB1dGlsSW5zcGVjdC5jdXN0b207XG52YXIgaW5zcGVjdFN5bWJvbCA9IGlzU3ltYm9sKGluc3BlY3RDdXN0b20pID8gaW5zcGVjdEN1c3RvbSA6IG51bGw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5zcGVjdF8ob2JqLCBvcHRpb25zLCBkZXB0aCwgc2Vlbikge1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChoYXMob3B0cywgJ3F1b3RlU3R5bGUnKSAmJiAob3B0cy5xdW90ZVN0eWxlICE9PSAnc2luZ2xlJyAmJiBvcHRzLnF1b3RlU3R5bGUgIT09ICdkb3VibGUnKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJxdW90ZVN0eWxlXCIgbXVzdCBiZSBcInNpbmdsZVwiIG9yIFwiZG91YmxlXCInKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgICBoYXMob3B0cywgJ21heFN0cmluZ0xlbmd0aCcpICYmICh0eXBlb2Ygb3B0cy5tYXhTdHJpbmdMZW5ndGggPT09ICdudW1iZXInXG4gICAgICAgICAgICA/IG9wdHMubWF4U3RyaW5nTGVuZ3RoIDwgMCAmJiBvcHRzLm1heFN0cmluZ0xlbmd0aCAhPT0gSW5maW5pdHlcbiAgICAgICAgICAgIDogb3B0cy5tYXhTdHJpbmdMZW5ndGggIT09IG51bGxcbiAgICAgICAgKVxuICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJtYXhTdHJpbmdMZW5ndGhcIiwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyLCBJbmZpbml0eSwgb3IgYG51bGxgJyk7XG4gICAgfVxuICAgIHZhciBjdXN0b21JbnNwZWN0ID0gaGFzKG9wdHMsICdjdXN0b21JbnNwZWN0JykgPyBvcHRzLmN1c3RvbUluc3BlY3QgOiB0cnVlO1xuICAgIGlmICh0eXBlb2YgY3VzdG9tSW5zcGVjdCAhPT0gJ2Jvb2xlYW4nICYmIGN1c3RvbUluc3BlY3QgIT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBcImN1c3RvbUluc3BlY3RcIiwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYHRydWVgLCBgZmFsc2VgLCBvciBgXFwnc3ltYm9sXFwnYCcpO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICAgaGFzKG9wdHMsICdpbmRlbnQnKVxuICAgICAgICAmJiBvcHRzLmluZGVudCAhPT0gbnVsbFxuICAgICAgICAmJiBvcHRzLmluZGVudCAhPT0gJ1xcdCdcbiAgICAgICAgJiYgIShwYXJzZUludChvcHRzLmluZGVudCwgMTApID09PSBvcHRzLmluZGVudCAmJiBvcHRzLmluZGVudCA+IDApXG4gICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBcImluZGVudFwiIG11c3QgYmUgXCJcXFxcdFwiLCBhbiBpbnRlZ2VyID4gMCwgb3IgYG51bGxgJyk7XG4gICAgfVxuICAgIGlmIChoYXMob3B0cywgJ251bWVyaWNTZXBhcmF0b3InKSAmJiB0eXBlb2Ygb3B0cy5udW1lcmljU2VwYXJhdG9yICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIFwibnVtZXJpY1NlcGFyYXRvclwiLCBpZiBwcm92aWRlZCwgbXVzdCBiZSBgdHJ1ZWAgb3IgYGZhbHNlYCcpO1xuICAgIH1cbiAgICB2YXIgbnVtZXJpY1NlcGFyYXRvciA9IG9wdHMubnVtZXJpY1NlcGFyYXRvcjtcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gICAgfVxuICAgIGlmIChvYmogPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICdudWxsJztcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gb2JqID8gJ3RydWUnIDogJ2ZhbHNlJztcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGluc3BlY3RTdHJpbmcob2JqLCBvcHRzKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChvYmogPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBJbmZpbml0eSAvIG9iaiA+IDAgPyAnMCcgOiAnLTAnO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHIgPSBTdHJpbmcob2JqKTtcbiAgICAgICAgcmV0dXJuIG51bWVyaWNTZXBhcmF0b3IgPyBhZGROdW1lcmljU2VwYXJhdG9yKG9iaiwgc3RyKSA6IHN0cjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdiaWdpbnQnKSB7XG4gICAgICAgIHZhciBiaWdJbnRTdHIgPSBTdHJpbmcob2JqKSArICduJztcbiAgICAgICAgcmV0dXJuIG51bWVyaWNTZXBhcmF0b3IgPyBhZGROdW1lcmljU2VwYXJhdG9yKG9iaiwgYmlnSW50U3RyKSA6IGJpZ0ludFN0cjtcbiAgICB9XG5cbiAgICB2YXIgbWF4RGVwdGggPSB0eXBlb2Ygb3B0cy5kZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyA1IDogb3B0cy5kZXB0aDtcbiAgICBpZiAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJykgeyBkZXB0aCA9IDA7IH1cbiAgICBpZiAoZGVwdGggPj0gbWF4RGVwdGggJiYgbWF4RGVwdGggPiAwICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KG9iaikgPyAnW0FycmF5XScgOiAnW09iamVjdF0nO1xuICAgIH1cblxuICAgIHZhciBpbmRlbnQgPSBnZXRJbmRlbnQob3B0cywgZGVwdGgpO1xuXG4gICAgaWYgKHR5cGVvZiBzZWVuID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZWVuID0gW107XG4gICAgfSBlbHNlIGlmIChpbmRleE9mKHNlZW4sIG9iaikgPj0gMCkge1xuICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3BlY3QodmFsdWUsIGZyb20sIG5vSW5kZW50KSB7XG4gICAgICAgIGlmIChmcm9tKSB7XG4gICAgICAgICAgICBzZWVuID0gJGFyclNsaWNlLmNhbGwoc2Vlbik7XG4gICAgICAgICAgICBzZWVuLnB1c2goZnJvbSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vSW5kZW50KSB7XG4gICAgICAgICAgICB2YXIgbmV3T3B0cyA9IHtcbiAgICAgICAgICAgICAgICBkZXB0aDogb3B0cy5kZXB0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChoYXMob3B0cywgJ3F1b3RlU3R5bGUnKSkge1xuICAgICAgICAgICAgICAgIG5ld09wdHMucXVvdGVTdHlsZSA9IG9wdHMucXVvdGVTdHlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0Xyh2YWx1ZSwgbmV3T3B0cywgZGVwdGggKyAxLCBzZWVuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zcGVjdF8odmFsdWUsIG9wdHMsIGRlcHRoICsgMSwgc2Vlbik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiYgIWlzUmVnRXhwKG9iaikpIHsgLy8gaW4gb2xkZXIgZW5naW5lcywgcmVnZXhlcyBhcmUgY2FsbGFibGVcbiAgICAgICAgdmFyIG5hbWUgPSBuYW1lT2Yob2JqKTtcbiAgICAgICAgdmFyIGtleXMgPSBhcnJPYmpLZXlzKG9iaiwgaW5zcGVjdCk7XG4gICAgICAgIHJldHVybiAnW0Z1bmN0aW9uJyArIChuYW1lID8gJzogJyArIG5hbWUgOiAnIChhbm9ueW1vdXMpJykgKyAnXScgKyAoa2V5cy5sZW5ndGggPiAwID8gJyB7ICcgKyAkam9pbi5jYWxsKGtleXMsICcsICcpICsgJyB9JyA6ICcnKTtcbiAgICB9XG4gICAgaWYgKGlzU3ltYm9sKG9iaikpIHtcbiAgICAgICAgdmFyIHN5bVN0cmluZyA9IGhhc1NoYW1tZWRTeW1ib2xzID8gJHJlcGxhY2UuY2FsbChTdHJpbmcob2JqKSwgL14oU3ltYm9sXFwoLipcXCkpX1teKV0qJC8sICckMScpIDogc3ltVG9TdHJpbmcuY2FsbChvYmopO1xuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgIWhhc1NoYW1tZWRTeW1ib2xzID8gbWFya0JveGVkKHN5bVN0cmluZykgOiBzeW1TdHJpbmc7XG4gICAgfVxuICAgIGlmIChpc0VsZW1lbnQob2JqKSkge1xuICAgICAgICB2YXIgcyA9ICc8JyArICR0b0xvd2VyQ2FzZS5jYWxsKFN0cmluZyhvYmoubm9kZU5hbWUpKTtcbiAgICAgICAgdmFyIGF0dHJzID0gb2JqLmF0dHJpYnV0ZXMgfHwgW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHMgKz0gJyAnICsgYXR0cnNbaV0ubmFtZSArICc9JyArIHdyYXBRdW90ZXMocXVvdGUoYXR0cnNbaV0udmFsdWUpLCAnZG91YmxlJywgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgcyArPSAnPic7XG4gICAgICAgIGlmIChvYmouY2hpbGROb2RlcyAmJiBvYmouY2hpbGROb2Rlcy5sZW5ndGgpIHsgcyArPSAnLi4uJzsgfVxuICAgICAgICBzICs9ICc8LycgKyAkdG9Mb3dlckNhc2UuY2FsbChTdHJpbmcob2JqLm5vZGVOYW1lKSkgKyAnPic7XG4gICAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSAwKSB7IHJldHVybiAnW10nOyB9XG4gICAgICAgIHZhciB4cyA9IGFyck9iaktleXMob2JqLCBpbnNwZWN0KTtcbiAgICAgICAgaWYgKGluZGVudCAmJiAhc2luZ2xlTGluZVZhbHVlcyh4cykpIHtcbiAgICAgICAgICAgIHJldHVybiAnWycgKyBpbmRlbnRlZEpvaW4oeHMsIGluZGVudCkgKyAnXSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdbICcgKyAkam9pbi5jYWxsKHhzLCAnLCAnKSArICcgXSc7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKG9iaikpIHtcbiAgICAgICAgdmFyIHBhcnRzID0gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpO1xuICAgICAgICBpZiAoISgnY2F1c2UnIGluIEVycm9yLnByb3RvdHlwZSkgJiYgJ2NhdXNlJyBpbiBvYmogJiYgIWlzRW51bWVyYWJsZS5jYWxsKG9iaiwgJ2NhdXNlJykpIHtcbiAgICAgICAgICAgIHJldHVybiAneyBbJyArIFN0cmluZyhvYmopICsgJ10gJyArICRqb2luLmNhbGwoJGNvbmNhdC5jYWxsKCdbY2F1c2VdOiAnICsgaW5zcGVjdChvYmouY2F1c2UpLCBwYXJ0cyksICcsICcpICsgJyB9JztcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKSB7IHJldHVybiAnWycgKyBTdHJpbmcob2JqKSArICddJzsgfVxuICAgICAgICByZXR1cm4gJ3sgWycgKyBTdHJpbmcob2JqKSArICddICcgKyAkam9pbi5jYWxsKHBhcnRzLCAnLCAnKSArICcgfSc7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBjdXN0b21JbnNwZWN0KSB7XG4gICAgICAgIGlmIChpbnNwZWN0U3ltYm9sICYmIHR5cGVvZiBvYmpbaW5zcGVjdFN5bWJvbF0gPT09ICdmdW5jdGlvbicgJiYgdXRpbEluc3BlY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsSW5zcGVjdChvYmosIHsgZGVwdGg6IG1heERlcHRoIC0gZGVwdGggfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VzdG9tSW5zcGVjdCAhPT0gJ3N5bWJvbCcgJiYgdHlwZW9mIG9iai5pbnNwZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqLmluc3BlY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNNYXAob2JqKSkge1xuICAgICAgICB2YXIgbWFwUGFydHMgPSBbXTtcbiAgICAgICAgaWYgKG1hcEZvckVhY2gpIHtcbiAgICAgICAgICAgIG1hcEZvckVhY2guY2FsbChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgbWFwUGFydHMucHVzaChpbnNwZWN0KGtleSwgb2JqLCB0cnVlKSArICcgPT4gJyArIGluc3BlY3QodmFsdWUsIG9iaikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25PZignTWFwJywgbWFwU2l6ZS5jYWxsKG9iaiksIG1hcFBhcnRzLCBpbmRlbnQpO1xuICAgIH1cbiAgICBpZiAoaXNTZXQob2JqKSkge1xuICAgICAgICB2YXIgc2V0UGFydHMgPSBbXTtcbiAgICAgICAgaWYgKHNldEZvckVhY2gpIHtcbiAgICAgICAgICAgIHNldEZvckVhY2guY2FsbChvYmosIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHNldFBhcnRzLnB1c2goaW5zcGVjdCh2YWx1ZSwgb2JqKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29sbGVjdGlvbk9mKCdTZXQnLCBzZXRTaXplLmNhbGwob2JqKSwgc2V0UGFydHMsIGluZGVudCk7XG4gICAgfVxuICAgIGlmIChpc1dlYWtNYXAob2JqKSkge1xuICAgICAgICByZXR1cm4gd2Vha0NvbGxlY3Rpb25PZignV2Vha01hcCcpO1xuICAgIH1cbiAgICBpZiAoaXNXZWFrU2V0KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIHdlYWtDb2xsZWN0aW9uT2YoJ1dlYWtTZXQnKTtcbiAgICB9XG4gICAgaWYgKGlzV2Vha1JlZihvYmopKSB7XG4gICAgICAgIHJldHVybiB3ZWFrQ29sbGVjdGlvbk9mKCdXZWFrUmVmJyk7XG4gICAgfVxuICAgIGlmIChpc051bWJlcihvYmopKSB7XG4gICAgICAgIHJldHVybiBtYXJrQm94ZWQoaW5zcGVjdChOdW1iZXIob2JqKSkpO1xuICAgIH1cbiAgICBpZiAoaXNCaWdJbnQob2JqKSkge1xuICAgICAgICByZXR1cm4gbWFya0JveGVkKGluc3BlY3QoYmlnSW50VmFsdWVPZi5jYWxsKG9iaikpKTtcbiAgICB9XG4gICAgaWYgKGlzQm9vbGVhbihvYmopKSB7XG4gICAgICAgIHJldHVybiBtYXJrQm94ZWQoYm9vbGVhblZhbHVlT2YuY2FsbChvYmopKTtcbiAgICB9XG4gICAgaWYgKGlzU3RyaW5nKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG1hcmtCb3hlZChpbnNwZWN0KFN0cmluZyhvYmopKSk7XG4gICAgfVxuICAgIC8vIG5vdGU6IGluIElFIDgsIHNvbWV0aW1lcyBgZ2xvYmFsICE9PSB3aW5kb3dgIGJ1dCBib3RoIGFyZSB0aGUgcHJvdG90eXBlcyBvZiBlYWNoIG90aGVyXG4gICAgLyogZXNsaW50LWVudiBicm93c2VyICovXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIG9iaiA9PT0gd2luZG93KSB7XG4gICAgICAgIHJldHVybiAneyBbb2JqZWN0IFdpbmRvd10gfSc7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICAgKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyAmJiBvYmogPT09IGdsb2JhbFRoaXMpXG4gICAgICAgIHx8ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBvYmogPT09IGdsb2JhbClcbiAgICApIHtcbiAgICAgICAgcmV0dXJuICd7IFtvYmplY3QgZ2xvYmFsVGhpc10gfSc7XG4gICAgfVxuICAgIGlmICghaXNEYXRlKG9iaikgJiYgIWlzUmVnRXhwKG9iaikpIHtcbiAgICAgICAgdmFyIHlzID0gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpO1xuICAgICAgICB2YXIgaXNQbGFpbk9iamVjdCA9IGdQTyA/IGdQTyhvYmopID09PSBPYmplY3QucHJvdG90eXBlIDogb2JqIGluc3RhbmNlb2YgT2JqZWN0IHx8IG9iai5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0O1xuICAgICAgICB2YXIgcHJvdG9UYWcgPSBvYmogaW5zdGFuY2VvZiBPYmplY3QgPyAnJyA6ICdudWxsIHByb3RvdHlwZSc7XG4gICAgICAgIHZhciBzdHJpbmdUYWcgPSAhaXNQbGFpbk9iamVjdCAmJiB0b1N0cmluZ1RhZyAmJiBPYmplY3Qob2JqKSA9PT0gb2JqICYmIHRvU3RyaW5nVGFnIGluIG9iaiA/ICRzbGljZS5jYWxsKHRvU3RyKG9iaiksIDgsIC0xKSA6IHByb3RvVGFnID8gJ09iamVjdCcgOiAnJztcbiAgICAgICAgdmFyIGNvbnN0cnVjdG9yVGFnID0gaXNQbGFpbk9iamVjdCB8fCB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yICE9PSAnZnVuY3Rpb24nID8gJycgOiBvYmouY29uc3RydWN0b3IubmFtZSA/IG9iai5jb25zdHJ1Y3Rvci5uYW1lICsgJyAnIDogJyc7XG4gICAgICAgIHZhciB0YWcgPSBjb25zdHJ1Y3RvclRhZyArIChzdHJpbmdUYWcgfHwgcHJvdG9UYWcgPyAnWycgKyAkam9pbi5jYWxsKCRjb25jYXQuY2FsbChbXSwgc3RyaW5nVGFnIHx8IFtdLCBwcm90b1RhZyB8fCBbXSksICc6ICcpICsgJ10gJyA6ICcnKTtcbiAgICAgICAgaWYgKHlzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gdGFnICsgJ3t9JzsgfVxuICAgICAgICBpZiAoaW5kZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGFnICsgJ3snICsgaW5kZW50ZWRKb2luKHlzLCBpbmRlbnQpICsgJ30nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YWcgKyAneyAnICsgJGpvaW4uY2FsbCh5cywgJywgJykgKyAnIH0nO1xuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKG9iaik7XG59O1xuXG5mdW5jdGlvbiB3cmFwUXVvdGVzKHMsIGRlZmF1bHRTdHlsZSwgb3B0cykge1xuICAgIHZhciBxdW90ZUNoYXIgPSAob3B0cy5xdW90ZVN0eWxlIHx8IGRlZmF1bHRTdHlsZSkgPT09ICdkb3VibGUnID8gJ1wiJyA6IFwiJ1wiO1xuICAgIHJldHVybiBxdW90ZUNoYXIgKyBzICsgcXVvdGVDaGFyO1xufVxuXG5mdW5jdGlvbiBxdW90ZShzKSB7XG4gICAgcmV0dXJuICRyZXBsYWNlLmNhbGwoU3RyaW5nKHMpLCAvXCIvZywgJyZxdW90OycpO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KG9iaikgeyByZXR1cm4gdG9TdHIob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cbmZ1bmN0aW9uIGlzRGF0ZShvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cbmZ1bmN0aW9uIGlzUmVnRXhwKG9iaikgeyByZXR1cm4gdG9TdHIob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc0Vycm9yKG9iaikgeyByZXR1cm4gdG9TdHIob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cbmZ1bmN0aW9uIGlzU3RyaW5nKG9iaikgeyByZXR1cm4gdG9TdHIob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc051bWJlcihvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IE51bWJlcl0nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuZnVuY3Rpb24gaXNCb29sZWFuKG9iaikgeyByZXR1cm4gdG9TdHIob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuXG4vLyBTeW1ib2wgYW5kIEJpZ0ludCBkbyBoYXZlIFN5bWJvbC50b1N0cmluZ1RhZyBieSBzcGVjLCBzbyB0aGF0IGNhbid0IGJlIHVzZWQgdG8gZWxpbWluYXRlIGZhbHNlIHBvc2l0aXZlc1xuZnVuY3Rpb24gaXNTeW1ib2wob2JqKSB7XG4gICAgaWYgKGhhc1NoYW1tZWRTeW1ib2xzKSB7XG4gICAgICAgIHJldHVybiBvYmogJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqIGluc3RhbmNlb2YgU3ltYm9sO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8ICFzeW1Ub1N0cmluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHN5bVRvU3RyaW5nLmNhbGwob2JqKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzQmlnSW50KG9iaikge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8ICFiaWdJbnRWYWx1ZU9mKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgYmlnSW50VmFsdWVPZi5jYWxsKG9iaik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSB8fCBmdW5jdGlvbiAoa2V5KSB7IHJldHVybiBrZXkgaW4gdGhpczsgfTtcbmZ1bmN0aW9uIGhhcyhvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd24uY2FsbChvYmosIGtleSk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyKG9iaikge1xuICAgIHJldHVybiBvYmplY3RUb1N0cmluZy5jYWxsKG9iaik7XG59XG5cbmZ1bmN0aW9uIG5hbWVPZihmKSB7XG4gICAgaWYgKGYubmFtZSkgeyByZXR1cm4gZi5uYW1lOyB9XG4gICAgdmFyIG0gPSAkbWF0Y2guY2FsbChmdW5jdGlvblRvU3RyaW5nLmNhbGwoZiksIC9eZnVuY3Rpb25cXHMqKFtcXHckXSspLyk7XG4gICAgaWYgKG0pIHsgcmV0dXJuIG1bMV07IH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaW5kZXhPZih4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSB7IHJldHVybiB4cy5pbmRleE9mKHgpOyB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHhzW2ldID09PSB4KSB7IHJldHVybiBpOyB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gaXNNYXAoeCkge1xuICAgIGlmICghbWFwU2l6ZSB8fCAheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBtYXBTaXplLmNhbGwoeCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzZXRTaXplLmNhbGwoeCk7XG4gICAgICAgIH0gY2F0Y2ggKHMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4IGluc3RhbmNlb2YgTWFwOyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNXZWFrTWFwKHgpIHtcbiAgICBpZiAoIXdlYWtNYXBIYXMgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgd2Vha01hcEhhcy5jYWxsKHgsIHdlYWtNYXBIYXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2Vha1NldEhhcy5jYWxsKHgsIHdlYWtTZXRIYXMpO1xuICAgICAgICB9IGNhdGNoIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIFdlYWtNYXA7IC8vIGNvcmUtanMgd29ya2Fyb3VuZCwgcHJlLXYyLjUuMFxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dlYWtSZWYoeCkge1xuICAgIGlmICghd2Vha1JlZkRlcmVmIHx8ICF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHdlYWtSZWZEZXJlZi5jYWxsKHgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNTZXQoeCkge1xuICAgIGlmICghc2V0U2l6ZSB8fCAheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBzZXRTaXplLmNhbGwoeCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBtYXBTaXplLmNhbGwoeCk7XG4gICAgICAgIH0gY2F0Y2ggKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4IGluc3RhbmNlb2YgU2V0OyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNXZWFrU2V0KHgpIHtcbiAgICBpZiAoIXdlYWtTZXRIYXMgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgd2Vha1NldEhhcy5jYWxsKHgsIHdlYWtTZXRIYXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2Vha01hcEhhcy5jYWxsKHgsIHdlYWtNYXBIYXMpO1xuICAgICAgICB9IGNhdGNoIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIFdlYWtTZXQ7IC8vIGNvcmUtanMgd29ya2Fyb3VuZCwgcHJlLXYyLjUuMFxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0VsZW1lbnQoeCkge1xuICAgIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgeCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIHgubm9kZU5hbWUgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB4LmdldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaW5zcGVjdFN0cmluZyhzdHIsIG9wdHMpIHtcbiAgICBpZiAoc3RyLmxlbmd0aCA+IG9wdHMubWF4U3RyaW5nTGVuZ3RoKSB7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSBzdHIubGVuZ3RoIC0gb3B0cy5tYXhTdHJpbmdMZW5ndGg7XG4gICAgICAgIHZhciB0cmFpbGVyID0gJy4uLiAnICsgcmVtYWluaW5nICsgJyBtb3JlIGNoYXJhY3RlcicgKyAocmVtYWluaW5nID4gMSA/ICdzJyA6ICcnKTtcbiAgICAgICAgcmV0dXJuIGluc3BlY3RTdHJpbmcoJHNsaWNlLmNhbGwoc3RyLCAwLCBvcHRzLm1heFN0cmluZ0xlbmd0aCksIG9wdHMpICsgdHJhaWxlcjtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbiAgICB2YXIgcyA9ICRyZXBsYWNlLmNhbGwoJHJlcGxhY2UuY2FsbChzdHIsIC8oWydcXFxcXSkvZywgJ1xcXFwkMScpLCAvW1xceDAwLVxceDFmXS9nLCBsb3dieXRlKTtcbiAgICByZXR1cm4gd3JhcFF1b3RlcyhzLCAnc2luZ2xlJywgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIGxvd2J5dGUoYykge1xuICAgIHZhciBuID0gYy5jaGFyQ29kZUF0KDApO1xuICAgIHZhciB4ID0ge1xuICAgICAgICA4OiAnYicsXG4gICAgICAgIDk6ICd0JyxcbiAgICAgICAgMTA6ICduJyxcbiAgICAgICAgMTI6ICdmJyxcbiAgICAgICAgMTM6ICdyJ1xuICAgIH1bbl07XG4gICAgaWYgKHgpIHsgcmV0dXJuICdcXFxcJyArIHg7IH1cbiAgICByZXR1cm4gJ1xcXFx4JyArIChuIDwgMHgxMCA/ICcwJyA6ICcnKSArICR0b1VwcGVyQ2FzZS5jYWxsKG4udG9TdHJpbmcoMTYpKTtcbn1cblxuZnVuY3Rpb24gbWFya0JveGVkKHN0cikge1xuICAgIHJldHVybiAnT2JqZWN0KCcgKyBzdHIgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHdlYWtDb2xsZWN0aW9uT2YodHlwZSkge1xuICAgIHJldHVybiB0eXBlICsgJyB7ID8gfSc7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3Rpb25PZih0eXBlLCBzaXplLCBlbnRyaWVzLCBpbmRlbnQpIHtcbiAgICB2YXIgam9pbmVkRW50cmllcyA9IGluZGVudCA/IGluZGVudGVkSm9pbihlbnRyaWVzLCBpbmRlbnQpIDogJGpvaW4uY2FsbChlbnRyaWVzLCAnLCAnKTtcbiAgICByZXR1cm4gdHlwZSArICcgKCcgKyBzaXplICsgJykgeycgKyBqb2luZWRFbnRyaWVzICsgJ30nO1xufVxuXG5mdW5jdGlvbiBzaW5nbGVMaW5lVmFsdWVzKHhzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaW5kZXhPZih4c1tpXSwgJ1xcbicpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5kZW50KG9wdHMsIGRlcHRoKSB7XG4gICAgdmFyIGJhc2VJbmRlbnQ7XG4gICAgaWYgKG9wdHMuaW5kZW50ID09PSAnXFx0Jykge1xuICAgICAgICBiYXNlSW5kZW50ID0gJ1xcdCc7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0cy5pbmRlbnQgPT09ICdudW1iZXInICYmIG9wdHMuaW5kZW50ID4gMCkge1xuICAgICAgICBiYXNlSW5kZW50ID0gJGpvaW4uY2FsbChBcnJheShvcHRzLmluZGVudCArIDEpLCAnICcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBiYXNlOiBiYXNlSW5kZW50LFxuICAgICAgICBwcmV2OiAkam9pbi5jYWxsKEFycmF5KGRlcHRoICsgMSksIGJhc2VJbmRlbnQpXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaW5kZW50ZWRKb2luKHhzLCBpbmRlbnQpIHtcbiAgICBpZiAoeHMubGVuZ3RoID09PSAwKSB7IHJldHVybiAnJzsgfVxuICAgIHZhciBsaW5lSm9pbmVyID0gJ1xcbicgKyBpbmRlbnQucHJldiArIGluZGVudC5iYXNlO1xuICAgIHJldHVybiBsaW5lSm9pbmVyICsgJGpvaW4uY2FsbCh4cywgJywnICsgbGluZUpvaW5lcikgKyAnXFxuJyArIGluZGVudC5wcmV2O1xufVxuXG5mdW5jdGlvbiBhcnJPYmpLZXlzKG9iaiwgaW5zcGVjdCkge1xuICAgIHZhciBpc0FyciA9IGlzQXJyYXkob2JqKTtcbiAgICB2YXIgeHMgPSBbXTtcbiAgICBpZiAoaXNBcnIpIHtcbiAgICAgICAgeHMubGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHhzW2ldID0gaGFzKG9iaiwgaSkgPyBpbnNwZWN0KG9ialtpXSwgb2JqKSA6ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBzeW1zID0gdHlwZW9mIGdPUFMgPT09ICdmdW5jdGlvbicgPyBnT1BTKG9iaikgOiBbXTtcbiAgICB2YXIgc3ltTWFwO1xuICAgIGlmIChoYXNTaGFtbWVkU3ltYm9scykge1xuICAgICAgICBzeW1NYXAgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzeW1zLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICBzeW1NYXBbJyQnICsgc3ltc1trXV0gPSBzeW1zW2tdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgICAgIGlmICghaGFzKG9iaiwga2V5KSkgeyBjb250aW51ZTsgfSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4LCBuby1jb250aW51ZVxuICAgICAgICBpZiAoaXNBcnIgJiYgU3RyaW5nKE51bWJlcihrZXkpKSA9PT0ga2V5ICYmIGtleSA8IG9iai5sZW5ndGgpIHsgY29udGludWU7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheCwgbm8tY29udGludWVcbiAgICAgICAgaWYgKGhhc1NoYW1tZWRTeW1ib2xzICYmIHN5bU1hcFsnJCcgKyBrZXldIGluc3RhbmNlb2YgU3ltYm9sKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIHRvIHByZXZlbnQgc2hhbW1lZCBTeW1ib2xzLCB3aGljaCBhcmUgc3RvcmVkIGFzIHN0cmluZ3MsIGZyb20gYmVpbmcgaW5jbHVkZWQgaW4gdGhlIHN0cmluZyBrZXkgc2VjdGlvblxuICAgICAgICAgICAgY29udGludWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXgsIG5vLWNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoJHRlc3QuY2FsbCgvW15cXHckXS8sIGtleSkpIHtcbiAgICAgICAgICAgIHhzLnB1c2goaW5zcGVjdChrZXksIG9iaikgKyAnOiAnICsgaW5zcGVjdChvYmpba2V5XSwgb2JqKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4cy5wdXNoKGtleSArICc6ICcgKyBpbnNwZWN0KG9ialtrZXldLCBvYmopKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGdPUFMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzeW1zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoaXNFbnVtZXJhYmxlLmNhbGwob2JqLCBzeW1zW2pdKSkge1xuICAgICAgICAgICAgICAgIHhzLnB1c2goJ1snICsgaW5zcGVjdChzeW1zW2pdKSArICddOiAnICsgaW5zcGVjdChvYmpbc3ltc1tqXV0sIG9iaikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB4cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdldEludHJpbnNpYyA9IHJlcXVpcmUoJ2dldC1pbnRyaW5zaWMnKTtcbnZhciBjYWxsQm91bmQgPSByZXF1aXJlKCdjYWxsLWJpbmQvY2FsbEJvdW5kJyk7XG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoJ29iamVjdC1pbnNwZWN0Jyk7XG5cbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcbnZhciAkV2Vha01hcCA9IEdldEludHJpbnNpYygnJVdlYWtNYXAlJywgdHJ1ZSk7XG52YXIgJE1hcCA9IEdldEludHJpbnNpYygnJU1hcCUnLCB0cnVlKTtcblxudmFyICR3ZWFrTWFwR2V0ID0gY2FsbEJvdW5kKCdXZWFrTWFwLnByb3RvdHlwZS5nZXQnLCB0cnVlKTtcbnZhciAkd2Vha01hcFNldCA9IGNhbGxCb3VuZCgnV2Vha01hcC5wcm90b3R5cGUuc2V0JywgdHJ1ZSk7XG52YXIgJHdlYWtNYXBIYXMgPSBjYWxsQm91bmQoJ1dlYWtNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xudmFyICRtYXBHZXQgPSBjYWxsQm91bmQoJ01hcC5wcm90b3R5cGUuZ2V0JywgdHJ1ZSk7XG52YXIgJG1hcFNldCA9IGNhbGxCb3VuZCgnTWFwLnByb3RvdHlwZS5zZXQnLCB0cnVlKTtcbnZhciAkbWFwSGFzID0gY2FsbEJvdW5kKCdNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xuXG4vKlxuKiBUaGlzIGZ1bmN0aW9uIHRyYXZlcnNlcyB0aGUgbGlzdCByZXR1cm5pbmcgdGhlIG5vZGUgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4ga2V5LlxuKlxuKiBUaGF0IG5vZGUgaXMgYWxzbyBtb3ZlZCB0byB0aGUgaGVhZCBvZiB0aGUgbGlzdCwgc28gdGhhdCBpZiBpdCdzIGFjY2Vzc2VkIGFnYWluIHdlIGRvbid0IG5lZWQgdG8gdHJhdmVyc2UgdGhlIHdob2xlIGxpc3QuIEJ5IGRvaW5nIHNvLCBhbGwgdGhlIHJlY2VudGx5IHVzZWQgbm9kZXMgY2FuIGJlIGFjY2Vzc2VkIHJlbGF0aXZlbHkgcXVpY2tseS5cbiovXG4vKiogQHR5cGUge2ltcG9ydCgnLicpLmxpc3RHZXROb2RlfSAqL1xudmFyIGxpc3RHZXROb2RlID0gZnVuY3Rpb24gKGxpc3QsIGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG5cdC8qKiBAdHlwZSB7dHlwZW9mIGxpc3QgfCBOb25OdWxsYWJsZTwodHlwZW9mIGxpc3QpWyduZXh0J10+fSAqL1xuXHR2YXIgcHJldiA9IGxpc3Q7XG5cdC8qKiBAdHlwZSB7KHR5cGVvZiBsaXN0KVsnbmV4dCddfSAqL1xuXHR2YXIgY3Vycjtcblx0Zm9yICg7IChjdXJyID0gcHJldi5uZXh0KSAhPT0gbnVsbDsgcHJldiA9IGN1cnIpIHtcblx0XHRpZiAoY3Vyci5rZXkgPT09IGtleSkge1xuXHRcdFx0cHJldi5uZXh0ID0gY3Vyci5uZXh0O1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV4dHJhLXBhcmVuc1xuXHRcdFx0Y3Vyci5uZXh0ID0gLyoqIEB0eXBlIHtOb25OdWxsYWJsZTx0eXBlb2YgbGlzdC5uZXh0Pn0gKi8gKGxpc3QubmV4dCk7XG5cdFx0XHRsaXN0Lm5leHQgPSBjdXJyOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRyZXR1cm4gY3Vycjtcblx0XHR9XG5cdH1cbn07XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuJykubGlzdEdldH0gKi9cbnZhciBsaXN0R2V0ID0gZnVuY3Rpb24gKG9iamVjdHMsIGtleSkge1xuXHR2YXIgbm9kZSA9IGxpc3RHZXROb2RlKG9iamVjdHMsIGtleSk7XG5cdHJldHVybiBub2RlICYmIG5vZGUudmFsdWU7XG59O1xuLyoqIEB0eXBlIHtpbXBvcnQoJy4nKS5saXN0U2V0fSAqL1xudmFyIGxpc3RTZXQgPSBmdW5jdGlvbiAob2JqZWN0cywga2V5LCB2YWx1ZSkge1xuXHR2YXIgbm9kZSA9IGxpc3RHZXROb2RlKG9iamVjdHMsIGtleSk7XG5cdGlmIChub2RlKSB7XG5cdFx0bm9kZS52YWx1ZSA9IHZhbHVlO1xuXHR9IGVsc2Uge1xuXHRcdC8vIFByZXBlbmQgdGhlIG5ldyBub2RlIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3Rcblx0XHRvYmplY3RzLm5leHQgPSAvKiogQHR5cGUge2ltcG9ydCgnLicpLkxpc3ROb2RlPHR5cGVvZiB2YWx1ZT59ICovICh7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ24sIG5vLWV4dHJhLXBhcmVuc1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHRuZXh0OiBvYmplY3RzLm5leHQsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9KTtcblx0fVxufTtcbi8qKiBAdHlwZSB7aW1wb3J0KCcuJykubGlzdEhhc30gKi9cbnZhciBsaXN0SGFzID0gZnVuY3Rpb24gKG9iamVjdHMsIGtleSkge1xuXHRyZXR1cm4gISFsaXN0R2V0Tm9kZShvYmplY3RzLCBrZXkpO1xufTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4nKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0U2lkZUNoYW5uZWwoKSB7XG5cdC8qKiBAdHlwZSB7V2Vha01hcDxvYmplY3QsIHVua25vd24+fSAqLyB2YXIgJHdtO1xuXHQvKiogQHR5cGUge01hcDxvYmplY3QsIHVua25vd24+fSAqLyB2YXIgJG07XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCcuJykuUm9vdE5vZGU8dW5rbm93bj59ICovIHZhciAkbztcblxuXHQvKiogQHR5cGUge2ltcG9ydCgnLicpLkNoYW5uZWx9ICovXG5cdHZhciBjaGFubmVsID0ge1xuXHRcdGFzc2VydDogZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0aWYgKCFjaGFubmVsLmhhcyhrZXkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdTaWRlIGNoYW5uZWwgZG9lcyBub3QgY29udGFpbiAnICsgaW5zcGVjdChrZXkpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGdldDogZnVuY3Rpb24gKGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG5cdFx0XHRpZiAoJFdlYWtNYXAgJiYga2V5ICYmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHRpZiAoJHdtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICR3ZWFrTWFwR2V0KCR3bSwga2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICgkTWFwKSB7XG5cdFx0XHRcdGlmICgkbSkge1xuXHRcdFx0XHRcdHJldHVybiAkbWFwR2V0KCRtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoJG8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcblx0XHRcdFx0XHRyZXR1cm4gbGlzdEdldCgkbywga2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aGFzOiBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRpZiAoJFdlYWtNYXAgJiYga2V5ICYmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHRpZiAoJHdtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICR3ZWFrTWFwSGFzKCR3bSwga2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICgkTWFwKSB7XG5cdFx0XHRcdGlmICgkbSkge1xuXHRcdFx0XHRcdHJldHVybiAkbWFwSGFzKCRtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoJG8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcblx0XHRcdFx0XHRyZXR1cm4gbGlzdEhhcygkbywga2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cdFx0c2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdFx0aWYgKCRXZWFrTWFwICYmIGtleSAmJiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGtleSA9PT0gJ2Z1bmN0aW9uJykpIHtcblx0XHRcdFx0aWYgKCEkd20pIHtcblx0XHRcdFx0XHQkd20gPSBuZXcgJFdlYWtNYXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQkd2Vha01hcFNldCgkd20sIGtleSwgdmFsdWUpO1xuXHRcdFx0fSBlbHNlIGlmICgkTWFwKSB7XG5cdFx0XHRcdGlmICghJG0pIHtcblx0XHRcdFx0XHQkbSA9IG5ldyAkTWFwKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JG1hcFNldCgkbSwga2V5LCB2YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoISRvKSB7XG5cdFx0XHRcdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgbGlua2VkIGxpc3QgYXMgYW4gZW1wdHkgbm9kZSwgc28gdGhhdCB3ZSBkb24ndCBoYXZlIHRvIHNwZWNpYWwtY2FzZSBoYW5kbGluZyBvZiB0aGUgZmlyc3Qgbm9kZTogd2UgY2FuIGFsd2F5cyByZWZlciB0byBpdCBhcyAocHJldmlvdXMgbm9kZSkubmV4dCwgaW5zdGVhZCBvZiBzb21ldGhpbmcgbGlrZSAobGlzdCkuaGVhZFxuXHRcdFx0XHRcdCRvID0geyBrZXk6IHt9LCBuZXh0OiBudWxsIH07XG5cdFx0XHRcdH1cblx0XHRcdFx0bGlzdFNldCgkbywga2V5LCB2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gY2hhbm5lbDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZXBsYWNlID0gU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlO1xudmFyIHBlcmNlbnRUd2VudGllcyA9IC8lMjAvZztcblxudmFyIEZvcm1hdCA9IHtcbiAgICBSRkMxNzM4OiAnUkZDMTczOCcsXG4gICAgUkZDMzk4NjogJ1JGQzM5ODYnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnZGVmYXVsdCc6IEZvcm1hdC5SRkMzOTg2LFxuICAgIGZvcm1hdHRlcnM6IHtcbiAgICAgICAgUkZDMTczODogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZS5jYWxsKHZhbHVlLCBwZXJjZW50VHdlbnRpZXMsICcrJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFJGQzM5ODY6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFJGQzE3Mzg6IEZvcm1hdC5SRkMxNzM4LFxuICAgIFJGQzM5ODY6IEZvcm1hdC5SRkMzOTg2XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxudmFyIGhleFRhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gICAgICAgIGFycmF5LnB1c2goJyUnICsgKChpIDwgMTYgPyAnMCcgOiAnJykgKyBpLnRvU3RyaW5nKDE2KSkudG9VcHBlckNhc2UoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycmF5O1xufSgpKTtcblxudmFyIGNvbXBhY3RRdWV1ZSA9IGZ1bmN0aW9uIGNvbXBhY3RRdWV1ZShxdWV1ZSkge1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgIHZhciBpdGVtID0gcXVldWUucG9wKCk7XG4gICAgICAgIHZhciBvYmogPSBpdGVtLm9ialtpdGVtLnByb3BdO1xuXG4gICAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgIHZhciBjb21wYWN0ZWQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9ialtqXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFjdGVkLnB1c2gob2JqW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGl0ZW0ub2JqW2l0ZW0ucHJvcF0gPSBjb21wYWN0ZWQ7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgYXJyYXlUb09iamVjdCA9IGZ1bmN0aW9uIGFycmF5VG9PYmplY3Qoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbaV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvYmpbaV0gPSBzb3VyY2VbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxudmFyIG1lcmdlID0gZnVuY3Rpb24gbWVyZ2UodGFyZ2V0LCBzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICAvKiBlc2xpbnQgbm8tcGFyYW0tcmVhc3NpZ246IDAgKi9cbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgICB0YXJnZXQucHVzaChzb3VyY2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKChvcHRpb25zICYmIChvcHRpb25zLnBsYWluT2JqZWN0cyB8fCBvcHRpb25zLmFsbG93UHJvdG90eXBlcykpIHx8ICFoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W3NvdXJjZV0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFt0YXJnZXQsIHNvdXJjZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIGlmICghdGFyZ2V0IHx8IHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBbdGFyZ2V0XS5jb25jYXQoc291cmNlKTtcbiAgICB9XG5cbiAgICB2YXIgbWVyZ2VUYXJnZXQgPSB0YXJnZXQ7XG4gICAgaWYgKGlzQXJyYXkodGFyZ2V0KSAmJiAhaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgIG1lcmdlVGFyZ2V0ID0gYXJyYXlUb09iamVjdCh0YXJnZXQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChpc0FycmF5KHRhcmdldCkgJiYgaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgIHNvdXJjZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpKSB7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwodGFyZ2V0LCBpKSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJdGVtID0gdGFyZ2V0W2ldO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRJdGVtICYmIHR5cGVvZiB0YXJnZXRJdGVtID09PSAnb2JqZWN0JyAmJiBpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSBtZXJnZSh0YXJnZXRJdGVtLCBpdGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG5cbiAgICAgICAgaWYgKGhhcy5jYWxsKGFjYywga2V5KSkge1xuICAgICAgICAgICAgYWNjW2tleV0gPSBtZXJnZShhY2Nba2V5XSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIG1lcmdlVGFyZ2V0KTtcbn07XG5cbnZhciBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ25TaW5nbGVTb3VyY2UodGFyZ2V0LCBzb3VyY2UpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoc291cmNlKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywga2V5KSB7XG4gICAgICAgIGFjY1trZXldID0gc291cmNlW2tleV07XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgdGFyZ2V0KTtcbn07XG5cbnZhciBkZWNvZGUgPSBmdW5jdGlvbiAoc3RyLCBkZWNvZGVyLCBjaGFyc2V0KSB7XG4gICAgdmFyIHN0cldpdGhvdXRQbHVzID0gc3RyLnJlcGxhY2UoL1xcKy9nLCAnICcpO1xuICAgIGlmIChjaGFyc2V0ID09PSAnaXNvLTg4NTktMScpIHtcbiAgICAgICAgLy8gdW5lc2NhcGUgbmV2ZXIgdGhyb3dzLCBubyB0cnkuLi5jYXRjaCBuZWVkZWQ6XG4gICAgICAgIHJldHVybiBzdHJXaXRob3V0UGx1cy5yZXBsYWNlKC8lWzAtOWEtZl17Mn0vZ2ksIHVuZXNjYXBlKTtcbiAgICB9XG4gICAgLy8gdXRmLThcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cldpdGhvdXRQbHVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBzdHJXaXRob3V0UGx1cztcbiAgICB9XG59O1xuXG52YXIgbGltaXQgPSAxMDI0O1xuXG4vKiBlc2xpbnQgb3BlcmF0b3ItbGluZWJyZWFrOiBbMiwgXCJiZWZvcmVcIl0gKi9cblxudmFyIGVuY29kZSA9IGZ1bmN0aW9uIGVuY29kZShzdHIsIGRlZmF1bHRFbmNvZGVyLCBjaGFyc2V0LCBraW5kLCBmb3JtYXQpIHtcbiAgICAvLyBUaGlzIGNvZGUgd2FzIG9yaWdpbmFsbHkgd3JpdHRlbiBieSBCcmlhbiBXaGl0ZSAobXNjZGV4KSBmb3IgdGhlIGlvLmpzIGNvcmUgcXVlcnlzdHJpbmcgbGlicmFyeS5cbiAgICAvLyBJdCBoYXMgYmVlbiBhZGFwdGVkIGhlcmUgZm9yIHN0cmljdGVyIGFkaGVyZW5jZSB0byBSRkMgMzk4NlxuICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgdmFyIHN0cmluZyA9IHN0cjtcbiAgICBpZiAodHlwZW9mIHN0ciA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgc3RyaW5nID0gU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN0cik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgICBzdHJpbmcgPSBTdHJpbmcoc3RyKTtcbiAgICB9XG5cbiAgICBpZiAoY2hhcnNldCA9PT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGUoc3RyaW5nKS5yZXBsYWNlKC8ldVswLTlhLWZdezR9L2dpLCBmdW5jdGlvbiAoJDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJTI2JTIzJyArIHBhcnNlSW50KCQwLnNsaWNlKDIpLCAxNikgKyAnJTNCJztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIG91dCA9ICcnO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RyaW5nLmxlbmd0aDsgaiArPSBsaW1pdCkge1xuICAgICAgICB2YXIgc2VnbWVudCA9IHN0cmluZy5sZW5ndGggPj0gbGltaXQgPyBzdHJpbmcuc2xpY2UoaiwgaiArIGxpbWl0KSA6IHN0cmluZztcbiAgICAgICAgdmFyIGFyciA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VnbWVudC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGMgPSBzZWdtZW50LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgYyA9PT0gMHgyRCAvLyAtXG4gICAgICAgICAgICAgICAgfHwgYyA9PT0gMHgyRSAvLyAuXG4gICAgICAgICAgICAgICAgfHwgYyA9PT0gMHg1RiAvLyBfXG4gICAgICAgICAgICAgICAgfHwgYyA9PT0gMHg3RSAvLyB+XG4gICAgICAgICAgICAgICAgfHwgKGMgPj0gMHgzMCAmJiBjIDw9IDB4MzkpIC8vIDAtOVxuICAgICAgICAgICAgICAgIHx8IChjID49IDB4NDEgJiYgYyA8PSAweDVBKSAvLyBhLXpcbiAgICAgICAgICAgICAgICB8fCAoYyA+PSAweDYxICYmIGMgPD0gMHg3QSkgLy8gQS1aXG4gICAgICAgICAgICAgICAgfHwgKGZvcm1hdCA9PT0gZm9ybWF0cy5SRkMxNzM4ICYmIChjID09PSAweDI4IHx8IGMgPT09IDB4MjkpKSAvLyAoIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGFyclthcnIubGVuZ3RoXSA9IHNlZ21lbnQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYyA8IDB4ODApIHtcbiAgICAgICAgICAgICAgICBhcnJbYXJyLmxlbmd0aF0gPSBoZXhUYWJsZVtjXTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgICAgIGFyclthcnIubGVuZ3RoXSA9IGhleFRhYmxlWzB4QzAgfCAoYyA+PiA2KV1cbiAgICAgICAgICAgICAgICAgICAgKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjIDwgMHhEODAwIHx8IGMgPj0gMHhFMDAwKSB7XG4gICAgICAgICAgICAgICAgYXJyW2Fyci5sZW5ndGhdID0gaGV4VGFibGVbMHhFMCB8IChjID4+IDEyKV1cbiAgICAgICAgICAgICAgICAgICAgKyBoZXhUYWJsZVsweDgwIHwgKChjID4+IDYpICYgMHgzRildXG4gICAgICAgICAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8IChjICYgMHgzRildO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgICBjID0gMHgxMDAwMCArICgoKGMgJiAweDNGRikgPDwgMTApIHwgKHNlZ21lbnQuY2hhckNvZGVBdChpKSAmIDB4M0ZGKSk7XG5cbiAgICAgICAgICAgIGFyclthcnIubGVuZ3RoXSA9IGhleFRhYmxlWzB4RjAgfCAoYyA+PiAxOCldXG4gICAgICAgICAgICAgICAgKyBoZXhUYWJsZVsweDgwIHwgKChjID4+IDEyKSAmIDB4M0YpXVxuICAgICAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXVxuICAgICAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8IChjICYgMHgzRildO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0ICs9IGFyci5qb2luKCcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxudmFyIGNvbXBhY3QgPSBmdW5jdGlvbiBjb21wYWN0KHZhbHVlKSB7XG4gICAgdmFyIHF1ZXVlID0gW3sgb2JqOiB7IG86IHZhbHVlIH0sIHByb3A6ICdvJyB9XTtcbiAgICB2YXIgcmVmcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgaXRlbSA9IHF1ZXVlW2ldO1xuICAgICAgICB2YXIgb2JqID0gaXRlbS5vYmpbaXRlbS5wcm9wXTtcblxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwga2V5cy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbal07XG4gICAgICAgICAgICB2YXIgdmFsID0gb2JqW2tleV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgJiYgdmFsICE9PSBudWxsICYmIHJlZnMuaW5kZXhPZih2YWwpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goeyBvYmo6IG9iaiwgcHJvcDoga2V5IH0pO1xuICAgICAgICAgICAgICAgIHJlZnMucHVzaCh2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcGFjdFF1ZXVlKHF1ZXVlKTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cbnZhciBpc1JlZ0V4cCA9IGZ1bmN0aW9uIGlzUmVnRXhwKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59O1xuXG52YXIgaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlcihvYmopIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuICEhKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iaikpO1xufTtcblxudmFyIGNvbWJpbmUgPSBmdW5jdGlvbiBjb21iaW5lKGEsIGIpIHtcbiAgICByZXR1cm4gW10uY29uY2F0KGEsIGIpO1xufTtcblxudmFyIG1heWJlTWFwID0gZnVuY3Rpb24gbWF5YmVNYXAodmFsLCBmbikge1xuICAgIGlmIChpc0FycmF5KHZhbCkpIHtcbiAgICAgICAgdmFyIG1hcHBlZCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgbWFwcGVkLnB1c2goZm4odmFsW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICB9XG4gICAgcmV0dXJuIGZuKHZhbCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhcnJheVRvT2JqZWN0OiBhcnJheVRvT2JqZWN0LFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGNvbWJpbmU6IGNvbWJpbmUsXG4gICAgY29tcGFjdDogY29tcGFjdCxcbiAgICBkZWNvZGU6IGRlY29kZSxcbiAgICBlbmNvZGU6IGVuY29kZSxcbiAgICBpc0J1ZmZlcjogaXNCdWZmZXIsXG4gICAgaXNSZWdFeHA6IGlzUmVnRXhwLFxuICAgIG1heWJlTWFwOiBtYXliZU1hcCxcbiAgICBtZXJnZTogbWVyZ2Vcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTaWRlQ2hhbm5lbCA9IHJlcXVpcmUoJ3NpZGUtY2hhbm5lbCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGZvcm1hdHMgPSByZXF1aXJlKCcuL2Zvcm1hdHMnKTtcbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgYXJyYXlQcmVmaXhHZW5lcmF0b3JzID0ge1xuICAgIGJyYWNrZXRzOiBmdW5jdGlvbiBicmFja2V0cyhwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeCArICdbXSc7XG4gICAgfSxcbiAgICBjb21tYTogJ2NvbW1hJyxcbiAgICBpbmRpY2VzOiBmdW5jdGlvbiBpbmRpY2VzKHByZWZpeCwga2V5KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggKyAnWycgKyBrZXkgKyAnXSc7XG4gICAgfSxcbiAgICByZXBlYXQ6IGZ1bmN0aW9uIHJlcGVhdChwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeDtcbiAgICB9XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIHB1c2hUb0FycmF5ID0gZnVuY3Rpb24gKGFyciwgdmFsdWVPckFycmF5KSB7XG4gICAgcHVzaC5hcHBseShhcnIsIGlzQXJyYXkodmFsdWVPckFycmF5KSA/IHZhbHVlT3JBcnJheSA6IFt2YWx1ZU9yQXJyYXldKTtcbn07XG5cbnZhciB0b0lTTyA9IERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nO1xuXG52YXIgZGVmYXVsdEZvcm1hdCA9IGZvcm1hdHNbJ2RlZmF1bHQnXTtcbnZhciBkZWZhdWx0cyA9IHtcbiAgICBhZGRRdWVyeVByZWZpeDogZmFsc2UsXG4gICAgYWxsb3dEb3RzOiBmYWxzZSxcbiAgICBhbGxvd0VtcHR5QXJyYXlzOiBmYWxzZSxcbiAgICBhcnJheUZvcm1hdDogJ2luZGljZXMnLFxuICAgIGNoYXJzZXQ6ICd1dGYtOCcsXG4gICAgY2hhcnNldFNlbnRpbmVsOiBmYWxzZSxcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBlbmNvZGU6IHRydWUsXG4gICAgZW5jb2RlRG90SW5LZXlzOiBmYWxzZSxcbiAgICBlbmNvZGVyOiB1dGlscy5lbmNvZGUsXG4gICAgZW5jb2RlVmFsdWVzT25seTogZmFsc2UsXG4gICAgZm9ybWF0OiBkZWZhdWx0Rm9ybWF0LFxuICAgIGZvcm1hdHRlcjogZm9ybWF0cy5mb3JtYXR0ZXJzW2RlZmF1bHRGb3JtYXRdLFxuICAgIC8vIGRlcHJlY2F0ZWRcbiAgICBpbmRpY2VzOiBmYWxzZSxcbiAgICBzZXJpYWxpemVEYXRlOiBmdW5jdGlvbiBzZXJpYWxpemVEYXRlKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRvSVNPLmNhbGwoZGF0ZSk7XG4gICAgfSxcbiAgICBza2lwTnVsbHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBpc05vbk51bGxpc2hQcmltaXRpdmUgPSBmdW5jdGlvbiBpc05vbk51bGxpc2hQcmltaXRpdmUodikge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gJ3N0cmluZydcbiAgICAgICAgfHwgdHlwZW9mIHYgPT09ICdudW1iZXInXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnYm9vbGVhbidcbiAgICAgICAgfHwgdHlwZW9mIHYgPT09ICdzeW1ib2wnXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnYmlnaW50Jztcbn07XG5cbnZhciBzZW50aW5lbCA9IHt9O1xuXG52YXIgc3RyaW5naWZ5ID0gZnVuY3Rpb24gc3RyaW5naWZ5KFxuICAgIG9iamVjdCxcbiAgICBwcmVmaXgsXG4gICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICBjb21tYVJvdW5kVHJpcCxcbiAgICBhbGxvd0VtcHR5QXJyYXlzLFxuICAgIHN0cmljdE51bGxIYW5kbGluZyxcbiAgICBza2lwTnVsbHMsXG4gICAgZW5jb2RlRG90SW5LZXlzLFxuICAgIGVuY29kZXIsXG4gICAgZmlsdGVyLFxuICAgIHNvcnQsXG4gICAgYWxsb3dEb3RzLFxuICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgZm9ybWF0LFxuICAgIGZvcm1hdHRlcixcbiAgICBlbmNvZGVWYWx1ZXNPbmx5LFxuICAgIGNoYXJzZXQsXG4gICAgc2lkZUNoYW5uZWxcbikge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG5cbiAgICB2YXIgdG1wU2MgPSBzaWRlQ2hhbm5lbDtcbiAgICB2YXIgc3RlcCA9IDA7XG4gICAgdmFyIGZpbmRGbGFnID0gZmFsc2U7XG4gICAgd2hpbGUgKCh0bXBTYyA9IHRtcFNjLmdldChzZW50aW5lbCkpICE9PSB2b2lkIHVuZGVmaW5lZCAmJiAhZmluZEZsYWcpIHtcbiAgICAgICAgLy8gV2hlcmUgb2JqZWN0IGxhc3QgYXBwZWFyZWQgaW4gdGhlIHJlZiB0cmVlXG4gICAgICAgIHZhciBwb3MgPSB0bXBTYy5nZXQob2JqZWN0KTtcbiAgICAgICAgc3RlcCArPSAxO1xuICAgICAgICBpZiAodHlwZW9mIHBvcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChwb3MgPT09IHN0ZXApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQ3ljbGljIG9iamVjdCB2YWx1ZScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaW5kRmxhZyA9IHRydWU7IC8vIEJyZWFrIHdoaWxlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0bXBTYy5nZXQoc2VudGluZWwpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc3RlcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmogPSBmaWx0ZXIocHJlZml4LCBvYmopO1xuICAgIH0gZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICBvYmogPSBzZXJpYWxpemVEYXRlKG9iaik7XG4gICAgfSBlbHNlIGlmIChnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGlzQXJyYXkob2JqKSkge1xuICAgICAgICBvYmogPSB1dGlscy5tYXliZU1hcChvYmosIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVEYXRlKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoc3RyaWN0TnVsbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlciAmJiAhZW5jb2RlVmFsdWVzT25seSA/IGVuY29kZXIocHJlZml4LCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAna2V5JywgZm9ybWF0KSA6IHByZWZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iaiA9ICcnO1xuICAgIH1cblxuICAgIGlmIChpc05vbk51bGxpc2hQcmltaXRpdmUob2JqKSB8fCB1dGlscy5pc0J1ZmZlcihvYmopKSB7XG4gICAgICAgIGlmIChlbmNvZGVyKSB7XG4gICAgICAgICAgICB2YXIga2V5VmFsdWUgPSBlbmNvZGVWYWx1ZXNPbmx5ID8gcHJlZml4IDogZW5jb2RlcihwcmVmaXgsIGRlZmF1bHRzLmVuY29kZXIsIGNoYXJzZXQsICdrZXknLCBmb3JtYXQpO1xuICAgICAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIoa2V5VmFsdWUpICsgJz0nICsgZm9ybWF0dGVyKGVuY29kZXIob2JqLCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAndmFsdWUnLCBmb3JtYXQpKV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIocHJlZml4KSArICc9JyArIGZvcm1hdHRlcihTdHJpbmcob2JqKSldO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH1cblxuICAgIHZhciBvYmpLZXlzO1xuICAgIGlmIChnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGlzQXJyYXkob2JqKSkge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGpvaW4gZWxlbWVudHMgaW5cbiAgICAgICAgaWYgKGVuY29kZVZhbHVlc09ubHkgJiYgZW5jb2Rlcikge1xuICAgICAgICAgICAgb2JqID0gdXRpbHMubWF5YmVNYXAob2JqLCBlbmNvZGVyKTtcbiAgICAgICAgfVxuICAgICAgICBvYmpLZXlzID0gW3sgdmFsdWU6IG9iai5sZW5ndGggPiAwID8gb2JqLmpvaW4oJywnKSB8fCBudWxsIDogdm9pZCB1bmRlZmluZWQgfV07XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGZpbHRlcikpIHtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIG9iaktleXMgPSBzb3J0ID8ga2V5cy5zb3J0KHNvcnQpIDoga2V5cztcbiAgICB9XG5cbiAgICB2YXIgZW5jb2RlZFByZWZpeCA9IGVuY29kZURvdEluS2V5cyA/IHByZWZpeC5yZXBsYWNlKC9cXC4vZywgJyUyRScpIDogcHJlZml4O1xuXG4gICAgdmFyIGFkanVzdGVkUHJlZml4ID0gY29tbWFSb3VuZFRyaXAgJiYgaXNBcnJheShvYmopICYmIG9iai5sZW5ndGggPT09IDEgPyBlbmNvZGVkUHJlZml4ICsgJ1tdJyA6IGVuY29kZWRQcmVmaXg7XG5cbiAgICBpZiAoYWxsb3dFbXB0eUFycmF5cyAmJiBpc0FycmF5KG9iaikgJiYgb2JqLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gYWRqdXN0ZWRQcmVmaXggKyAnW10nO1xuICAgIH1cblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqS2V5cy5sZW5ndGg7ICsraikge1xuICAgICAgICB2YXIga2V5ID0gb2JqS2V5c1tqXTtcbiAgICAgICAgdmFyIHZhbHVlID0gdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGtleS52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgPyBrZXkudmFsdWUgOiBvYmpba2V5XTtcblxuICAgICAgICBpZiAoc2tpcE51bGxzICYmIHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbmNvZGVkS2V5ID0gYWxsb3dEb3RzICYmIGVuY29kZURvdEluS2V5cyA/IGtleS5yZXBsYWNlKC9cXC4vZywgJyUyRScpIDoga2V5O1xuICAgICAgICB2YXIga2V5UHJlZml4ID0gaXNBcnJheShvYmopXG4gICAgICAgICAgICA/IHR5cGVvZiBnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnZnVuY3Rpb24nID8gZ2VuZXJhdGVBcnJheVByZWZpeChhZGp1c3RlZFByZWZpeCwgZW5jb2RlZEtleSkgOiBhZGp1c3RlZFByZWZpeFxuICAgICAgICAgICAgOiBhZGp1c3RlZFByZWZpeCArIChhbGxvd0RvdHMgPyAnLicgKyBlbmNvZGVkS2V5IDogJ1snICsgZW5jb2RlZEtleSArICddJyk7XG5cbiAgICAgICAgc2lkZUNoYW5uZWwuc2V0KG9iamVjdCwgc3RlcCk7XG4gICAgICAgIHZhciB2YWx1ZVNpZGVDaGFubmVsID0gZ2V0U2lkZUNoYW5uZWwoKTtcbiAgICAgICAgdmFsdWVTaWRlQ2hhbm5lbC5zZXQoc2VudGluZWwsIHNpZGVDaGFubmVsKTtcbiAgICAgICAgcHVzaFRvQXJyYXkodmFsdWVzLCBzdHJpbmdpZnkoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGtleVByZWZpeCxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICBjb21tYVJvdW5kVHJpcCxcbiAgICAgICAgICAgIGFsbG93RW1wdHlBcnJheXMsXG4gICAgICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgICAgICAgICBza2lwTnVsbHMsXG4gICAgICAgICAgICBlbmNvZGVEb3RJbktleXMsXG4gICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGVuY29kZVZhbHVlc09ubHkgJiYgaXNBcnJheShvYmopID8gbnVsbCA6IGVuY29kZXIsXG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzb3J0LFxuICAgICAgICAgICAgYWxsb3dEb3RzLFxuICAgICAgICAgICAgc2VyaWFsaXplRGF0ZSxcbiAgICAgICAgICAgIGZvcm1hdCxcbiAgICAgICAgICAgIGZvcm1hdHRlcixcbiAgICAgICAgICAgIGVuY29kZVZhbHVlc09ubHksXG4gICAgICAgICAgICBjaGFyc2V0LFxuICAgICAgICAgICAgdmFsdWVTaWRlQ2hhbm5lbFxuICAgICAgICApKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzO1xufTtcblxudmFyIG5vcm1hbGl6ZVN0cmluZ2lmeU9wdGlvbnMgPSBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmdpZnlPcHRpb25zKG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5hbGxvd0VtcHR5QXJyYXlzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0cy5hbGxvd0VtcHR5QXJyYXlzICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYGFsbG93RW1wdHlBcnJheXNgIG9wdGlvbiBjYW4gb25seSBiZSBgdHJ1ZWAgb3IgYGZhbHNlYCwgd2hlbiBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5lbmNvZGVEb3RJbktleXMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvcHRzLmVuY29kZURvdEluS2V5cyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2BlbmNvZGVEb3RJbktleXNgIG9wdGlvbiBjYW4gb25seSBiZSBgdHJ1ZWAgb3IgYGZhbHNlYCwgd2hlbiBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmVuY29kZXIgIT09IG51bGwgJiYgdHlwZW9mIG9wdHMuZW5jb2RlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9wdHMuZW5jb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFbmNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHZhciBjaGFyc2V0ID0gb3B0cy5jaGFyc2V0IHx8IGRlZmF1bHRzLmNoYXJzZXQ7XG4gICAgaWYgKHR5cGVvZiBvcHRzLmNoYXJzZXQgIT09ICd1bmRlZmluZWQnICYmIG9wdHMuY2hhcnNldCAhPT0gJ3V0Zi04JyAmJiBvcHRzLmNoYXJzZXQgIT09ICdpc28tODg1OS0xJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2hhcnNldCBvcHRpb24gbXVzdCBiZSBlaXRoZXIgdXRmLTgsIGlzby04ODU5LTEsIG9yIHVuZGVmaW5lZCcpO1xuICAgIH1cblxuICAgIHZhciBmb3JtYXQgPSBmb3JtYXRzWydkZWZhdWx0J107XG4gICAgaWYgKHR5cGVvZiBvcHRzLmZvcm1hdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKCFoYXMuY2FsbChmb3JtYXRzLmZvcm1hdHRlcnMsIG9wdHMuZm9ybWF0KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBmb3JtYXQgb3B0aW9uIHByb3ZpZGVkLicpO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIH1cbiAgICB2YXIgZm9ybWF0dGVyID0gZm9ybWF0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG5cbiAgICB2YXIgZmlsdGVyID0gZGVmYXVsdHMuZmlsdGVyO1xuICAgIGlmICh0eXBlb2Ygb3B0cy5maWx0ZXIgPT09ICdmdW5jdGlvbicgfHwgaXNBcnJheShvcHRzLmZpbHRlcikpIHtcbiAgICAgICAgZmlsdGVyID0gb3B0cy5maWx0ZXI7XG4gICAgfVxuXG4gICAgdmFyIGFycmF5Rm9ybWF0O1xuICAgIGlmIChvcHRzLmFycmF5Rm9ybWF0IGluIGFycmF5UHJlZml4R2VuZXJhdG9ycykge1xuICAgICAgICBhcnJheUZvcm1hdCA9IG9wdHMuYXJyYXlGb3JtYXQ7XG4gICAgfSBlbHNlIGlmICgnaW5kaWNlcycgaW4gb3B0cykge1xuICAgICAgICBhcnJheUZvcm1hdCA9IG9wdHMuaW5kaWNlcyA/ICdpbmRpY2VzJyA6ICdyZXBlYXQnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gZGVmYXVsdHMuYXJyYXlGb3JtYXQ7XG4gICAgfVxuXG4gICAgaWYgKCdjb21tYVJvdW5kVHJpcCcgaW4gb3B0cyAmJiB0eXBlb2Ygb3B0cy5jb21tYVJvdW5kVHJpcCAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2Bjb21tYVJvdW5kVHJpcGAgbXVzdCBiZSBhIGJvb2xlYW4sIG9yIGFic2VudCcpO1xuICAgIH1cblxuICAgIHZhciBhbGxvd0RvdHMgPSB0eXBlb2Ygb3B0cy5hbGxvd0RvdHMgPT09ICd1bmRlZmluZWQnID8gb3B0cy5lbmNvZGVEb3RJbktleXMgPT09IHRydWUgPyB0cnVlIDogZGVmYXVsdHMuYWxsb3dEb3RzIDogISFvcHRzLmFsbG93RG90cztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZFF1ZXJ5UHJlZml4OiB0eXBlb2Ygb3B0cy5hZGRRdWVyeVByZWZpeCA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5hZGRRdWVyeVByZWZpeCA6IGRlZmF1bHRzLmFkZFF1ZXJ5UHJlZml4LFxuICAgICAgICBhbGxvd0RvdHM6IGFsbG93RG90cyxcbiAgICAgICAgYWxsb3dFbXB0eUFycmF5czogdHlwZW9mIG9wdHMuYWxsb3dFbXB0eUFycmF5cyA9PT0gJ2Jvb2xlYW4nID8gISFvcHRzLmFsbG93RW1wdHlBcnJheXMgOiBkZWZhdWx0cy5hbGxvd0VtcHR5QXJyYXlzLFxuICAgICAgICBhcnJheUZvcm1hdDogYXJyYXlGb3JtYXQsXG4gICAgICAgIGNoYXJzZXQ6IGNoYXJzZXQsXG4gICAgICAgIGNoYXJzZXRTZW50aW5lbDogdHlwZW9mIG9wdHMuY2hhcnNldFNlbnRpbmVsID09PSAnYm9vbGVhbicgPyBvcHRzLmNoYXJzZXRTZW50aW5lbCA6IGRlZmF1bHRzLmNoYXJzZXRTZW50aW5lbCxcbiAgICAgICAgY29tbWFSb3VuZFRyaXA6IG9wdHMuY29tbWFSb3VuZFRyaXAsXG4gICAgICAgIGRlbGltaXRlcjogdHlwZW9mIG9wdHMuZGVsaW1pdGVyID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHRzLmRlbGltaXRlciA6IG9wdHMuZGVsaW1pdGVyLFxuICAgICAgICBlbmNvZGU6IHR5cGVvZiBvcHRzLmVuY29kZSA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5lbmNvZGUgOiBkZWZhdWx0cy5lbmNvZGUsXG4gICAgICAgIGVuY29kZURvdEluS2V5czogdHlwZW9mIG9wdHMuZW5jb2RlRG90SW5LZXlzID09PSAnYm9vbGVhbicgPyBvcHRzLmVuY29kZURvdEluS2V5cyA6IGRlZmF1bHRzLmVuY29kZURvdEluS2V5cyxcbiAgICAgICAgZW5jb2RlcjogdHlwZW9mIG9wdHMuZW5jb2RlciA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuZW5jb2RlciA6IGRlZmF1bHRzLmVuY29kZXIsXG4gICAgICAgIGVuY29kZVZhbHVlc09ubHk6IHR5cGVvZiBvcHRzLmVuY29kZVZhbHVlc09ubHkgPT09ICdib29sZWFuJyA/IG9wdHMuZW5jb2RlVmFsdWVzT25seSA6IGRlZmF1bHRzLmVuY29kZVZhbHVlc09ubHksXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgICBmb3JtYXQ6IGZvcm1hdCxcbiAgICAgICAgZm9ybWF0dGVyOiBmb3JtYXR0ZXIsXG4gICAgICAgIHNlcmlhbGl6ZURhdGU6IHR5cGVvZiBvcHRzLnNlcmlhbGl6ZURhdGUgPT09ICdmdW5jdGlvbicgPyBvcHRzLnNlcmlhbGl6ZURhdGUgOiBkZWZhdWx0cy5zZXJpYWxpemVEYXRlLFxuICAgICAgICBza2lwTnVsbHM6IHR5cGVvZiBvcHRzLnNraXBOdWxscyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5za2lwTnVsbHMgOiBkZWZhdWx0cy5za2lwTnVsbHMsXG4gICAgICAgIHNvcnQ6IHR5cGVvZiBvcHRzLnNvcnQgPT09ICdmdW5jdGlvbicgPyBvcHRzLnNvcnQgOiBudWxsLFxuICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IHR5cGVvZiBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBkZWZhdWx0cy5zdHJpY3ROdWxsSGFuZGxpbmdcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqZWN0LCBvcHRzKSB7XG4gICAgdmFyIG9iaiA9IG9iamVjdDtcbiAgICB2YXIgb3B0aW9ucyA9IG5vcm1hbGl6ZVN0cmluZ2lmeU9wdGlvbnMob3B0cyk7XG5cbiAgICB2YXIgb2JqS2V5cztcbiAgICB2YXIgZmlsdGVyO1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgb2JqID0gZmlsdGVyKCcnLCBvYmopO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShvcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIG9iaktleXMgPSBmaWx0ZXI7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHZhciBnZW5lcmF0ZUFycmF5UHJlZml4ID0gYXJyYXlQcmVmaXhHZW5lcmF0b3JzW29wdGlvbnMuYXJyYXlGb3JtYXRdO1xuICAgIHZhciBjb21tYVJvdW5kVHJpcCA9IGdlbmVyYXRlQXJyYXlQcmVmaXggPT09ICdjb21tYScgJiYgb3B0aW9ucy5jb21tYVJvdW5kVHJpcDtcblxuICAgIGlmICghb2JqS2V5cykge1xuICAgICAgICBvYmpLZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5zb3J0KSB7XG4gICAgICAgIG9iaktleXMuc29ydChvcHRpb25zLnNvcnQpO1xuICAgIH1cblxuICAgIHZhciBzaWRlQ2hhbm5lbCA9IGdldFNpZGVDaGFubmVsKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpLZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBvYmpLZXlzW2ldO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNraXBOdWxscyAmJiBvYmpba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgcHVzaFRvQXJyYXkoa2V5cywgc3RyaW5naWZ5KFxuICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4LFxuICAgICAgICAgICAgY29tbWFSb3VuZFRyaXAsXG4gICAgICAgICAgICBvcHRpb25zLmFsbG93RW1wdHlBcnJheXMsXG4gICAgICAgICAgICBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyxcbiAgICAgICAgICAgIG9wdGlvbnMuc2tpcE51bGxzLFxuICAgICAgICAgICAgb3B0aW9ucy5lbmNvZGVEb3RJbktleXMsXG4gICAgICAgICAgICBvcHRpb25zLmVuY29kZSA/IG9wdGlvbnMuZW5jb2RlciA6IG51bGwsXG4gICAgICAgICAgICBvcHRpb25zLmZpbHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuc29ydCxcbiAgICAgICAgICAgIG9wdGlvbnMuYWxsb3dEb3RzLFxuICAgICAgICAgICAgb3B0aW9ucy5zZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgb3B0aW9ucy5mb3JtYXQsXG4gICAgICAgICAgICBvcHRpb25zLmZvcm1hdHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgICAgIG9wdGlvbnMuY2hhcnNldCxcbiAgICAgICAgICAgIHNpZGVDaGFubmVsXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHZhciBqb2luZWQgPSBrZXlzLmpvaW4ob3B0aW9ucy5kZWxpbWl0ZXIpO1xuICAgIHZhciBwcmVmaXggPSBvcHRpb25zLmFkZFF1ZXJ5UHJlZml4ID09PSB0cnVlID8gJz8nIDogJyc7XG5cbiAgICBpZiAob3B0aW9ucy5jaGFyc2V0U2VudGluZWwpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2hhcnNldCA9PT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgICAgICAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JyksIHRoZSBcIm51bWVyaWMgZW50aXR5XCIgcmVwcmVzZW50YXRpb24gb2YgYSBjaGVja21hcmtcbiAgICAgICAgICAgIHByZWZpeCArPSAndXRmOD0lMjYlMjMxMDAwMyUzQiYnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuICAgICAgICAgICAgcHJlZml4ICs9ICd1dGY4PSVFMiU5QyU5MyYnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGpvaW5lZC5sZW5ndGggPiAwID8gcHJlZml4ICsgam9pbmVkIDogJyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgYWxsb3dEb3RzOiBmYWxzZSxcbiAgICBhbGxvd0VtcHR5QXJyYXlzOiBmYWxzZSxcbiAgICBhbGxvd1Byb3RvdHlwZXM6IGZhbHNlLFxuICAgIGFsbG93U3BhcnNlOiBmYWxzZSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBjaGFyc2V0OiAndXRmLTgnLFxuICAgIGNoYXJzZXRTZW50aW5lbDogZmFsc2UsXG4gICAgY29tbWE6IGZhbHNlLFxuICAgIGRlY29kZURvdEluS2V5czogZmFsc2UsXG4gICAgZGVjb2RlcjogdXRpbHMuZGVjb2RlLFxuICAgIGRlbGltaXRlcjogJyYnLFxuICAgIGRlcHRoOiA1LFxuICAgIGR1cGxpY2F0ZXM6ICdjb21iaW5lJyxcbiAgICBpZ25vcmVRdWVyeVByZWZpeDogZmFsc2UsXG4gICAgaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzOiBmYWxzZSxcbiAgICBwYXJhbWV0ZXJMaW1pdDogMTAwMCxcbiAgICBwYXJzZUFycmF5czogdHJ1ZSxcbiAgICBwbGFpbk9iamVjdHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBpbnRlcnByZXROdW1lcmljRW50aXRpZXMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8mIyhcXGQrKTsvZywgZnVuY3Rpb24gKCQwLCBudW1iZXJTdHIpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobnVtYmVyU3RyLCAxMCkpO1xuICAgIH0pO1xufTtcblxudmFyIHBhcnNlQXJyYXlWYWx1ZSA9IGZ1bmN0aW9uICh2YWwsIG9wdGlvbnMpIHtcbiAgICBpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuY29tbWEgJiYgdmFsLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB2YWwuc3BsaXQoJywnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLy8gVGhpcyBpcyB3aGF0IGJyb3dzZXJzIHdpbGwgc3VibWl0IHdoZW4gdGhlIOKckyBjaGFyYWN0ZXIgb2NjdXJzIGluIGFuXG4vLyBhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQgYm9keSBhbmQgdGhlIGVuY29kaW5nIG9mIHRoZSBwYWdlIGNvbnRhaW5pbmdcbi8vIHRoZSBmb3JtIGlzIGlzby04ODU5LTEsIG9yIHdoZW4gdGhlIHN1Ym1pdHRlZCBmb3JtIGhhcyBhbiBhY2NlcHQtY2hhcnNldFxuLy8gYXR0cmlidXRlIG9mIGlzby04ODU5LTEuIFByZXN1bWFibHkgYWxzbyB3aXRoIG90aGVyIGNoYXJzZXRzIHRoYXQgZG8gbm90IGNvbnRhaW5cbi8vIHRoZSDinJMgY2hhcmFjdGVyLCBzdWNoIGFzIHVzLWFzY2lpLlxudmFyIGlzb1NlbnRpbmVsID0gJ3V0Zjg9JTI2JTIzMTAwMDMlM0InOyAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JylcblxuLy8gVGhlc2UgYXJlIHRoZSBwZXJjZW50LWVuY29kZWQgdXRmLTggb2N0ZXRzIHJlcHJlc2VudGluZyBhIGNoZWNrbWFyaywgaW5kaWNhdGluZyB0aGF0IHRoZSByZXF1ZXN0IGFjdHVhbGx5IGlzIHV0Zi04IGVuY29kZWQuXG52YXIgY2hhcnNldFNlbnRpbmVsID0gJ3V0Zjg9JUUyJTlDJTkzJzsgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuXG52YXIgcGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nVmFsdWVzKHN0ciwgb3B0aW9ucykge1xuICAgIHZhciBvYmogPSB7IF9fcHJvdG9fXzogbnVsbCB9O1xuXG4gICAgdmFyIGNsZWFuU3RyID0gb3B0aW9ucy5pZ25vcmVRdWVyeVByZWZpeCA/IHN0ci5yZXBsYWNlKC9eXFw/LywgJycpIDogc3RyO1xuICAgIGNsZWFuU3RyID0gY2xlYW5TdHIucmVwbGFjZSgvJTVCL2dpLCAnWycpLnJlcGxhY2UoLyU1RC9naSwgJ10nKTtcbiAgICB2YXIgbGltaXQgPSBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID09PSBJbmZpbml0eSA/IHVuZGVmaW5lZCA6IG9wdGlvbnMucGFyYW1ldGVyTGltaXQ7XG4gICAgdmFyIHBhcnRzID0gY2xlYW5TdHIuc3BsaXQob3B0aW9ucy5kZWxpbWl0ZXIsIGxpbWl0KTtcbiAgICB2YXIgc2tpcEluZGV4ID0gLTE7IC8vIEtlZXAgdHJhY2sgb2Ygd2hlcmUgdGhlIHV0Zjggc2VudGluZWwgd2FzIGZvdW5kXG4gICAgdmFyIGk7XG5cbiAgICB2YXIgY2hhcnNldCA9IG9wdGlvbnMuY2hhcnNldDtcbiAgICBpZiAob3B0aW9ucy5jaGFyc2V0U2VudGluZWwpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbaV0uaW5kZXhPZigndXRmOD0nKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0c1tpXSA9PT0gY2hhcnNldFNlbnRpbmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJzZXQgPSAndXRmLTgnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFydHNbaV0gPT09IGlzb1NlbnRpbmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJzZXQgPSAnaXNvLTg4NTktMSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNraXBJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgaSA9IHBhcnRzLmxlbmd0aDsgLy8gVGhlIGVzbGludCBzZXR0aW5ncyBkbyBub3QgYWxsb3cgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGkgPT09IHNraXBJbmRleCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXTtcblxuICAgICAgICB2YXIgYnJhY2tldEVxdWFsc1BvcyA9IHBhcnQuaW5kZXhPZignXT0nKTtcbiAgICAgICAgdmFyIHBvcyA9IGJyYWNrZXRFcXVhbHNQb3MgPT09IC0xID8gcGFydC5pbmRleE9mKCc9JykgOiBicmFja2V0RXF1YWxzUG9zICsgMTtcblxuICAgICAgICB2YXIga2V5LCB2YWw7XG4gICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICBrZXkgPSBvcHRpb25zLmRlY29kZXIocGFydCwgZGVmYXVsdHMuZGVjb2RlciwgY2hhcnNldCwgJ2tleScpO1xuICAgICAgICAgICAgdmFsID0gb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgPyBudWxsIDogJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXkgPSBvcHRpb25zLmRlY29kZXIocGFydC5zbGljZSgwLCBwb3MpLCBkZWZhdWx0cy5kZWNvZGVyLCBjaGFyc2V0LCAna2V5Jyk7XG4gICAgICAgICAgICB2YWwgPSB1dGlscy5tYXliZU1hcChcbiAgICAgICAgICAgICAgICBwYXJzZUFycmF5VmFsdWUocGFydC5zbGljZShwb3MgKyAxKSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVuY29kZWRWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGVjb2RlcihlbmNvZGVkVmFsLCBkZWZhdWx0cy5kZWNvZGVyLCBjaGFyc2V0LCAndmFsdWUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbCAmJiBvcHRpb25zLmludGVycHJldE51bWVyaWNFbnRpdGllcyAmJiBjaGFyc2V0ID09PSAnaXNvLTg4NTktMScpIHtcbiAgICAgICAgICAgIHZhbCA9IGludGVycHJldE51bWVyaWNFbnRpdGllcyh2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcnQuaW5kZXhPZignW109JykgPiAtMSkge1xuICAgICAgICAgICAgdmFsID0gaXNBcnJheSh2YWwpID8gW3ZhbF0gOiB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXhpc3RpbmcgPSBoYXMuY2FsbChvYmosIGtleSk7XG4gICAgICAgIGlmIChleGlzdGluZyAmJiBvcHRpb25zLmR1cGxpY2F0ZXMgPT09ICdjb21iaW5lJykge1xuICAgICAgICAgICAgb2JqW2tleV0gPSB1dGlscy5jb21iaW5lKG9ialtrZXldLCB2YWwpO1xuICAgICAgICB9IGVsc2UgaWYgKCFleGlzdGluZyB8fCBvcHRpb25zLmR1cGxpY2F0ZXMgPT09ICdsYXN0Jykge1xuICAgICAgICAgICAgb2JqW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxudmFyIHBhcnNlT2JqZWN0ID0gZnVuY3Rpb24gKGNoYWluLCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCkge1xuICAgIHZhciBsZWFmID0gdmFsdWVzUGFyc2VkID8gdmFsIDogcGFyc2VBcnJheVZhbHVlKHZhbCwgb3B0aW9ucyk7XG5cbiAgICBmb3IgKHZhciBpID0gY2hhaW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIG9iajtcbiAgICAgICAgdmFyIHJvb3QgPSBjaGFpbltpXTtcblxuICAgICAgICBpZiAocm9vdCA9PT0gJ1tdJyAmJiBvcHRpb25zLnBhcnNlQXJyYXlzKSB7XG4gICAgICAgICAgICBvYmogPSBvcHRpb25zLmFsbG93RW1wdHlBcnJheXMgJiYgbGVhZiA9PT0gJycgPyBbXSA6IFtdLmNvbmNhdChsZWFmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgICAgICAgICAgdmFyIGNsZWFuUm9vdCA9IHJvb3QuY2hhckF0KDApID09PSAnWycgJiYgcm9vdC5jaGFyQXQocm9vdC5sZW5ndGggLSAxKSA9PT0gJ10nID8gcm9vdC5zbGljZSgxLCAtMSkgOiByb290O1xuICAgICAgICAgICAgdmFyIGRlY29kZWRSb290ID0gb3B0aW9ucy5kZWNvZGVEb3RJbktleXMgPyBjbGVhblJvb3QucmVwbGFjZSgvJTJFL2csICcuJykgOiBjbGVhblJvb3Q7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChkZWNvZGVkUm9vdCwgMTApO1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBhcnNlQXJyYXlzICYmIGRlY29kZWRSb290ID09PSAnJykge1xuICAgICAgICAgICAgICAgIG9iaiA9IHsgMDogbGVhZiB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAhaXNOYU4oaW5kZXgpXG4gICAgICAgICAgICAgICAgJiYgcm9vdCAhPT0gZGVjb2RlZFJvb3RcbiAgICAgICAgICAgICAgICAmJiBTdHJpbmcoaW5kZXgpID09PSBkZWNvZGVkUm9vdFxuICAgICAgICAgICAgICAgICYmIGluZGV4ID49IDBcbiAgICAgICAgICAgICAgICAmJiAob3B0aW9ucy5wYXJzZUFycmF5cyAmJiBpbmRleCA8PSBvcHRpb25zLmFycmF5TGltaXQpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBvYmogPSBbXTtcbiAgICAgICAgICAgICAgICBvYmpbaW5kZXhdID0gbGVhZjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVjb2RlZFJvb3QgIT09ICdfX3Byb3RvX18nKSB7XG4gICAgICAgICAgICAgICAgb2JqW2RlY29kZWRSb290XSA9IGxlYWY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZWFmID0gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiBsZWFmO1xufTtcblxudmFyIHBhcnNlS2V5cyA9IGZ1bmN0aW9uIHBhcnNlUXVlcnlTdHJpbmdLZXlzKGdpdmVuS2V5LCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCkge1xuICAgIGlmICghZ2l2ZW5LZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybSBkb3Qgbm90YXRpb24gdG8gYnJhY2tldCBub3RhdGlvblxuICAgIHZhciBrZXkgPSBvcHRpb25zLmFsbG93RG90cyA/IGdpdmVuS2V5LnJlcGxhY2UoL1xcLihbXi5bXSspL2csICdbJDFdJykgOiBnaXZlbktleTtcblxuICAgIC8vIFRoZSByZWdleCBjaHVua3NcblxuICAgIHZhciBicmFja2V0cyA9IC8oXFxbW15bXFxdXSpdKS87XG4gICAgdmFyIGNoaWxkID0gLyhcXFtbXltcXF1dKl0pL2c7XG5cbiAgICAvLyBHZXQgdGhlIHBhcmVudFxuXG4gICAgdmFyIHNlZ21lbnQgPSBvcHRpb25zLmRlcHRoID4gMCAmJiBicmFja2V0cy5leGVjKGtleSk7XG4gICAgdmFyIHBhcmVudCA9IHNlZ21lbnQgPyBrZXkuc2xpY2UoMCwgc2VnbWVudC5pbmRleCkgOiBrZXk7XG5cbiAgICAvLyBTdGFzaCB0aGUgcGFyZW50IGlmIGl0IGV4aXN0c1xuXG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIC8vIElmIHdlIGFyZW4ndCB1c2luZyBwbGFpbiBvYmplY3RzLCBvcHRpb25hbGx5IHByZWZpeCBrZXlzIHRoYXQgd291bGQgb3ZlcndyaXRlIG9iamVjdCBwcm90b3R5cGUgcHJvcGVydGllc1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIGhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHBhcmVudCkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBrZXlzLnB1c2gocGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggY2hpbGRyZW4gYXBwZW5kaW5nIHRvIHRoZSBhcnJheSB1bnRpbCB3ZSBoaXQgZGVwdGhcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAob3B0aW9ucy5kZXB0aCA+IDAgJiYgKHNlZ21lbnQgPSBjaGlsZC5leGVjKGtleSkpICE9PSBudWxsICYmIGkgPCBvcHRpb25zLmRlcHRoKSB7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdLnNsaWNlKDEsIC0xKSkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5wdXNoKHNlZ21lbnRbMV0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYSByZW1haW5kZXIsIGp1c3QgYWRkIHdoYXRldmVyIGlzIGxlZnRcblxuICAgIGlmIChzZWdtZW50KSB7XG4gICAgICAgIGtleXMucHVzaCgnWycgKyBrZXkuc2xpY2Uoc2VnbWVudC5pbmRleCkgKyAnXScpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZU9iamVjdChrZXlzLCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCk7XG59O1xuXG52YXIgbm9ybWFsaXplUGFyc2VPcHRpb25zID0gZnVuY3Rpb24gbm9ybWFsaXplUGFyc2VPcHRpb25zKG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5hbGxvd0VtcHR5QXJyYXlzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0cy5hbGxvd0VtcHR5QXJyYXlzICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYGFsbG93RW1wdHlBcnJheXNgIG9wdGlvbiBjYW4gb25seSBiZSBgdHJ1ZWAgb3IgYGZhbHNlYCwgd2hlbiBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5kZWNvZGVEb3RJbktleXMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvcHRzLmRlY29kZURvdEluS2V5cyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2BkZWNvZGVEb3RJbktleXNgIG9wdGlvbiBjYW4gb25seSBiZSBgdHJ1ZWAgb3IgYGZhbHNlYCwgd2hlbiBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmRlY29kZXIgIT09IG51bGwgJiYgdHlwZW9mIG9wdHMuZGVjb2RlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9wdHMuZGVjb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdEZWNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5jaGFyc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBvcHRzLmNoYXJzZXQgIT09ICd1dGYtOCcgJiYgb3B0cy5jaGFyc2V0ICE9PSAnaXNvLTg4NTktMScpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGNoYXJzZXQgb3B0aW9uIG11c3QgYmUgZWl0aGVyIHV0Zi04LCBpc28tODg1OS0xLCBvciB1bmRlZmluZWQnKTtcbiAgICB9XG4gICAgdmFyIGNoYXJzZXQgPSB0eXBlb2Ygb3B0cy5jaGFyc2V0ID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHRzLmNoYXJzZXQgOiBvcHRzLmNoYXJzZXQ7XG5cbiAgICB2YXIgZHVwbGljYXRlcyA9IHR5cGVvZiBvcHRzLmR1cGxpY2F0ZXMgPT09ICd1bmRlZmluZWQnID8gZGVmYXVsdHMuZHVwbGljYXRlcyA6IG9wdHMuZHVwbGljYXRlcztcblxuICAgIGlmIChkdXBsaWNhdGVzICE9PSAnY29tYmluZScgJiYgZHVwbGljYXRlcyAhPT0gJ2ZpcnN0JyAmJiBkdXBsaWNhdGVzICE9PSAnbGFzdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGR1cGxpY2F0ZXMgb3B0aW9uIG11c3QgYmUgZWl0aGVyIGNvbWJpbmUsIGZpcnN0LCBvciBsYXN0Jyk7XG4gICAgfVxuXG4gICAgdmFyIGFsbG93RG90cyA9IHR5cGVvZiBvcHRzLmFsbG93RG90cyA9PT0gJ3VuZGVmaW5lZCcgPyBvcHRzLmRlY29kZURvdEluS2V5cyA9PT0gdHJ1ZSA/IHRydWUgOiBkZWZhdWx0cy5hbGxvd0RvdHMgOiAhIW9wdHMuYWxsb3dEb3RzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWxsb3dEb3RzOiBhbGxvd0RvdHMsXG4gICAgICAgIGFsbG93RW1wdHlBcnJheXM6IHR5cGVvZiBvcHRzLmFsbG93RW1wdHlBcnJheXMgPT09ICdib29sZWFuJyA/ICEhb3B0cy5hbGxvd0VtcHR5QXJyYXlzIDogZGVmYXVsdHMuYWxsb3dFbXB0eUFycmF5cyxcbiAgICAgICAgYWxsb3dQcm90b3R5cGVzOiB0eXBlb2Ygb3B0cy5hbGxvd1Byb3RvdHlwZXMgPT09ICdib29sZWFuJyA/IG9wdHMuYWxsb3dQcm90b3R5cGVzIDogZGVmYXVsdHMuYWxsb3dQcm90b3R5cGVzLFxuICAgICAgICBhbGxvd1NwYXJzZTogdHlwZW9mIG9wdHMuYWxsb3dTcGFyc2UgPT09ICdib29sZWFuJyA/IG9wdHMuYWxsb3dTcGFyc2UgOiBkZWZhdWx0cy5hbGxvd1NwYXJzZSxcbiAgICAgICAgYXJyYXlMaW1pdDogdHlwZW9mIG9wdHMuYXJyYXlMaW1pdCA9PT0gJ251bWJlcicgPyBvcHRzLmFycmF5TGltaXQgOiBkZWZhdWx0cy5hcnJheUxpbWl0LFxuICAgICAgICBjaGFyc2V0OiBjaGFyc2V0LFxuICAgICAgICBjaGFyc2V0U2VudGluZWw6IHR5cGVvZiBvcHRzLmNoYXJzZXRTZW50aW5lbCA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5jaGFyc2V0U2VudGluZWwgOiBkZWZhdWx0cy5jaGFyc2V0U2VudGluZWwsXG4gICAgICAgIGNvbW1hOiB0eXBlb2Ygb3B0cy5jb21tYSA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5jb21tYSA6IGRlZmF1bHRzLmNvbW1hLFxuICAgICAgICBkZWNvZGVEb3RJbktleXM6IHR5cGVvZiBvcHRzLmRlY29kZURvdEluS2V5cyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5kZWNvZGVEb3RJbktleXMgOiBkZWZhdWx0cy5kZWNvZGVEb3RJbktleXMsXG4gICAgICAgIGRlY29kZXI6IHR5cGVvZiBvcHRzLmRlY29kZXIgPT09ICdmdW5jdGlvbicgPyBvcHRzLmRlY29kZXIgOiBkZWZhdWx0cy5kZWNvZGVyLFxuICAgICAgICBkZWxpbWl0ZXI6IHR5cGVvZiBvcHRzLmRlbGltaXRlciA9PT0gJ3N0cmluZycgfHwgdXRpbHMuaXNSZWdFeHAob3B0cy5kZWxpbWl0ZXIpID8gb3B0cy5kZWxpbWl0ZXIgOiBkZWZhdWx0cy5kZWxpbWl0ZXIsXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbXBsaWNpdC1jb2VyY2lvbiwgbm8tZXh0cmEtcGFyZW5zXG4gICAgICAgIGRlcHRoOiAodHlwZW9mIG9wdHMuZGVwdGggPT09ICdudW1iZXInIHx8IG9wdHMuZGVwdGggPT09IGZhbHNlKSA/ICtvcHRzLmRlcHRoIDogZGVmYXVsdHMuZGVwdGgsXG4gICAgICAgIGR1cGxpY2F0ZXM6IGR1cGxpY2F0ZXMsXG4gICAgICAgIGlnbm9yZVF1ZXJ5UHJlZml4OiBvcHRzLmlnbm9yZVF1ZXJ5UHJlZml4ID09PSB0cnVlLFxuICAgICAgICBpbnRlcnByZXROdW1lcmljRW50aXRpZXM6IHR5cGVvZiBvcHRzLmludGVycHJldE51bWVyaWNFbnRpdGllcyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5pbnRlcnByZXROdW1lcmljRW50aXRpZXMgOiBkZWZhdWx0cy5pbnRlcnByZXROdW1lcmljRW50aXRpZXMsXG4gICAgICAgIHBhcmFtZXRlckxpbWl0OiB0eXBlb2Ygb3B0cy5wYXJhbWV0ZXJMaW1pdCA9PT0gJ251bWJlcicgPyBvcHRzLnBhcmFtZXRlckxpbWl0IDogZGVmYXVsdHMucGFyYW1ldGVyTGltaXQsXG4gICAgICAgIHBhcnNlQXJyYXlzOiBvcHRzLnBhcnNlQXJyYXlzICE9PSBmYWxzZSxcbiAgICAgICAgcGxhaW5PYmplY3RzOiB0eXBlb2Ygb3B0cy5wbGFpbk9iamVjdHMgPT09ICdib29sZWFuJyA/IG9wdHMucGxhaW5PYmplY3RzIDogZGVmYXVsdHMucGxhaW5PYmplY3RzLFxuICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IHR5cGVvZiBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBkZWZhdWx0cy5zdHJpY3ROdWxsSGFuZGxpbmdcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCBvcHRzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBub3JtYWxpemVQYXJzZU9wdGlvbnMob3B0cyk7XG5cbiAgICBpZiAoc3RyID09PSAnJyB8fCBzdHIgPT09IG51bGwgfHwgdHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgIH1cblxuICAgIHZhciB0ZW1wT2JqID0gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgPyBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIDogc3RyO1xuICAgIHZhciBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUga2V5cyBhbmQgc2V0dXAgdGhlIG5ldyBvYmplY3RcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGVtcE9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgbmV3T2JqID0gcGFyc2VLZXlzKGtleSwgdGVtcE9ialtrZXldLCBvcHRpb25zLCB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyk7XG4gICAgICAgIG9iaiA9IHV0aWxzLm1lcmdlKG9iaiwgbmV3T2JqLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5hbGxvd1NwYXJzZSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiB1dGlscy5jb21wYWN0KG9iaik7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZvcm1hdHM6IGZvcm1hdHMsXG4gICAgcGFyc2U6IHBhcnNlLFxuICAgIHN0cmluZ2lmeTogc3RyaW5naWZ5XG59O1xuIiwiaW1wb3J0IHdpbmRvd0hhbmRsZXIgZnJvbSAnLi4vLi4vc3JjL2hlbHBlci93aW5kb3cnO1xuaW1wb3J0IHFzIGZyb20gJ3FzJztcbmltcG9ydCB1cmxqb2luIGZyb20gJ3VybC1qb2luJztcblxuZnVuY3Rpb24gUG9wdXBIYW5kbGVyKHdlYkF1dGgpIHtcbiAgdGhpcy53ZWJBdXRoID0gd2ViQXV0aDtcbiAgdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG4gIHRoaXMub3B0aW9ucyA9IG51bGw7XG59XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIF93aW5kb3cgPSB3aW5kb3dIYW5kbGVyLmdldFdpbmRvdygpO1xuXG4gIHZhciB1cmwgPSBvcHRpb25zLnVybCB8fCAnYWJvdXQ6YmxhbmsnO1xuICB2YXIgcG9wdXBPcHRpb25zID0gb3B0aW9ucy5wb3B1cE9wdGlvbnMgfHwge307XG5cbiAgcG9wdXBPcHRpb25zLmxvY2F0aW9uID0gJ3llcyc7XG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMud2lkdGg7XG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMuaGVpZ2h0O1xuXG4gIHZhciB3aW5kb3dGZWF0dXJlcyA9IHFzLnN0cmluZ2lmeShwb3B1cE9wdGlvbnMsIHtcbiAgICBlbmNvZGU6IGZhbHNlLFxuICAgIGRlbGltaXRlcjogJywnXG4gIH0pO1xuXG4gIGlmICh0aGlzLl9jdXJyZW50X3BvcHVwICYmICF0aGlzLl9jdXJyZW50X3BvcHVwLmNsb3NlZCkge1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50X3BvcHVwO1xuICB9XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cCA9IF93aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCB3aW5kb3dGZWF0dXJlcyk7XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cC5raWxsID0gZnVuY3Rpb24oc3VjY2Vzcykge1xuICAgIF90aGlzLl9jdXJyZW50X3BvcHVwLnN1Y2Nlc3MgPSBzdWNjZXNzO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXMuX2N1cnJlbnRfcG9wdXA7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbih1cmwsIF8sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICBvcHRpb25zLnVybCA9IHVybDtcbiAgICB0aGlzLnByZWxvYWQob3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fY3VycmVudF9wb3B1cC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICB9XG5cbiAgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIF90aGlzLmVycm9ySGFuZGxlcihldmVudCwgY2IpO1xuICB9O1xuXG4gIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBfdGhpcy5zdGFydEhhbmRsZXIoZXZlbnQsIGNiKTtcbiAgfTtcblxuICB0aGlzLnRyYW5zaWVudEV4aXRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMuZXhpdEhhbmRsZXIoY2IpO1xuICB9O1xuXG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVycm9yJywgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXIpO1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRzdGFydCcsIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyKTtcbiAgdGhpcy5fY3VycmVudF9wb3B1cC5hZGRFdmVudExpc3RlbmVyKCdleGl0JywgdGhpcy50cmFuc2llbnRFeGl0SGFuZGxlcik7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLmVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50LCBjYikge1xuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9jdXJyZW50X3BvcHVwLmtpbGwodHJ1ZSk7XG5cbiAgY2IoeyBlcnJvcjogJ3dpbmRvd19lcnJvcicsIGVycm9yRGVzY3JpcHRpb246IGV2ZW50Lm1lc3NhZ2UgfSk7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLnVuaG9vayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgJ2xvYWRlcnJvcicsXG4gICAgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXJcbiAgKTtcbiAgdGhpcy5fY3VycmVudF9wb3B1cC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICdsb2Fkc3RhcnQnLFxuICAgIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyXG4gICk7XG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXhpdCcsIHRoaXMudHJhbnNpZW50RXhpdEhhbmRsZXIpO1xufTtcblxuUG9wdXBIYW5kbGVyLnByb3RvdHlwZS5leGl0SGFuZGxlciA9IGZ1bmN0aW9uKGNiKSB7XG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHdoZW4gdGhlIG1vZGFsIGlzIGNsb3NlZCwgdGhpcyBldmVudCBpcyBjYWxsZWQgd2hpY2ggZW5kcyB1cCByZW1vdmluZyB0aGVcbiAgLy8gZXZlbnQgbGlzdGVuZXJzLiBJZiB5b3UgbW92ZSB0aGlzIGJlZm9yZSBjbG9zaW5nIHRoZSBtb2RhbCwgaXQgd2lsbCBhZGQgfjEgc2VjXG4gIC8vIGRlbGF5IGJldHdlZW4gdGhlIHVzZXIgYmVpbmcgcmVkaXJlY3RlZCB0byB0aGUgY2FsbGJhY2sgYW5kIHRoZSBwb3B1cCBnZXRzIGNsb3NlZC5cbiAgdGhpcy51bmhvb2soKTtcblxuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXAuc3VjY2Vzcykge1xuICAgIGNiKHsgZXJyb3I6ICd3aW5kb3dfY2xvc2VkJywgZXJyb3JEZXNjcmlwdGlvbjogJ0Jyb3dzZXIgd2luZG93IGNsb3NlZCcgfSk7XG4gIH1cbn07XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUuc3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKCF0aGlzLl9jdXJyZW50X3BvcHVwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGNhbGxiYWNrVXJsID0gdXJsam9pbihcbiAgICAnaHR0cHM6JyxcbiAgICB0aGlzLndlYkF1dGguYmFzZU9wdGlvbnMuZG9tYWluLFxuICAgICcvbW9iaWxlJ1xuICApO1xuXG4gIGlmIChldmVudC51cmwgJiYgIShldmVudC51cmwuaW5kZXhPZihjYWxsYmFja1VybCArICcjJykgPT09IDApKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHBhcnRzID0gZXZlbnQudXJsLnNwbGl0KCcjJyk7XG5cbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBvcHRzID0geyBoYXNoOiBwYXJ0cy5wb3AoKSB9O1xuXG4gIGlmICh0aGlzLm9wdGlvbnMubm9uY2UpIHtcbiAgICBvcHRzLm5vbmNlID0gdGhpcy5vcHRpb25zLm5vbmNlO1xuICB9XG5cbiAgdGhpcy53ZWJBdXRoLnBhcnNlSGFzaChvcHRzLCBmdW5jdGlvbihlcnJvciwgcmVzdWx0KSB7XG4gICAgaWYgKGVycm9yIHx8IHJlc3VsdCkge1xuICAgICAgX3RoaXMuX2N1cnJlbnRfcG9wdXAua2lsbCh0cnVlKTtcbiAgICAgIGNiKGVycm9yLCByZXN1bHQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQb3B1cEhhbmRsZXI7XG4iLCJpbXBvcnQgdXJsam9pbiBmcm9tICd1cmwtam9pbic7XG5pbXBvcnQgUG9wdXBIYW5kbGVyIGZyb20gJy4vcG9wdXAtaGFuZGxlcic7XG5cbmZ1bmN0aW9uIFBsdWdpbkhhbmRsZXIod2ViQXV0aCkge1xuICB0aGlzLndlYkF1dGggPSB3ZWJBdXRoO1xufVxuXG5QbHVnaW5IYW5kbGVyLnByb3RvdHlwZS5wcm9jZXNzUGFyYW1zID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gIHBhcmFtcy5yZWRpcmVjdFVyaSA9IHVybGpvaW4oJ2h0dHBzOi8vJyArIHBhcmFtcy5kb21haW4sICdtb2JpbGUnKTtcbiAgZGVsZXRlIHBhcmFtcy5vd3A7XG4gIHJldHVybiBwYXJhbXM7XG59O1xuXG5QbHVnaW5IYW5kbGVyLnByb3RvdHlwZS5nZXRQb3B1cEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIodGhpcy53ZWJBdXRoKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBsdWdpbkhhbmRsZXI7XG4iLCJpbXBvcnQgdmVyc2lvbiBmcm9tICcuLi8uLi9zcmMvdmVyc2lvbic7XG5pbXBvcnQgd2luZG93SGFuZGxlciBmcm9tICcuLi8uLi9zcmMvaGVscGVyL3dpbmRvdyc7XG5pbXBvcnQgUGx1Z2luSGFuZGxlciBmcm9tICcuL3BsdWdpbi1oYW5kbGVyJztcblxuZnVuY3Rpb24gQ29yZG92YVBsdWdpbigpIHtcbiAgdGhpcy53ZWJBdXRoID0gbnVsbDtcbiAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbi5yYXc7XG4gIHRoaXMuZXh0ZW5zaWJpbGl0eVBvaW50cyA9IFsncG9wdXAuYXV0aG9yaXplJywgJ3BvcHVwLmdldFBvcHVwSGFuZGxlciddO1xufVxuXG5Db3Jkb3ZhUGx1Z2luLnByb3RvdHlwZS5zZXRXZWJBdXRoID0gZnVuY3Rpb24od2ViQXV0aCkge1xuICB0aGlzLndlYkF1dGggPSB3ZWJBdXRoO1xufTtcblxuQ29yZG92YVBsdWdpbi5wcm90b3R5cGUuc3VwcG9ydHMgPSBmdW5jdGlvbihleHRlbnNpYmlsaXR5UG9pbnQpIHtcbiAgdmFyIF93aW5kb3cgPSB3aW5kb3dIYW5kbGVyLmdldFdpbmRvdygpO1xuICByZXR1cm4gKFxuICAgICghIV93aW5kb3cuY29yZG92YSB8fCAhIV93aW5kb3cuZWxlY3Ryb24pICYmXG4gICAgdGhpcy5leHRlbnNpYmlsaXR5UG9pbnRzLmluZGV4T2YoZXh0ZW5zaWJpbGl0eVBvaW50KSA+IC0xXG4gICk7XG59O1xuXG5Db3Jkb3ZhUGx1Z2luLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgUGx1Z2luSGFuZGxlcih0aGlzLndlYkF1dGgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ29yZG92YVBsdWdpbjtcbiJdLCJuYW1lcyI6WyJ0aGlzIiwiaGFzU3ltYm9sU2hhbSIsImJpbmQiLCJ1bmRlZmluZWQiLCIkVHlwZUVycm9yIiwiaGFzU3ltYm9scyIsInJlcXVpcmUkJDAiLCJoYXNQcm90byIsInJlcXVpcmUkJDEiLCIkRXJyb3IiLCIkRXZhbEVycm9yIiwiJFJhbmdlRXJyb3IiLCIkUmVmZXJlbmNlRXJyb3IiLCIkU3ludGF4RXJyb3IiLCIkVVJJRXJyb3IiLCJoYXNPd24iLCJHZXRJbnRyaW5zaWMiLCIkZ09QRCIsIiRkZWZpbmVQcm9wZXJ0eSIsImdPUEQiLCJkZWZpbmUiLCIkcmVwbGFjZSIsIiRjb25jYXQiLCIkZmxvb3IiLCJpc0FycmF5IiwiZ2xvYmFsIiwidG9TdHIiLCJpbnNwZWN0IiwiaGFzIiwibWVyZ2UiLCJpc1JlZ0V4cCIsInNpZGVDaGFubmVsIiwiZ2V0U2lkZUNoYW5uZWwiLCJkZWZhdWx0cyIsInN0cmluZ2lmeSIsInFzIiwidXJsam9pbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztFQUFBLFdBQWMsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7O0VDQWxDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQ3pDO0VBQ0EsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0VBQ3hDLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSyxPQUFPLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQztFQUM1QyxFQUFFLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtFQUNwQyxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDMUIsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNB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
