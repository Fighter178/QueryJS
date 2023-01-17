(() => {
    const loadStart = new Date();
    const QjObj = Object;
    QjObj.freeze(QjObj);
    const qjVars = { local: {} };
    const noIdError = (elem) => {
        throw new Error(`QueryJS | Element (${elem}) must have an id. Add id=[id] to fix this.`);
    };
    (() => {
        document.querySelectorAll("*").forEach((elem) => {
            const dta = elem.dataset;
            const bind = dta.bind;
            const template = dta.qjTemplate || dta.qjTemplateText;
            if (bind) {
                if (!elem.id)
                    noIdError(elem);
                const element = document.querySelector(`#${elem.id}`);
                //@ts-ignore
                qjVars[bind] = { value: element.value, onChange: (v) => { } };
                elem.addEventListener("input", (e) => {
                    //@ts-ignore
                    qjVars[bind].onChange(element.value);
                });
            }
            ;
            /* if (template) {
                const element:HTMLElement = document.querySelector(`#${elem.id}`);
                const text = element.innerText;
                // Matches {}, excludes \{}
                const regex = /(?<!\\)\{(.*?)(?<!\\)\}/g
                
                // evaluate the template literals and replace them with their evaluated value
                element.innerText = text.replace(regex, (match, expression) => {
                    return new Function(`return ${expression}`)();
                }).replace(/\\\{/g, "{");
                
            }*/
        });
    })();
    (() => {
        const elements = document.querySelectorAll("[data-template]");
        elements.forEach((element) => {
            let textContent = element.textContent;
            let newContent = "";
            let currentIndex = 0;
            // Find all brace expressions
            const braceIndices = [];
            let braceOpenIndex = textContent.indexOf("{", currentIndex);
            while (braceOpenIndex !== -1) {
                let braceCloseIndex = textContent.indexOf("}", braceOpenIndex);
                braceIndices.push({ open: braceOpenIndex, close: braceCloseIndex });
                currentIndex = braceCloseIndex;
                braceOpenIndex = textContent.indexOf("{", currentIndex);
            }
            // Replace brace expressions with evaluated values
            currentIndex = 0;
            braceIndices.forEach((indices) => {
                newContent += textContent.slice(currentIndex, indices.open);
                const code = textContent.slice(indices.open + 1, indices.close);
                //@ts-ignore
                //new Observable("").subscribe()
                newContent += new Function(`return ${code}`).call(window);
                currentIndex = indices.close + 1;
            });
            newContent += textContent.slice(currentIndex);
            // Update the element's content with the new content
            element.textContent = newContent;
        });
    })();
    const config = { fixEval: true, allTemplate: true };
    document.addEventListener("DOMContentLoaded", () => {
        if (config.fixEval) {
            //Insecure Eval fix
            globalThis.eval = (x) => {
                new Function(`()=>{${x}}`)();
            };
        }
    });
    const Qj = (selector) => {
        if (typeof selector === 'object') {
            QjObj.assign(config, selector);
        }
        else {
            return document.querySelector(selector);
        }
    };
    //Globals
    globalThis.QjConfig = config;
    globalThis.$ = Qj;
    //@ts-ignore
    globalThis.Qj = Qj;
    Qj.vars = qjVars;
    Qj.render = (id) => {
        const element = document.querySelector(`#${id}`);
        const text = element.innerText;
        // Matches {}, excludes \{}
        const regex = /(?<!\\)\{(.*?)(?<!\\)\}/g;
        // evaluate the template literals and replace them with their evaluated value
        element.innerText = text.replace(regex, (match, expression) => {
            return new Function(`return ${expression}`)();
        }).replace(/\\\{/g, "{");
    };
    Qj.vars.local["update"] = {};
    Qj.update = (id, js, options = {}) => {
        const e = document.getElementById(id);
        eval(js);
        Qj.render(id);
    };
    /**
     *
     * @param str string containing JS
     * @param obj object to replace variables as
     * @param safe To check if the word is reserved, eg. "break" (DEPRECATED)
     * @returns string with references to variables replaced with the reference to the object.
     */
    Qj.proxy = (str, obj, safe = true) => {
        let reservedWords = ["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"];
        let s = str.replace(/(var|let|const)\s+\b([a-zA-Z_$][a-zA-Z_$0-9]*)\b/g, function (match, keyword, variable) {
            if (!obj.hasOwnProperty(variable) && !reservedWords.includes(variable)) {
                obj[variable] = variable;
                return `${keyword} ${obj}.${variable}`;
            }
            return match;
        });
        const recursiveSearch = (str, find) => {
            const count = str.search(find);
            let s = str;
            for (let i = 0; i < count; i++) {
                s = s.replace("let", "");
            }
            ;
            return s;
        };
        s = recursiveSearch(s, "let");
        s = recursiveSearch(s, "const");
        s = recursiveSearch(s, "var");
        return s;
    };
    Qj.reactive = (value, onChange, property) => {
        if (!property)
            throw new Error("QueryJS | Property argument must be defined in Qj.reactive/Qj.$");
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === property || "$")
                    return value;
                return new Proxy(() => { }, {
                    set: (_, __, newValue) => {
                        value = newValue;
                        onChange();
                        return true;
                    },
                });
            },
        });
    };
    Qj.$ = Qj.reactive;
    Qj.props = (obj) => {
        var p = [];
        for (; obj != null; obj = Object.getPrototypeOf(obj)) {
            var op = Object.getOwnPropertyNames(obj);
            for (var i = 0; i < op.length; i++)
                if (p.indexOf(op[i]) == -1)
                    p.push(op[i]);
        }
        return p;
    };
    Qj.alias = (func, alias) => {
        const props = Qj.props(Qj);
        if (alias in props)
            throw new Error(`QueryJS | Alias (${alias}) reserved.`);
        else
            Qj[alias] = func;
    };
    // Protection
    Qj.props(Qj).forEach(prop => {
        try {
            QjObj.freeze(Qj[prop]);
        }
        catch (e) {
            e = e;
        }
        ;
    });
    const finalLoad = new Date();
    document.dispatchEvent(new CustomEvent("QjLoad", {
        bubbles: true,
        cancelable: false,
        detail: {
            timestamp: finalLoad,
            loadDuration: loadStart.getMilliseconds() - finalLoad.getMilliseconds(),
            Qj: Qj,
        }
    }));
})();
