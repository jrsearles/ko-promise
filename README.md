ko.promise - Observable Promises
================================

## Purpose

The purpose of this library is to normalize the API surface between observables and promises, allowing them to be used interchangeably within your application. This simplifies the process of binding asynchronous calls to your view without having to explicitly await the promise's resolution. Example:

```js
function vm() {
	// the jQuery ajax call will return a promise derivative, 
	// which will be turned into an observable that is set when the promise is resolved
	this.asyncResource = ko.promise($.ajax("external/url"));

	this.normalValue = ko.observable("")
}

ko.applyBindings(new vm());
```

Within your application, you can use this observable just like any other observable. In addition, the observable contains a `state` computed property which you can use to respond to state changes in your bindings. Example:

```html
<div class="alert alert-danger" role="alert" data-bind="visible: asyncResource.state() === 'rejected'">
  <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
  There was an error retrieving an external resource.
</div>

<!-- ko if: asyncResource.state() === 'fulfilled' -->
<ul class="list-group" data-bind="foreach: asyncResource">
  <li class="list-group-item" data-bind="text: resourceText"></li>
</ul>
<!-- /ko -->
```

In large complex applications you may end up with calls that can return a promise, and observable, or even a plain object in different instances. `ko-promise` can help you here - by wrapping the object in an observable promise you can use a consistent approach to handling the value. Example:

```js
function handleValue(value) {
	// this value in this function can be async, observable, or just a plain object
	// wrap it in a promise and then you can treat it like any regular promise
	ko.promise(value)
		.then(function(resolvedValue) {
			// respond to the value
		});
}
```

## Installation

ko.promise can be installed via Bower.

```js
bower install ko-promise
```

or downloaded directly.
* Minified:
* Source:

## API

### Instantiation

**ko.promise**`([Observable|Promise|Anything] obj)` > `returns [ObservablePromise]`: takes an observable, a promise, or any object and converts it into an observable promise. The returned object will be an observable with additional methods supporting traditional promise functionality. (The library is agnostic when it comes to which promise implementation is used. As long as the promise has a `then` function that takes a success and fail callback it should be compatible.)
- If an observable is passed in, the object will be in a pending state and will resolve when a value is set on the observable. If the observable already has a value it will be considered already `fulfilled`.
- If a promise is passed in, the promise resolution will be wrapped and the returned observable will be set when the underlying promise is resolved. Any success or failure callbacks will be executed when the underlying promise is resolved or rejected.
- If any other type of object is passed in, the object will be used as the value of the observable and the object will be in a `fulfilled` state. Any success callbacks added will be executed immediately. Any failure callbacks registered will be ignored.

### Promise Methods

**then**`([Function] onFulfilled, [Function] onRejected)` > `returns [ObservablePromise]`: follows the [Promises/A+](https://promisesaplus.com) specification. Registers a callback which will be executed on the successful or unsuccessful resolution of the promise. Either callback is optional. The function returns another promise instance which will resolve with the value of the executed callback *or* the originating promise's resolved value if the callback does not return a value.

**state**`()` > `returns [String]`: a knockout computed which returns the state of the promise. The available options are `pending`, `fulfilled`, `rejected`.

*The following methods are subsets of `then` and are included to roughly match the methods available in [jQuery's promise implementation](http://api.jquery.com/deferred.promise/).*

**fail** or **catch**`([Function] onRejected)` > `returns [ObservablePromise]`: registers a callback to be executed on promise rejection. Returns an observable promise.

**done**`([Function] onFulfilled)` > `returns [ObservablePromise]`: registers a callback to be executed on promise resolution. Returns an observable promise.

**always**`([Function] onResolved)` > `returns [ObservablePromise]`: registers a callback which will be executed on the resolution of the promise, whether successful or not. Returns an observable promise.

### Utility Methods

**ko.promise.when** or **ko.promise.all**`([Array] promises)` > `returns [ObservablePromise]`: accepts an array of observables, promises, and/or values and will return an observable promise. The promise will resolve when all of the provided promises are resolved and will return an array of the values for each promise (in the order they are included). If any of the provided promises are rejected, the returned promise will be rejected.

**ko.promise.race**`([Array] promises)` > `returns [ObservablePromise]` accepts an array of observables, promises, and/or values and will return an observable promise. The promise will resolve when the first promise resolves or rejects (whichever happens first).

## License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
