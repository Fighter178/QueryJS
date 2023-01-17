# QueryJS

The library that works like a framework, but isn't. One single JS file, giving you all that you need. No fuss with many files, though it does work with Node.
## Includes:
 - Components (WIP)
 - Data binding
 - Reactivity (WIP)
 - Flexible Syntax
## Excludes:
 - Syntax highting (for now)
 - Good Docs
 - Form Actions
 - Backend framework (eg. Sveltekit)
## Install
To install QueryJS, use the CDN:
```html
<script src="https://cdn.jsdelivr.net/gh/Fighter178/QueryJS/qj.min.js" integrity="sha512-SdmGVkl4uiea7nXSFzQ0Eo45QlBiyhDgouJRtsHDbvZW99SmPyS6wEpE7bHf4XkU7ycvGmUiCQ7CqPK7NOUssw==" crossorigin="anonymous"></script>
```
Or, via NPM:
```
npm i @fighter178/queryjs
```
*note that QueryJS uses the document, and so it won't run in Node. Use import syntax instead of "require".
## Data attributes
### Binding data
To bind data, use the `data-bind="[variableName]"` syntax.
All elements that want to leverage QueryJS, must have an id, though it can be anything that isn't null. 
#### For example,
if I wanted to bind the value of the input below, this would work:
```html
<input type="text" data-bind="myText", id="text-input">
```
and to get the value I could do 
```js
Qj.vars["myText"].value // returns current value of input
```
or, if I wanted to watch for changes,
```js
Qj.vars["myText"].onChange((v)=>{console.log(`Value of my text: ${v}`)})
```
However, this would not:
```html
<input type="text" data-bind="myText">
```
This would throw the error: `QueryJS | Element ([element without id]) must have an id. Add id=[id] to fix this.`
Note, that any variable that is stored by QJ, will and must be in the `Qj.vars`object. This is to prevent pollution of the global namespace, and for compatibility.
Binding like this watches for all input, user or not. Be aware of this. Using binding works on inputs, textareas, etc.

### Showing Data
If you wanted to show the user some data, use the syntax `{expression}`. Doing this inside of braces allows you to execute JavaScript within HTML. If the user doesn't have JS enabled, then it won't work. If you want to escape braces, use `\{}`. This escapes it. Renders `{}` to the screen. To do this, it requires an element to have the data attribute `data-template="true"` on it, and of course an id.
#### Example: 
*note that unlike most other attributes, data binding doesn't require an ID anymore.
```html
<p data-template>{1+2}></p>
``` 
Results in this being shown to the user:
```html
3
```
While this:
```html
<p data-template>\{1+2}</p>
```
Gives:
```html
{1+2}
```
on the screen despite `data-template` being set to true.
This works with multiple templates, without limit.
Sadly, this is not reactive, though you can use the render function to help.
#### Executing in the Global Scope (WIP)
By default, a template is executed in its own scope. If you need to execute it in the global scope, then do this:
`data-template-scope="global"`.
You could also put any scope defined in the global scope here, like a custom scope:
```js
myScope: {
    let i=0;
}
```
Then use `data-template-scope="myScope"`

### Qj.render Function
As mentioned above, templates aren't reactive, so you'll need to use this function to make them. 
Use it like this `Qj.render(id)`. 
This re-renders the templates, so if you changed the text, with elem.innerText, it will re-render.
#### Example
index.js
```js
let i = 0;
setInterval(()=>{
    const elem = document.querySelector("#my-text-elem").innerText=`{1+${i}}`;
    Qj.render("my-text-elem");
},1000)
```
index.html
```html
<p id="my-text-elem">{1+0}</p>
```
Would make the number in the paragraph element count up each second. However, there is a major problem, and that is, this is what normal JS does, except more complicated. So, below is a better version, using Qj.update().
### Qj.update function
The update function essentially allows you to render new text to the screen, much more simply. It basically wraps the text updating with the render call. Also with a lot more options.
How arguments are ordered:
`Qj.update(id, text, options)`.
The most interesting part is the options parameter, as it allows you to loop, delay, etc.
So, lets implement the example above with the update function.
index.js
```js
Qj.update("my-text-elem","{1+i}", {
    loop:{
        count:Infinity, // Loop forever, converts to a setInterval if it is infinite.
        interval:1000, // Wait 1sec between loops,
        callback:()=>{i++} // when loop runs increment i.
    },
    vars:{
        i:0; // set i.
    }
})
```
This may seem like its more code, and yes, it is. But, it is easier, as there is only _one_ function call, and this is the tip of the iceberg when it comes to the update function. Though, this is the long way to write it, as this also works:
```js
Qj.update("my-text-elem", "{1+i}", {
    loop:[true, 1000," i++"], // true means loop to infinity, 1000 is the interval (default to 0), and i++ is what to run when the loop is done.
    vars:["i"]
});
```

## Variables
Variables in QueryJS are stored in the `Qj.vars` object. Anything that needs a variable within its local scope uses `Qj.vars.local.[functionName]` This allows you to access the variables in any Qj function, though truly local ones aren't accessible.
### Reactive variables
To create a reactive variable, you need to use `Qj.reactive(value, onChange)` function. The alias for this is `Qj.$`. 
So lets create a reactive variable like this:
index.html
```html
<button onclick="myCount.$++">Count up</button>
<p id="counter" data-qj-template="true" data-qj-template-scope="global">{myCount.$}</p>
```
index.js
```js
const myCount = Qj.$(0, (value)=>{
    Qj("#counter")[1].innerHTML = `{${value}}`;
    Qj.render("counter");
});
```
This updates the counter.
## Writing aliases
Some QueryJS functions have aliases. However, if you want to write your own alias, then you can use the `Qj.alias` function.
You should use this, and not extend the Qj object itself. Qj.alias checks to make sure that an alias isn't already being used, unless safe=false. 
