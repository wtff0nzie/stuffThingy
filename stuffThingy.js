var stuffThinger = function (landmarks) {
    'use strict';

    var win = window,
        doc = document,
        history = win.history,
        scripts = [],
        fragDiv,
        frag;

    // Does UA support us?
    if (!win.history || ![].forEach) {
        return;
    }

    if (typeof landmarks === 'string') {
        landmarks = [landmarks];
    }

    frag = doc.createDocumentFragment();
    fragDiv = doc.createElement('div');
    frag.appendChild(fragDiv);


    // Lightweight CSS selector
    function q$(selector, context) {
        if (typeof selector === 'string') {
            return [].slice.call((context || doc).querySelectorAll(selector));
        }
        return [selector];
    }


    // Inject new page content
    function injectContent(docFrag) {
        landmarks.forEach(function (selector) {
            q$(selector, docFrag).forEach(function (el) {
                var pageEl = q$(selector, doc)[0],
                    autoFocus;

                pageEl.innerHTML = '';
                pageEl.appendChild(el);


                autoFocus = q$('input[autofocus], textarea[autofocus]', pageEl);
                if (autoFocus.length > 0) {
                    autoFocus[autoFocus.length - 1].focus();
                }
            });
        });

        docFrag.innerHTML = '';
    }


    // Handle inline and ext scripts
    function handleScripts(frag) {
        q$('script', frag).forEach(function (script) {
            var tag;

            if (scripts.indexOf(script) > -1) {
                return;
            }
            scripts.push(script);

            tag = doc.createElement('script');

            if (script.src) {
                tag.src = script.src;
            } else {
                tag.textContent = script.textContent;
            }

            doc.body.appendChild(tag);
        });
    }


    // 'Ajaxify' a <FORM>
    function ajaxifyForm(frm) {
        frm.addEventListener('submit', function (evt) {
            var payload = '',
                X;

            evt.preventDefault();

            q$('input,select,textarea').forEach(function (el) {
                payload += el.name + '=' + encodeURIComponent(el.value) + '&';
            });

            X = new XMLHttpRequest();
            X.open(frm.getAttribute('method') || 'POST', frm.getAttribute('action') || doc.location.href, true);

            X.onreadystatechange = function () {
                if (X.readyState !== 4 || X.status !== 200) {
                    return;
                }

                prepContent(X.responseText);
            };

            X.send(payload);
        });
    }


    // Handle <FORM>s
    function handleForms(frag) {
        q$('form', frag).forEach(ajaxifyForm);
    }


    // Prepare content for injection
    function prepContent(markup) {
        fragDiv.innerHTML = markup;

        handleForms(frag);
        handleScripts(frag);

        injectContent(frag);
    }


    // Fetch a specific page
    function fetchPage(href) {
        var X = new XMLHttpRequest();

        X.open('GET', href, true);

        X.onload = function () {
            if (X.status >= 200 && X.status < 400) {
                prepContent(X.responseText);
            }
        };

        X.send();
    }


    // Global click listener
    doc.addEventListener('click', function (evt) {
        var target = evt.target;

        if (!target) {
            return;
        }

        if (target.tagName === 'A') {
            evt.preventDefault();

            try {
                history.pushState({href: target.href}, target.textContent, target.href);
                fetchPage(target.href);
            } catch (e) {
                win.console.log(e);
                doc.location = target.href;
            }
        }
    });


    // Listen for changes
    win.onpopstate = function (evt) {
        var href = evt.state.href;

        if (href) {
            fetchPage(href);
        }
    };


    // Create <SCRIPT> manifest
    q$('script').forEach(function (script) {
        scripts.push(script);
    });


    // Record initial state
    history.replaceState({href: doc.location.href}, doc.title, doc.location.href);
};

stuffThinger('main');