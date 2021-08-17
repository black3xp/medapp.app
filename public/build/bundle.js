
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (moment) {
    'use strict';

    moment = moment && Object.prototype.hasOwnProperty.call(moment, 'default') ? moment['default'] : moment;

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group) {
        const value = [];
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.push(group[i].__value);
        }
        return value;
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.23.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[14]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[13]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix) {
    				if (typeof prefix == "string" && path.startsWith(prefix)) {
    					path = path.substr(prefix.length) || "/";
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		previousScrollState,
    		lastLoc,
    		componentObj,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location$1;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        // Repeat this for each class
        (el.className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the active class firsts
            el.node.classList.remove(cls);

            // If the pattern matches, then set the active class
            if (el.pattern.test(location$1)) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location$1 = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            regexparam(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src/Layout/Aside.svelte generated by Svelte v3.23.0 */
    const file = "src/Layout/Aside.svelte";

    function create_fragment$1(ctx) {
    	let aside;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let a0;
    	let link_action;
    	let t2;
    	let div0;
    	let a1;
    	let t3;
    	let a2;
    	let t4;
    	let div2;
    	let ul1;
    	let li0;
    	let a3;
    	let span2;
    	let span1;
    	let t6;
    	let span3;
    	let i0;
    	let link_action_1;
    	let active_action;
    	let t7;
    	let li1;
    	let a4;
    	let span5;
    	let span4;
    	let t9;
    	let span6;
    	let i1;
    	let link_action_2;
    	let active_action_1;
    	let t10;
    	let li4;
    	let a5;
    	let span10;
    	let span8;
    	let t11;
    	let span7;
    	let t12;
    	let span9;
    	let t14;
    	let span11;
    	let i2;
    	let t15;
    	let ul0;
    	let li2;
    	let a6;
    	let span13;
    	let span12;
    	let t17;
    	let span14;
    	let i3;
    	let link_action_3;
    	let active_action_2;
    	let t19;
    	let li3;
    	let a7;
    	let span16;
    	let span15;
    	let t21;
    	let span17;
    	let i4;
    	let link_action_4;
    	let active_action_3;
    	let active_action_4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			a0 = element("a");
    			a0.textContent = "Gestor de Citas";
    			t2 = space();
    			div0 = element("div");
    			a1 = element("a");
    			t3 = space();
    			a2 = element("a");
    			t4 = space();
    			div2 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			a3 = element("a");
    			span2 = element("span");
    			span1 = element("span");
    			span1.textContent = "Escritorio";
    			t6 = space();
    			span3 = element("span");
    			i0 = element("i");
    			t7 = space();
    			li1 = element("li");
    			a4 = element("a");
    			span5 = element("span");
    			span4 = element("span");
    			span4.textContent = "Citas programadas";
    			t9 = space();
    			span6 = element("span");
    			i1 = element("i");
    			t10 = space();
    			li4 = element("li");
    			a5 = element("a");
    			span10 = element("span");
    			span8 = element("span");
    			t11 = text("Mantenimiento\n              ");
    			span7 = element("span");
    			t12 = space();
    			span9 = element("span");
    			span9.textContent = "Usuarios...";
    			t14 = space();
    			span11 = element("span");
    			i2 = element("i");
    			t15 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a6 = element("a");
    			span13 = element("span");
    			span12 = element("span");
    			span12.textContent = "Usuarios";
    			t17 = space();
    			span14 = element("span");
    			i3 = element("i");
    			i3.textContent = "U";
    			t19 = space();
    			li3 = element("li");
    			a7 = element("a");
    			span16 = element("span");
    			span15 = element("span");
    			span15.textContent = "Consultorios";
    			t21 = space();
    			span17 = element("span");
    			i4 = element("i");
    			i4.textContent = "C";
    			attr_dev(img, "class", "admin-brand-logo");
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "40");
    			attr_dev(img, "alt", "atmos Logo");
    			add_location(img, file, 8, 4, 217);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file, 14, 6, 373);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file, 13, 4, 332);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle");
    			add_location(a1, file, 19, 6, 517);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file, 23, 6, 671);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file, 17, 4, 463);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file, 6, 2, 144);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file, 35, 12, 1036);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file, 34, 10, 998);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-view-dashboard-outline");
    			add_location(i0, file, 38, 12, 1143);
    			attr_dev(span3, "class", "menu-icon");
    			add_location(span3, file, 37, 10, 1106);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file, 33, 8, 948);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file, 32, 6, 900);
    			attr_dev(span4, "class", "menu-name");
    			add_location(span4, file, 46, 12, 1444);
    			attr_dev(span5, "class", "menu-label");
    			add_location(span5, file, 45, 10, 1406);
    			attr_dev(i1, "class", "icon-placeholder mdi mdi-calendar-check");
    			add_location(i1, file, 49, 12, 1558);
    			attr_dev(span6, "class", "menu-icon");
    			add_location(span6, file, 48, 10, 1521);
    			attr_dev(a4, "href", "/citas/gestion");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file, 44, 8, 1343);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file, 43, 6, 1282);
    			attr_dev(span7, "class", "menu-arrow");
    			add_location(span7, file, 77, 14, 2490);
    			attr_dev(span8, "class", "menu-name");
    			add_location(span8, file, 75, 12, 2423);
    			attr_dev(span9, "class", "menu-info");
    			add_location(span9, file, 79, 12, 2550);
    			attr_dev(span10, "class", "menu-label");
    			add_location(span10, file, 74, 10, 2385);
    			attr_dev(i2, "class", "icon-placeholder mdi mdi-settings-outline");
    			add_location(i2, file, 82, 12, 2658);
    			attr_dev(span11, "class", "menu-icon");
    			add_location(span11, file, 81, 10, 2621);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "open-dropdown menu-link");
    			add_location(a5, file, 73, 8, 2329);
    			attr_dev(span12, "class", "menu-name");
    			add_location(span12, file, 90, 16, 2983);
    			attr_dev(span13, "class", "menu-label");
    			add_location(span13, file, 89, 14, 2941);
    			attr_dev(i3, "class", "icon-placeholder ");
    			add_location(i3, file, 93, 16, 3100);
    			attr_dev(span14, "class", "menu-icon");
    			add_location(span14, file, 92, 14, 3059);
    			attr_dev(a6, "href", "/Usuario/Index");
    			attr_dev(a6, "class", " menu-link");
    			add_location(a6, file, 88, 12, 2873);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file, 87, 10, 2808);
    			attr_dev(span15, "class", "menu-name");
    			add_location(span15, file, 100, 16, 3401);
    			attr_dev(span16, "class", "menu-label");
    			add_location(span16, file, 99, 14, 3359);
    			attr_dev(i4, "class", "icon-placeholder ");
    			add_location(i4, file, 103, 16, 3522);
    			attr_dev(span17, "class", "menu-icon");
    			add_location(span17, file, 102, 14, 3481);
    			attr_dev(a7, "href", "/mantenimiento/consultorios");
    			attr_dev(a7, "class", " menu-link");
    			add_location(a7, file, 98, 12, 3278);
    			attr_dev(li3, "class", "menu-item");
    			add_location(li3, file, 97, 10, 3200);
    			attr_dev(ul0, "class", "sub-menu");
    			add_location(ul0, file, 86, 8, 2776);
    			attr_dev(li4, "class", "menu-item ");
    			toggle_class(li4, "d-none", false);
    			add_location(li4, file, 70, 6, 2233);
    			attr_dev(ul1, "class", "menu");
    			add_location(ul1, file, 30, 4, 846);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file, 28, 2, 764);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, span0);
    			append_dev(span0, a0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, a1);
    			append_dev(div0, t3);
    			append_dev(div0, a2);
    			append_dev(aside, t4);
    			append_dev(aside, div2);
    			append_dev(div2, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a3);
    			append_dev(a3, span2);
    			append_dev(span2, span1);
    			append_dev(a3, t6);
    			append_dev(a3, span3);
    			append_dev(span3, i0);
    			append_dev(ul1, t7);
    			append_dev(ul1, li1);
    			append_dev(li1, a4);
    			append_dev(a4, span5);
    			append_dev(span5, span4);
    			append_dev(a4, t9);
    			append_dev(a4, span6);
    			append_dev(span6, i1);
    			append_dev(ul1, t10);
    			append_dev(ul1, li4);
    			append_dev(li4, a5);
    			append_dev(a5, span10);
    			append_dev(span10, span8);
    			append_dev(span8, t11);
    			append_dev(span8, span7);
    			append_dev(span10, t12);
    			append_dev(span10, span9);
    			append_dev(a5, t14);
    			append_dev(a5, span11);
    			append_dev(span11, i2);
    			append_dev(li4, t15);
    			append_dev(li4, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a6);
    			append_dev(a6, span13);
    			append_dev(span13, span12);
    			append_dev(a6, t17);
    			append_dev(a6, span14);
    			append_dev(span14, i3);
    			append_dev(ul0, t19);
    			append_dev(ul0, li3);
    			append_dev(li3, a7);
    			append_dev(a7, span16);
    			append_dev(span16, span15);
    			append_dev(a7, t21);
    			append_dev(a7, span17);
    			append_dev(span17, i4);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active.call(null, li0, "/")),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active.call(null, li1, "/citas/gestion")),
    					action_destroyer(link_action_3 = link.call(null, a6)),
    					action_destroyer(active_action_2 = active.call(null, li2, "/Usuario/Index")),
    					action_destroyer(link_action_4 = link.call(null, a7)),
    					action_destroyer(active_action_3 = active.call(null, li3, "/mantenimiento/consultorios")),
    					action_destroyer(active_action_4 = active.call(null, li4, "/Usuario/*"))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Aside> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Aside", $$slots, []);
    	$$self.$capture_state = () => ({ link, active });
    	return [];
    }

    class Aside extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Aside",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /**
     * The code was extracted from:
     * https://github.com/davidchambers/Base64.js
     */

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    function InvalidCharacterError(message) {
      this.message = message;
    }

    InvalidCharacterError.prototype = new Error();
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    function polyfill (input) {
      var str = String(input).replace(/=+$/, '');
      if (str.length % 4 == 1) {
        throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (
        // initialize result and counters
        var bc = 0, bs, buffer, idx = 0, output = '';
        // get next character
        buffer = str.charAt(idx++);
        // character found in table? initialize bit storage and add its ascii value;
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          // and if not first of each 4 characters,
          // convert the first 8 bits to one ascii character
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        // try to find character in table (0-63, not found => -1)
        buffer = chars.indexOf(buffer);
      }
      return output;
    }


    var atob$1 = typeof window !== 'undefined' && window.atob && window.atob.bind(window) || polyfill;

    function b64DecodeUnicode(str) {
      return decodeURIComponent(atob$1(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
          code = '0' + code;
        }
        return '%' + code;
      }));
    }

    var base64_url_decode = function(str) {
      var output = str.replace(/-/g, "+").replace(/_/g, "/");
      switch (output.length % 4) {
        case 0:
          break;
        case 2:
          output += "==";
          break;
        case 3:
          output += "=";
          break;
        default:
          throw "Illegal base64url string!";
      }

      try{
        return b64DecodeUnicode(output);
      } catch (err) {
        return atob$1(output);
      }
    };

    function InvalidTokenError(message) {
      this.message = message;
    }

    InvalidTokenError.prototype = new Error();
    InvalidTokenError.prototype.name = 'InvalidTokenError';

    var lib = function (token,options) {
      if (typeof token !== 'string') {
        throw new InvalidTokenError('Invalid token specified');
      }

      options = options || {};
      var pos = options.header === true ? 0 : 1;
      try {
        return JSON.parse(base64_url_decode(token.split('.')[pos]));
      } catch (e) {
        throw new InvalidTokenError('Invalid token specified: ' + e.message);
      }
    };

    var InvalidTokenError_1 = InvalidTokenError;
    lib.InvalidTokenError = InvalidTokenError_1;

    /* src/Layout/Header.svelte generated by Svelte v3.23.0 */
    const file$1 = "src/Layout/Header.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let a0;
    	let t0;
    	let nav0;
    	let ul0;
    	let li0;
    	let a1;
    	let i0;
    	let t1;
    	let nav1;
    	let ul1;
    	let li1;
    	let div10;
    	let a2;
    	let i1;
    	let t2;
    	let span0;
    	let t3;
    	let div9;
    	let div0;
    	let a3;
    	let t4;
    	let span1;
    	let t6;
    	let a4;
    	let t7;
    	let div8;
    	let div1;
    	let t9;
    	let a5;
    	let div3;
    	let div2;
    	let i2;
    	let t10;
    	let t11;
    	let a6;
    	let div5;
    	let div4;
    	let i3;
    	let t12;
    	let t13;
    	let a7;
    	let div7;
    	let div6;
    	let i4;
    	let t14;
    	let t15;
    	let li2;
    	let a8;
    	let div11;
    	let span2;
    	let t17;
    	let div13;
    	let a9;
    	let t19;
    	let div12;
    	let t20;
    	let a10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			a0 = element("a");
    			t0 = space();
    			nav0 = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			i0 = element("i");
    			t1 = space();
    			nav1 = element("nav");
    			ul1 = element("ul");
    			li1 = element("li");
    			div10 = element("div");
    			a2 = element("a");
    			i1 = element("i");
    			t2 = space();
    			span0 = element("span");
    			t3 = space();
    			div9 = element("div");
    			div0 = element("div");
    			a3 = element("a");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Notifications";
    			t6 = space();
    			a4 = element("a");
    			t7 = space();
    			div8 = element("div");
    			div1 = element("div");
    			div1.textContent = "today";
    			t9 = space();
    			a5 = element("a");
    			div3 = element("div");
    			div2 = element("div");
    			i2 = element("i");
    			t10 = text("\n                    All systems operational.");
    			t11 = space();
    			a6 = element("a");
    			div5 = element("div");
    			div4 = element("div");
    			i3 = element("i");
    			t12 = text("\n                    File upload successful.");
    			t13 = space();
    			a7 = element("a");
    			div7 = element("div");
    			div6 = element("div");
    			i4 = element("i");
    			t14 = text("\n                    Your holiday has been denied");
    			t15 = space();
    			li2 = element("li");
    			a8 = element("a");
    			div11 = element("div");
    			span2 = element("span");
    			span2.textContent = "V";
    			t17 = space();
    			div13 = element("div");
    			a9 = element("a");
    			a9.textContent = "Resetear contraseña";
    			t19 = space();
    			div12 = element("div");
    			t20 = space();
    			a10 = element("a");
    			a10.textContent = "Cerrar sesion";
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "sidebar-toggle");
    			attr_dev(a0, "data-toggleclass", "sidebar-open");
    			attr_dev(a0, "data-target", "body");
    			add_location(a0, file$1, 16, 2, 320);
    			attr_dev(i0, "class", " mdi mdi-magnify mdi-24px align-middle");
    			add_location(i0, file$1, 33, 10, 690);
    			attr_dev(a1, "class", "nav-link ");
    			attr_dev(a1, "data-target", "#!siteSearchModal");
    			attr_dev(a1, "data-toggle", "modal");
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file$1, 28, 8, 556);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$1, 27, 6, 526);
    			attr_dev(ul0, "class", "nav align-items-center");
    			add_location(ul0, file$1, 25, 4, 483);
    			attr_dev(nav0, "class", " mr-auto my-auto");
    			add_location(nav0, file$1, 24, 2, 448);
    			attr_dev(i1, "class", "mdi mdi-24px mdi-bell-outline");
    			add_location(i1, file$1, 49, 12, 1091);
    			attr_dev(span0, "class", "notification-counter");
    			add_location(span0, file$1, 50, 12, 1147);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "data-toggle", "dropdown");
    			attr_dev(a2, "aria-haspopup", "true");
    			attr_dev(a2, "aria-expanded", "false");
    			add_location(a2, file$1, 43, 10, 922);
    			attr_dev(a3, "href", "#!");
    			attr_dev(a3, "class", "mdi mdi-18px mdi-settings text-muted");
    			add_location(a3, file$1, 57, 14, 1414);
    			attr_dev(span1, "class", "h5 m-0");
    			add_location(span1, file$1, 60, 14, 1531);
    			attr_dev(a4, "href", "#!");
    			attr_dev(a4, "class", "mdi mdi-18px mdi-notification-clear-all text-muted");
    			add_location(a4, file$1, 61, 14, 1587);
    			attr_dev(div0, "class", "d-flex p-all-15 bg-white justify-content-between\n              border-bottom ");
    			add_location(div0, file$1, 54, 12, 1294);
    			attr_dev(div1, "class", "text-overline m-b-5");
    			add_location(div1, file$1, 68, 14, 1830);
    			attr_dev(i2, "class", "mdi mdi-circle text-success");
    			add_location(i2, file$1, 72, 20, 2023);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file$1, 71, 18, 1979);
    			attr_dev(div3, "class", "card");
    			add_location(div3, file$1, 70, 16, 1942);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "d-block m-b-10");
    			add_location(a5, file$1, 69, 14, 1889);
    			attr_dev(i3, "class", "mdi mdi-upload-multiple ");
    			add_location(i3, file$1, 80, 20, 2325);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$1, 79, 18, 2281);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file$1, 78, 16, 2244);
    			attr_dev(a6, "href", "#!");
    			attr_dev(a6, "class", "d-block m-b-10");
    			add_location(a6, file$1, 77, 14, 2191);
    			attr_dev(i4, "class", "mdi mdi-cancel text-danger");
    			add_location(i4, file$1, 88, 20, 2623);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file$1, 87, 18, 2579);
    			attr_dev(div7, "class", "card");
    			add_location(div7, file$1, 86, 16, 2542);
    			attr_dev(a7, "href", "#!");
    			attr_dev(a7, "class", "d-block m-b-10");
    			add_location(a7, file$1, 85, 14, 2489);
    			attr_dev(div8, "class", "notification-events bg-gray-300");
    			add_location(div8, file$1, 67, 12, 1770);
    			attr_dev(div9, "class", "dropdown-menu notification-container dropdown-menu-right");
    			add_location(div9, file$1, 53, 10, 1211);
    			attr_dev(div10, "class", "dropdown");
    			add_location(div10, file$1, 42, 8, 889);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$1, 41, 6, 859);
    			attr_dev(span2, "class", "avatar-title rounded-circle bg-dark");
    			add_location(span2, file$1, 108, 12, 3145);
    			attr_dev(div11, "class", "avatar avatar-sm avatar-online");
    			add_location(div11, file$1, 107, 10, 3088);
    			attr_dev(a8, "class", "nav-link dropdown-toggle");
    			attr_dev(a8, "href", "#!");
    			attr_dev(a8, "role", "button");
    			attr_dev(a8, "data-toggle", "dropdown");
    			attr_dev(a8, "aria-haspopup", "true");
    			attr_dev(a8, "aria-expanded", "false");
    			add_location(a8, file$1, 100, 8, 2891);
    			attr_dev(a9, "class", "dropdown-item");
    			attr_dev(a9, "href", "#!");
    			add_location(a9, file$1, 113, 10, 3301);
    			attr_dev(div12, "class", "dropdown-divider");
    			add_location(div12, file$1, 114, 10, 3370);
    			attr_dev(a10, "class", "dropdown-item");
    			attr_dev(a10, "href", "#!");
    			add_location(a10, file$1, 115, 10, 3413);
    			attr_dev(div13, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div13, file$1, 112, 8, 3243);
    			attr_dev(li2, "class", "nav-item dropdown ");
    			add_location(li2, file$1, 99, 6, 2851);
    			attr_dev(ul1, "class", "nav align-items-center");
    			add_location(ul1, file$1, 39, 4, 816);
    			attr_dev(nav1, "class", " ml-auto");
    			add_location(nav1, file$1, 38, 2, 789);
    			attr_dev(header, "class", "admin-header");
    			add_location(header, file$1, 15, 0, 288);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, a0);
    			append_dev(header, t0);
    			append_dev(header, nav0);
    			append_dev(nav0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i0);
    			append_dev(header, t1);
    			append_dev(header, nav1);
    			append_dev(nav1, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div10);
    			append_dev(div10, a2);
    			append_dev(a2, i1);
    			append_dev(a2, t2);
    			append_dev(a2, span0);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, div0);
    			append_dev(div0, a3);
    			append_dev(div0, t4);
    			append_dev(div0, span1);
    			append_dev(div0, t6);
    			append_dev(div0, a4);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			append_dev(div8, t9);
    			append_dev(div8, a5);
    			append_dev(a5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, i2);
    			append_dev(div2, t10);
    			append_dev(div8, t11);
    			append_dev(div8, a6);
    			append_dev(a6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, i3);
    			append_dev(div4, t12);
    			append_dev(div8, t13);
    			append_dev(div8, a7);
    			append_dev(a7, div7);
    			append_dev(div7, div6);
    			append_dev(div6, i4);
    			append_dev(div6, t14);
    			append_dev(ul1, t15);
    			append_dev(ul1, li2);
    			append_dev(li2, a8);
    			append_dev(a8, div11);
    			append_dev(div11, span2);
    			append_dev(li2, t17);
    			append_dev(li2, div13);
    			append_dev(div13, a9);
    			append_dev(div13, t19);
    			append_dev(div13, div12);
    			append_dev(div13, t20);
    			append_dev(div13, a10);

    			if (!mounted) {
    				dispose = listen_dev(a10, "click", prevent_default(/*logOut*/ ctx[0]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	jQuery(".modal-backdrop").hide();

    	const logOut = () => {
    		localStorage.removeItem("access_token");

    		if (!localStorage.getItem("access_token")) {
    			push("/home/login");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	$$self.$capture_state = () => ({ push, jwt: lib, logOut });
    	return [logOut];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Pages/Home/Index.svelte generated by Svelte v3.23.0 */
    const file$2 = "src/Pages/Home/Index.svelte";

    function create_fragment$3(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let section;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let h1;
    	let t3;
    	let p;
    	let current;
    	const aside = new Aside({ $$inline: true });
    	const header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Bienvenido";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Al sistema de gestion de citas";
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file$2, 19, 12, 475);
    			add_location(p, file$2, 20, 12, 525);
    			attr_dev(div0, "class", "col-4 container");
    			add_location(div0, file$2, 18, 10, 433);
    			attr_dev(div1, "class", "row justify-content-center");
    			add_location(div1, file$2, 17, 8, 382);
    			attr_dev(div2, "class", "jumbotron jumbotron-fluid");
    			add_location(div2, file$2, 15, 6, 327);
    			attr_dev(div3, "class", "container mt-3");
    			add_location(div3, file$2, 14, 4, 292);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$2, 13, 2, 256);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$2, 11, 0, 215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Index", $$slots, []);
    	$$self.$capture_state = () => ({ Aside, Header, onDestroy, push });
    	return [];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /**
     * Data as preserved in the backing store
     * @typedef {Object} SessionData
     * @property {string} username user name (id)
     * @property {string} access_token JWT token
     */

    /**
     * User session
     * To create as session backed by browser local storage
     * ```js
     * let session = new Session(localStorage);
     * ```
     * or by browser session storage
     * ```js
     * let session = new Session(sessionStorage);
     * ```
     * @param {SessionData} data
     * @property {Set<string>} entitlements
     * @property {Set<Object>} subscriptions store subscriptions
     * @property {Date} expirationDate
     * @property {string} access_token token itself
     * @property {SessionData} store backing store to use for save same as data param
     */
    class Session {
      constructor(data) {
        let expirationTimer;

        Object.defineProperties(this, {
          store: {
            value: data
          },
          subscriptions: {
            value: new Set()
          },
          entitlements: {
            value: new Set()
          },
          expirationDate: {
            value: new Date(0)
          },
          expirationTimer: {
            get: () => expirationTimer,
            set: v => (expirationTimer = v)
          }
        });

        this.update(data);
      }

      /**
       * Invalidate session data
       */
      clear() {
        this.entitlements.clear();
        this.expirationDate.setTime(0);
        this.username = undefined;
        this.access_token = undefined;
        if (this.expirationTimer) {
          clearTimeout(this.expirationTimer);
          this.expirationTimer = undefined;
        }
      }

      update(data) {
        this.clear();

        if (data !== undefined) {
          this.username = data.username !== "undefined" ? data.username : undefined;
          this.access_token = data.access_token;

          const decoded = decode(data.access_token);

          if (decoded) {
            this.expirationDate.setUTCSeconds(decoded.exp);

            const expiresInMilliSeconds =
              this.expirationDate.valueOf() - Date.now();

            if(expiresInMilliSeconds > 0) {
              if(decoded.entitlements) {
                decoded.entitlements.split(/,/).forEach(e => this.entitlements.add(e));
              }

              this.expirationTimer = setTimeout(() => {
                this.clear();
                this.fire();
              }, expiresInMilliSeconds);
            }
          }
        }

        this.fire();
      }

      /**
       * Persist into the backing store
       */
      save() {
        if (this.username === undefined) {
          delete this.store.access_token;
          delete this.store.username;
        } else {
          this.store.access_token = this.access_token;
          this.store.username = this.username;
        }
      }

      /**
       * http header suitable for fetch
       * @return {Object} header The http header.
       * @return {string} header.Authorization The Bearer access token.
       */
      get authorizationHeader() {
        return { Authorization: "Bearer " + this.access_token };
      }

      /**
       * As long as the expirationTimer is running we must be valid
       * @return {boolean} true if session is valid (not expired)
       */
      get isValid() {
        return this.expirationTimer !== undefined;
      }

      /**
       * Remove all tokens from the session and the backing store
       */
      invalidate() {
        this.update();
        this.save();
      }

      /**
       * Check presence of an entilement.
       * @param {string} name of the entitlement
       * @return {boolean} true if the named entitlement is present
       */ 
      hasEntitlement(name) {
        return this.entitlements.has(name);
      }

      fire() {
        this.subscriptions.forEach(subscription => subscription(this));
      }

      /**
       * Fired when the session changes
       * @param {Function} subscription
       */
      subscribe(subscription) {
        subscription(this);
        this.subscriptions.add(subscription);
        return () => this.subscriptions.delete(subscription);
      }
    }

    function decode(token) {
      return token === undefined || token === "undefined"
        ? undefined
        : JSON.parse(atob(token.split(".")[1]));
    }

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __extends = (undefined && undefined.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    /** Error thrown when an HTTP request fails. */
    var HttpError = /** @class */ (function (_super) {
        __extends(HttpError, _super);
        /** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
         *
         * @param {string} errorMessage A descriptive error message.
         * @param {number} statusCode The HTTP status code represented by this error.
         */
        function HttpError(errorMessage, statusCode) {
            var _newTarget = this.constructor;
            var _this = this;
            var trueProto = _newTarget.prototype;
            _this = _super.call(this, errorMessage) || this;
            _this.statusCode = statusCode;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            _this.__proto__ = trueProto;
            return _this;
        }
        return HttpError;
    }(Error));
    /** Error thrown when a timeout elapses. */
    var TimeoutError = /** @class */ (function (_super) {
        __extends(TimeoutError, _super);
        /** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        function TimeoutError(errorMessage) {
            var _newTarget = this.constructor;
            if (errorMessage === void 0) { errorMessage = "A timeout occurred."; }
            var _this = this;
            var trueProto = _newTarget.prototype;
            _this = _super.call(this, errorMessage) || this;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            _this.__proto__ = trueProto;
            return _this;
        }
        return TimeoutError;
    }(Error));
    /** Error thrown when an action is aborted. */
    var AbortError = /** @class */ (function (_super) {
        __extends(AbortError, _super);
        /** Constructs a new instance of {@link AbortError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        function AbortError(errorMessage) {
            var _newTarget = this.constructor;
            if (errorMessage === void 0) { errorMessage = "An abort occurred."; }
            var _this = this;
            var trueProto = _newTarget.prototype;
            _this = _super.call(this, errorMessage) || this;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            _this.__proto__ = trueProto;
            return _this;
        }
        return AbortError;
    }(Error));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    /** Represents an HTTP response. */
    var HttpResponse = /** @class */ (function () {
        function HttpResponse(statusCode, statusText, content) {
            this.statusCode = statusCode;
            this.statusText = statusText;
            this.content = content;
        }
        return HttpResponse;
    }());
    /** Abstraction over an HTTP client.
     *
     * This class provides an abstraction over an HTTP client so that a different implementation can be provided on different platforms.
     */
    var HttpClient = /** @class */ (function () {
        function HttpClient() {
        }
        HttpClient.prototype.get = function (url, options) {
            return this.send(__assign({}, options, { method: "GET", url: url }));
        };
        HttpClient.prototype.post = function (url, options) {
            return this.send(__assign({}, options, { method: "POST", url: url }));
        };
        HttpClient.prototype.delete = function (url, options) {
            return this.send(__assign({}, options, { method: "DELETE", url: url }));
        };
        /** Gets all cookies that apply to the specified URL.
         *
         * @param url The URL that the cookies are valid for.
         * @returns {string} A string containing all the key-value cookie pairs for the specified URL.
         */
        // @ts-ignore
        HttpClient.prototype.getCookieString = function (url) {
            return "";
        };
        return HttpClient;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    // These values are designed to match the ASP.NET Log Levels since that's the pattern we're emulating here.
    /** Indicates the severity of a log message.
     *
     * Log Levels are ordered in increasing severity. So `Debug` is more severe than `Trace`, etc.
     */
    var LogLevel;
    (function (LogLevel) {
        /** Log level for very low severity diagnostic messages. */
        LogLevel[LogLevel["Trace"] = 0] = "Trace";
        /** Log level for low severity diagnostic messages. */
        LogLevel[LogLevel["Debug"] = 1] = "Debug";
        /** Log level for informational diagnostic messages. */
        LogLevel[LogLevel["Information"] = 2] = "Information";
        /** Log level for diagnostic messages that indicate a non-fatal problem. */
        LogLevel[LogLevel["Warning"] = 3] = "Warning";
        /** Log level for diagnostic messages that indicate a failure in the current operation. */
        LogLevel[LogLevel["Error"] = 4] = "Error";
        /** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
        LogLevel[LogLevel["Critical"] = 5] = "Critical";
        /** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
        LogLevel[LogLevel["None"] = 6] = "None";
    })(LogLevel || (LogLevel = {}));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    /** A logger that does nothing when log messages are sent to it. */
    var NullLogger = /** @class */ (function () {
        function NullLogger() {
        }
        /** @inheritDoc */
        // tslint:disable-next-line
        NullLogger.prototype.log = function (_logLevel, _message) {
        };
        /** The singleton instance of the {@link @microsoft/signalr.NullLogger}. */
        NullLogger.instance = new NullLogger();
        return NullLogger;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    /** @private */
    var Arg = /** @class */ (function () {
        function Arg() {
        }
        Arg.isRequired = function (val, name) {
            if (val === null || val === undefined) {
                throw new Error("The '" + name + "' argument is required.");
            }
        };
        Arg.isIn = function (val, values, name) {
            // TypeScript enums have keys for **both** the name and the value of each enum member on the type itself.
            if (!(val in values)) {
                throw new Error("Unknown " + name + " value: " + val + ".");
            }
        };
        return Arg;
    }());
    /** @private */
    var Platform = /** @class */ (function () {
        function Platform() {
        }
        Object.defineProperty(Platform, "isBrowser", {
            get: function () {
                return typeof window === "object";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Platform, "isWebWorker", {
            get: function () {
                return typeof self === "object" && "importScripts" in self;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Platform, "isNode", {
            get: function () {
                return !this.isBrowser && !this.isWebWorker;
            },
            enumerable: true,
            configurable: true
        });
        return Platform;
    }());
    /** @private */
    function getDataDetail(data, includeContent) {
        var detail = "";
        if (isArrayBuffer(data)) {
            detail = "Binary data of length " + data.byteLength;
            if (includeContent) {
                detail += ". Content: '" + formatArrayBuffer(data) + "'";
            }
        }
        else if (typeof data === "string") {
            detail = "String data of length " + data.length;
            if (includeContent) {
                detail += ". Content: '" + data + "'";
            }
        }
        return detail;
    }
    /** @private */
    function formatArrayBuffer(data) {
        var view = new Uint8Array(data);
        // Uint8Array.map only supports returning another Uint8Array?
        var str = "";
        view.forEach(function (num) {
            var pad = num < 16 ? "0" : "";
            str += "0x" + pad + num.toString(16) + " ";
        });
        // Trim of trailing space.
        return str.substr(0, str.length - 1);
    }
    // Also in signalr-protocol-msgpack/Utils.ts
    /** @private */
    function isArrayBuffer(val) {
        return val && typeof ArrayBuffer !== "undefined" &&
            (val instanceof ArrayBuffer ||
                // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
                (val.constructor && val.constructor.name === "ArrayBuffer"));
    }
    /** @private */
    function sendMessage(logger, transportName, httpClient, url, accessTokenFactory, content, logMessageContent) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, headers, token, responseType, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!accessTokenFactory) return [3 /*break*/, 2];
                        return [4 /*yield*/, accessTokenFactory()];
                    case 1:
                        token = _b.sent();
                        if (token) {
                            headers = (_a = {},
                                _a["Authorization"] = "Bearer " + token,
                                _a);
                        }
                        _b.label = 2;
                    case 2:
                        logger.log(LogLevel.Trace, "(" + transportName + " transport) sending data. " + getDataDetail(content, logMessageContent) + ".");
                        responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
                        return [4 /*yield*/, httpClient.post(url, {
                                content: content,
                                headers: headers,
                                responseType: responseType,
                            })];
                    case 3:
                        response = _b.sent();
                        logger.log(LogLevel.Trace, "(" + transportName + " transport) request complete. Response status: " + response.statusCode + ".");
                        return [2 /*return*/];
                }
            });
        });
    }
    /** @private */
    function createLogger(logger) {
        if (logger === undefined) {
            return new ConsoleLogger(LogLevel.Information);
        }
        if (logger === null) {
            return NullLogger.instance;
        }
        if (logger.log) {
            return logger;
        }
        return new ConsoleLogger(logger);
    }
    /** @private */
    var SubjectSubscription = /** @class */ (function () {
        function SubjectSubscription(subject, observer) {
            this.subject = subject;
            this.observer = observer;
        }
        SubjectSubscription.prototype.dispose = function () {
            var index = this.subject.observers.indexOf(this.observer);
            if (index > -1) {
                this.subject.observers.splice(index, 1);
            }
            if (this.subject.observers.length === 0 && this.subject.cancelCallback) {
                this.subject.cancelCallback().catch(function (_) { });
            }
        };
        return SubjectSubscription;
    }());
    /** @private */
    var ConsoleLogger = /** @class */ (function () {
        function ConsoleLogger(minimumLogLevel) {
            this.minimumLogLevel = minimumLogLevel;
            this.outputConsole = console;
        }
        ConsoleLogger.prototype.log = function (logLevel, message) {
            if (logLevel >= this.minimumLogLevel) {
                switch (logLevel) {
                    case LogLevel.Critical:
                    case LogLevel.Error:
                        this.outputConsole.error("[" + new Date().toISOString() + "] " + LogLevel[logLevel] + ": " + message);
                        break;
                    case LogLevel.Warning:
                        this.outputConsole.warn("[" + new Date().toISOString() + "] " + LogLevel[logLevel] + ": " + message);
                        break;
                    case LogLevel.Information:
                        this.outputConsole.info("[" + new Date().toISOString() + "] " + LogLevel[logLevel] + ": " + message);
                        break;
                    default:
                        // console.debug only goes to attached debuggers in Node, so we use console.log for Trace and Debug
                        this.outputConsole.log("[" + new Date().toISOString() + "] " + LogLevel[logLevel] + ": " + message);
                        break;
                }
            }
        };
        return ConsoleLogger;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __extends$1 = (undefined && undefined.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    var requestModule;
    if (typeof XMLHttpRequest === "undefined") {
        // In order to ignore the dynamic require in webpack builds we need to do this magic
        // @ts-ignore: TS doesn't know about these names
        var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
        requestModule = requireFunc("request");
    }
    /** @private */
    var NodeHttpClient = /** @class */ (function (_super) {
        __extends$1(NodeHttpClient, _super);
        function NodeHttpClient(logger) {
            var _this = _super.call(this) || this;
            if (typeof requestModule === "undefined") {
                throw new Error("The 'request' module could not be loaded.");
            }
            _this.logger = logger;
            _this.cookieJar = requestModule.jar();
            _this.request = requestModule.defaults({ jar: _this.cookieJar });
            return _this;
        }
        NodeHttpClient.prototype.send = function (httpRequest) {
            var _this = this;
            // Check that abort was not signaled before calling send
            if (httpRequest.abortSignal) {
                if (httpRequest.abortSignal.aborted) {
                    return Promise.reject(new AbortError());
                }
            }
            return new Promise(function (resolve, reject) {
                var requestBody;
                if (isArrayBuffer(httpRequest.content)) {
                    requestBody = Buffer.from(httpRequest.content);
                }
                else {
                    requestBody = httpRequest.content || "";
                }
                var currentRequest = _this.request(httpRequest.url, {
                    body: requestBody,
                    // If binary is expected 'null' should be used, otherwise for text 'utf8'
                    encoding: httpRequest.responseType === "arraybuffer" ? null : "utf8",
                    headers: __assign$1({ 
                        // Tell auth middleware to 401 instead of redirecting
                        "X-Requested-With": "XMLHttpRequest" }, httpRequest.headers),
                    method: httpRequest.method,
                    timeout: httpRequest.timeout,
                }, function (error, response, body) {
                    if (httpRequest.abortSignal) {
                        httpRequest.abortSignal.onabort = null;
                    }
                    if (error) {
                        if (error.code === "ETIMEDOUT") {
                            _this.logger.log(LogLevel.Warning, "Timeout from HTTP request.");
                            reject(new TimeoutError());
                        }
                        _this.logger.log(LogLevel.Warning, "Error from HTTP request. " + error);
                        reject(error);
                        return;
                    }
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(new HttpResponse(response.statusCode, response.statusMessage || "", body));
                    }
                    else {
                        reject(new HttpError(response.statusMessage || "", response.statusCode || 0));
                    }
                });
                if (httpRequest.abortSignal) {
                    httpRequest.abortSignal.onabort = function () {
                        currentRequest.abort();
                        reject(new AbortError());
                    };
                }
            });
        };
        NodeHttpClient.prototype.getCookieString = function (url) {
            return this.cookieJar.getCookieString(url);
        };
        return NodeHttpClient;
    }(HttpClient));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __extends$2 = (undefined && undefined.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var XhrHttpClient = /** @class */ (function (_super) {
        __extends$2(XhrHttpClient, _super);
        function XhrHttpClient(logger) {
            var _this = _super.call(this) || this;
            _this.logger = logger;
            return _this;
        }
        /** @inheritDoc */
        XhrHttpClient.prototype.send = function (request) {
            var _this = this;
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(request.method, request.url, true);
                xhr.withCredentials = true;
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                // Explicitly setting the Content-Type header for React Native on Android platform.
                xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
                var headers = request.headers;
                if (headers) {
                    Object.keys(headers)
                        .forEach(function (header) {
                        xhr.setRequestHeader(header, headers[header]);
                    });
                }
                if (request.responseType) {
                    xhr.responseType = request.responseType;
                }
                if (request.abortSignal) {
                    request.abortSignal.onabort = function () {
                        xhr.abort();
                        reject(new AbortError());
                    };
                }
                if (request.timeout) {
                    xhr.timeout = request.timeout;
                }
                xhr.onload = function () {
                    if (request.abortSignal) {
                        request.abortSignal.onabort = null;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
                    }
                    else {
                        reject(new HttpError(xhr.statusText, xhr.status));
                    }
                };
                xhr.onerror = function () {
                    _this.logger.log(LogLevel.Warning, "Error from HTTP request. " + xhr.status + ": " + xhr.statusText + ".");
                    reject(new HttpError(xhr.statusText, xhr.status));
                };
                xhr.ontimeout = function () {
                    _this.logger.log(LogLevel.Warning, "Timeout from HTTP request.");
                    reject(new TimeoutError());
                };
                xhr.send(request.content || "");
            });
        };
        return XhrHttpClient;
    }(HttpClient));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __extends$3 = (undefined && undefined.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    /** Default implementation of {@link @microsoft/signalr.HttpClient}. */
    var DefaultHttpClient = /** @class */ (function (_super) {
        __extends$3(DefaultHttpClient, _super);
        /** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
        function DefaultHttpClient(logger) {
            var _this = _super.call(this) || this;
            if (typeof XMLHttpRequest !== "undefined") {
                _this.httpClient = new XhrHttpClient(logger);
            }
            else {
                _this.httpClient = new NodeHttpClient(logger);
            }
            return _this;
        }
        /** @inheritDoc */
        DefaultHttpClient.prototype.send = function (request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return this.httpClient.send(request);
        };
        DefaultHttpClient.prototype.getCookieString = function (url) {
            return this.httpClient.getCookieString(url);
        };
        return DefaultHttpClient;
    }(HttpClient));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    // Not exported from index
    /** @private */
    var TextMessageFormat = /** @class */ (function () {
        function TextMessageFormat() {
        }
        TextMessageFormat.write = function (output) {
            return "" + output + TextMessageFormat.RecordSeparator;
        };
        TextMessageFormat.parse = function (input) {
            if (input[input.length - 1] !== TextMessageFormat.RecordSeparator) {
                throw new Error("Message is incomplete.");
            }
            var messages = input.split(TextMessageFormat.RecordSeparator);
            messages.pop();
            return messages;
        };
        TextMessageFormat.RecordSeparatorCode = 0x1e;
        TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);
        return TextMessageFormat;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    /** @private */
    var HandshakeProtocol = /** @class */ (function () {
        function HandshakeProtocol() {
        }
        // Handshake request is always JSON
        HandshakeProtocol.prototype.writeHandshakeRequest = function (handshakeRequest) {
            return TextMessageFormat.write(JSON.stringify(handshakeRequest));
        };
        HandshakeProtocol.prototype.parseHandshakeResponse = function (data) {
            var responseMessage;
            var messageData;
            var remainingData;
            if (isArrayBuffer(data) || (typeof Buffer !== "undefined" && data instanceof Buffer)) {
                // Format is binary but still need to read JSON text from handshake response
                var binaryData = new Uint8Array(data);
                var separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                var responseLength = separatorIndex + 1;
                messageData = String.fromCharCode.apply(null, binaryData.slice(0, responseLength));
                remainingData = (binaryData.byteLength > responseLength) ? binaryData.slice(responseLength).buffer : null;
            }
            else {
                var textData = data;
                var separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                var responseLength = separatorIndex + 1;
                messageData = textData.substring(0, responseLength);
                remainingData = (textData.length > responseLength) ? textData.substring(responseLength) : null;
            }
            // At this point we should have just the single handshake message
            var messages = TextMessageFormat.parse(messageData);
            var response = JSON.parse(messages[0]);
            if (response.type) {
                throw new Error("Expected a handshake response from the server.");
            }
            responseMessage = response;
            // multiple messages could have arrived with handshake
            // return additional data to be parsed as usual, or null if all parsed
            return [remainingData, responseMessage];
        };
        return HandshakeProtocol;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    /** Defines the type of a Hub Message. */
    var MessageType;
    (function (MessageType) {
        /** Indicates the message is an Invocation message and implements the {@link @microsoft/signalr.InvocationMessage} interface. */
        MessageType[MessageType["Invocation"] = 1] = "Invocation";
        /** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
        MessageType[MessageType["StreamItem"] = 2] = "StreamItem";
        /** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
        MessageType[MessageType["Completion"] = 3] = "Completion";
        /** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
        MessageType[MessageType["StreamInvocation"] = 4] = "StreamInvocation";
        /** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
        MessageType[MessageType["CancelInvocation"] = 5] = "CancelInvocation";
        /** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
        MessageType[MessageType["Ping"] = 6] = "Ping";
        /** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
        MessageType[MessageType["Close"] = 7] = "Close";
    })(MessageType || (MessageType = {}));

    // Copyright (c) .NET Foundation. All rights reserved.
    /** Stream implementation to stream items to the server. */
    var Subject = /** @class */ (function () {
        function Subject() {
            this.observers = [];
        }
        Subject.prototype.next = function (item) {
            for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
                var observer = _a[_i];
                observer.next(item);
            }
        };
        Subject.prototype.error = function (err) {
            for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
                var observer = _a[_i];
                if (observer.error) {
                    observer.error(err);
                }
            }
        };
        Subject.prototype.complete = function () {
            for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
                var observer = _a[_i];
                if (observer.complete) {
                    observer.complete();
                }
            }
        };
        Subject.prototype.subscribe = function (observer) {
            this.observers.push(observer);
            return new SubjectSubscription(this, observer);
        };
        return Subject;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$1 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var DEFAULT_TIMEOUT_IN_MS = 30 * 1000;
    var DEFAULT_PING_INTERVAL_IN_MS = 15 * 1000;
    /** Describes the current state of the {@link HubConnection} to the server. */
    var HubConnectionState;
    (function (HubConnectionState) {
        /** The hub connection is disconnected. */
        HubConnectionState["Disconnected"] = "Disconnected";
        /** The hub connection is connecting. */
        HubConnectionState["Connecting"] = "Connecting";
        /** The hub connection is connected. */
        HubConnectionState["Connected"] = "Connected";
        /** The hub connection is disconnecting. */
        HubConnectionState["Disconnecting"] = "Disconnecting";
        /** The hub connection is reconnecting. */
        HubConnectionState["Reconnecting"] = "Reconnecting";
    })(HubConnectionState || (HubConnectionState = {}));
    /** Represents a connection to a SignalR Hub. */
    var HubConnection = /** @class */ (function () {
        function HubConnection(connection, logger, protocol, reconnectPolicy) {
            var _this = this;
            Arg.isRequired(connection, "connection");
            Arg.isRequired(logger, "logger");
            Arg.isRequired(protocol, "protocol");
            this.serverTimeoutInMilliseconds = DEFAULT_TIMEOUT_IN_MS;
            this.keepAliveIntervalInMilliseconds = DEFAULT_PING_INTERVAL_IN_MS;
            this.logger = logger;
            this.protocol = protocol;
            this.connection = connection;
            this.reconnectPolicy = reconnectPolicy;
            this.handshakeProtocol = new HandshakeProtocol();
            this.connection.onreceive = function (data) { return _this.processIncomingData(data); };
            this.connection.onclose = function (error) { return _this.connectionClosed(error); };
            this.callbacks = {};
            this.methods = {};
            this.closedCallbacks = [];
            this.reconnectingCallbacks = [];
            this.reconnectedCallbacks = [];
            this.invocationId = 0;
            this.receivedHandshakeResponse = false;
            this.connectionState = HubConnectionState.Disconnected;
            this.connectionStarted = false;
            this.cachedPingMessage = this.protocol.writeMessage({ type: MessageType.Ping });
        }
        /** @internal */
        // Using a public static factory method means we can have a private constructor and an _internal_
        // create method that can be used by HubConnectionBuilder. An "internal" constructor would just
        // be stripped away and the '.d.ts' file would have no constructor, which is interpreted as a
        // public parameter-less constructor.
        HubConnection.create = function (connection, logger, protocol, reconnectPolicy) {
            return new HubConnection(connection, logger, protocol, reconnectPolicy);
        };
        Object.defineProperty(HubConnection.prototype, "state", {
            /** Indicates the state of the {@link HubConnection} to the server. */
            get: function () {
                return this.connectionState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HubConnection.prototype, "connectionId", {
            /** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
             *  in the disconnected state or if the negotiation step was skipped.
             */
            get: function () {
                return this.connection ? (this.connection.connectionId || null) : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HubConnection.prototype, "baseUrl", {
            /** Indicates the url of the {@link HubConnection} to the server. */
            get: function () {
                return this.connection.baseUrl || "";
            },
            /**
             * Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
             * Reconnecting states.
             * @param {string} url The url to connect to.
             */
            set: function (url) {
                if (this.connectionState !== HubConnectionState.Disconnected && this.connectionState !== HubConnectionState.Reconnecting) {
                    throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
                }
                if (!url) {
                    throw new Error("The HubConnection url must be a valid url.");
                }
                this.connection.baseUrl = url;
            },
            enumerable: true,
            configurable: true
        });
        /** Starts the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
         */
        HubConnection.prototype.start = function () {
            this.startPromise = this.startWithStateTransitions();
            return this.startPromise;
        };
        HubConnection.prototype.startWithStateTransitions = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                var e_1;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.connectionState !== HubConnectionState.Disconnected) {
                                return [2 /*return*/, Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."))];
                            }
                            this.connectionState = HubConnectionState.Connecting;
                            this.logger.log(LogLevel.Debug, "Starting HubConnection.");
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.startInternal()];
                        case 2:
                            _a.sent();
                            this.connectionState = HubConnectionState.Connected;
                            this.connectionStarted = true;
                            this.logger.log(LogLevel.Debug, "HubConnection connected successfully.");
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            this.connectionState = HubConnectionState.Disconnected;
                            this.logger.log(LogLevel.Debug, "HubConnection failed to start successfully because of error '" + e_1 + "'.");
                            return [2 /*return*/, Promise.reject(e_1)];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        HubConnection.prototype.startInternal = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                var handshakePromise, handshakeRequest, e_2;
                var _this = this;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.stopDuringStartError = undefined;
                            this.receivedHandshakeResponse = false;
                            handshakePromise = new Promise(function (resolve, reject) {
                                _this.handshakeResolver = resolve;
                                _this.handshakeRejecter = reject;
                            });
                            return [4 /*yield*/, this.connection.start(this.protocol.transferFormat)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, , 7]);
                            handshakeRequest = {
                                protocol: this.protocol.name,
                                version: this.protocol.version,
                            };
                            this.logger.log(LogLevel.Debug, "Sending handshake request.");
                            return [4 /*yield*/, this.sendMessage(this.handshakeProtocol.writeHandshakeRequest(handshakeRequest))];
                        case 3:
                            _a.sent();
                            this.logger.log(LogLevel.Information, "Using HubProtocol '" + this.protocol.name + "'.");
                            // defensively cleanup timeout in case we receive a message from the server before we finish start
                            this.cleanupTimeout();
                            this.resetTimeoutPeriod();
                            this.resetKeepAliveInterval();
                            return [4 /*yield*/, handshakePromise];
                        case 4:
                            _a.sent();
                            // It's important to check the stopDuringStartError instead of just relying on the handshakePromise
                            // being rejected on close, because this continuation can run after both the handshake completed successfully
                            // and the connection was closed.
                            if (this.stopDuringStartError) {
                                // It's important to throw instead of returning a rejected promise, because we don't want to allow any state
                                // transitions to occur between now and the calling code observing the exceptions. Returning a rejected promise
                                // will cause the calling continuation to get scheduled to run later.
                                throw this.stopDuringStartError;
                            }
                            return [3 /*break*/, 7];
                        case 5:
                            e_2 = _a.sent();
                            this.logger.log(LogLevel.Debug, "Hub handshake failed with error '" + e_2 + "' during start(). Stopping HubConnection.");
                            this.cleanupTimeout();
                            this.cleanupPingTimer();
                            // HttpConnection.stop() should not complete until after the onclose callback is invoked.
                            // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
                            return [4 /*yield*/, this.connection.stop(e_2)];
                        case 6:
                            // HttpConnection.stop() should not complete until after the onclose callback is invoked.
                            // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
                            _a.sent();
                            throw e_2;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /** Stops the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
         */
        HubConnection.prototype.stop = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                var startPromise, e_3;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startPromise = this.startPromise;
                            this.stopPromise = this.stopInternal();
                            return [4 /*yield*/, this.stopPromise];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            // Awaiting undefined continues immediately
                            return [4 /*yield*/, startPromise];
                        case 3:
                            // Awaiting undefined continues immediately
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_3 = _a.sent();
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HubConnection.prototype.stopInternal = function (error) {
            if (this.connectionState === HubConnectionState.Disconnected) {
                this.logger.log(LogLevel.Debug, "Call to HubConnection.stop(" + error + ") ignored because it is already in the disconnected state.");
                return Promise.resolve();
            }
            if (this.connectionState === HubConnectionState.Disconnecting) {
                this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnecting state.");
                return this.stopPromise;
            }
            this.connectionState = HubConnectionState.Disconnecting;
            this.logger.log(LogLevel.Debug, "Stopping HubConnection.");
            if (this.reconnectDelayHandle) {
                // We're in a reconnect delay which means the underlying connection is currently already stopped.
                // Just clear the handle to stop the reconnect loop (which no one is waiting on thankfully) and
                // fire the onclose callbacks.
                this.logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
                clearTimeout(this.reconnectDelayHandle);
                this.reconnectDelayHandle = undefined;
                this.completeClose();
                return Promise.resolve();
            }
            this.cleanupTimeout();
            this.cleanupPingTimer();
            this.stopDuringStartError = error || new Error("The connection was stopped before the hub handshake could complete.");
            // HttpConnection.stop() should not complete until after either HttpConnection.start() fails
            // or the onclose callback is invoked. The onclose callback will transition the HubConnection
            // to the disconnected state if need be before HttpConnection.stop() completes.
            return this.connection.stop(error);
        };
        /** Invokes a streaming hub method on the server using the specified name and arguments.
         *
         * @typeparam T The type of the items returned by the server.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {IStreamResult<T>} An object that yields results from the server as they are received.
         */
        HubConnection.prototype.stream = function (methodName) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var _a = this.replaceStreamingParams(args), streams = _a[0], streamIds = _a[1];
            var invocationDescriptor = this.createStreamInvocation(methodName, args, streamIds);
            var promiseQueue;
            var subject = new Subject();
            subject.cancelCallback = function () {
                var cancelInvocation = _this.createCancelInvocation(invocationDescriptor.invocationId);
                delete _this.callbacks[invocationDescriptor.invocationId];
                return promiseQueue.then(function () {
                    return _this.sendWithProtocol(cancelInvocation);
                });
            };
            this.callbacks[invocationDescriptor.invocationId] = function (invocationEvent, error) {
                if (error) {
                    subject.error(error);
                    return;
                }
                else if (invocationEvent) {
                    // invocationEvent will not be null when an error is not passed to the callback
                    if (invocationEvent.type === MessageType.Completion) {
                        if (invocationEvent.error) {
                            subject.error(new Error(invocationEvent.error));
                        }
                        else {
                            subject.complete();
                        }
                    }
                    else {
                        subject.next((invocationEvent.item));
                    }
                }
            };
            promiseQueue = this.sendWithProtocol(invocationDescriptor)
                .catch(function (e) {
                subject.error(e);
                delete _this.callbacks[invocationDescriptor.invocationId];
            });
            this.launchStreams(streams, promiseQueue);
            return subject;
        };
        HubConnection.prototype.sendMessage = function (message) {
            this.resetKeepAliveInterval();
            return this.connection.send(message);
        };
        /**
         * Sends a js object to the server.
         * @param message The js object to serialize and send.
         */
        HubConnection.prototype.sendWithProtocol = function (message) {
            return this.sendMessage(this.protocol.writeMessage(message));
        };
        /** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
         *
         * The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
         * be processing the invocation.
         *
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
         */
        HubConnection.prototype.send = function (methodName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var _a = this.replaceStreamingParams(args), streams = _a[0], streamIds = _a[1];
            var sendPromise = this.sendWithProtocol(this.createInvocation(methodName, args, true, streamIds));
            this.launchStreams(streams, sendPromise);
            return sendPromise;
        };
        /** Invokes a hub method on the server using the specified name and arguments.
         *
         * The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
         * resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
         * resolving the Promise.
         *
         * @typeparam T The expected return type.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
         */
        HubConnection.prototype.invoke = function (methodName) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var _a = this.replaceStreamingParams(args), streams = _a[0], streamIds = _a[1];
            var invocationDescriptor = this.createInvocation(methodName, args, false, streamIds);
            var p = new Promise(function (resolve, reject) {
                // invocationId will always have a value for a non-blocking invocation
                _this.callbacks[invocationDescriptor.invocationId] = function (invocationEvent, error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    else if (invocationEvent) {
                        // invocationEvent will not be null when an error is not passed to the callback
                        if (invocationEvent.type === MessageType.Completion) {
                            if (invocationEvent.error) {
                                reject(new Error(invocationEvent.error));
                            }
                            else {
                                resolve(invocationEvent.result);
                            }
                        }
                        else {
                            reject(new Error("Unexpected message type: " + invocationEvent.type));
                        }
                    }
                };
                var promiseQueue = _this.sendWithProtocol(invocationDescriptor)
                    .catch(function (e) {
                    reject(e);
                    // invocationId will always have a value for a non-blocking invocation
                    delete _this.callbacks[invocationDescriptor.invocationId];
                });
                _this.launchStreams(streams, promiseQueue);
            });
            return p;
        };
        /** Registers a handler that will be invoked when the hub method with the specified method name is invoked.
         *
         * @param {string} methodName The name of the hub method to define.
         * @param {Function} newMethod The handler that will be raised when the hub method is invoked.
         */
        HubConnection.prototype.on = function (methodName, newMethod) {
            if (!methodName || !newMethod) {
                return;
            }
            methodName = methodName.toLowerCase();
            if (!this.methods[methodName]) {
                this.methods[methodName] = [];
            }
            // Preventing adding the same handler multiple times.
            if (this.methods[methodName].indexOf(newMethod) !== -1) {
                return;
            }
            this.methods[methodName].push(newMethod);
        };
        HubConnection.prototype.off = function (methodName, method) {
            if (!methodName) {
                return;
            }
            methodName = methodName.toLowerCase();
            var handlers = this.methods[methodName];
            if (!handlers) {
                return;
            }
            if (method) {
                var removeIdx = handlers.indexOf(method);
                if (removeIdx !== -1) {
                    handlers.splice(removeIdx, 1);
                    if (handlers.length === 0) {
                        delete this.methods[methodName];
                    }
                }
            }
            else {
                delete this.methods[methodName];
            }
        };
        /** Registers a handler that will be invoked when the connection is closed.
         *
         * @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
         */
        HubConnection.prototype.onclose = function (callback) {
            if (callback) {
                this.closedCallbacks.push(callback);
            }
        };
        /** Registers a handler that will be invoked when the connection starts reconnecting.
         *
         * @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
         */
        HubConnection.prototype.onreconnecting = function (callback) {
            if (callback) {
                this.reconnectingCallbacks.push(callback);
            }
        };
        /** Registers a handler that will be invoked when the connection successfully reconnects.
         *
         * @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
         */
        HubConnection.prototype.onreconnected = function (callback) {
            if (callback) {
                this.reconnectedCallbacks.push(callback);
            }
        };
        HubConnection.prototype.processIncomingData = function (data) {
            this.cleanupTimeout();
            if (!this.receivedHandshakeResponse) {
                data = this.processHandshakeResponse(data);
                this.receivedHandshakeResponse = true;
            }
            // Data may have all been read when processing handshake response
            if (data) {
                // Parse the messages
                var messages = this.protocol.parseMessages(data, this.logger);
                for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                    var message = messages_1[_i];
                    switch (message.type) {
                        case MessageType.Invocation:
                            this.invokeClientMethod(message);
                            break;
                        case MessageType.StreamItem:
                        case MessageType.Completion:
                            var callback = this.callbacks[message.invocationId];
                            if (callback) {
                                if (message.type === MessageType.Completion) {
                                    delete this.callbacks[message.invocationId];
                                }
                                callback(message);
                            }
                            break;
                        case MessageType.Ping:
                            // Don't care about pings
                            break;
                        case MessageType.Close:
                            this.logger.log(LogLevel.Information, "Close message received from server.");
                            var error = message.error ? new Error("Server returned an error on close: " + message.error) : undefined;
                            if (message.allowReconnect === true) {
                                // It feels wrong not to await connection.stop() here, but processIncomingData is called as part of an onreceive callback which is not async,
                                // this is already the behavior for serverTimeout(), and HttpConnection.Stop() should catch and log all possible exceptions.
                                // tslint:disable-next-line:no-floating-promises
                                this.connection.stop(error);
                            }
                            else {
                                // We cannot await stopInternal() here, but subsequent calls to stop() will await this if stopInternal() is still ongoing.
                                this.stopPromise = this.stopInternal(error);
                            }
                            break;
                        default:
                            this.logger.log(LogLevel.Warning, "Invalid message type: " + message.type + ".");
                            break;
                    }
                }
            }
            this.resetTimeoutPeriod();
        };
        HubConnection.prototype.processHandshakeResponse = function (data) {
            var _a;
            var responseMessage;
            var remainingData;
            try {
                _a = this.handshakeProtocol.parseHandshakeResponse(data), remainingData = _a[0], responseMessage = _a[1];
            }
            catch (e) {
                var message = "Error parsing handshake response: " + e;
                this.logger.log(LogLevel.Error, message);
                var error = new Error(message);
                this.handshakeRejecter(error);
                throw error;
            }
            if (responseMessage.error) {
                var message = "Server returned handshake error: " + responseMessage.error;
                this.logger.log(LogLevel.Error, message);
                var error = new Error(message);
                this.handshakeRejecter(error);
                throw error;
            }
            else {
                this.logger.log(LogLevel.Debug, "Server handshake complete.");
            }
            this.handshakeResolver();
            return remainingData;
        };
        HubConnection.prototype.resetKeepAliveInterval = function () {
            var _this = this;
            this.cleanupPingTimer();
            this.pingServerHandle = setTimeout(function () { return __awaiter$1(_this, void 0, void 0, function () {
                var _a;
                return __generator$1(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(this.connectionState === HubConnectionState.Connected)) return [3 /*break*/, 4];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.sendMessage(this.cachedPingMessage)];
                        case 2:
                            _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            // We don't care about the error. It should be seen elsewhere in the client.
                            // The connection is probably in a bad or closed state now, cleanup the timer so it stops triggering
                            this.cleanupPingTimer();
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); }, this.keepAliveIntervalInMilliseconds);
        };
        HubConnection.prototype.resetTimeoutPeriod = function () {
            var _this = this;
            if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
                // Set the timeout timer
                this.timeoutHandle = setTimeout(function () { return _this.serverTimeout(); }, this.serverTimeoutInMilliseconds);
            }
        };
        HubConnection.prototype.serverTimeout = function () {
            // The server hasn't talked to us in a while. It doesn't like us anymore ... :(
            // Terminate the connection, but we don't need to wait on the promise. This could trigger reconnecting.
            // tslint:disable-next-line:no-floating-promises
            this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
        };
        HubConnection.prototype.invokeClientMethod = function (invocationMessage) {
            var _this = this;
            var methods = this.methods[invocationMessage.target.toLowerCase()];
            if (methods) {
                try {
                    methods.forEach(function (m) { return m.apply(_this, invocationMessage.arguments); });
                }
                catch (e) {
                    this.logger.log(LogLevel.Error, "A callback for the method " + invocationMessage.target.toLowerCase() + " threw error '" + e + "'.");
                }
                if (invocationMessage.invocationId) {
                    // This is not supported in v1. So we return an error to avoid blocking the server waiting for the response.
                    var message = "Server requested a response, which is not supported in this version of the client.";
                    this.logger.log(LogLevel.Error, message);
                    // We don't want to wait on the stop itself.
                    this.stopPromise = this.stopInternal(new Error(message));
                }
            }
            else {
                this.logger.log(LogLevel.Warning, "No client method with the name '" + invocationMessage.target + "' found.");
            }
        };
        HubConnection.prototype.connectionClosed = function (error) {
            this.logger.log(LogLevel.Debug, "HubConnection.connectionClosed(" + error + ") called while in state " + this.connectionState + ".");
            // Triggering this.handshakeRejecter is insufficient because it could already be resolved without the continuation having run yet.
            this.stopDuringStartError = this.stopDuringStartError || error || new Error("The underlying connection was closed before the hub handshake could complete.");
            // If the handshake is in progress, start will be waiting for the handshake promise, so we complete it.
            // If it has already completed, this should just noop.
            if (this.handshakeResolver) {
                this.handshakeResolver();
            }
            this.cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));
            this.cleanupTimeout();
            this.cleanupPingTimer();
            if (this.connectionState === HubConnectionState.Disconnecting) {
                this.completeClose(error);
            }
            else if (this.connectionState === HubConnectionState.Connected && this.reconnectPolicy) {
                // tslint:disable-next-line:no-floating-promises
                this.reconnect(error);
            }
            else if (this.connectionState === HubConnectionState.Connected) {
                this.completeClose(error);
            }
            // If none of the above if conditions were true were called the HubConnection must be in either:
            // 1. The Connecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail it.
            // 2. The Reconnecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail the current reconnect attempt
            //    and potentially continue the reconnect() loop.
            // 3. The Disconnected state in which case we're already done.
        };
        HubConnection.prototype.completeClose = function (error) {
            var _this = this;
            if (this.connectionStarted) {
                this.connectionState = HubConnectionState.Disconnected;
                this.connectionStarted = false;
                try {
                    this.closedCallbacks.forEach(function (c) { return c.apply(_this, [error]); });
                }
                catch (e) {
                    this.logger.log(LogLevel.Error, "An onclose callback called with error '" + error + "' threw error '" + e + "'.");
                }
            }
        };
        HubConnection.prototype.reconnect = function (error) {
            return __awaiter$1(this, void 0, void 0, function () {
                var reconnectStartTime, previousReconnectAttempts, retryError, nextRetryDelay, e_4;
                var _this = this;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            reconnectStartTime = Date.now();
                            previousReconnectAttempts = 0;
                            retryError = error !== undefined ? error : new Error("Attempting to reconnect due to a unknown error.");
                            nextRetryDelay = this.getNextRetryDelay(previousReconnectAttempts++, 0, retryError);
                            if (nextRetryDelay === null) {
                                this.logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
                                this.completeClose(error);
                                return [2 /*return*/];
                            }
                            this.connectionState = HubConnectionState.Reconnecting;
                            if (error) {
                                this.logger.log(LogLevel.Information, "Connection reconnecting because of error '" + error + "'.");
                            }
                            else {
                                this.logger.log(LogLevel.Information, "Connection reconnecting.");
                            }
                            if (this.onreconnecting) {
                                try {
                                    this.reconnectingCallbacks.forEach(function (c) { return c.apply(_this, [error]); });
                                }
                                catch (e) {
                                    this.logger.log(LogLevel.Error, "An onreconnecting callback called with error '" + error + "' threw error '" + e + "'.");
                                }
                                // Exit early if an onreconnecting callback called connection.stop().
                                if (this.connectionState !== HubConnectionState.Reconnecting) {
                                    this.logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
                                    return [2 /*return*/];
                                }
                            }
                            _a.label = 1;
                        case 1:
                            if (!(nextRetryDelay !== null)) return [3 /*break*/, 7];
                            this.logger.log(LogLevel.Information, "Reconnect attempt number " + previousReconnectAttempts + " will start in " + nextRetryDelay + " ms.");
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    _this.reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
                                })];
                        case 2:
                            _a.sent();
                            this.reconnectDelayHandle = undefined;
                            if (this.connectionState !== HubConnectionState.Reconnecting) {
                                this.logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
                                return [2 /*return*/];
                            }
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.startInternal()];
                        case 4:
                            _a.sent();
                            this.connectionState = HubConnectionState.Connected;
                            this.logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
                            if (this.onreconnected) {
                                try {
                                    this.reconnectedCallbacks.forEach(function (c) { return c.apply(_this, [_this.connection.connectionId]); });
                                }
                                catch (e) {
                                    this.logger.log(LogLevel.Error, "An onreconnected callback called with connectionId '" + this.connection.connectionId + "; threw error '" + e + "'.");
                                }
                            }
                            return [2 /*return*/];
                        case 5:
                            e_4 = _a.sent();
                            this.logger.log(LogLevel.Information, "Reconnect attempt failed because of error '" + e_4 + "'.");
                            if (this.connectionState !== HubConnectionState.Reconnecting) {
                                this.logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect attempt. Done reconnecting.");
                                return [2 /*return*/];
                            }
                            retryError = e_4 instanceof Error ? e_4 : new Error(e_4.toString());
                            nextRetryDelay = this.getNextRetryDelay(previousReconnectAttempts++, Date.now() - reconnectStartTime, retryError);
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 1];
                        case 7:
                            this.logger.log(LogLevel.Information, "Reconnect retries have been exhausted after " + (Date.now() - reconnectStartTime) + " ms and " + previousReconnectAttempts + " failed attempts. Connection disconnecting.");
                            this.completeClose();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HubConnection.prototype.getNextRetryDelay = function (previousRetryCount, elapsedMilliseconds, retryReason) {
            try {
                return this.reconnectPolicy.nextRetryDelayInMilliseconds({
                    elapsedMilliseconds: elapsedMilliseconds,
                    previousRetryCount: previousRetryCount,
                    retryReason: retryReason,
                });
            }
            catch (e) {
                this.logger.log(LogLevel.Error, "IRetryPolicy.nextRetryDelayInMilliseconds(" + previousRetryCount + ", " + elapsedMilliseconds + ") threw error '" + e + "'.");
                return null;
            }
        };
        HubConnection.prototype.cancelCallbacksWithError = function (error) {
            var callbacks = this.callbacks;
            this.callbacks = {};
            Object.keys(callbacks)
                .forEach(function (key) {
                var callback = callbacks[key];
                callback(null, error);
            });
        };
        HubConnection.prototype.cleanupPingTimer = function () {
            if (this.pingServerHandle) {
                clearTimeout(this.pingServerHandle);
            }
        };
        HubConnection.prototype.cleanupTimeout = function () {
            if (this.timeoutHandle) {
                clearTimeout(this.timeoutHandle);
            }
        };
        HubConnection.prototype.createInvocation = function (methodName, args, nonblocking, streamIds) {
            if (nonblocking) {
                return {
                    arguments: args,
                    streamIds: streamIds,
                    target: methodName,
                    type: MessageType.Invocation,
                };
            }
            else {
                var invocationId = this.invocationId;
                this.invocationId++;
                return {
                    arguments: args,
                    invocationId: invocationId.toString(),
                    streamIds: streamIds,
                    target: methodName,
                    type: MessageType.Invocation,
                };
            }
        };
        HubConnection.prototype.launchStreams = function (streams, promiseQueue) {
            var _this = this;
            if (streams.length === 0) {
                return;
            }
            // Synchronize stream data so they arrive in-order on the server
            if (!promiseQueue) {
                promiseQueue = Promise.resolve();
            }
            var _loop_1 = function (streamId) {
                streams[streamId].subscribe({
                    complete: function () {
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createCompletionMessage(streamId)); });
                    },
                    error: function (err) {
                        var message;
                        if (err instanceof Error) {
                            message = err.message;
                        }
                        else if (err && err.toString) {
                            message = err.toString();
                        }
                        else {
                            message = "Unknown error";
                        }
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createCompletionMessage(streamId, message)); });
                    },
                    next: function (item) {
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createStreamItemMessage(streamId, item)); });
                    },
                });
            };
            // We want to iterate over the keys, since the keys are the stream ids
            // tslint:disable-next-line:forin
            for (var streamId in streams) {
                _loop_1(streamId);
            }
        };
        HubConnection.prototype.replaceStreamingParams = function (args) {
            var streams = [];
            var streamIds = [];
            for (var i = 0; i < args.length; i++) {
                var argument = args[i];
                if (this.isObservable(argument)) {
                    var streamId = this.invocationId;
                    this.invocationId++;
                    // Store the stream for later use
                    streams[streamId] = argument;
                    streamIds.push(streamId.toString());
                    // remove stream from args
                    args.splice(i, 1);
                }
            }
            return [streams, streamIds];
        };
        HubConnection.prototype.isObservable = function (arg) {
            // This allows other stream implementations to just work (like rxjs)
            return arg && arg.subscribe && typeof arg.subscribe === "function";
        };
        HubConnection.prototype.createStreamInvocation = function (methodName, args, streamIds) {
            var invocationId = this.invocationId;
            this.invocationId++;
            return {
                arguments: args,
                invocationId: invocationId.toString(),
                streamIds: streamIds,
                target: methodName,
                type: MessageType.StreamInvocation,
            };
        };
        HubConnection.prototype.createCancelInvocation = function (id) {
            return {
                invocationId: id,
                type: MessageType.CancelInvocation,
            };
        };
        HubConnection.prototype.createStreamItemMessage = function (id, item) {
            return {
                invocationId: id,
                item: item,
                type: MessageType.StreamItem,
            };
        };
        HubConnection.prototype.createCompletionMessage = function (id, error, result) {
            if (error) {
                return {
                    error: error,
                    invocationId: id,
                    type: MessageType.Completion,
                };
            }
            return {
                invocationId: id,
                result: result,
                type: MessageType.Completion,
            };
        };
        return HubConnection;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    // 0, 2, 10, 30 second delays before reconnect attempts.
    var DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2000, 10000, 30000, null];
    /** @private */
    var DefaultReconnectPolicy = /** @class */ (function () {
        function DefaultReconnectPolicy(retryDelays) {
            this.retryDelays = retryDelays !== undefined ? retryDelays.concat([null]) : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
        }
        DefaultReconnectPolicy.prototype.nextRetryDelayInMilliseconds = function (retryContext) {
            return this.retryDelays[retryContext.previousRetryCount];
        };
        return DefaultReconnectPolicy;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    // This will be treated as a bit flag in the future, so we keep it using power-of-two values.
    /** Specifies a specific HTTP transport type. */
    var HttpTransportType;
    (function (HttpTransportType) {
        /** Specifies no transport preference. */
        HttpTransportType[HttpTransportType["None"] = 0] = "None";
        /** Specifies the WebSockets transport. */
        HttpTransportType[HttpTransportType["WebSockets"] = 1] = "WebSockets";
        /** Specifies the Server-Sent Events transport. */
        HttpTransportType[HttpTransportType["ServerSentEvents"] = 2] = "ServerSentEvents";
        /** Specifies the Long Polling transport. */
        HttpTransportType[HttpTransportType["LongPolling"] = 4] = "LongPolling";
    })(HttpTransportType || (HttpTransportType = {}));
    /** Specifies the transfer format for a connection. */
    var TransferFormat;
    (function (TransferFormat) {
        /** Specifies that only text data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Text"] = 1] = "Text";
        /** Specifies that binary data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Binary"] = 2] = "Binary";
    })(TransferFormat || (TransferFormat = {}));

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    // Rough polyfill of https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    // We don't actually ever use the API being polyfilled, we always use the polyfill because
    // it's a very new API right now.
    // Not exported from index.
    /** @private */
    var AbortController = /** @class */ (function () {
        function AbortController() {
            this.isAborted = false;
            this.onabort = null;
        }
        AbortController.prototype.abort = function () {
            if (!this.isAborted) {
                this.isAborted = true;
                if (this.onabort) {
                    this.onabort();
                }
            }
        };
        Object.defineProperty(AbortController.prototype, "signal", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbortController.prototype, "aborted", {
            get: function () {
                return this.isAborted;
            },
            enumerable: true,
            configurable: true
        });
        return AbortController;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$2 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    // Not exported from 'index', this type is internal.
    /** @private */
    var LongPollingTransport = /** @class */ (function () {
        function LongPollingTransport(httpClient, accessTokenFactory, logger, logMessageContent) {
            this.httpClient = httpClient;
            this.accessTokenFactory = accessTokenFactory;
            this.logger = logger;
            this.pollAbort = new AbortController();
            this.logMessageContent = logMessageContent;
            this.running = false;
            this.onreceive = null;
            this.onclose = null;
        }
        Object.defineProperty(LongPollingTransport.prototype, "pollAborted", {
            // This is an internal type, not exported from 'index' so this is really just internal.
            get: function () {
                return this.pollAbort.aborted;
            },
            enumerable: true,
            configurable: true
        });
        LongPollingTransport.prototype.connect = function (url, transferFormat) {
            return __awaiter$2(this, void 0, void 0, function () {
                var pollOptions, token, pollUrl, response;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            Arg.isRequired(url, "url");
                            Arg.isRequired(transferFormat, "transferFormat");
                            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
                            this.url = url;
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
                            // Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
                            if (transferFormat === TransferFormat.Binary &&
                                (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
                                throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
                            }
                            pollOptions = {
                                abortSignal: this.pollAbort.signal,
                                headers: {},
                                timeout: 100000,
                            };
                            if (transferFormat === TransferFormat.Binary) {
                                pollOptions.responseType = "arraybuffer";
                            }
                            return [4 /*yield*/, this.getAccessToken()];
                        case 1:
                            token = _a.sent();
                            this.updateHeaderToken(pollOptions, token);
                            pollUrl = url + "&_=" + Date.now();
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) polling: " + pollUrl + ".");
                            return [4 /*yield*/, this.httpClient.get(pollUrl, pollOptions)];
                        case 2:
                            response = _a.sent();
                            if (response.statusCode !== 200) {
                                this.logger.log(LogLevel.Error, "(LongPolling transport) Unexpected response code: " + response.statusCode + ".");
                                // Mark running as false so that the poll immediately ends and runs the close logic
                                this.closeError = new HttpError(response.statusText || "", response.statusCode);
                                this.running = false;
                            }
                            else {
                                this.running = true;
                            }
                            this.receiving = this.poll(this.url, pollOptions);
                            return [2 /*return*/];
                    }
                });
            });
        };
        LongPollingTransport.prototype.getAccessToken = function () {
            return __awaiter$2(this, void 0, void 0, function () {
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.accessTokenFactory) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.accessTokenFactory()];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2: return [2 /*return*/, null];
                    }
                });
            });
        };
        LongPollingTransport.prototype.updateHeaderToken = function (request, token) {
            if (!request.headers) {
                request.headers = {};
            }
            if (token) {
                // tslint:disable-next-line:no-string-literal
                request.headers["Authorization"] = "Bearer " + token;
                return;
            }
            // tslint:disable-next-line:no-string-literal
            if (request.headers["Authorization"]) {
                // tslint:disable-next-line:no-string-literal
                delete request.headers["Authorization"];
            }
        };
        LongPollingTransport.prototype.poll = function (url, pollOptions) {
            return __awaiter$2(this, void 0, void 0, function () {
                var token, pollUrl, response, e_1;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, , 8, 9]);
                            _a.label = 1;
                        case 1:
                            if (!this.running) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.getAccessToken()];
                        case 2:
                            token = _a.sent();
                            this.updateHeaderToken(pollOptions, token);
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            pollUrl = url + "&_=" + Date.now();
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) polling: " + pollUrl + ".");
                            return [4 /*yield*/, this.httpClient.get(pollUrl, pollOptions)];
                        case 4:
                            response = _a.sent();
                            if (response.statusCode === 204) {
                                this.logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
                                this.running = false;
                            }
                            else if (response.statusCode !== 200) {
                                this.logger.log(LogLevel.Error, "(LongPolling transport) Unexpected response code: " + response.statusCode + ".");
                                // Unexpected status code
                                this.closeError = new HttpError(response.statusText || "", response.statusCode);
                                this.running = false;
                            }
                            else {
                                // Process the response
                                if (response.content) {
                                    this.logger.log(LogLevel.Trace, "(LongPolling transport) data received. " + getDataDetail(response.content, this.logMessageContent) + ".");
                                    if (this.onreceive) {
                                        this.onreceive(response.content);
                                    }
                                }
                                else {
                                    // This is another way timeout manifest.
                                    this.logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                                }
                            }
                            return [3 /*break*/, 6];
                        case 5:
                            e_1 = _a.sent();
                            if (!this.running) {
                                // Log but disregard errors that occur after stopping
                                this.logger.log(LogLevel.Trace, "(LongPolling transport) Poll errored after shutdown: " + e_1.message);
                            }
                            else {
                                if (e_1 instanceof TimeoutError) {
                                    // Ignore timeouts and reissue the poll.
                                    this.logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                                }
                                else {
                                    // Close the connection with the error as the result.
                                    this.closeError = e_1;
                                    this.running = false;
                                }
                            }
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 1];
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
                            // We will reach here with pollAborted==false when the server returned a response causing the transport to stop.
                            // If pollAborted==true then client initiated the stop and the stop method will raise the close event after DELETE is sent.
                            if (!this.pollAborted) {
                                this.raiseOnClose();
                            }
                            return [7 /*endfinally*/];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        LongPollingTransport.prototype.send = function (data) {
            return __awaiter$2(this, void 0, void 0, function () {
                return __generator$2(this, function (_a) {
                    if (!this.running) {
                        return [2 /*return*/, Promise.reject(new Error("Cannot send until the transport is connected"))];
                    }
                    return [2 /*return*/, sendMessage(this.logger, "LongPolling", this.httpClient, this.url, this.accessTokenFactory, data, this.logMessageContent)];
                });
            });
        };
        LongPollingTransport.prototype.stop = function () {
            return __awaiter$2(this, void 0, void 0, function () {
                var deleteOptions, token;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
                            // Tell receiving loop to stop, abort any current request, and then wait for it to finish
                            this.running = false;
                            this.pollAbort.abort();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 5, 6]);
                            return [4 /*yield*/, this.receiving];
                        case 2:
                            _a.sent();
                            // Send DELETE to clean up long polling on the server
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) sending DELETE request to " + this.url + ".");
                            deleteOptions = {
                                headers: {},
                            };
                            return [4 /*yield*/, this.getAccessToken()];
                        case 3:
                            token = _a.sent();
                            this.updateHeaderToken(deleteOptions, token);
                            return [4 /*yield*/, this.httpClient.delete(this.url, deleteOptions)];
                        case 4:
                            _a.sent();
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request sent.");
                            return [3 /*break*/, 6];
                        case 5:
                            this.logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
                            // Raise close event here instead of in polling
                            // It needs to happen after the DELETE request is sent
                            this.raiseOnClose();
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        LongPollingTransport.prototype.raiseOnClose = function () {
            if (this.onclose) {
                var logMessage = "(LongPolling transport) Firing onclose event.";
                if (this.closeError) {
                    logMessage += " Error: " + this.closeError;
                }
                this.logger.log(LogLevel.Trace, logMessage);
                this.onclose(this.closeError);
            }
        };
        return LongPollingTransport;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$3 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    /** @private */
    var ServerSentEventsTransport = /** @class */ (function () {
        function ServerSentEventsTransport(httpClient, accessTokenFactory, logger, logMessageContent, eventSourceConstructor) {
            this.httpClient = httpClient;
            this.accessTokenFactory = accessTokenFactory;
            this.logger = logger;
            this.logMessageContent = logMessageContent;
            this.eventSourceConstructor = eventSourceConstructor;
            this.onreceive = null;
            this.onclose = null;
        }
        ServerSentEventsTransport.prototype.connect = function (url, transferFormat) {
            return __awaiter$3(this, void 0, void 0, function () {
                var token;
                var _this = this;
                return __generator$3(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            Arg.isRequired(url, "url");
                            Arg.isRequired(transferFormat, "transferFormat");
                            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
                            this.logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
                            // set url before accessTokenFactory because this.url is only for send and we set the auth header instead of the query string for send
                            this.url = url;
                            if (!this.accessTokenFactory) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.accessTokenFactory()];
                        case 1:
                            token = _a.sent();
                            if (token) {
                                url += (url.indexOf("?") < 0 ? "?" : "&") + ("access_token=" + encodeURIComponent(token));
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                                var opened = false;
                                if (transferFormat !== TransferFormat.Text) {
                                    reject(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
                                    return;
                                }
                                var eventSource;
                                if (Platform.isBrowser || Platform.isWebWorker) {
                                    eventSource = new _this.eventSourceConstructor(url, { withCredentials: true });
                                }
                                else {
                                    // Non-browser passes cookies via the dictionary
                                    var cookies = _this.httpClient.getCookieString(url);
                                    eventSource = new _this.eventSourceConstructor(url, { withCredentials: true, headers: { Cookie: cookies } });
                                }
                                try {
                                    eventSource.onmessage = function (e) {
                                        if (_this.onreceive) {
                                            try {
                                                _this.logger.log(LogLevel.Trace, "(SSE transport) data received. " + getDataDetail(e.data, _this.logMessageContent) + ".");
                                                _this.onreceive(e.data);
                                            }
                                            catch (error) {
                                                _this.close(error);
                                                return;
                                            }
                                        }
                                    };
                                    eventSource.onerror = function (e) {
                                        var error = new Error(e.data || "Error occurred");
                                        if (opened) {
                                            _this.close(error);
                                        }
                                        else {
                                            reject(error);
                                        }
                                    };
                                    eventSource.onopen = function () {
                                        _this.logger.log(LogLevel.Information, "SSE connected to " + _this.url);
                                        _this.eventSource = eventSource;
                                        opened = true;
                                        resolve();
                                    };
                                }
                                catch (e) {
                                    reject(e);
                                    return;
                                }
                            })];
                    }
                });
            });
        };
        ServerSentEventsTransport.prototype.send = function (data) {
            return __awaiter$3(this, void 0, void 0, function () {
                return __generator$3(this, function (_a) {
                    if (!this.eventSource) {
                        return [2 /*return*/, Promise.reject(new Error("Cannot send until the transport is connected"))];
                    }
                    return [2 /*return*/, sendMessage(this.logger, "SSE", this.httpClient, this.url, this.accessTokenFactory, data, this.logMessageContent)];
                });
            });
        };
        ServerSentEventsTransport.prototype.stop = function () {
            this.close();
            return Promise.resolve();
        };
        ServerSentEventsTransport.prototype.close = function (e) {
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = undefined;
                if (this.onclose) {
                    this.onclose(e);
                }
            }
        };
        return ServerSentEventsTransport;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$4 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    /** @private */
    var WebSocketTransport = /** @class */ (function () {
        function WebSocketTransport(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor) {
            this.logger = logger;
            this.accessTokenFactory = accessTokenFactory;
            this.logMessageContent = logMessageContent;
            this.webSocketConstructor = webSocketConstructor;
            this.httpClient = httpClient;
            this.onreceive = null;
            this.onclose = null;
        }
        WebSocketTransport.prototype.connect = function (url, transferFormat) {
            return __awaiter$4(this, void 0, void 0, function () {
                var token;
                var _this = this;
                return __generator$4(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            Arg.isRequired(url, "url");
                            Arg.isRequired(transferFormat, "transferFormat");
                            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
                            this.logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
                            if (!this.accessTokenFactory) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.accessTokenFactory()];
                        case 1:
                            token = _a.sent();
                            if (token) {
                                url += (url.indexOf("?") < 0 ? "?" : "&") + ("access_token=" + encodeURIComponent(token));
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                                url = url.replace(/^http/, "ws");
                                var webSocket;
                                var cookies = _this.httpClient.getCookieString(url);
                                var opened = false;
                                if (Platform.isNode && cookies) {
                                    // Only pass cookies when in non-browser environments
                                    webSocket = new _this.webSocketConstructor(url, undefined, {
                                        headers: {
                                            Cookie: "" + cookies,
                                        },
                                    });
                                }
                                if (!webSocket) {
                                    // Chrome is not happy with passing 'undefined' as protocol
                                    webSocket = new _this.webSocketConstructor(url);
                                }
                                if (transferFormat === TransferFormat.Binary) {
                                    webSocket.binaryType = "arraybuffer";
                                }
                                // tslint:disable-next-line:variable-name
                                webSocket.onopen = function (_event) {
                                    _this.logger.log(LogLevel.Information, "WebSocket connected to " + url + ".");
                                    _this.webSocket = webSocket;
                                    opened = true;
                                    resolve();
                                };
                                webSocket.onerror = function (event) {
                                    var error = null;
                                    // ErrorEvent is a browser only type we need to check if the type exists before using it
                                    if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                                        error = event.error;
                                    }
                                    else {
                                        error = new Error("There was an error with the transport.");
                                    }
                                    reject(error);
                                };
                                webSocket.onmessage = function (message) {
                                    _this.logger.log(LogLevel.Trace, "(WebSockets transport) data received. " + getDataDetail(message.data, _this.logMessageContent) + ".");
                                    if (_this.onreceive) {
                                        _this.onreceive(message.data);
                                    }
                                };
                                webSocket.onclose = function (event) {
                                    // Don't call close handler if connection was never established
                                    // We'll reject the connect call instead
                                    if (opened) {
                                        _this.close(event);
                                    }
                                    else {
                                        var error = null;
                                        // ErrorEvent is a browser only type we need to check if the type exists before using it
                                        if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                                            error = event.error;
                                        }
                                        else {
                                            error = new Error("There was an error with the transport.");
                                        }
                                        reject(error);
                                    }
                                };
                            })];
                    }
                });
            });
        };
        WebSocketTransport.prototype.send = function (data) {
            if (this.webSocket && this.webSocket.readyState === this.webSocketConstructor.OPEN) {
                this.logger.log(LogLevel.Trace, "(WebSockets transport) sending data. " + getDataDetail(data, this.logMessageContent) + ".");
                this.webSocket.send(data);
                return Promise.resolve();
            }
            return Promise.reject("WebSocket is not in the OPEN state");
        };
        WebSocketTransport.prototype.stop = function () {
            if (this.webSocket) {
                // Manually invoke onclose callback inline so we know the HttpConnection was closed properly before returning
                // This also solves an issue where websocket.onclose could take 18+ seconds to trigger during network disconnects
                this.close(undefined);
            }
            return Promise.resolve();
        };
        WebSocketTransport.prototype.close = function (event) {
            // webSocket will be null if the transport did not start successfully
            if (this.webSocket) {
                // Clear websocket handlers because we are considering the socket closed now
                this.webSocket.onclose = function () { };
                this.webSocket.onmessage = function () { };
                this.webSocket.onerror = function () { };
                this.webSocket.close();
                this.webSocket = undefined;
            }
            this.logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
            if (this.onclose) {
                if (event && (event.wasClean === false || event.code !== 1000)) {
                    this.onclose(new Error("WebSocket closed with status code: " + event.code + " (" + event.reason + ")."));
                }
                else {
                    this.onclose();
                }
            }
        };
        return WebSocketTransport;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$5 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var MAX_REDIRECTS = 100;
    var WebSocketModule = null;
    var EventSourceModule = null;
    if (Platform.isNode && typeof require !== "undefined") {
        // In order to ignore the dynamic require in webpack builds we need to do this magic
        // @ts-ignore: TS doesn't know about these names
        var requireFunc$1 = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
        WebSocketModule = requireFunc$1("ws");
        EventSourceModule = requireFunc$1("eventsource");
    }
    /** @private */
    var HttpConnection = /** @class */ (function () {
        function HttpConnection(url, options) {
            if (options === void 0) { options = {}; }
            this.features = {};
            this.negotiateVersion = 1;
            Arg.isRequired(url, "url");
            this.logger = createLogger(options.logger);
            this.baseUrl = this.resolveUrl(url);
            options = options || {};
            options.logMessageContent = options.logMessageContent || false;
            if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) {
                options.WebSocket = WebSocket;
            }
            else if (Platform.isNode && !options.WebSocket) {
                if (WebSocketModule) {
                    options.WebSocket = WebSocketModule;
                }
            }
            if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) {
                options.EventSource = EventSource;
            }
            else if (Platform.isNode && !options.EventSource) {
                if (typeof EventSourceModule !== "undefined") {
                    options.EventSource = EventSourceModule;
                }
            }
            this.httpClient = options.httpClient || new DefaultHttpClient(this.logger);
            this.connectionState = "Disconnected" /* Disconnected */;
            this.connectionStarted = false;
            this.options = options;
            this.onreceive = null;
            this.onclose = null;
        }
        HttpConnection.prototype.start = function (transferFormat) {
            return __awaiter$5(this, void 0, void 0, function () {
                var message, message;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transferFormat = transferFormat || TransferFormat.Binary;
                            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
                            this.logger.log(LogLevel.Debug, "Starting connection with transfer format '" + TransferFormat[transferFormat] + "'.");
                            if (this.connectionState !== "Disconnected" /* Disconnected */) {
                                return [2 /*return*/, Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."))];
                            }
                            this.connectionState = "Connecting " /* Connecting */;
                            this.startInternalPromise = this.startInternal(transferFormat);
                            return [4 /*yield*/, this.startInternalPromise];
                        case 1:
                            _a.sent();
                            if (!(this.connectionState === "Disconnecting" /* Disconnecting */)) return [3 /*break*/, 3];
                            message = "Failed to start the HttpConnection before stop() was called.";
                            this.logger.log(LogLevel.Error, message);
                            // We cannot await stopPromise inside startInternal since stopInternal awaits the startInternalPromise.
                            return [4 /*yield*/, this.stopPromise];
                        case 2:
                            // We cannot await stopPromise inside startInternal since stopInternal awaits the startInternalPromise.
                            _a.sent();
                            return [2 /*return*/, Promise.reject(new Error(message))];
                        case 3:
                            if (this.connectionState !== "Connected" /* Connected */) {
                                message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
                                this.logger.log(LogLevel.Error, message);
                                return [2 /*return*/, Promise.reject(new Error(message))];
                            }
                            _a.label = 4;
                        case 4:
                            this.connectionStarted = true;
                            return [2 /*return*/];
                    }
                });
            });
        };
        HttpConnection.prototype.send = function (data) {
            if (this.connectionState !== "Connected" /* Connected */) {
                return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
            }
            if (!this.sendQueue) {
                this.sendQueue = new TransportSendQueue(this.transport);
            }
            // Transport will not be null if state is connected
            return this.sendQueue.send(data);
        };
        HttpConnection.prototype.stop = function (error) {
            return __awaiter$5(this, void 0, void 0, function () {
                var _this = this;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.connectionState === "Disconnected" /* Disconnected */) {
                                this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnected state.");
                                return [2 /*return*/, Promise.resolve()];
                            }
                            if (this.connectionState === "Disconnecting" /* Disconnecting */) {
                                this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnecting state.");
                                return [2 /*return*/, this.stopPromise];
                            }
                            this.connectionState = "Disconnecting" /* Disconnecting */;
                            this.stopPromise = new Promise(function (resolve) {
                                // Don't complete stop() until stopConnection() completes.
                                _this.stopPromiseResolver = resolve;
                            });
                            // stopInternal should never throw so just observe it.
                            return [4 /*yield*/, this.stopInternal(error)];
                        case 1:
                            // stopInternal should never throw so just observe it.
                            _a.sent();
                            return [4 /*yield*/, this.stopPromise];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HttpConnection.prototype.stopInternal = function (error) {
            return __awaiter$5(this, void 0, void 0, function () {
                var e_1, e_2;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Set error as soon as possible otherwise there is a race between
                            // the transport closing and providing an error and the error from a close message
                            // We would prefer the close message error.
                            this.stopError = error;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.startInternalPromise];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            if (!this.transport) return [3 /*break*/, 9];
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.transport.stop()];
                        case 6:
                            _a.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            e_2 = _a.sent();
                            this.logger.log(LogLevel.Error, "HttpConnection.transport.stop() threw error '" + e_2 + "'.");
                            this.stopConnection();
                            return [3 /*break*/, 8];
                        case 8:
                            this.transport = undefined;
                            return [3 /*break*/, 10];
                        case 9:
                            this.logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
                            this.stopConnection();
                            _a.label = 10;
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        HttpConnection.prototype.startInternal = function (transferFormat) {
            return __awaiter$5(this, void 0, void 0, function () {
                var url, negotiateResponse, redirects, _loop_1, this_1, e_3;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            url = this.baseUrl;
                            this.accessTokenFactory = this.options.accessTokenFactory;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 12, , 13]);
                            if (!this.options.skipNegotiation) return [3 /*break*/, 5];
                            if (!(this.options.transport === HttpTransportType.WebSockets)) return [3 /*break*/, 3];
                            // No need to add a connection ID in this case
                            this.transport = this.constructTransport(HttpTransportType.WebSockets);
                            // We should just call connect directly in this case.
                            // No fallback or negotiate in this case.
                            return [4 /*yield*/, this.startTransport(url, transferFormat)];
                        case 2:
                            // We should just call connect directly in this case.
                            // No fallback or negotiate in this case.
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3: throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
                        case 4: return [3 /*break*/, 11];
                        case 5:
                            negotiateResponse = null;
                            redirects = 0;
                            _loop_1 = function () {
                                var accessToken_1;
                                return __generator$5(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this_1.getNegotiationResponse(url)];
                                        case 1:
                                            negotiateResponse = _a.sent();
                                            // the user tries to stop the connection when it is being started
                                            if (this_1.connectionState === "Disconnecting" /* Disconnecting */ || this_1.connectionState === "Disconnected" /* Disconnected */) {
                                                throw new Error("The connection was stopped during negotiation.");
                                            }
                                            if (negotiateResponse.error) {
                                                throw new Error(negotiateResponse.error);
                                            }
                                            if (negotiateResponse.ProtocolVersion) {
                                                throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
                                            }
                                            if (negotiateResponse.url) {
                                                url = negotiateResponse.url;
                                            }
                                            if (negotiateResponse.accessToken) {
                                                accessToken_1 = negotiateResponse.accessToken;
                                                this_1.accessTokenFactory = function () { return accessToken_1; };
                                            }
                                            redirects++;
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _a.label = 6;
                        case 6: return [5 /*yield**/, _loop_1()];
                        case 7:
                            _a.sent();
                            _a.label = 8;
                        case 8:
                            if (negotiateResponse.url && redirects < MAX_REDIRECTS) return [3 /*break*/, 6];
                            _a.label = 9;
                        case 9:
                            if (redirects === MAX_REDIRECTS && negotiateResponse.url) {
                                throw new Error("Negotiate redirection limit exceeded.");
                            }
                            return [4 /*yield*/, this.createTransport(url, this.options.transport, negotiateResponse, transferFormat)];
                        case 10:
                            _a.sent();
                            _a.label = 11;
                        case 11:
                            if (this.transport instanceof LongPollingTransport) {
                                this.features.inherentKeepAlive = true;
                            }
                            if (this.connectionState === "Connecting " /* Connecting */) {
                                // Ensure the connection transitions to the connected state prior to completing this.startInternalPromise.
                                // start() will handle the case when stop was called and startInternal exits still in the disconnecting state.
                                this.logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
                                this.connectionState = "Connected" /* Connected */;
                            }
                            return [3 /*break*/, 13];
                        case 12:
                            e_3 = _a.sent();
                            this.logger.log(LogLevel.Error, "Failed to start the connection: " + e_3);
                            this.connectionState = "Disconnected" /* Disconnected */;
                            this.transport = undefined;
                            return [2 /*return*/, Promise.reject(e_3)];
                        case 13: return [2 /*return*/];
                    }
                });
            });
        };
        HttpConnection.prototype.getNegotiationResponse = function (url) {
            return __awaiter$5(this, void 0, void 0, function () {
                var _a, headers, token, negotiateUrl, response, negotiateResponse, e_4;
                return __generator$5(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.accessTokenFactory) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.accessTokenFactory()];
                        case 1:
                            token = _b.sent();
                            if (token) {
                                headers = (_a = {},
                                    _a["Authorization"] = "Bearer " + token,
                                    _a);
                            }
                            _b.label = 2;
                        case 2:
                            negotiateUrl = this.resolveNegotiateUrl(url);
                            this.logger.log(LogLevel.Debug, "Sending negotiation request: " + negotiateUrl + ".");
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.httpClient.post(negotiateUrl, {
                                    content: "",
                                    headers: headers,
                                })];
                        case 4:
                            response = _b.sent();
                            if (response.statusCode !== 200) {
                                return [2 /*return*/, Promise.reject(new Error("Unexpected status code returned from negotiate " + response.statusCode))];
                            }
                            negotiateResponse = JSON.parse(response.content);
                            if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
                                // Negotiate version 0 doesn't use connectionToken
                                // So we set it equal to connectionId so all our logic can use connectionToken without being aware of the negotiate version
                                negotiateResponse.connectionToken = negotiateResponse.connectionId;
                            }
                            return [2 /*return*/, negotiateResponse];
                        case 5:
                            e_4 = _b.sent();
                            this.logger.log(LogLevel.Error, "Failed to complete negotiation with the server: " + e_4);
                            return [2 /*return*/, Promise.reject(e_4)];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        HttpConnection.prototype.createConnectUrl = function (url, connectionToken) {
            if (!connectionToken) {
                return url;
            }
            return url + (url.indexOf("?") === -1 ? "?" : "&") + ("id=" + connectionToken);
        };
        HttpConnection.prototype.createTransport = function (url, requestedTransport, negotiateResponse, requestedTransferFormat) {
            return __awaiter$5(this, void 0, void 0, function () {
                var connectUrl, transportExceptions, transports, negotiate, _i, transports_1, endpoint, transportOrError, ex_1, ex_2, message;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            connectUrl = this.createConnectUrl(url, negotiateResponse.connectionToken);
                            if (!this.isITransport(requestedTransport)) return [3 /*break*/, 2];
                            this.logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
                            this.transport = requestedTransport;
                            return [4 /*yield*/, this.startTransport(connectUrl, requestedTransferFormat)];
                        case 1:
                            _a.sent();
                            this.connectionId = negotiateResponse.connectionId;
                            return [2 /*return*/];
                        case 2:
                            transportExceptions = [];
                            transports = negotiateResponse.availableTransports || [];
                            negotiate = negotiateResponse;
                            _i = 0, transports_1 = transports;
                            _a.label = 3;
                        case 3:
                            if (!(_i < transports_1.length)) return [3 /*break*/, 13];
                            endpoint = transports_1[_i];
                            transportOrError = this.resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat);
                            if (!(transportOrError instanceof Error)) return [3 /*break*/, 4];
                            // Store the error and continue, we don't want to cause a re-negotiate in these cases
                            transportExceptions.push(endpoint.transport + " failed: " + transportOrError);
                            return [3 /*break*/, 12];
                        case 4:
                            if (!this.isITransport(transportOrError)) return [3 /*break*/, 12];
                            this.transport = transportOrError;
                            if (!!negotiate) return [3 /*break*/, 9];
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.getNegotiationResponse(url)];
                        case 6:
                            negotiate = _a.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            ex_1 = _a.sent();
                            return [2 /*return*/, Promise.reject(ex_1)];
                        case 8:
                            connectUrl = this.createConnectUrl(url, negotiate.connectionToken);
                            _a.label = 9;
                        case 9:
                            _a.trys.push([9, 11, , 12]);
                            return [4 /*yield*/, this.startTransport(connectUrl, requestedTransferFormat)];
                        case 10:
                            _a.sent();
                            this.connectionId = negotiate.connectionId;
                            return [2 /*return*/];
                        case 11:
                            ex_2 = _a.sent();
                            this.logger.log(LogLevel.Error, "Failed to start the transport '" + endpoint.transport + "': " + ex_2);
                            negotiate = undefined;
                            transportExceptions.push(endpoint.transport + " failed: " + ex_2);
                            if (this.connectionState !== "Connecting " /* Connecting */) {
                                message = "Failed to select transport before stop() was called.";
                                this.logger.log(LogLevel.Debug, message);
                                return [2 /*return*/, Promise.reject(new Error(message))];
                            }
                            return [3 /*break*/, 12];
                        case 12:
                            _i++;
                            return [3 /*break*/, 3];
                        case 13:
                            if (transportExceptions.length > 0) {
                                return [2 /*return*/, Promise.reject(new Error("Unable to connect to the server with any of the available transports. " + transportExceptions.join(" ")))];
                            }
                            return [2 /*return*/, Promise.reject(new Error("None of the transports supported by the client are supported by the server."))];
                    }
                });
            });
        };
        HttpConnection.prototype.constructTransport = function (transport) {
            switch (transport) {
                case HttpTransportType.WebSockets:
                    if (!this.options.WebSocket) {
                        throw new Error("'WebSocket' is not supported in your environment.");
                    }
                    return new WebSocketTransport(this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false, this.options.WebSocket);
                case HttpTransportType.ServerSentEvents:
                    if (!this.options.EventSource) {
                        throw new Error("'EventSource' is not supported in your environment.");
                    }
                    return new ServerSentEventsTransport(this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false, this.options.EventSource);
                case HttpTransportType.LongPolling:
                    return new LongPollingTransport(this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false);
                default:
                    throw new Error("Unknown transport: " + transport + ".");
            }
        };
        HttpConnection.prototype.startTransport = function (url, transferFormat) {
            var _this = this;
            this.transport.onreceive = this.onreceive;
            this.transport.onclose = function (e) { return _this.stopConnection(e); };
            return this.transport.connect(url, transferFormat);
        };
        HttpConnection.prototype.resolveTransportOrError = function (endpoint, requestedTransport, requestedTransferFormat) {
            var transport = HttpTransportType[endpoint.transport];
            if (transport === null || transport === undefined) {
                this.logger.log(LogLevel.Debug, "Skipping transport '" + endpoint.transport + "' because it is not supported by this client.");
                return new Error("Skipping transport '" + endpoint.transport + "' because it is not supported by this client.");
            }
            else {
                if (transportMatches(requestedTransport, transport)) {
                    var transferFormats = endpoint.transferFormats.map(function (s) { return TransferFormat[s]; });
                    if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
                        if ((transport === HttpTransportType.WebSockets && !this.options.WebSocket) ||
                            (transport === HttpTransportType.ServerSentEvents && !this.options.EventSource)) {
                            this.logger.log(LogLevel.Debug, "Skipping transport '" + HttpTransportType[transport] + "' because it is not supported in your environment.'");
                            return new Error("'" + HttpTransportType[transport] + "' is not supported in your environment.");
                        }
                        else {
                            this.logger.log(LogLevel.Debug, "Selecting transport '" + HttpTransportType[transport] + "'.");
                            try {
                                return this.constructTransport(transport);
                            }
                            catch (ex) {
                                return ex;
                            }
                        }
                    }
                    else {
                        this.logger.log(LogLevel.Debug, "Skipping transport '" + HttpTransportType[transport] + "' because it does not support the requested transfer format '" + TransferFormat[requestedTransferFormat] + "'.");
                        return new Error("'" + HttpTransportType[transport] + "' does not support " + TransferFormat[requestedTransferFormat] + ".");
                    }
                }
                else {
                    this.logger.log(LogLevel.Debug, "Skipping transport '" + HttpTransportType[transport] + "' because it was disabled by the client.");
                    return new Error("'" + HttpTransportType[transport] + "' is disabled by the client.");
                }
            }
        };
        HttpConnection.prototype.isITransport = function (transport) {
            return transport && typeof (transport) === "object" && "connect" in transport;
        };
        HttpConnection.prototype.stopConnection = function (error) {
            var _this = this;
            this.logger.log(LogLevel.Debug, "HttpConnection.stopConnection(" + error + ") called while in state " + this.connectionState + ".");
            this.transport = undefined;
            // If we have a stopError, it takes precedence over the error from the transport
            error = this.stopError || error;
            this.stopError = undefined;
            if (this.connectionState === "Disconnected" /* Disconnected */) {
                this.logger.log(LogLevel.Debug, "Call to HttpConnection.stopConnection(" + error + ") was ignored because the connection is already in the disconnected state.");
                return;
            }
            if (this.connectionState === "Connecting " /* Connecting */) {
                this.logger.log(LogLevel.Warning, "Call to HttpConnection.stopConnection(" + error + ") was ignored because the connection hasn't yet left the in the connecting state.");
                return;
            }
            if (this.connectionState === "Disconnecting" /* Disconnecting */) {
                // A call to stop() induced this call to stopConnection and needs to be completed.
                // Any stop() awaiters will be scheduled to continue after the onclose callback fires.
                this.stopPromiseResolver();
            }
            if (error) {
                this.logger.log(LogLevel.Error, "Connection disconnected with error '" + error + "'.");
            }
            else {
                this.logger.log(LogLevel.Information, "Connection disconnected.");
            }
            if (this.sendQueue) {
                this.sendQueue.stop().catch(function (e) {
                    _this.logger.log(LogLevel.Error, "TransportSendQueue.stop() threw error '" + e + "'.");
                });
                this.sendQueue = undefined;
            }
            this.connectionId = undefined;
            this.connectionState = "Disconnected" /* Disconnected */;
            if (this.connectionStarted) {
                this.connectionStarted = false;
                try {
                    if (this.onclose) {
                        this.onclose(error);
                    }
                }
                catch (e) {
                    this.logger.log(LogLevel.Error, "HttpConnection.onclose(" + error + ") threw error '" + e + "'.");
                }
            }
        };
        HttpConnection.prototype.resolveUrl = function (url) {
            // startsWith is not supported in IE
            if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
                return url;
            }
            if (!Platform.isBrowser || !window.document) {
                throw new Error("Cannot resolve '" + url + "'.");
            }
            // Setting the url to the href propery of an anchor tag handles normalization
            // for us. There are 3 main cases.
            // 1. Relative path normalization e.g "b" -> "http://localhost:5000/a/b"
            // 2. Absolute path normalization e.g "/a/b" -> "http://localhost:5000/a/b"
            // 3. Networkpath reference normalization e.g "//localhost:5000/a/b" -> "http://localhost:5000/a/b"
            var aTag = window.document.createElement("a");
            aTag.href = url;
            this.logger.log(LogLevel.Information, "Normalizing '" + url + "' to '" + aTag.href + "'.");
            return aTag.href;
        };
        HttpConnection.prototype.resolveNegotiateUrl = function (url) {
            var index = url.indexOf("?");
            var negotiateUrl = url.substring(0, index === -1 ? url.length : index);
            if (negotiateUrl[negotiateUrl.length - 1] !== "/") {
                negotiateUrl += "/";
            }
            negotiateUrl += "negotiate";
            negotiateUrl += index === -1 ? "" : url.substring(index);
            if (negotiateUrl.indexOf("negotiateVersion") === -1) {
                negotiateUrl += index === -1 ? "?" : "&";
                negotiateUrl += "negotiateVersion=" + this.negotiateVersion;
            }
            return negotiateUrl;
        };
        return HttpConnection;
    }());
    function transportMatches(requestedTransport, actualTransport) {
        return !requestedTransport || ((actualTransport & requestedTransport) !== 0);
    }
    /** @private */
    var TransportSendQueue = /** @class */ (function () {
        function TransportSendQueue(transport) {
            this.transport = transport;
            this.buffer = [];
            this.executing = true;
            this.sendBufferedData = new PromiseSource();
            this.transportResult = new PromiseSource();
            this.sendLoopPromise = this.sendLoop();
        }
        TransportSendQueue.prototype.send = function (data) {
            this.bufferData(data);
            if (!this.transportResult) {
                this.transportResult = new PromiseSource();
            }
            return this.transportResult.promise;
        };
        TransportSendQueue.prototype.stop = function () {
            this.executing = false;
            this.sendBufferedData.resolve();
            return this.sendLoopPromise;
        };
        TransportSendQueue.prototype.bufferData = function (data) {
            if (this.buffer.length && typeof (this.buffer[0]) !== typeof (data)) {
                throw new Error("Expected data to be of type " + typeof (this.buffer) + " but was of type " + typeof (data));
            }
            this.buffer.push(data);
            this.sendBufferedData.resolve();
        };
        TransportSendQueue.prototype.sendLoop = function () {
            return __awaiter$5(this, void 0, void 0, function () {
                var transportResult, data, error_1;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, this.sendBufferedData.promise];
                        case 1:
                            _a.sent();
                            if (!this.executing) {
                                if (this.transportResult) {
                                    this.transportResult.reject("Connection stopped.");
                                }
                                return [3 /*break*/, 6];
                            }
                            this.sendBufferedData = new PromiseSource();
                            transportResult = this.transportResult;
                            this.transportResult = undefined;
                            data = typeof (this.buffer[0]) === "string" ?
                                this.buffer.join("") :
                                TransportSendQueue.concatBuffers(this.buffer);
                            this.buffer.length = 0;
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.transport.send(data)];
                        case 3:
                            _a.sent();
                            transportResult.resolve();
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            transportResult.reject(error_1);
                            return [3 /*break*/, 5];
                        case 5: return [3 /*break*/, 0];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        TransportSendQueue.concatBuffers = function (arrayBuffers) {
            var totalLength = arrayBuffers.map(function (b) { return b.byteLength; }).reduce(function (a, b) { return a + b; });
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var _i = 0, arrayBuffers_1 = arrayBuffers; _i < arrayBuffers_1.length; _i++) {
                var item = arrayBuffers_1[_i];
                result.set(new Uint8Array(item), offset);
                offset += item.byteLength;
            }
            return result;
        };
        return TransportSendQueue;
    }());
    var PromiseSource = /** @class */ (function () {
        function PromiseSource() {
            var _this = this;
            this.promise = new Promise(function (resolve, reject) {
                var _a;
                return _a = [resolve, reject], _this.resolver = _a[0], _this.rejecter = _a[1], _a;
            });
        }
        PromiseSource.prototype.resolve = function () {
            this.resolver();
        };
        PromiseSource.prototype.reject = function (reason) {
            this.rejecter(reason);
        };
        return PromiseSource;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    var JSON_HUB_PROTOCOL_NAME = "json";
    /** Implements the JSON Hub Protocol. */
    var JsonHubProtocol = /** @class */ (function () {
        function JsonHubProtocol() {
            /** @inheritDoc */
            this.name = JSON_HUB_PROTOCOL_NAME;
            /** @inheritDoc */
            this.version = 1;
            /** @inheritDoc */
            this.transferFormat = TransferFormat.Text;
        }
        /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
         *
         * @param {string} input A string containing the serialized representation.
         * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
         */
        JsonHubProtocol.prototype.parseMessages = function (input, logger) {
            // The interface does allow "ArrayBuffer" to be passed in, but this implementation does not. So let's throw a useful error.
            if (typeof input !== "string") {
                throw new Error("Invalid input for JSON hub protocol. Expected a string.");
            }
            if (!input) {
                return [];
            }
            if (logger === null) {
                logger = NullLogger.instance;
            }
            // Parse the messages
            var messages = TextMessageFormat.parse(input);
            var hubMessages = [];
            for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                var message = messages_1[_i];
                var parsedMessage = JSON.parse(message);
                if (typeof parsedMessage.type !== "number") {
                    throw new Error("Invalid payload.");
                }
                switch (parsedMessage.type) {
                    case MessageType.Invocation:
                        this.isInvocationMessage(parsedMessage);
                        break;
                    case MessageType.StreamItem:
                        this.isStreamItemMessage(parsedMessage);
                        break;
                    case MessageType.Completion:
                        this.isCompletionMessage(parsedMessage);
                        break;
                    case MessageType.Ping:
                        // Single value, no need to validate
                        break;
                    case MessageType.Close:
                        // All optional values, no need to validate
                        break;
                    default:
                        // Future protocol changes can add message types, old clients can ignore them
                        logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
                        continue;
                }
                hubMessages.push(parsedMessage);
            }
            return hubMessages;
        };
        /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
         *
         * @param {HubMessage} message The message to write.
         * @returns {string} A string containing the serialized representation of the message.
         */
        JsonHubProtocol.prototype.writeMessage = function (message) {
            return TextMessageFormat.write(JSON.stringify(message));
        };
        JsonHubProtocol.prototype.isInvocationMessage = function (message) {
            this.assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
            if (message.invocationId !== undefined) {
                this.assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
            }
        };
        JsonHubProtocol.prototype.isStreamItemMessage = function (message) {
            this.assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
            if (message.item === undefined) {
                throw new Error("Invalid payload for StreamItem message.");
            }
        };
        JsonHubProtocol.prototype.isCompletionMessage = function (message) {
            if (message.result && message.error) {
                throw new Error("Invalid payload for Completion message.");
            }
            if (!message.result && message.error) {
                this.assertNotEmptyString(message.error, "Invalid payload for Completion message.");
            }
            this.assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
        };
        JsonHubProtocol.prototype.assertNotEmptyString = function (value, errorMessage) {
            if (typeof value !== "string" || value === "") {
                throw new Error(errorMessage);
            }
        };
        return JsonHubProtocol;
    }());

    // Copyright (c) .NET Foundation. All rights reserved.
    // Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
    var __assign$2 = (undefined && undefined.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    // tslint:disable:object-literal-sort-keys
    var LogLevelNameMapping = {
        trace: LogLevel.Trace,
        debug: LogLevel.Debug,
        info: LogLevel.Information,
        information: LogLevel.Information,
        warn: LogLevel.Warning,
        warning: LogLevel.Warning,
        error: LogLevel.Error,
        critical: LogLevel.Critical,
        none: LogLevel.None,
    };
    function parseLogLevel(name) {
        // Case-insensitive matching via lower-casing
        // Yes, I know case-folding is a complicated problem in Unicode, but we only support
        // the ASCII strings defined in LogLevelNameMapping anyway, so it's fine -anurse.
        var mapping = LogLevelNameMapping[name.toLowerCase()];
        if (typeof mapping !== "undefined") {
            return mapping;
        }
        else {
            throw new Error("Unknown log level: " + name);
        }
    }
    /** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
    var HubConnectionBuilder = /** @class */ (function () {
        function HubConnectionBuilder() {
        }
        HubConnectionBuilder.prototype.configureLogging = function (logging) {
            Arg.isRequired(logging, "logging");
            if (isLogger(logging)) {
                this.logger = logging;
            }
            else if (typeof logging === "string") {
                var logLevel = parseLogLevel(logging);
                this.logger = new ConsoleLogger(logLevel);
            }
            else {
                this.logger = new ConsoleLogger(logging);
            }
            return this;
        };
        HubConnectionBuilder.prototype.withUrl = function (url, transportTypeOrOptions) {
            Arg.isRequired(url, "url");
            this.url = url;
            // Flow-typing knows where it's at. Since HttpTransportType is a number and IHttpConnectionOptions is guaranteed
            // to be an object, we know (as does TypeScript) this comparison is all we need to figure out which overload was called.
            if (typeof transportTypeOrOptions === "object") {
                this.httpConnectionOptions = __assign$2({}, this.httpConnectionOptions, transportTypeOrOptions);
            }
            else {
                this.httpConnectionOptions = __assign$2({}, this.httpConnectionOptions, { transport: transportTypeOrOptions });
            }
            return this;
        };
        /** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
         *
         * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
         */
        HubConnectionBuilder.prototype.withHubProtocol = function (protocol) {
            Arg.isRequired(protocol, "protocol");
            this.protocol = protocol;
            return this;
        };
        HubConnectionBuilder.prototype.withAutomaticReconnect = function (retryDelaysOrReconnectPolicy) {
            if (this.reconnectPolicy) {
                throw new Error("A reconnectPolicy has already been set.");
            }
            if (!retryDelaysOrReconnectPolicy) {
                this.reconnectPolicy = new DefaultReconnectPolicy();
            }
            else if (Array.isArray(retryDelaysOrReconnectPolicy)) {
                this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
            }
            else {
                this.reconnectPolicy = retryDelaysOrReconnectPolicy;
            }
            return this;
        };
        /** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
         *
         * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
         */
        HubConnectionBuilder.prototype.build = function () {
            // If httpConnectionOptions has a logger, use it. Otherwise, override it with the one
            // provided to configureLogger
            var httpConnectionOptions = this.httpConnectionOptions || {};
            // If it's 'null', the user **explicitly** asked for null, don't mess with it.
            if (httpConnectionOptions.logger === undefined) {
                // If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
                httpConnectionOptions.logger = this.logger;
            }
            // Now create the connection
            if (!this.url) {
                throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
            }
            var connection = new HttpConnection(this.url, httpConnectionOptions);
            return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy);
        };
        return HubConnectionBuilder;
    }());
    function isLogger(logger) {
        return logger.log !== undefined;
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer$1(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = merge(result[key], val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Function equal to merge with the difference being that no reference
     * to original objects is kept.
     *
     * @see merge
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function deepMerge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = deepMerge(result[key], val);
        } else if (typeof val === 'object') {
          result[key] = deepMerge({}, val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer$1,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      deepMerge: deepMerge,
      extend: extend,
      trim: trim
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password || '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          var cookies$1 = cookies;

          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies$1.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (requestData === undefined) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
      var defaultToConfig2Keys = [
        'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
        'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath'
      ];

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
        if (utils.isObject(config2[prop])) {
          config[prop] = utils.deepMerge(config1[prop], config2[prop]);
        } else if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (utils.isObject(config1[prop])) {
          config[prop] = utils.deepMerge(config1[prop]);
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys);

      var otherKeys = Object
        .keys(config2)
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var sweetalert2_all = createCommonjsModule(function (module, exports) {
    /*!
    * sweetalert2 v10.8.1
    * Released under the MIT License.
    */
    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {
      function _typeof(obj) {
        "@babel/helpers - typeof";

        if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
          _typeof = function (obj) {
            return typeof obj;
          };
        } else {
          _typeof = function (obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          };
        }

        return _typeof(obj);
      }

      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }

      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
      }

      function _extends() {
        _extends = Object.assign || function (target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }

          return target;
        };

        return _extends.apply(this, arguments);
      }

      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function");
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
            value: subClass,
            writable: true,
            configurable: true
          }
        });
        if (superClass) _setPrototypeOf(subClass, superClass);
      }

      function _getPrototypeOf(o) {
        _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
          return o.__proto__ || Object.getPrototypeOf(o);
        };
        return _getPrototypeOf(o);
      }

      function _setPrototypeOf(o, p) {
        _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
          o.__proto__ = p;
          return o;
        };

        return _setPrototypeOf(o, p);
      }

      function _isNativeReflectConstruct() {
        if (typeof Reflect === "undefined" || !Reflect.construct) return false;
        if (Reflect.construct.sham) return false;
        if (typeof Proxy === "function") return true;

        try {
          Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
          return true;
        } catch (e) {
          return false;
        }
      }

      function _construct(Parent, args, Class) {
        if (_isNativeReflectConstruct()) {
          _construct = Reflect.construct;
        } else {
          _construct = function _construct(Parent, args, Class) {
            var a = [null];
            a.push.apply(a, args);
            var Constructor = Function.bind.apply(Parent, a);
            var instance = new Constructor();
            if (Class) _setPrototypeOf(instance, Class.prototype);
            return instance;
          };
        }

        return _construct.apply(null, arguments);
      }

      function _assertThisInitialized(self) {
        if (self === void 0) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return self;
      }

      function _possibleConstructorReturn(self, call) {
        if (call && (typeof call === "object" || typeof call === "function")) {
          return call;
        }

        return _assertThisInitialized(self);
      }

      function _createSuper(Derived) {
        var hasNativeReflectConstruct = _isNativeReflectConstruct();

        return function _createSuperInternal() {
          var Super = _getPrototypeOf(Derived),
              result;

          if (hasNativeReflectConstruct) {
            var NewTarget = _getPrototypeOf(this).constructor;

            result = Reflect.construct(Super, arguments, NewTarget);
          } else {
            result = Super.apply(this, arguments);
          }

          return _possibleConstructorReturn(this, result);
        };
      }

      function _superPropBase(object, property) {
        while (!Object.prototype.hasOwnProperty.call(object, property)) {
          object = _getPrototypeOf(object);
          if (object === null) break;
        }

        return object;
      }

      function _get(target, property, receiver) {
        if (typeof Reflect !== "undefined" && Reflect.get) {
          _get = Reflect.get;
        } else {
          _get = function _get(target, property, receiver) {
            var base = _superPropBase(target, property);

            if (!base) return;
            var desc = Object.getOwnPropertyDescriptor(base, property);

            if (desc.get) {
              return desc.get.call(receiver);
            }

            return desc.value;
          };
        }

        return _get(target, property, receiver || target);
      }

      var consolePrefix = 'SweetAlert2:';
      /**
       * Filter the unique values into a new array
       * @param arr
       */

      var uniqueArray = function uniqueArray(arr) {
        var result = [];

        for (var i = 0; i < arr.length; i++) {
          if (result.indexOf(arr[i]) === -1) {
            result.push(arr[i]);
          }
        }

        return result;
      };
      /**
       * Capitalize the first letter of a string
       * @param str
       */

      var capitalizeFirstLetter = function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
      /**
       * Returns the array of object values (Object.values isn't supported in IE11)
       * @param obj
       */

      var objectValues = function objectValues(obj) {
        return Object.keys(obj).map(function (key) {
          return obj[key];
        });
      };
      /**
       * Convert NodeList to Array
       * @param nodeList
       */

      var toArray = function toArray(nodeList) {
        return Array.prototype.slice.call(nodeList);
      };
      /**
       * Standardise console warnings
       * @param message
       */

      var warn = function warn(message) {
        console.warn("".concat(consolePrefix, " ").concat(message));
      };
      /**
       * Standardise console errors
       * @param message
       */

      var error = function error(message) {
        console.error("".concat(consolePrefix, " ").concat(message));
      };
      /**
       * Private global state for `warnOnce`
       * @type {Array}
       * @private
       */

      var previousWarnOnceMessages = [];
      /**
       * Show a console warning, but only if it hasn't already been shown
       * @param message
       */

      var warnOnce = function warnOnce(message) {
        if (!(previousWarnOnceMessages.indexOf(message) !== -1)) {
          previousWarnOnceMessages.push(message);
          warn(message);
        }
      };
      /**
       * Show a one-time console warning about deprecated params/methods
       */

      var warnAboutDeprecation = function warnAboutDeprecation(deprecatedParam, useInstead) {
        warnOnce("\"".concat(deprecatedParam, "\" is deprecated and will be removed in the next major release. Please use \"").concat(useInstead, "\" instead."));
      };
      /**
       * If `arg` is a function, call it (with no arguments or context) and return the result.
       * Otherwise, just pass the value through
       * @param arg
       */

      var callIfFunction = function callIfFunction(arg) {
        return typeof arg === 'function' ? arg() : arg;
      };
      var hasToPromiseFn = function hasToPromiseFn(arg) {
        return arg && typeof arg.toPromise === 'function';
      };
      var asPromise = function asPromise(arg) {
        return hasToPromiseFn(arg) ? arg.toPromise() : Promise.resolve(arg);
      };
      var isPromise = function isPromise(arg) {
        return arg && Promise.resolve(arg) === arg;
      };

      var DismissReason = Object.freeze({
        cancel: 'cancel',
        backdrop: 'backdrop',
        close: 'close',
        esc: 'esc',
        timer: 'timer'
      });

      var isJqueryElement = function isJqueryElement(elem) {
        return _typeof(elem) === 'object' && elem.jquery;
      };

      var isElement = function isElement(elem) {
        return elem instanceof Element || isJqueryElement(elem);
      };

      var argsToParams = function argsToParams(args) {
        var params = {};

        if (_typeof(args[0]) === 'object' && !isElement(args[0])) {
          _extends(params, args[0]);
        } else {
          ['title', 'html', 'icon'].forEach(function (name, index) {
            var arg = args[index];

            if (typeof arg === 'string' || isElement(arg)) {
              params[name] = arg;
            } else if (arg !== undefined) {
              error("Unexpected type of ".concat(name, "! Expected \"string\" or \"Element\", got ").concat(_typeof(arg)));
            }
          });
        }

        return params;
      };

      var swalPrefix = 'swal2-';
      var prefix = function prefix(items) {
        var result = {};

        for (var i in items) {
          result[items[i]] = swalPrefix + items[i];
        }

        return result;
      };
      var swalClasses = prefix(['container', 'shown', 'height-auto', 'iosfix', 'popup', 'modal', 'no-backdrop', 'no-transition', 'toast', 'toast-shown', 'toast-column', 'show', 'hide', 'close', 'title', 'header', 'content', 'html-container', 'actions', 'confirm', 'deny', 'cancel', 'footer', 'icon', 'icon-content', 'image', 'input', 'file', 'range', 'select', 'radio', 'checkbox', 'label', 'textarea', 'inputerror', 'input-label', 'validation-message', 'progress-steps', 'active-progress-step', 'progress-step', 'progress-step-line', 'loader', 'loading', 'styled', 'top', 'top-start', 'top-end', 'top-left', 'top-right', 'center', 'center-start', 'center-end', 'center-left', 'center-right', 'bottom', 'bottom-start', 'bottom-end', 'bottom-left', 'bottom-right', 'grow-row', 'grow-column', 'grow-fullscreen', 'rtl', 'timer-progress-bar', 'timer-progress-bar-container', 'scrollbar-measure', 'icon-success', 'icon-warning', 'icon-info', 'icon-question', 'icon-error']);
      var iconTypes = prefix(['success', 'warning', 'info', 'question', 'error']);

      var getContainer = function getContainer() {
        return document.body.querySelector(".".concat(swalClasses.container));
      };
      var elementBySelector = function elementBySelector(selectorString) {
        var container = getContainer();
        return container ? container.querySelector(selectorString) : null;
      };

      var elementByClass = function elementByClass(className) {
        return elementBySelector(".".concat(className));
      };

      var getPopup = function getPopup() {
        return elementByClass(swalClasses.popup);
      };
      var getIcons = function getIcons() {
        var popup = getPopup();
        return toArray(popup.querySelectorAll(".".concat(swalClasses.icon)));
      };
      var getIcon = function getIcon() {
        var visibleIcon = getIcons().filter(function (icon) {
          return isVisible(icon);
        });
        return visibleIcon.length ? visibleIcon[0] : null;
      };
      var getTitle = function getTitle() {
        return elementByClass(swalClasses.title);
      };
      var getContent = function getContent() {
        return elementByClass(swalClasses.content);
      };
      var getHtmlContainer = function getHtmlContainer() {
        return elementByClass(swalClasses['html-container']);
      };
      var getImage = function getImage() {
        return elementByClass(swalClasses.image);
      };
      var getProgressSteps = function getProgressSteps() {
        return elementByClass(swalClasses['progress-steps']);
      };
      var getValidationMessage = function getValidationMessage() {
        return elementByClass(swalClasses['validation-message']);
      };
      var getConfirmButton = function getConfirmButton() {
        return elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.confirm));
      };
      var getDenyButton = function getDenyButton() {
        return elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.deny));
      };
      var getInputLabel = function getInputLabel() {
        return elementByClass(swalClasses['input-label']);
      };
      var getLoader = function getLoader() {
        return elementBySelector(".".concat(swalClasses.loader));
      };
      var getCancelButton = function getCancelButton() {
        return elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.cancel));
      };
      var getActions = function getActions() {
        return elementByClass(swalClasses.actions);
      };
      var getHeader = function getHeader() {
        return elementByClass(swalClasses.header);
      };
      var getFooter = function getFooter() {
        return elementByClass(swalClasses.footer);
      };
      var getTimerProgressBar = function getTimerProgressBar() {
        return elementByClass(swalClasses['timer-progress-bar']);
      };
      var getCloseButton = function getCloseButton() {
        return elementByClass(swalClasses.close);
      }; // https://github.com/jkup/focusable/blob/master/index.js

      var focusable = "\n  a[href],\n  area[href],\n  input:not([disabled]),\n  select:not([disabled]),\n  textarea:not([disabled]),\n  button:not([disabled]),\n  iframe,\n  object,\n  embed,\n  [tabindex=\"0\"],\n  [contenteditable],\n  audio[controls],\n  video[controls],\n  summary\n";
      var getFocusableElements = function getFocusableElements() {
        var focusableElementsWithTabindex = toArray(getPopup().querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')) // sort according to tabindex
        .sort(function (a, b) {
          a = parseInt(a.getAttribute('tabindex'));
          b = parseInt(b.getAttribute('tabindex'));

          if (a > b) {
            return 1;
          } else if (a < b) {
            return -1;
          }

          return 0;
        });
        var otherFocusableElements = toArray(getPopup().querySelectorAll(focusable)).filter(function (el) {
          return el.getAttribute('tabindex') !== '-1';
        });
        return uniqueArray(focusableElementsWithTabindex.concat(otherFocusableElements)).filter(function (el) {
          return isVisible(el);
        });
      };
      var isModal = function isModal() {
        return !isToast() && !document.body.classList.contains(swalClasses['no-backdrop']);
      };
      var isToast = function isToast() {
        return document.body.classList.contains(swalClasses['toast-shown']);
      };
      var isLoading = function isLoading() {
        return getPopup().hasAttribute('data-loading');
      };

      var states = {
        previousBodyPadding: null
      };
      var setInnerHtml = function setInnerHtml(elem, html) {
        // #1926
        elem.textContent = '';

        if (html) {
          var parser = new DOMParser();
          var parsed = parser.parseFromString(html, "text/html");
          toArray(parsed.querySelector('head').childNodes).forEach(function (child) {
            elem.appendChild(child);
          });
          toArray(parsed.querySelector('body').childNodes).forEach(function (child) {
            elem.appendChild(child);
          });
        }
      };
      var hasClass = function hasClass(elem, className) {
        if (!className) {
          return false;
        }

        var classList = className.split(/\s+/);

        for (var i = 0; i < classList.length; i++) {
          if (!elem.classList.contains(classList[i])) {
            return false;
          }
        }

        return true;
      };

      var removeCustomClasses = function removeCustomClasses(elem, params) {
        toArray(elem.classList).forEach(function (className) {
          if (!(objectValues(swalClasses).indexOf(className) !== -1) && !(objectValues(iconTypes).indexOf(className) !== -1) && !(objectValues(params.showClass).indexOf(className) !== -1)) {
            elem.classList.remove(className);
          }
        });
      };

      var applyCustomClass = function applyCustomClass(elem, params, className) {
        removeCustomClasses(elem, params);

        if (params.customClass && params.customClass[className]) {
          if (typeof params.customClass[className] !== 'string' && !params.customClass[className].forEach) {
            return warn("Invalid type of customClass.".concat(className, "! Expected string or iterable object, got \"").concat(_typeof(params.customClass[className]), "\""));
          }

          addClass(elem, params.customClass[className]);
        }
      };
      function getInput(content, inputType) {
        if (!inputType) {
          return null;
        }

        switch (inputType) {
          case 'select':
          case 'textarea':
          case 'file':
            return getChildByClass(content, swalClasses[inputType]);

          case 'checkbox':
            return content.querySelector(".".concat(swalClasses.checkbox, " input"));

          case 'radio':
            return content.querySelector(".".concat(swalClasses.radio, " input:checked")) || content.querySelector(".".concat(swalClasses.radio, " input:first-child"));

          case 'range':
            return content.querySelector(".".concat(swalClasses.range, " input"));

          default:
            return getChildByClass(content, swalClasses.input);
        }
      }
      var focusInput = function focusInput(input) {
        input.focus(); // place cursor at end of text in text input

        if (input.type !== 'file') {
          // http://stackoverflow.com/a/2345915
          var val = input.value;
          input.value = '';
          input.value = val;
        }
      };
      var toggleClass = function toggleClass(target, classList, condition) {
        if (!target || !classList) {
          return;
        }

        if (typeof classList === 'string') {
          classList = classList.split(/\s+/).filter(Boolean);
        }

        classList.forEach(function (className) {
          if (target.forEach) {
            target.forEach(function (elem) {
              condition ? elem.classList.add(className) : elem.classList.remove(className);
            });
          } else {
            condition ? target.classList.add(className) : target.classList.remove(className);
          }
        });
      };
      var addClass = function addClass(target, classList) {
        toggleClass(target, classList, true);
      };
      var removeClass = function removeClass(target, classList) {
        toggleClass(target, classList, false);
      };
      var getChildByClass = function getChildByClass(elem, className) {
        for (var i = 0; i < elem.childNodes.length; i++) {
          if (hasClass(elem.childNodes[i], className)) {
            return elem.childNodes[i];
          }
        }
      };
      var applyNumericalStyle = function applyNumericalStyle(elem, property, value) {
        if (value || parseInt(value) === 0) {
          elem.style[property] = typeof value === 'number' ? "".concat(value, "px") : value;
        } else {
          elem.style.removeProperty(property);
        }
      };
      var show = function show(elem) {
        var display = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'flex';
        elem.style.display = display;
      };
      var hide = function hide(elem) {
        elem.style.display = 'none';
      };
      var setStyle = function setStyle(parent, selector, property, value) {
        var el = parent.querySelector(selector);

        if (el) {
          el.style[property] = value;
        }
      };
      var toggle = function toggle(elem, condition, display) {
        condition ? show(elem, display) : hide(elem);
      }; // borrowed from jquery $(elem).is(':visible') implementation

      var isVisible = function isVisible(elem) {
        return !!(elem && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
      };
      /* istanbul ignore next */

      var isScrollable = function isScrollable(elem) {
        return !!(elem.scrollHeight > elem.clientHeight);
      }; // borrowed from https://stackoverflow.com/a/46352119

      var hasCssAnimation = function hasCssAnimation(elem) {
        var style = window.getComputedStyle(elem);
        var animDuration = parseFloat(style.getPropertyValue('animation-duration') || '0');
        var transDuration = parseFloat(style.getPropertyValue('transition-duration') || '0');
        return animDuration > 0 || transDuration > 0;
      };
      var contains = function contains(haystack, needle) {
        if (typeof haystack.contains === 'function') {
          return haystack.contains(needle);
        }
      };
      var animateTimerProgressBar = function animateTimerProgressBar(timer) {
        var reset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var timerProgressBar = getTimerProgressBar();

        if (isVisible(timerProgressBar)) {
          if (reset) {
            timerProgressBar.style.transition = 'none';
            timerProgressBar.style.width = '100%';
          }

          setTimeout(function () {
            timerProgressBar.style.transition = "width ".concat(timer / 1000, "s linear");
            timerProgressBar.style.width = '0%';
          }, 10);
        }
      };
      var stopTimerProgressBar = function stopTimerProgressBar() {
        var timerProgressBar = getTimerProgressBar();
        var timerProgressBarWidth = parseInt(window.getComputedStyle(timerProgressBar).width);
        timerProgressBar.style.removeProperty('transition');
        timerProgressBar.style.width = '100%';
        var timerProgressBarFullWidth = parseInt(window.getComputedStyle(timerProgressBar).width);
        var timerProgressBarPercent = parseInt(timerProgressBarWidth / timerProgressBarFullWidth * 100);
        timerProgressBar.style.removeProperty('transition');
        timerProgressBar.style.width = "".concat(timerProgressBarPercent, "%");
      };

      // Detect Node env
      var isNodeEnv = function isNodeEnv() {
        return typeof window === 'undefined' || typeof document === 'undefined';
      };

      var sweetHTML = "\n <div aria-labelledby=\"".concat(swalClasses.title, "\" aria-describedby=\"").concat(swalClasses.content, "\" class=\"").concat(swalClasses.popup, "\" tabindex=\"-1\">\n   <div class=\"").concat(swalClasses.header, "\">\n     <ul class=\"").concat(swalClasses['progress-steps'], "\"></ul>\n     <div class=\"").concat(swalClasses.icon, " ").concat(iconTypes.error, "\"></div>\n     <div class=\"").concat(swalClasses.icon, " ").concat(iconTypes.question, "\"></div>\n     <div class=\"").concat(swalClasses.icon, " ").concat(iconTypes.warning, "\"></div>\n     <div class=\"").concat(swalClasses.icon, " ").concat(iconTypes.info, "\"></div>\n     <div class=\"").concat(swalClasses.icon, " ").concat(iconTypes.success, "\"></div>\n     <img class=\"").concat(swalClasses.image, "\" />\n     <h2 class=\"").concat(swalClasses.title, "\" id=\"").concat(swalClasses.title, "\"></h2>\n     <button type=\"button\" class=\"").concat(swalClasses.close, "\"></button>\n   </div>\n   <div class=\"").concat(swalClasses.content, "\">\n     <div id=\"").concat(swalClasses.content, "\" class=\"").concat(swalClasses['html-container'], "\"></div>\n     <input class=\"").concat(swalClasses.input, "\" />\n     <input type=\"file\" class=\"").concat(swalClasses.file, "\" />\n     <div class=\"").concat(swalClasses.range, "\">\n       <input type=\"range\" />\n       <output></output>\n     </div>\n     <select class=\"").concat(swalClasses.select, "\"></select>\n     <div class=\"").concat(swalClasses.radio, "\"></div>\n     <label for=\"").concat(swalClasses.checkbox, "\" class=\"").concat(swalClasses.checkbox, "\">\n       <input type=\"checkbox\" />\n       <span class=\"").concat(swalClasses.label, "\"></span>\n     </label>\n     <textarea class=\"").concat(swalClasses.textarea, "\"></textarea>\n     <div class=\"").concat(swalClasses['validation-message'], "\" id=\"").concat(swalClasses['validation-message'], "\"></div>\n   </div>\n   <div class=\"").concat(swalClasses.actions, "\">\n     <div class=\"").concat(swalClasses.loader, "\"></div>\n     <button type=\"button\" class=\"").concat(swalClasses.confirm, "\"></button>\n     <button type=\"button\" class=\"").concat(swalClasses.deny, "\"></button>\n     <button type=\"button\" class=\"").concat(swalClasses.cancel, "\"></button>\n   </div>\n   <div class=\"").concat(swalClasses.footer, "\"></div>\n   <div class=\"").concat(swalClasses['timer-progress-bar-container'], "\">\n     <div class=\"").concat(swalClasses['timer-progress-bar'], "\"></div>\n   </div>\n </div>\n").replace(/(^|\n)\s*/g, '');

      var resetOldContainer = function resetOldContainer() {
        var oldContainer = getContainer();

        if (!oldContainer) {
          return false;
        }

        oldContainer.parentNode.removeChild(oldContainer);
        removeClass([document.documentElement, document.body], [swalClasses['no-backdrop'], swalClasses['toast-shown'], swalClasses['has-column']]);
        return true;
      };

      var oldInputVal; // IE11 workaround, see #1109 for details

      var resetValidationMessage = function resetValidationMessage(e) {
        if (Swal.isVisible() && oldInputVal !== e.target.value) {
          Swal.resetValidationMessage();
        }

        oldInputVal = e.target.value;
      };

      var addInputChangeListeners = function addInputChangeListeners() {
        var content = getContent();
        var input = getChildByClass(content, swalClasses.input);
        var file = getChildByClass(content, swalClasses.file);
        var range = content.querySelector(".".concat(swalClasses.range, " input"));
        var rangeOutput = content.querySelector(".".concat(swalClasses.range, " output"));
        var select = getChildByClass(content, swalClasses.select);
        var checkbox = content.querySelector(".".concat(swalClasses.checkbox, " input"));
        var textarea = getChildByClass(content, swalClasses.textarea);
        input.oninput = resetValidationMessage;
        file.onchange = resetValidationMessage;
        select.onchange = resetValidationMessage;
        checkbox.onchange = resetValidationMessage;
        textarea.oninput = resetValidationMessage;

        range.oninput = function (e) {
          resetValidationMessage(e);
          rangeOutput.value = range.value;
        };

        range.onchange = function (e) {
          resetValidationMessage(e);
          range.nextSibling.value = range.value;
        };
      };

      var getTarget = function getTarget(target) {
        return typeof target === 'string' ? document.querySelector(target) : target;
      };

      var setupAccessibility = function setupAccessibility(params) {
        var popup = getPopup();
        popup.setAttribute('role', params.toast ? 'alert' : 'dialog');
        popup.setAttribute('aria-live', params.toast ? 'polite' : 'assertive');

        if (!params.toast) {
          popup.setAttribute('aria-modal', 'true');
        }
      };

      var setupRTL = function setupRTL(targetElement) {
        if (window.getComputedStyle(targetElement).direction === 'rtl') {
          addClass(getContainer(), swalClasses.rtl);
        }
      };
      /*
       * Add modal + backdrop to DOM
       */


      var init = function init(params) {
        // Clean up the old popup container if it exists
        var oldContainerExisted = resetOldContainer();
        /* istanbul ignore if */

        if (isNodeEnv()) {
          error('SweetAlert2 requires document to initialize');
          return;
        }

        var container = document.createElement('div');
        container.className = swalClasses.container;

        if (oldContainerExisted) {
          addClass(container, swalClasses['no-transition']);
        }

        setInnerHtml(container, sweetHTML);
        var targetElement = getTarget(params.target);
        targetElement.appendChild(container);
        setupAccessibility(params);
        setupRTL(targetElement);
        addInputChangeListeners();
      };

      var parseHtmlToContainer = function parseHtmlToContainer(param, target) {
        // DOM element
        if (param instanceof HTMLElement) {
          target.appendChild(param); // Object
        } else if (_typeof(param) === 'object') {
          handleObject(param, target); // Plain string
        } else if (param) {
          setInnerHtml(target, param);
        }
      };

      var handleObject = function handleObject(param, target) {
        // JQuery element(s)
        if (param.jquery) {
          handleJqueryElem(target, param); // For other objects use their string representation
        } else {
          setInnerHtml(target, param.toString());
        }
      };

      var handleJqueryElem = function handleJqueryElem(target, elem) {
        target.textContent = '';

        if (0 in elem) {
          for (var i = 0; (i in elem); i++) {
            target.appendChild(elem[i].cloneNode(true));
          }
        } else {
          target.appendChild(elem.cloneNode(true));
        }
      };

      var animationEndEvent = function () {
        // Prevent run in Node env

        /* istanbul ignore if */
        if (isNodeEnv()) {
          return false;
        }

        var testEl = document.createElement('div');
        var transEndEventNames = {
          WebkitAnimation: 'webkitAnimationEnd',
          OAnimation: 'oAnimationEnd oanimationend',
          animation: 'animationend'
        };

        for (var i in transEndEventNames) {
          if (Object.prototype.hasOwnProperty.call(transEndEventNames, i) && typeof testEl.style[i] !== 'undefined') {
            return transEndEventNames[i];
          }
        }

        return false;
      }();

      // https://github.com/twbs/bootstrap/blob/master/js/src/modal.js

      var measureScrollbar = function measureScrollbar() {
        var scrollDiv = document.createElement('div');
        scrollDiv.className = swalClasses['scrollbar-measure'];
        document.body.appendChild(scrollDiv);
        var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
      };

      var renderActions = function renderActions(instance, params) {
        var actions = getActions();
        var loader = getLoader();
        var confirmButton = getConfirmButton();
        var denyButton = getDenyButton();
        var cancelButton = getCancelButton(); // Actions (buttons) wrapper

        if (!params.showConfirmButton && !params.showDenyButton && !params.showCancelButton) {
          hide(actions);
        } // Custom class


        applyCustomClass(actions, params, 'actions'); // Render buttons

        renderButton(confirmButton, 'confirm', params);
        renderButton(denyButton, 'deny', params);
        renderButton(cancelButton, 'cancel', params);
        handleButtonsStyling(confirmButton, denyButton, cancelButton, params);

        if (params.reverseButtons) {
          actions.insertBefore(cancelButton, loader);
          actions.insertBefore(denyButton, loader);
          actions.insertBefore(confirmButton, loader);
        } // Loader


        loader.innerHTML = params.loaderHtml;
        applyCustomClass(loader, params, 'loader');
      };

      function handleButtonsStyling(confirmButton, denyButton, cancelButton, params) {
        if (!params.buttonsStyling) {
          return removeClass([confirmButton, denyButton, cancelButton], swalClasses.styled);
        }

        addClass([confirmButton, denyButton, cancelButton], swalClasses.styled); // Buttons background colors

        if (params.confirmButtonColor) {
          confirmButton.style.backgroundColor = params.confirmButtonColor;
        }

        if (params.denyButtonColor) {
          denyButton.style.backgroundColor = params.denyButtonColor;
        }

        if (params.cancelButtonColor) {
          cancelButton.style.backgroundColor = params.cancelButtonColor;
        }
      }

      function renderButton(button, buttonType, params) {
        toggle(button, params["show".concat(capitalizeFirstLetter(buttonType), "Button")], 'inline-block');
        setInnerHtml(button, params["".concat(buttonType, "ButtonText")]); // Set caption text

        button.setAttribute('aria-label', params["".concat(buttonType, "ButtonAriaLabel")]); // ARIA label
        // Add buttons custom classes

        button.className = swalClasses[buttonType];
        applyCustomClass(button, params, "".concat(buttonType, "Button"));
        addClass(button, params["".concat(buttonType, "ButtonClass")]);
      }

      function handleBackdropParam(container, backdrop) {
        if (typeof backdrop === 'string') {
          container.style.background = backdrop;
        } else if (!backdrop) {
          addClass([document.documentElement, document.body], swalClasses['no-backdrop']);
        }
      }

      function handlePositionParam(container, position) {
        if (position in swalClasses) {
          addClass(container, swalClasses[position]);
        } else {
          warn('The "position" parameter is not valid, defaulting to "center"');
          addClass(container, swalClasses.center);
        }
      }

      function handleGrowParam(container, grow) {
        if (grow && typeof grow === 'string') {
          var growClass = "grow-".concat(grow);

          if (growClass in swalClasses) {
            addClass(container, swalClasses[growClass]);
          }
        }
      }

      var renderContainer = function renderContainer(instance, params) {
        var container = getContainer();

        if (!container) {
          return;
        }

        handleBackdropParam(container, params.backdrop);

        if (!params.backdrop && params.allowOutsideClick) {
          warn('"allowOutsideClick" parameter requires `backdrop` parameter to be set to `true`');
        }

        handlePositionParam(container, params.position);
        handleGrowParam(container, params.grow); // Custom class

        applyCustomClass(container, params, 'container'); // Set queue step attribute for getQueueStep() method

        var queueStep = document.body.getAttribute('data-swal2-queue-step');

        if (queueStep) {
          container.setAttribute('data-queue-step', queueStep);
          document.body.removeAttribute('data-swal2-queue-step');
        }
      };

      /**
       * This module containts `WeakMap`s for each effectively-"private  property" that a `Swal` has.
       * For example, to set the private property "foo" of `this` to "bar", you can `privateProps.foo.set(this, 'bar')`
       * This is the approach that Babel will probably take to implement private methods/fields
       *   https://github.com/tc39/proposal-private-methods
       *   https://github.com/babel/babel/pull/7555
       * Once we have the changes from that PR in Babel, and our core class fits reasonable in *one module*
       *   then we can use that language feature.
       */
      var privateProps = {
        promise: new WeakMap(),
        innerParams: new WeakMap(),
        domCache: new WeakMap()
      };

      var inputTypes = ['input', 'file', 'range', 'select', 'radio', 'checkbox', 'textarea'];
      var renderInput = function renderInput(instance, params) {
        var content = getContent();
        var innerParams = privateProps.innerParams.get(instance);
        var rerender = !innerParams || params.input !== innerParams.input;
        inputTypes.forEach(function (inputType) {
          var inputClass = swalClasses[inputType];
          var inputContainer = getChildByClass(content, inputClass); // set attributes

          setAttributes(inputType, params.inputAttributes); // set class

          inputContainer.className = inputClass;

          if (rerender) {
            hide(inputContainer);
          }
        });

        if (params.input) {
          if (rerender) {
            showInput(params);
          } // set custom class


          setCustomClass(params);
        }
      };

      var showInput = function showInput(params) {
        if (!renderInputType[params.input]) {
          return error("Unexpected type of input! Expected \"text\", \"email\", \"password\", \"number\", \"tel\", \"select\", \"radio\", \"checkbox\", \"textarea\", \"file\" or \"url\", got \"".concat(params.input, "\""));
        }

        var inputContainer = getInputContainer(params.input);
        var input = renderInputType[params.input](inputContainer, params);
        show(input); // input autofocus

        setTimeout(function () {
          focusInput(input);
        });
      };

      var removeAttributes = function removeAttributes(input) {
        for (var i = 0; i < input.attributes.length; i++) {
          var attrName = input.attributes[i].name;

          if (!(['type', 'value', 'style'].indexOf(attrName) !== -1)) {
            input.removeAttribute(attrName);
          }
        }
      };

      var setAttributes = function setAttributes(inputType, inputAttributes) {
        var input = getInput(getContent(), inputType);

        if (!input) {
          return;
        }

        removeAttributes(input);

        for (var attr in inputAttributes) {
          // Do not set a placeholder for <input type="range">
          // it'll crash Edge, #1298
          if (inputType === 'range' && attr === 'placeholder') {
            continue;
          }

          input.setAttribute(attr, inputAttributes[attr]);
        }
      };

      var setCustomClass = function setCustomClass(params) {
        var inputContainer = getInputContainer(params.input);

        if (params.customClass) {
          addClass(inputContainer, params.customClass.input);
        }
      };

      var setInputPlaceholder = function setInputPlaceholder(input, params) {
        if (!input.placeholder || params.inputPlaceholder) {
          input.placeholder = params.inputPlaceholder;
        }
      };

      var setInputLabel = function setInputLabel(input, prependTo, params) {
        if (params.inputLabel) {
          input.id = swalClasses.input;
          var label = document.createElement('label');
          var labelClass = swalClasses['input-label'];
          label.setAttribute('for', input.id);
          label.className = labelClass;
          label.innerText = params.inputLabel;
          prependTo.insertAdjacentElement('beforebegin', label);
        }
      };

      var getInputContainer = function getInputContainer(inputType) {
        var inputClass = swalClasses[inputType] ? swalClasses[inputType] : swalClasses.input;
        return getChildByClass(getContent(), inputClass);
      };

      var renderInputType = {};

      renderInputType.text = renderInputType.email = renderInputType.password = renderInputType.number = renderInputType.tel = renderInputType.url = function (input, params) {
        if (typeof params.inputValue === 'string' || typeof params.inputValue === 'number') {
          input.value = params.inputValue;
        } else if (!isPromise(params.inputValue)) {
          warn("Unexpected type of inputValue! Expected \"string\", \"number\" or \"Promise\", got \"".concat(_typeof(params.inputValue), "\""));
        }

        setInputLabel(input, input, params);
        setInputPlaceholder(input, params);
        input.type = params.input;
        return input;
      };

      renderInputType.file = function (input, params) {
        setInputLabel(input, input, params);
        setInputPlaceholder(input, params);
        return input;
      };

      renderInputType.range = function (range, params) {
        var rangeInput = range.querySelector('input');
        var rangeOutput = range.querySelector('output');
        rangeInput.value = params.inputValue;
        rangeInput.type = params.input;
        rangeOutput.value = params.inputValue;
        setInputLabel(rangeInput, range, params);
        return range;
      };

      renderInputType.select = function (select, params) {
        select.textContent = '';

        if (params.inputPlaceholder) {
          var placeholder = document.createElement('option');
          setInnerHtml(placeholder, params.inputPlaceholder);
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = true;
          select.appendChild(placeholder);
        }

        setInputLabel(select, select, params);
        return select;
      };

      renderInputType.radio = function (radio) {
        radio.textContent = '';
        return radio;
      };

      renderInputType.checkbox = function (checkboxContainer, params) {
        var checkbox = getInput(getContent(), 'checkbox');
        checkbox.value = 1;
        checkbox.id = swalClasses.checkbox;
        checkbox.checked = Boolean(params.inputValue);
        var label = checkboxContainer.querySelector('span');
        setInnerHtml(label, params.inputPlaceholder);
        return checkboxContainer;
      };

      renderInputType.textarea = function (textarea, params) {
        textarea.value = params.inputValue;
        setInputPlaceholder(textarea, params);
        setInputLabel(textarea, textarea, params);

        if ('MutationObserver' in window) {
          // #1699
          var initialPopupWidth = parseInt(window.getComputedStyle(getPopup()).width);
          var popupPadding = parseInt(window.getComputedStyle(getPopup()).paddingLeft) + parseInt(window.getComputedStyle(getPopup()).paddingRight);

          var outputsize = function outputsize() {
            var contentWidth = textarea.offsetWidth + popupPadding;

            if (contentWidth > initialPopupWidth) {
              getPopup().style.width = "".concat(contentWidth, "px");
            } else {
              getPopup().style.width = null;
            }
          };

          new MutationObserver(outputsize).observe(textarea, {
            attributes: true,
            attributeFilter: ['style']
          });
        }

        return textarea;
      };

      var renderContent = function renderContent(instance, params) {
        var content = getContent().querySelector("#".concat(swalClasses.content)); // Content as HTML

        if (params.html) {
          parseHtmlToContainer(params.html, content);
          show(content, 'block'); // Content as plain text
        } else if (params.text) {
          content.textContent = params.text;
          show(content, 'block'); // No content
        } else {
          hide(content);
        }

        renderInput(instance, params); // Custom class

        applyCustomClass(getContent(), params, 'content');
      };

      var renderFooter = function renderFooter(instance, params) {
        var footer = getFooter();
        toggle(footer, params.footer);

        if (params.footer) {
          parseHtmlToContainer(params.footer, footer);
        } // Custom class


        applyCustomClass(footer, params, 'footer');
      };

      var renderCloseButton = function renderCloseButton(instance, params) {
        var closeButton = getCloseButton();
        setInnerHtml(closeButton, params.closeButtonHtml); // Custom class

        applyCustomClass(closeButton, params, 'closeButton');
        toggle(closeButton, params.showCloseButton);
        closeButton.setAttribute('aria-label', params.closeButtonAriaLabel);
      };

      var renderIcon = function renderIcon(instance, params) {
        var innerParams = privateProps.innerParams.get(instance); // if the given icon already rendered, apply the styling without re-rendering the icon

        if (innerParams && params.icon === innerParams.icon && getIcon()) {
          applyStyles(getIcon(), params);
          return;
        }

        hideAllIcons();

        if (!params.icon) {
          return;
        }

        if (Object.keys(iconTypes).indexOf(params.icon) !== -1) {
          var icon = elementBySelector(".".concat(swalClasses.icon, ".").concat(iconTypes[params.icon]));
          show(icon); // Custom or default content

          setContent(icon, params);
          applyStyles(icon, params); // Animate icon

          addClass(icon, params.showClass.icon);
        } else {
          error("Unknown icon! Expected \"success\", \"error\", \"warning\", \"info\" or \"question\", got \"".concat(params.icon, "\""));
        }
      };

      var hideAllIcons = function hideAllIcons() {
        var icons = getIcons();

        for (var i = 0; i < icons.length; i++) {
          hide(icons[i]);
        }
      };

      var applyStyles = function applyStyles(icon, params) {
        // Icon color
        setColor(icon, params); // Success icon background color

        adjustSuccessIconBackgoundColor(); // Custom class

        applyCustomClass(icon, params, 'icon');
      }; // Adjust success icon background color to match the popup background color


      var adjustSuccessIconBackgoundColor = function adjustSuccessIconBackgoundColor() {
        var popup = getPopup();
        var popupBackgroundColor = window.getComputedStyle(popup).getPropertyValue('background-color');
        var successIconParts = popup.querySelectorAll('[class^=swal2-success-circular-line], .swal2-success-fix');

        for (var i = 0; i < successIconParts.length; i++) {
          successIconParts[i].style.backgroundColor = popupBackgroundColor;
        }
      };

      var setContent = function setContent(icon, params) {
        icon.textContent = '';

        if (params.iconHtml) {
          setInnerHtml(icon, iconContent(params.iconHtml));
        } else if (params.icon === 'success') {
          setInnerHtml(icon, "\n      <div class=\"swal2-success-circular-line-left\"></div>\n      <span class=\"swal2-success-line-tip\"></span> <span class=\"swal2-success-line-long\"></span>\n      <div class=\"swal2-success-ring\"></div> <div class=\"swal2-success-fix\"></div>\n      <div class=\"swal2-success-circular-line-right\"></div>\n    ");
        } else if (params.icon === 'error') {
          setInnerHtml(icon, "\n      <span class=\"swal2-x-mark\">\n        <span class=\"swal2-x-mark-line-left\"></span>\n        <span class=\"swal2-x-mark-line-right\"></span>\n      </span>\n    ");
        } else {
          var defaultIconHtml = {
            question: '?',
            warning: '!',
            info: 'i'
          };
          setInnerHtml(icon, iconContent(defaultIconHtml[params.icon]));
        }
      };

      var setColor = function setColor(icon, params) {
        if (!params.iconColor) {
          return;
        }

        icon.style.color = params.iconColor;
        icon.style.borderColor = params.iconColor;

        for (var _i = 0, _arr = ['.swal2-success-line-tip', '.swal2-success-line-long', '.swal2-x-mark-line-left', '.swal2-x-mark-line-right']; _i < _arr.length; _i++) {
          var sel = _arr[_i];
          setStyle(icon, sel, 'backgroundColor', params.iconColor);
        }

        setStyle(icon, '.swal2-success-ring', 'borderColor', params.iconColor);
      };

      var iconContent = function iconContent(content) {
        return "<div class=\"".concat(swalClasses['icon-content'], "\">").concat(content, "</div>");
      };

      var renderImage = function renderImage(instance, params) {
        var image = getImage();

        if (!params.imageUrl) {
          return hide(image);
        }

        show(image, ''); // Src, alt

        image.setAttribute('src', params.imageUrl);
        image.setAttribute('alt', params.imageAlt); // Width, height

        applyNumericalStyle(image, 'width', params.imageWidth);
        applyNumericalStyle(image, 'height', params.imageHeight); // Class

        image.className = swalClasses.image;
        applyCustomClass(image, params, 'image');
      };

      var currentSteps = [];
      /*
       * Global function for chaining sweetAlert popups
       */

      var queue = function queue(steps) {
        var Swal = this;
        currentSteps = steps;

        var resetAndResolve = function resetAndResolve(resolve, value) {
          currentSteps = [];
          resolve(value);
        };

        var queueResult = [];
        return new Promise(function (resolve) {
          (function step(i, callback) {
            if (i < currentSteps.length) {
              document.body.setAttribute('data-swal2-queue-step', i);
              Swal.fire(currentSteps[i]).then(function (result) {
                if (typeof result.value !== 'undefined') {
                  queueResult.push(result.value);
                  step(i + 1);
                } else {
                  resetAndResolve(resolve, {
                    dismiss: result.dismiss
                  });
                }
              });
            } else {
              resetAndResolve(resolve, {
                value: queueResult
              });
            }
          })(0);
        });
      };
      /*
       * Global function for getting the index of current popup in queue
       */

      var getQueueStep = function getQueueStep() {
        return getContainer() && getContainer().getAttribute('data-queue-step');
      };
      /*
       * Global function for inserting a popup to the queue
       */

      var insertQueueStep = function insertQueueStep(step, index) {
        if (index && index < currentSteps.length) {
          return currentSteps.splice(index, 0, step);
        }

        return currentSteps.push(step);
      };
      /*
       * Global function for deleting a popup from the queue
       */

      var deleteQueueStep = function deleteQueueStep(index) {
        if (typeof currentSteps[index] !== 'undefined') {
          currentSteps.splice(index, 1);
        }
      };

      var createStepElement = function createStepElement(step) {
        var stepEl = document.createElement('li');
        addClass(stepEl, swalClasses['progress-step']);
        setInnerHtml(stepEl, step);
        return stepEl;
      };

      var createLineElement = function createLineElement(params) {
        var lineEl = document.createElement('li');
        addClass(lineEl, swalClasses['progress-step-line']);

        if (params.progressStepsDistance) {
          lineEl.style.width = params.progressStepsDistance;
        }

        return lineEl;
      };

      var renderProgressSteps = function renderProgressSteps(instance, params) {
        var progressStepsContainer = getProgressSteps();

        if (!params.progressSteps || params.progressSteps.length === 0) {
          return hide(progressStepsContainer);
        }

        show(progressStepsContainer);
        progressStepsContainer.textContent = '';
        var currentProgressStep = parseInt(params.currentProgressStep === undefined ? getQueueStep() : params.currentProgressStep);

        if (currentProgressStep >= params.progressSteps.length) {
          warn('Invalid currentProgressStep parameter, it should be less than progressSteps.length ' + '(currentProgressStep like JS arrays starts from 0)');
        }

        params.progressSteps.forEach(function (step, index) {
          var stepEl = createStepElement(step);
          progressStepsContainer.appendChild(stepEl);

          if (index === currentProgressStep) {
            addClass(stepEl, swalClasses['active-progress-step']);
          }

          if (index !== params.progressSteps.length - 1) {
            var lineEl = createLineElement(params);
            progressStepsContainer.appendChild(lineEl);
          }
        });
      };

      var renderTitle = function renderTitle(instance, params) {
        var title = getTitle();
        toggle(title, params.title || params.titleText);

        if (params.title) {
          parseHtmlToContainer(params.title, title);
        }

        if (params.titleText) {
          title.innerText = params.titleText;
        } // Custom class


        applyCustomClass(title, params, 'title');
      };

      var renderHeader = function renderHeader(instance, params) {
        var header = getHeader(); // Custom class

        applyCustomClass(header, params, 'header'); // Progress steps

        renderProgressSteps(instance, params); // Icon

        renderIcon(instance, params); // Image

        renderImage(instance, params); // Title

        renderTitle(instance, params); // Close button

        renderCloseButton(instance, params);
      };

      var renderPopup = function renderPopup(instance, params) {
        var popup = getPopup(); // Width

        applyNumericalStyle(popup, 'width', params.width); // Padding

        applyNumericalStyle(popup, 'padding', params.padding); // Background

        if (params.background) {
          popup.style.background = params.background;
        } // Classes


        addClasses(popup, params);
      };

      var addClasses = function addClasses(popup, params) {
        // Default Class + showClass when updating Swal.update({})
        popup.className = "".concat(swalClasses.popup, " ").concat(isVisible(popup) ? params.showClass.popup : '');

        if (params.toast) {
          addClass([document.documentElement, document.body], swalClasses['toast-shown']);
          addClass(popup, swalClasses.toast);
        } else {
          addClass(popup, swalClasses.modal);
        } // Custom class


        applyCustomClass(popup, params, 'popup');

        if (typeof params.customClass === 'string') {
          addClass(popup, params.customClass);
        } // Icon class (#1842)


        if (params.icon) {
          addClass(popup, swalClasses["icon-".concat(params.icon)]);
        }
      };

      var render = function render(instance, params) {
        renderPopup(instance, params);
        renderContainer(instance, params);
        renderHeader(instance, params);
        renderContent(instance, params);
        renderActions(instance, params);
        renderFooter(instance, params);

        if (typeof params.didRender === 'function') {
          params.didRender(getPopup());
        } else if (typeof params.onRender === 'function') {
          params.onRender(getPopup()); // @deprecated
        }
      };

      /*
       * Global function to determine if SweetAlert2 popup is shown
       */

      var isVisible$1 = function isVisible$$1() {
        return isVisible(getPopup());
      };
      /*
       * Global function to click 'Confirm' button
       */

      var clickConfirm = function clickConfirm() {
        return getConfirmButton() && getConfirmButton().click();
      };
      /*
       * Global function to click 'Deny' button
       */

      var clickDeny = function clickDeny() {
        return getDenyButton() && getDenyButton().click();
      };
      /*
       * Global function to click 'Cancel' button
       */

      var clickCancel = function clickCancel() {
        return getCancelButton() && getCancelButton().click();
      };

      function fire() {
        var Swal = this;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _construct(Swal, args);
      }

      /**
       * Returns an extended version of `Swal` containing `params` as defaults.
       * Useful for reusing Swal configuration.
       *
       * For example:
       *
       * Before:
       * const textPromptOptions = { input: 'text', showCancelButton: true }
       * const {value: firstName} = await Swal.fire({ ...textPromptOptions, title: 'What is your first name?' })
       * const {value: lastName} = await Swal.fire({ ...textPromptOptions, title: 'What is your last name?' })
       *
       * After:
       * const TextPrompt = Swal.mixin({ input: 'text', showCancelButton: true })
       * const {value: firstName} = await TextPrompt('What is your first name?')
       * const {value: lastName} = await TextPrompt('What is your last name?')
       *
       * @param mixinParams
       */
      function mixin(mixinParams) {
        var MixinSwal = /*#__PURE__*/function (_this) {
          _inherits(MixinSwal, _this);

          var _super = _createSuper(MixinSwal);

          function MixinSwal() {
            _classCallCheck(this, MixinSwal);

            return _super.apply(this, arguments);
          }

          _createClass(MixinSwal, [{
            key: "_main",
            value: function _main(params) {
              return _get(_getPrototypeOf(MixinSwal.prototype), "_main", this).call(this, _extends({}, mixinParams, params));
            }
          }]);

          return MixinSwal;
        }(this);

        return MixinSwal;
      }

      /**
       * Show spinner instead of Confirm button
       */

      var showLoading = function showLoading() {
        var popup = getPopup();

        if (!popup) {
          Swal.fire();
        }

        popup = getPopup();
        var actions = getActions();
        var confirmButton = getConfirmButton();
        var loader = getLoader();
        show(actions);
        hide(confirmButton);
        addClass([popup, actions], swalClasses.loading);
        show(loader);
        popup.setAttribute('data-loading', true);
        popup.setAttribute('aria-busy', true);
        popup.focus();
      };

      var RESTORE_FOCUS_TIMEOUT = 100;

      var globalState = {};

      var focusPreviousActiveElement = function focusPreviousActiveElement() {
        if (globalState.previousActiveElement && globalState.previousActiveElement.focus) {
          globalState.previousActiveElement.focus();
          globalState.previousActiveElement = null;
        } else if (document.body) {
          document.body.focus();
        }
      }; // Restore previous active (focused) element


      var restoreActiveElement = function restoreActiveElement() {
        return new Promise(function (resolve) {
          var x = window.scrollX;
          var y = window.scrollY;
          globalState.restoreFocusTimeout = setTimeout(function () {
            focusPreviousActiveElement();
            resolve();
          }, RESTORE_FOCUS_TIMEOUT); // issues/900

          /* istanbul ignore if */

          if (typeof x !== 'undefined' && typeof y !== 'undefined') {
            // IE doesn't have scrollX/scrollY support
            window.scrollTo(x, y);
          }
        });
      };

      /**
       * If `timer` parameter is set, returns number of milliseconds of timer remained.
       * Otherwise, returns undefined.
       */

      var getTimerLeft = function getTimerLeft() {
        return globalState.timeout && globalState.timeout.getTimerLeft();
      };
      /**
       * Stop timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      var stopTimer = function stopTimer() {
        if (globalState.timeout) {
          stopTimerProgressBar();
          return globalState.timeout.stop();
        }
      };
      /**
       * Resume timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      var resumeTimer = function resumeTimer() {
        if (globalState.timeout) {
          var remaining = globalState.timeout.start();
          animateTimerProgressBar(remaining);
          return remaining;
        }
      };
      /**
       * Resume timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      var toggleTimer = function toggleTimer() {
        var timer = globalState.timeout;
        return timer && (timer.running ? stopTimer() : resumeTimer());
      };
      /**
       * Increase timer. Returns number of milliseconds of an updated timer.
       * If `timer` parameter isn't set, returns undefined.
       */

      var increaseTimer = function increaseTimer(n) {
        if (globalState.timeout) {
          var remaining = globalState.timeout.increase(n);
          animateTimerProgressBar(remaining, true);
          return remaining;
        }
      };
      /**
       * Check if timer is running. Returns true if timer is running
       * or false if timer is paused or stopped.
       * If `timer` parameter isn't set, returns undefined
       */

      var isTimerRunning = function isTimerRunning() {
        return globalState.timeout && globalState.timeout.isRunning();
      };

      var defaultParams = {
        title: '',
        titleText: '',
        text: '',
        html: '',
        footer: '',
        icon: undefined,
        iconColor: undefined,
        iconHtml: undefined,
        toast: false,
        animation: true,
        showClass: {
          popup: 'swal2-show',
          backdrop: 'swal2-backdrop-show',
          icon: 'swal2-icon-show'
        },
        hideClass: {
          popup: 'swal2-hide',
          backdrop: 'swal2-backdrop-hide',
          icon: 'swal2-icon-hide'
        },
        customClass: undefined,
        target: 'body',
        backdrop: true,
        heightAuto: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        allowEnterKey: true,
        stopKeydownPropagation: true,
        keydownListenerCapture: false,
        showConfirmButton: true,
        showDenyButton: false,
        showCancelButton: false,
        preConfirm: undefined,
        preDeny: undefined,
        confirmButtonText: 'OK',
        confirmButtonAriaLabel: '',
        confirmButtonColor: undefined,
        denyButtonText: 'No',
        denyButtonAriaLabel: '',
        denyButtonColor: undefined,
        cancelButtonText: 'Cancel',
        cancelButtonAriaLabel: '',
        cancelButtonColor: undefined,
        buttonsStyling: true,
        reverseButtons: false,
        focusConfirm: true,
        focusDeny: false,
        focusCancel: false,
        showCloseButton: false,
        closeButtonHtml: '&times;',
        closeButtonAriaLabel: 'Close this dialog',
        loaderHtml: '',
        showLoaderOnConfirm: false,
        imageUrl: undefined,
        imageWidth: undefined,
        imageHeight: undefined,
        imageAlt: '',
        timer: undefined,
        timerProgressBar: false,
        width: undefined,
        padding: undefined,
        background: undefined,
        input: undefined,
        inputPlaceholder: '',
        inputLabel: '',
        inputValue: '',
        inputOptions: {},
        inputAutoTrim: true,
        inputAttributes: {},
        inputValidator: undefined,
        returnInputValueOnDeny: false,
        validationMessage: undefined,
        grow: false,
        position: 'center',
        progressSteps: [],
        currentProgressStep: undefined,
        progressStepsDistance: undefined,
        onBeforeOpen: undefined,
        onOpen: undefined,
        willOpen: undefined,
        didOpen: undefined,
        onRender: undefined,
        didRender: undefined,
        onClose: undefined,
        onAfterClose: undefined,
        willClose: undefined,
        didClose: undefined,
        onDestroy: undefined,
        didDestroy: undefined,
        scrollbarPadding: true
      };
      var updatableParams = ['allowEscapeKey', 'allowOutsideClick', 'background', 'buttonsStyling', 'cancelButtonAriaLabel', 'cancelButtonColor', 'cancelButtonText', 'closeButtonAriaLabel', 'closeButtonHtml', 'confirmButtonAriaLabel', 'confirmButtonColor', 'confirmButtonText', 'currentProgressStep', 'customClass', 'denyButtonAriaLabel', 'denyButtonColor', 'denyButtonText', 'didClose', 'didDestroy', 'footer', 'hideClass', 'html', 'icon', 'iconColor', 'imageAlt', 'imageHeight', 'imageUrl', 'imageWidth', 'onAfterClose', 'onClose', 'onDestroy', 'progressSteps', 'reverseButtons', 'showCancelButton', 'showCloseButton', 'showConfirmButton', 'showDenyButton', 'text', 'title', 'titleText', 'willClose'];
      var deprecatedParams = {
        animation: 'showClass" and "hideClass',
        onBeforeOpen: 'willOpen',
        onOpen: 'didOpen',
        onRender: 'didRender',
        onClose: 'willClose',
        onAfterClose: 'didClose',
        onDestroy: 'didDestroy'
      };
      var toastIncompatibleParams = ['allowOutsideClick', 'allowEnterKey', 'backdrop', 'focusConfirm', 'focusDeny', 'focusCancel', 'heightAuto', 'keydownListenerCapture'];
      /**
       * Is valid parameter
       * @param {String} paramName
       */

      var isValidParameter = function isValidParameter(paramName) {
        return Object.prototype.hasOwnProperty.call(defaultParams, paramName);
      };
      /**
       * Is valid parameter for Swal.update() method
       * @param {String} paramName
       */

      var isUpdatableParameter = function isUpdatableParameter(paramName) {
        return updatableParams.indexOf(paramName) !== -1;
      };
      /**
       * Is deprecated parameter
       * @param {String} paramName
       */

      var isDeprecatedParameter = function isDeprecatedParameter(paramName) {
        return deprecatedParams[paramName];
      };

      var checkIfParamIsValid = function checkIfParamIsValid(param) {
        if (!isValidParameter(param)) {
          warn("Unknown parameter \"".concat(param, "\""));
        }
      };

      var checkIfToastParamIsValid = function checkIfToastParamIsValid(param) {
        if (toastIncompatibleParams.indexOf(param) !== -1) {
          warn("The parameter \"".concat(param, "\" is incompatible with toasts"));
        }
      };

      var checkIfParamIsDeprecated = function checkIfParamIsDeprecated(param) {
        if (isDeprecatedParameter(param)) {
          warnAboutDeprecation(param, isDeprecatedParameter(param));
        }
      };
      /**
       * Show relevant warnings for given params
       *
       * @param params
       */


      var showWarningsForParams = function showWarningsForParams(params) {
        for (var param in params) {
          checkIfParamIsValid(param);

          if (params.toast) {
            checkIfToastParamIsValid(param);
          }

          checkIfParamIsDeprecated(param);
        }
      };



      var staticMethods = /*#__PURE__*/Object.freeze({
        isValidParameter: isValidParameter,
        isUpdatableParameter: isUpdatableParameter,
        isDeprecatedParameter: isDeprecatedParameter,
        argsToParams: argsToParams,
        isVisible: isVisible$1,
        clickConfirm: clickConfirm,
        clickDeny: clickDeny,
        clickCancel: clickCancel,
        getContainer: getContainer,
        getPopup: getPopup,
        getTitle: getTitle,
        getContent: getContent,
        getHtmlContainer: getHtmlContainer,
        getImage: getImage,
        getIcon: getIcon,
        getIcons: getIcons,
        getInputLabel: getInputLabel,
        getCloseButton: getCloseButton,
        getActions: getActions,
        getConfirmButton: getConfirmButton,
        getDenyButton: getDenyButton,
        getCancelButton: getCancelButton,
        getLoader: getLoader,
        getHeader: getHeader,
        getFooter: getFooter,
        getTimerProgressBar: getTimerProgressBar,
        getFocusableElements: getFocusableElements,
        getValidationMessage: getValidationMessage,
        isLoading: isLoading,
        fire: fire,
        mixin: mixin,
        queue: queue,
        getQueueStep: getQueueStep,
        insertQueueStep: insertQueueStep,
        deleteQueueStep: deleteQueueStep,
        showLoading: showLoading,
        enableLoading: showLoading,
        getTimerLeft: getTimerLeft,
        stopTimer: stopTimer,
        resumeTimer: resumeTimer,
        toggleTimer: toggleTimer,
        increaseTimer: increaseTimer,
        isTimerRunning: isTimerRunning
      });

      /**
       * Enables buttons and hide loader.
       */

      function hideLoading() {
        // do nothing if popup is closed
        var innerParams = privateProps.innerParams.get(this);

        if (!innerParams) {
          return;
        }

        var domCache = privateProps.domCache.get(this);
        hide(domCache.loader);

        if (innerParams.showConfirmButton) {
          show(domCache.confirmButton, 'inline-block');
        } else if (!innerParams.showConfirmButton && !innerParams.showCancelButton) {
          hide(domCache.actions);
        }

        removeClass([domCache.popup, domCache.actions], swalClasses.loading);
        domCache.popup.removeAttribute('aria-busy');
        domCache.popup.removeAttribute('data-loading');
        domCache.confirmButton.disabled = false;
        domCache.denyButton.disabled = false;
        domCache.cancelButton.disabled = false;
      }

      function getInput$1(instance) {
        var innerParams = privateProps.innerParams.get(instance || this);
        var domCache = privateProps.domCache.get(instance || this);

        if (!domCache) {
          return null;
        }

        return getInput(domCache.content, innerParams.input);
      }

      var fixScrollbar = function fixScrollbar() {
        // for queues, do not do this more than once
        if (states.previousBodyPadding !== null) {
          return;
        } // if the body has overflow


        if (document.body.scrollHeight > window.innerHeight) {
          // add padding so the content doesn't shift after removal of scrollbar
          states.previousBodyPadding = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'));
          document.body.style.paddingRight = "".concat(states.previousBodyPadding + measureScrollbar(), "px");
        }
      };
      var undoScrollbar = function undoScrollbar() {
        if (states.previousBodyPadding !== null) {
          document.body.style.paddingRight = "".concat(states.previousBodyPadding, "px");
          states.previousBodyPadding = null;
        }
      };

      /* istanbul ignore file */

      var iOSfix = function iOSfix() {
        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

        if (iOS && !hasClass(document.body, swalClasses.iosfix)) {
          var offset = document.body.scrollTop;
          document.body.style.top = "".concat(offset * -1, "px");
          addClass(document.body, swalClasses.iosfix);
          lockBodyScroll();
          addBottomPaddingForTallPopups(); // #1948
        }
      };

      var addBottomPaddingForTallPopups = function addBottomPaddingForTallPopups() {
        var safari = !navigator.userAgent.match(/(CriOS|FxiOS|EdgiOS|YaBrowser|UCBrowser)/i);

        if (safari) {
          var bottomPanelHeight = 44;

          if (getPopup().scrollHeight > window.innerHeight - bottomPanelHeight) {
            getContainer().style.paddingBottom = "".concat(bottomPanelHeight, "px");
          }
        }
      };

      var lockBodyScroll = function lockBodyScroll() {
        // #1246
        var container = getContainer();
        var preventTouchMove;

        container.ontouchstart = function (e) {
          preventTouchMove = shouldPreventTouchMove(e);
        };

        container.ontouchmove = function (e) {
          if (preventTouchMove) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
      };

      var shouldPreventTouchMove = function shouldPreventTouchMove(event) {
        var target = event.target;
        var container = getContainer();

        if (event.touches && event.touches.length && event.touches[0].touchType === 'stylus') {
          // #1786
          return false;
        }

        if (target === container) {
          return true;
        }

        if (!isScrollable(container) && target.tagName !== 'INPUT' && // #1603
        !(isScrollable(getContent()) && // #1944
        getContent().contains(target))) {
          return true;
        }

        return false;
      };

      var undoIOSfix = function undoIOSfix() {
        if (hasClass(document.body, swalClasses.iosfix)) {
          var offset = parseInt(document.body.style.top, 10);
          removeClass(document.body, swalClasses.iosfix);
          document.body.style.top = '';
          document.body.scrollTop = offset * -1;
        }
      };

      /* istanbul ignore file */

      var isIE11 = function isIE11() {
        return !!window.MSInputMethodContext && !!document.documentMode;
      }; // Fix IE11 centering sweetalert2/issues/933


      var fixVerticalPositionIE = function fixVerticalPositionIE() {
        var container = getContainer();
        var popup = getPopup();
        container.style.removeProperty('align-items');

        if (popup.offsetTop < 0) {
          container.style.alignItems = 'flex-start';
        }
      };

      var IEfix = function IEfix() {
        if (typeof window !== 'undefined' && isIE11()) {
          fixVerticalPositionIE();
          window.addEventListener('resize', fixVerticalPositionIE);
        }
      };
      var undoIEfix = function undoIEfix() {
        if (typeof window !== 'undefined' && isIE11()) {
          window.removeEventListener('resize', fixVerticalPositionIE);
        }
      };

      // Adding aria-hidden="true" to elements outside of the active modal dialog ensures that
      // elements not within the active modal dialog will not be surfaced if a user opens a screen
      // reader’s list of elements (headings, form controls, landmarks, etc.) in the document.

      var setAriaHidden = function setAriaHidden() {
        var bodyChildren = toArray(document.body.children);
        bodyChildren.forEach(function (el) {
          if (el === getContainer() || contains(el, getContainer())) {
            return;
          }

          if (el.hasAttribute('aria-hidden')) {
            el.setAttribute('data-previous-aria-hidden', el.getAttribute('aria-hidden'));
          }

          el.setAttribute('aria-hidden', 'true');
        });
      };
      var unsetAriaHidden = function unsetAriaHidden() {
        var bodyChildren = toArray(document.body.children);
        bodyChildren.forEach(function (el) {
          if (el.hasAttribute('data-previous-aria-hidden')) {
            el.setAttribute('aria-hidden', el.getAttribute('data-previous-aria-hidden'));
            el.removeAttribute('data-previous-aria-hidden');
          } else {
            el.removeAttribute('aria-hidden');
          }
        });
      };

      /**
       * This module containts `WeakMap`s for each effectively-"private  property" that a `Swal` has.
       * For example, to set the private property "foo" of `this` to "bar", you can `privateProps.foo.set(this, 'bar')`
       * This is the approach that Babel will probably take to implement private methods/fields
       *   https://github.com/tc39/proposal-private-methods
       *   https://github.com/babel/babel/pull/7555
       * Once we have the changes from that PR in Babel, and our core class fits reasonable in *one module*
       *   then we can use that language feature.
       */
      var privateMethods = {
        swalPromiseResolve: new WeakMap()
      };

      /*
       * Instance method to close sweetAlert
       */

      function removePopupAndResetState(instance, container, isToast$$1, didClose) {
        if (isToast$$1) {
          triggerDidCloseAndDispose(instance, didClose);
        } else {
          restoreActiveElement().then(function () {
            return triggerDidCloseAndDispose(instance, didClose);
          });
          globalState.keydownTarget.removeEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = false;
        }

        if (container.parentNode && !document.body.getAttribute('data-swal2-queue-step')) {
          container.parentNode.removeChild(container);
        }

        if (isModal()) {
          undoScrollbar();
          undoIOSfix();
          undoIEfix();
          unsetAriaHidden();
        }

        removeBodyClasses();
      }

      function removeBodyClasses() {
        removeClass([document.documentElement, document.body], [swalClasses.shown, swalClasses['height-auto'], swalClasses['no-backdrop'], swalClasses['toast-shown'], swalClasses['toast-column']]);
      }

      function close(resolveValue) {
        var popup = getPopup();

        if (!popup) {
          return;
        }

        resolveValue = prepareResolveValue(resolveValue);
        var innerParams = privateProps.innerParams.get(this);

        if (!innerParams || hasClass(popup, innerParams.hideClass.popup)) {
          return;
        }

        var swalPromiseResolve = privateMethods.swalPromiseResolve.get(this);
        removeClass(popup, innerParams.showClass.popup);
        addClass(popup, innerParams.hideClass.popup);
        var backdrop = getContainer();
        removeClass(backdrop, innerParams.showClass.backdrop);
        addClass(backdrop, innerParams.hideClass.backdrop);
        handlePopupAnimation(this, popup, innerParams); // Resolve Swal promise

        swalPromiseResolve(resolveValue);
      }

      var prepareResolveValue = function prepareResolveValue(resolveValue) {
        // When user calls Swal.close()
        if (typeof resolveValue === 'undefined') {
          return {
            isConfirmed: false,
            isDenied: false,
            isDismissed: true
          };
        }

        return _extends({
          isConfirmed: false,
          isDenied: false,
          isDismissed: false
        }, resolveValue);
      };

      var handlePopupAnimation = function handlePopupAnimation(instance, popup, innerParams) {
        var container = getContainer(); // If animation is supported, animate

        var animationIsSupported = animationEndEvent && hasCssAnimation(popup);
        var onClose = innerParams.onClose,
            onAfterClose = innerParams.onAfterClose,
            willClose = innerParams.willClose,
            didClose = innerParams.didClose;
        runDidClose(popup, willClose, onClose);

        if (animationIsSupported) {
          animatePopup(instance, popup, container, didClose || onAfterClose);
        } else {
          // Otherwise, remove immediately
          removePopupAndResetState(instance, container, isToast(), didClose || onAfterClose);
        }
      };

      var runDidClose = function runDidClose(popup, willClose, onClose) {
        if (willClose !== null && typeof willClose === 'function') {
          willClose(popup);
        } else if (onClose !== null && typeof onClose === 'function') {
          onClose(popup); // @deprecated
        }
      };

      var animatePopup = function animatePopup(instance, popup, container, didClose) {
        globalState.swalCloseEventFinishedCallback = removePopupAndResetState.bind(null, instance, container, isToast(), didClose);
        popup.addEventListener(animationEndEvent, function (e) {
          if (e.target === popup) {
            globalState.swalCloseEventFinishedCallback();
            delete globalState.swalCloseEventFinishedCallback;
          }
        });
      };

      var triggerDidCloseAndDispose = function triggerDidCloseAndDispose(instance, didClose) {
        setTimeout(function () {
          if (typeof didClose === 'function') {
            didClose();
          }

          instance._destroy();
        });
      };

      function setButtonsDisabled(instance, buttons, disabled) {
        var domCache = privateProps.domCache.get(instance);
        buttons.forEach(function (button) {
          domCache[button].disabled = disabled;
        });
      }

      function setInputDisabled(input, disabled) {
        if (!input) {
          return false;
        }

        if (input.type === 'radio') {
          var radiosContainer = input.parentNode.parentNode;
          var radios = radiosContainer.querySelectorAll('input');

          for (var i = 0; i < radios.length; i++) {
            radios[i].disabled = disabled;
          }
        } else {
          input.disabled = disabled;
        }
      }

      function enableButtons() {
        setButtonsDisabled(this, ['confirmButton', 'denyButton', 'cancelButton'], false);
      }
      function disableButtons() {
        setButtonsDisabled(this, ['confirmButton', 'denyButton', 'cancelButton'], true);
      }
      function enableInput() {
        return setInputDisabled(this.getInput(), false);
      }
      function disableInput() {
        return setInputDisabled(this.getInput(), true);
      }

      function showValidationMessage(error) {
        var domCache = privateProps.domCache.get(this);
        var params = privateProps.innerParams.get(this);
        setInnerHtml(domCache.validationMessage, error);
        domCache.validationMessage.className = swalClasses['validation-message'];

        if (params.customClass && params.customClass.validationMessage) {
          addClass(domCache.validationMessage, params.customClass.validationMessage);
        }

        show(domCache.validationMessage);
        var input = this.getInput();

        if (input) {
          input.setAttribute('aria-invalid', true);
          input.setAttribute('aria-describedBy', swalClasses['validation-message']);
          focusInput(input);
          addClass(input, swalClasses.inputerror);
        }
      } // Hide block with validation message

      function resetValidationMessage$1() {
        var domCache = privateProps.domCache.get(this);

        if (domCache.validationMessage) {
          hide(domCache.validationMessage);
        }

        var input = this.getInput();

        if (input) {
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-describedBy');
          removeClass(input, swalClasses.inputerror);
        }
      }

      function getProgressSteps$1() {
        var domCache = privateProps.domCache.get(this);
        return domCache.progressSteps;
      }

      var Timer = /*#__PURE__*/function () {
        function Timer(callback, delay) {
          _classCallCheck(this, Timer);

          this.callback = callback;
          this.remaining = delay;
          this.running = false;
          this.start();
        }

        _createClass(Timer, [{
          key: "start",
          value: function start() {
            if (!this.running) {
              this.running = true;
              this.started = new Date();
              this.id = setTimeout(this.callback, this.remaining);
            }

            return this.remaining;
          }
        }, {
          key: "stop",
          value: function stop() {
            if (this.running) {
              this.running = false;
              clearTimeout(this.id);
              this.remaining -= new Date() - this.started;
            }

            return this.remaining;
          }
        }, {
          key: "increase",
          value: function increase(n) {
            var running = this.running;

            if (running) {
              this.stop();
            }

            this.remaining += n;

            if (running) {
              this.start();
            }

            return this.remaining;
          }
        }, {
          key: "getTimerLeft",
          value: function getTimerLeft() {
            if (this.running) {
              this.stop();
              this.start();
            }

            return this.remaining;
          }
        }, {
          key: "isRunning",
          value: function isRunning() {
            return this.running;
          }
        }]);

        return Timer;
      }();

      var defaultInputValidators = {
        email: function email(string, validationMessage) {
          return /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,24}$/.test(string) ? Promise.resolve() : Promise.resolve(validationMessage || 'Invalid email address');
        },
        url: function url(string, validationMessage) {
          // taken from https://stackoverflow.com/a/3809435 with a small change from #1306 and #2013
          return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/.test(string) ? Promise.resolve() : Promise.resolve(validationMessage || 'Invalid URL');
        }
      };

      function setDefaultInputValidators(params) {
        // Use default `inputValidator` for supported input types if not provided
        if (!params.inputValidator) {
          Object.keys(defaultInputValidators).forEach(function (key) {
            if (params.input === key) {
              params.inputValidator = defaultInputValidators[key];
            }
          });
        }
      }

      function validateCustomTargetElement(params) {
        // Determine if the custom target element is valid
        if (!params.target || typeof params.target === 'string' && !document.querySelector(params.target) || typeof params.target !== 'string' && !params.target.appendChild) {
          warn('Target parameter is not valid, defaulting to "body"');
          params.target = 'body';
        }
      }
      /**
       * Set type, text and actions on popup
       *
       * @param params
       * @returns {boolean}
       */


      function setParameters(params) {
        setDefaultInputValidators(params); // showLoaderOnConfirm && preConfirm

        if (params.showLoaderOnConfirm && !params.preConfirm) {
          warn('showLoaderOnConfirm is set to true, but preConfirm is not defined.\n' + 'showLoaderOnConfirm should be used together with preConfirm, see usage example:\n' + 'https://sweetalert2.github.io/#ajax-request');
        } // params.animation will be actually used in renderPopup.js
        // but in case when params.animation is a function, we need to call that function
        // before popup (re)initialization, so it'll be possible to check Swal.isVisible()
        // inside the params.animation function


        params.animation = callIfFunction(params.animation);
        validateCustomTargetElement(params); // Replace newlines with <br> in title

        if (typeof params.title === 'string') {
          params.title = params.title.split('\n').join('<br />');
        }

        init(params);
      }

      var SHOW_CLASS_TIMEOUT = 10;
      /**
       * Open popup, add necessary classes and styles, fix scrollbar
       *
       * @param params
       */

      var openPopup = function openPopup(params) {
        var container = getContainer();
        var popup = getPopup();

        if (typeof params.willOpen === 'function') {
          params.willOpen(popup);
        } else if (typeof params.onBeforeOpen === 'function') {
          params.onBeforeOpen(popup); // @deprecated
        }

        var bodyStyles = window.getComputedStyle(document.body);
        var initialBodyOverflow = bodyStyles.overflowY;
        addClasses$1(container, popup, params); // scrolling is 'hidden' until animation is done, after that 'auto'

        setTimeout(function () {
          setScrollingVisibility(container, popup);
        }, SHOW_CLASS_TIMEOUT);

        if (isModal()) {
          fixScrollContainer(container, params.scrollbarPadding, initialBodyOverflow);
          setAriaHidden();
        }

        if (!isToast() && !globalState.previousActiveElement) {
          globalState.previousActiveElement = document.activeElement;
        }

        runDidOpen(popup, params);
        removeClass(container, swalClasses['no-transition']);
      };

      var runDidOpen = function runDidOpen(popup, params) {
        if (typeof params.didOpen === 'function') {
          setTimeout(function () {
            return params.didOpen(popup);
          });
        } else if (typeof params.onOpen === 'function') {
          setTimeout(function () {
            return params.onOpen(popup);
          }); // @deprecated
        }
      };

      var swalOpenAnimationFinished = function swalOpenAnimationFinished(event) {
        var popup = getPopup();

        if (event.target !== popup) {
          return;
        }

        var container = getContainer();
        popup.removeEventListener(animationEndEvent, swalOpenAnimationFinished);
        container.style.overflowY = 'auto';
      };

      var setScrollingVisibility = function setScrollingVisibility(container, popup) {
        if (animationEndEvent && hasCssAnimation(popup)) {
          container.style.overflowY = 'hidden';
          popup.addEventListener(animationEndEvent, swalOpenAnimationFinished);
        } else {
          container.style.overflowY = 'auto';
        }
      };

      var fixScrollContainer = function fixScrollContainer(container, scrollbarPadding, initialBodyOverflow) {
        iOSfix();
        IEfix();

        if (scrollbarPadding && initialBodyOverflow !== 'hidden') {
          fixScrollbar();
        } // sweetalert2/issues/1247


        setTimeout(function () {
          container.scrollTop = 0;
        });
      };

      var addClasses$1 = function addClasses(container, popup, params) {
        addClass(container, params.showClass.backdrop); // the workaround with setting/unsetting opacity is needed for #2019 and 2059

        popup.style.setProperty('opacity', '0', 'important');
        show(popup);
        setTimeout(function () {
          // Animate popup right after showing it
          addClass(popup, params.showClass.popup); // and remove the opacity workaround

          popup.style.removeProperty('opacity');
        }, SHOW_CLASS_TIMEOUT); // 10ms in order to fix #2062

        addClass([document.documentElement, document.body], swalClasses.shown);

        if (params.heightAuto && params.backdrop && !params.toast) {
          addClass([document.documentElement, document.body], swalClasses['height-auto']);
        }
      };

      var handleInputOptionsAndValue = function handleInputOptionsAndValue(instance, params) {
        if (params.input === 'select' || params.input === 'radio') {
          handleInputOptions(instance, params);
        } else if (['text', 'email', 'number', 'tel', 'textarea'].indexOf(params.input) !== -1 && (hasToPromiseFn(params.inputValue) || isPromise(params.inputValue))) {
          handleInputValue(instance, params);
        }
      };
      var getInputValue = function getInputValue(instance, innerParams) {
        var input = instance.getInput();

        if (!input) {
          return null;
        }

        switch (innerParams.input) {
          case 'checkbox':
            return getCheckboxValue(input);

          case 'radio':
            return getRadioValue(input);

          case 'file':
            return getFileValue(input);

          default:
            return innerParams.inputAutoTrim ? input.value.trim() : input.value;
        }
      };

      var getCheckboxValue = function getCheckboxValue(input) {
        return input.checked ? 1 : 0;
      };

      var getRadioValue = function getRadioValue(input) {
        return input.checked ? input.value : null;
      };

      var getFileValue = function getFileValue(input) {
        return input.files.length ? input.getAttribute('multiple') !== null ? input.files : input.files[0] : null;
      };

      var handleInputOptions = function handleInputOptions(instance, params) {
        var content = getContent();

        var processInputOptions = function processInputOptions(inputOptions) {
          return populateInputOptions[params.input](content, formatInputOptions(inputOptions), params);
        };

        if (hasToPromiseFn(params.inputOptions) || isPromise(params.inputOptions)) {
          showLoading();
          asPromise(params.inputOptions).then(function (inputOptions) {
            instance.hideLoading();
            processInputOptions(inputOptions);
          });
        } else if (_typeof(params.inputOptions) === 'object') {
          processInputOptions(params.inputOptions);
        } else {
          error("Unexpected type of inputOptions! Expected object, Map or Promise, got ".concat(_typeof(params.inputOptions)));
        }
      };

      var handleInputValue = function handleInputValue(instance, params) {
        var input = instance.getInput();
        hide(input);
        asPromise(params.inputValue).then(function (inputValue) {
          input.value = params.input === 'number' ? parseFloat(inputValue) || 0 : "".concat(inputValue);
          show(input);
          input.focus();
          instance.hideLoading();
        })["catch"](function (err) {
          error("Error in inputValue promise: ".concat(err));
          input.value = '';
          show(input);
          input.focus();
          instance.hideLoading();
        });
      };

      var populateInputOptions = {
        select: function select(content, inputOptions, params) {
          var select = getChildByClass(content, swalClasses.select);

          var renderOption = function renderOption(parent, optionLabel, optionValue) {
            var option = document.createElement('option');
            option.value = optionValue;
            setInnerHtml(option, optionLabel);

            if (params.inputValue.toString() === optionValue.toString()) {
              option.selected = true;
            }

            parent.appendChild(option);
          };

          inputOptions.forEach(function (inputOption) {
            var optionValue = inputOption[0];
            var optionLabel = inputOption[1]; // <optgroup> spec:
            // https://www.w3.org/TR/html401/interact/forms.html#h-17.6
            // "...all OPTGROUP elements must be specified directly within a SELECT element (i.e., groups may not be nested)..."
            // check whether this is a <optgroup>

            if (Array.isArray(optionLabel)) {
              // if it is an array, then it is an <optgroup>
              var optgroup = document.createElement('optgroup');
              optgroup.label = optionValue;
              optgroup.disabled = false; // not configurable for now

              select.appendChild(optgroup);
              optionLabel.forEach(function (o) {
                return renderOption(optgroup, o[1], o[0]);
              });
            } else {
              // case of <option>
              renderOption(select, optionLabel, optionValue);
            }
          });
          select.focus();
        },
        radio: function radio(content, inputOptions, params) {
          var radio = getChildByClass(content, swalClasses.radio);
          inputOptions.forEach(function (inputOption) {
            var radioValue = inputOption[0];
            var radioLabel = inputOption[1];
            var radioInput = document.createElement('input');
            var radioLabelElement = document.createElement('label');
            radioInput.type = 'radio';
            radioInput.name = swalClasses.radio;
            radioInput.value = radioValue;

            if (params.inputValue.toString() === radioValue.toString()) {
              radioInput.checked = true;
            }

            var label = document.createElement('span');
            setInnerHtml(label, radioLabel);
            label.className = swalClasses.label;
            radioLabelElement.appendChild(radioInput);
            radioLabelElement.appendChild(label);
            radio.appendChild(radioLabelElement);
          });
          var radios = radio.querySelectorAll('input');

          if (radios.length) {
            radios[0].focus();
          }
        }
      };
      /**
       * Converts `inputOptions` into an array of `[value, label]`s
       * @param inputOptions
       */

      var formatInputOptions = function formatInputOptions(inputOptions) {
        var result = [];

        if (typeof Map !== 'undefined' && inputOptions instanceof Map) {
          inputOptions.forEach(function (value, key) {
            var valueFormatted = value;

            if (_typeof(valueFormatted) === 'object') {
              // case of <optgroup>
              valueFormatted = formatInputOptions(valueFormatted);
            }

            result.push([key, valueFormatted]);
          });
        } else {
          Object.keys(inputOptions).forEach(function (key) {
            var valueFormatted = inputOptions[key];

            if (_typeof(valueFormatted) === 'object') {
              // case of <optgroup>
              valueFormatted = formatInputOptions(valueFormatted);
            }

            result.push([key, valueFormatted]);
          });
        }

        return result;
      };

      var handleConfirmButtonClick = function handleConfirmButtonClick(instance, innerParams) {
        instance.disableButtons();

        if (innerParams.input) {
          handleConfirmOrDenyWithInput(instance, innerParams, 'confirm');
        } else {
          confirm(instance, innerParams, true);
        }
      };
      var handleDenyButtonClick = function handleDenyButtonClick(instance, innerParams) {
        instance.disableButtons();

        if (innerParams.returnInputValueOnDeny) {
          handleConfirmOrDenyWithInput(instance, innerParams, 'deny');
        } else {
          deny(instance, innerParams, false);
        }
      };
      var handleCancelButtonClick = function handleCancelButtonClick(instance, dismissWith) {
        instance.disableButtons();
        dismissWith(DismissReason.cancel);
      };

      var handleConfirmOrDenyWithInput = function handleConfirmOrDenyWithInput(instance, innerParams, type
      /* type is either 'confirm' or 'deny' */
      ) {
        var inputValue = getInputValue(instance, innerParams);

        if (innerParams.inputValidator) {
          handleInputValidator(instance, innerParams, inputValue);
        } else if (!instance.getInput().checkValidity()) {
          instance.enableButtons();
          instance.showValidationMessage(innerParams.validationMessage);
        } else if (type === 'deny') {
          deny(instance, innerParams, inputValue);
        } else {
          confirm(instance, innerParams, inputValue);
        }
      };

      var handleInputValidator = function handleInputValidator(instance, innerParams, inputValue) {
        instance.disableInput();
        var validationPromise = Promise.resolve().then(function () {
          return asPromise(innerParams.inputValidator(inputValue, innerParams.validationMessage));
        });
        validationPromise.then(function (validationMessage) {
          instance.enableButtons();
          instance.enableInput();

          if (validationMessage) {
            instance.showValidationMessage(validationMessage);
          } else {
            confirm(instance, innerParams, inputValue);
          }
        });
      };

      var deny = function deny(instance, innerParams, value) {
        if (innerParams.preDeny) {
          var preDenyPromise = Promise.resolve().then(function () {
            return asPromise(innerParams.preDeny(value, innerParams.validationMessage));
          });
          preDenyPromise.then(function (preDenyValue) {
            if (preDenyValue === false) {
              instance.hideLoading();
            } else {
              instance.closePopup({
                isDenied: true,
                value: typeof preDenyValue === 'undefined' ? value : preDenyValue
              });
            }
          });
        } else {
          instance.closePopup({
            isDenied: true,
            value: value
          });
        }
      };

      var succeedWith = function succeedWith(instance, value) {
        instance.closePopup({
          isConfirmed: true,
          value: value
        });
      };

      var confirm = function confirm(instance, innerParams, value) {
        if (innerParams.showLoaderOnConfirm) {
          showLoading(); // TODO: make showLoading an *instance* method
        }

        if (innerParams.preConfirm) {
          instance.resetValidationMessage();
          var preConfirmPromise = Promise.resolve().then(function () {
            return asPromise(innerParams.preConfirm(value, innerParams.validationMessage));
          });
          preConfirmPromise.then(function (preConfirmValue) {
            if (isVisible(getValidationMessage()) || preConfirmValue === false) {
              instance.hideLoading();
            } else {
              succeedWith(instance, typeof preConfirmValue === 'undefined' ? value : preConfirmValue);
            }
          });
        } else {
          succeedWith(instance, value);
        }
      };

      var addKeydownHandler = function addKeydownHandler(instance, globalState, innerParams, dismissWith) {
        if (globalState.keydownTarget && globalState.keydownHandlerAdded) {
          globalState.keydownTarget.removeEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = false;
        }

        if (!innerParams.toast) {
          globalState.keydownHandler = function (e) {
            return keydownHandler(instance, e, dismissWith);
          };

          globalState.keydownTarget = innerParams.keydownListenerCapture ? window : getPopup();
          globalState.keydownListenerCapture = innerParams.keydownListenerCapture;
          globalState.keydownTarget.addEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = true;
        }
      }; // Focus handling

      var setFocus = function setFocus(innerParams, index, increment) {
        var focusableElements = getFocusableElements(); // search for visible elements and select the next possible match

        for (var i = 0; i < focusableElements.length; i++) {
          index = index + increment; // rollover to first item

          if (index === focusableElements.length) {
            index = 0; // go to last item
          } else if (index === -1) {
            index = focusableElements.length - 1;
          }

          return focusableElements[index].focus();
        } // no visible focusable elements, focus the popup


        getPopup().focus();
      };
      var arrowKeysNextButton = ['ArrowRight', 'ArrowDown', 'Right', 'Down' // IE11
      ];
      var arrowKeysPreviousButton = ['ArrowLeft', 'ArrowUp', 'Left', 'Up' // IE11
      ];
      var escKeys = ['Escape', 'Esc' // IE11
      ];

      var keydownHandler = function keydownHandler(instance, e, dismissWith) {
        var innerParams = privateProps.innerParams.get(instance);

        if (innerParams.stopKeydownPropagation) {
          e.stopPropagation();
        } // ENTER


        if (e.key === 'Enter') {
          handleEnter(instance, e, innerParams); // TAB
        } else if (e.key === 'Tab') {
          handleTab(e, innerParams); // ARROWS - switch focus between buttons
        } else if ([].concat(arrowKeysNextButton, arrowKeysPreviousButton).indexOf(e.key) !== -1) {
          handleArrows(e.key); // ESC
        } else if (escKeys.indexOf(e.key) !== -1) {
          handleEsc(e, innerParams, dismissWith);
        }
      };

      var handleEnter = function handleEnter(instance, e, innerParams) {
        // #720 #721
        if (e.isComposing) {
          return;
        }

        if (e.target && instance.getInput() && e.target.outerHTML === instance.getInput().outerHTML) {
          if (['textarea', 'file'].indexOf(innerParams.input) !== -1) {
            return; // do not submit
          }

          clickConfirm();
          e.preventDefault();
        }
      };

      var handleTab = function handleTab(e, innerParams) {
        var targetElement = e.target;
        var focusableElements = getFocusableElements();
        var btnIndex = -1;

        for (var i = 0; i < focusableElements.length; i++) {
          if (targetElement === focusableElements[i]) {
            btnIndex = i;
            break;
          }
        }

        if (!e.shiftKey) {
          // Cycle to the next button
          setFocus(innerParams, btnIndex, 1);
        } else {
          // Cycle to the prev button
          setFocus(innerParams, btnIndex, -1);
        }

        e.stopPropagation();
        e.preventDefault();
      };

      var handleArrows = function handleArrows(key) {
        var confirmButton = getConfirmButton();
        var denyButton = getDenyButton();
        var cancelButton = getCancelButton();

        if (!([confirmButton, denyButton, cancelButton].indexOf(document.activeElement) !== -1)) {
          return;
        }

        var sibling = arrowKeysNextButton.indexOf(key) !== -1 ? 'nextElementSibling' : 'previousElementSibling';
        var buttonToFocus = document.activeElement[sibling];

        if (buttonToFocus) {
          buttonToFocus.focus();
        }
      };

      var handleEsc = function handleEsc(e, innerParams, dismissWith) {
        if (callIfFunction(innerParams.allowEscapeKey)) {
          e.preventDefault();
          dismissWith(DismissReason.esc);
        }
      };

      var handlePopupClick = function handlePopupClick(instance, domCache, dismissWith) {
        var innerParams = privateProps.innerParams.get(instance);

        if (innerParams.toast) {
          handleToastClick(instance, domCache, dismissWith);
        } else {
          // Ignore click events that had mousedown on the popup but mouseup on the container
          // This can happen when the user drags a slider
          handleModalMousedown(domCache); // Ignore click events that had mousedown on the container but mouseup on the popup

          handleContainerMousedown(domCache);
          handleModalClick(instance, domCache, dismissWith);
        }
      };

      var handleToastClick = function handleToastClick(instance, domCache, dismissWith) {
        // Closing toast by internal click
        domCache.popup.onclick = function () {
          var innerParams = privateProps.innerParams.get(instance);

          if (innerParams.showConfirmButton || innerParams.showDenyButton || innerParams.showCancelButton || innerParams.showCloseButton || innerParams.input) {
            return;
          }

          dismissWith(DismissReason.close);
        };
      };

      var ignoreOutsideClick = false;

      var handleModalMousedown = function handleModalMousedown(domCache) {
        domCache.popup.onmousedown = function () {
          domCache.container.onmouseup = function (e) {
            domCache.container.onmouseup = undefined; // We only check if the mouseup target is the container because usually it doesn't
            // have any other direct children aside of the popup

            if (e.target === domCache.container) {
              ignoreOutsideClick = true;
            }
          };
        };
      };

      var handleContainerMousedown = function handleContainerMousedown(domCache) {
        domCache.container.onmousedown = function () {
          domCache.popup.onmouseup = function (e) {
            domCache.popup.onmouseup = undefined; // We also need to check if the mouseup target is a child of the popup

            if (e.target === domCache.popup || domCache.popup.contains(e.target)) {
              ignoreOutsideClick = true;
            }
          };
        };
      };

      var handleModalClick = function handleModalClick(instance, domCache, dismissWith) {
        domCache.container.onclick = function (e) {
          var innerParams = privateProps.innerParams.get(instance);

          if (ignoreOutsideClick) {
            ignoreOutsideClick = false;
            return;
          }

          if (e.target === domCache.container && callIfFunction(innerParams.allowOutsideClick)) {
            dismissWith(DismissReason.backdrop);
          }
        };
      };

      function _main(userParams) {
        showWarningsForParams(userParams);

        if (globalState.currentInstance) {
          globalState.currentInstance._destroy();
        }

        globalState.currentInstance = this;
        var innerParams = prepareParams(userParams);
        setParameters(innerParams);
        Object.freeze(innerParams); // clear the previous timer

        if (globalState.timeout) {
          globalState.timeout.stop();
          delete globalState.timeout;
        } // clear the restore focus timeout


        clearTimeout(globalState.restoreFocusTimeout);
        var domCache = populateDomCache(this);
        render(this, innerParams);
        privateProps.innerParams.set(this, innerParams);
        return swalPromise(this, domCache, innerParams);
      }

      var prepareParams = function prepareParams(userParams) {
        var showClass = _extends({}, defaultParams.showClass, userParams.showClass);

        var hideClass = _extends({}, defaultParams.hideClass, userParams.hideClass);

        var params = _extends({}, defaultParams, userParams);

        params.showClass = showClass;
        params.hideClass = hideClass; // @deprecated

        if (userParams.animation === false) {
          params.showClass = {
            popup: 'swal2-noanimation',
            backdrop: 'swal2-noanimation'
          };
          params.hideClass = {};
        }

        return params;
      };

      var swalPromise = function swalPromise(instance, domCache, innerParams) {
        return new Promise(function (resolve) {
          // functions to handle all closings/dismissals
          var dismissWith = function dismissWith(dismiss) {
            instance.closePopup({
              isDismissed: true,
              dismiss: dismiss
            });
          };

          privateMethods.swalPromiseResolve.set(instance, resolve);

          domCache.confirmButton.onclick = function () {
            return handleConfirmButtonClick(instance, innerParams);
          };

          domCache.denyButton.onclick = function () {
            return handleDenyButtonClick(instance, innerParams);
          };

          domCache.cancelButton.onclick = function () {
            return handleCancelButtonClick(instance, dismissWith);
          };

          domCache.closeButton.onclick = function () {
            return dismissWith(DismissReason.close);
          };

          handlePopupClick(instance, domCache, dismissWith);
          addKeydownHandler(instance, globalState, innerParams, dismissWith);

          if (innerParams.toast && (innerParams.input || innerParams.footer || innerParams.showCloseButton)) {
            addClass(document.body, swalClasses['toast-column']);
          } else {
            removeClass(document.body, swalClasses['toast-column']);
          }

          handleInputOptionsAndValue(instance, innerParams);
          openPopup(innerParams);
          setupTimer(globalState, innerParams, dismissWith);
          initFocus(domCache, innerParams); // Scroll container to top on open (#1247, #1946)

          setTimeout(function () {
            domCache.container.scrollTop = 0;
          });
        });
      };

      var populateDomCache = function populateDomCache(instance) {
        var domCache = {
          popup: getPopup(),
          container: getContainer(),
          content: getContent(),
          actions: getActions(),
          confirmButton: getConfirmButton(),
          denyButton: getDenyButton(),
          cancelButton: getCancelButton(),
          loader: getLoader(),
          closeButton: getCloseButton(),
          validationMessage: getValidationMessage(),
          progressSteps: getProgressSteps()
        };
        privateProps.domCache.set(instance, domCache);
        return domCache;
      };

      var setupTimer = function setupTimer(globalState$$1, innerParams, dismissWith) {
        var timerProgressBar = getTimerProgressBar();
        hide(timerProgressBar);

        if (innerParams.timer) {
          globalState$$1.timeout = new Timer(function () {
            dismissWith('timer');
            delete globalState$$1.timeout;
          }, innerParams.timer);

          if (innerParams.timerProgressBar) {
            show(timerProgressBar);
            setTimeout(function () {
              if (globalState$$1.timeout.running) {
                // timer can be already stopped at this point
                animateTimerProgressBar(innerParams.timer);
              }
            });
          }
        }
      };

      var initFocus = function initFocus(domCache, innerParams) {
        if (innerParams.toast) {
          return;
        }

        if (!callIfFunction(innerParams.allowEnterKey)) {
          return blurActiveElement();
        }

        if (!focusButton(domCache, innerParams)) {
          setFocus(innerParams, -1, 1);
        }
      };

      var focusButton = function focusButton(domCache, innerParams) {
        if (innerParams.focusDeny && isVisible(domCache.denyButton)) {
          domCache.denyButton.focus();
          return true;
        }

        if (innerParams.focusCancel && isVisible(domCache.cancelButton)) {
          domCache.cancelButton.focus();
          return true;
        }

        if (innerParams.focusConfirm && isVisible(domCache.confirmButton)) {
          domCache.confirmButton.focus();
          return true;
        }

        return false;
      };

      var blurActiveElement = function blurActiveElement() {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
      };

      /**
       * Updates popup parameters.
       */

      function update(params) {
        var popup = getPopup();
        var innerParams = privateProps.innerParams.get(this);

        if (!popup || hasClass(popup, innerParams.hideClass.popup)) {
          return warn("You're trying to update the closed or closing popup, that won't work. Use the update() method in preConfirm parameter or show a new popup.");
        }

        var validUpdatableParams = {}; // assign valid params from `params` to `defaults`

        Object.keys(params).forEach(function (param) {
          if (Swal.isUpdatableParameter(param)) {
            validUpdatableParams[param] = params[param];
          } else {
            warn("Invalid parameter to update: \"".concat(param, "\". Updatable params are listed here: https://github.com/sweetalert2/sweetalert2/blob/master/src/utils/params.js\n\nIf you think this parameter should be updatable, request it here: https://github.com/sweetalert2/sweetalert2/issues/new?template=02_feature_request.md"));
          }
        });

        var updatedParams = _extends({}, innerParams, validUpdatableParams);

        render(this, updatedParams);
        privateProps.innerParams.set(this, updatedParams);
        Object.defineProperties(this, {
          params: {
            value: _extends({}, this.params, params),
            writable: false,
            enumerable: true
          }
        });
      }

      function _destroy() {
        var domCache = privateProps.domCache.get(this);
        var innerParams = privateProps.innerParams.get(this);

        if (!innerParams) {
          return; // This instance has already been destroyed
        } // Check if there is another Swal closing


        if (domCache.popup && globalState.swalCloseEventFinishedCallback) {
          globalState.swalCloseEventFinishedCallback();
          delete globalState.swalCloseEventFinishedCallback;
        } // Check if there is a swal disposal defer timer


        if (globalState.deferDisposalTimer) {
          clearTimeout(globalState.deferDisposalTimer);
          delete globalState.deferDisposalTimer;
        }

        runDidDestroy(innerParams);
        disposeSwal(this);
      }

      var runDidDestroy = function runDidDestroy(innerParams) {
        if (typeof innerParams.didDestroy === 'function') {
          innerParams.didDestroy();
        } else if (typeof innerParams.onDestroy === 'function') {
          innerParams.onDestroy(); // @deprecated
        }
      };

      var disposeSwal = function disposeSwal(instance) {
        // Unset this.params so GC will dispose it (#1569)
        delete instance.params; // Unset globalState props so GC will dispose globalState (#1569)

        delete globalState.keydownHandler;
        delete globalState.keydownTarget; // Unset WeakMaps so GC will be able to dispose them (#1569)

        unsetWeakMaps(privateProps);
        unsetWeakMaps(privateMethods);
      };

      var unsetWeakMaps = function unsetWeakMaps(obj) {
        for (var i in obj) {
          obj[i] = new WeakMap();
        }
      };



      var instanceMethods = /*#__PURE__*/Object.freeze({
        hideLoading: hideLoading,
        disableLoading: hideLoading,
        getInput: getInput$1,
        close: close,
        closePopup: close,
        closeModal: close,
        closeToast: close,
        enableButtons: enableButtons,
        disableButtons: disableButtons,
        enableInput: enableInput,
        disableInput: disableInput,
        showValidationMessage: showValidationMessage,
        resetValidationMessage: resetValidationMessage$1,
        getProgressSteps: getProgressSteps$1,
        _main: _main,
        update: update,
        _destroy: _destroy
      });

      var currentInstance;

      var SweetAlert = /*#__PURE__*/function () {
        function SweetAlert() {
          _classCallCheck(this, SweetAlert);

          // Prevent run in Node env
          if (typeof window === 'undefined') {
            return;
          } // Check for the existence of Promise


          if (typeof Promise === 'undefined') {
            error('This package requires a Promise library, please include a shim to enable it in this browser (See: https://github.com/sweetalert2/sweetalert2/wiki/Migration-from-SweetAlert-to-SweetAlert2#1-ie-support)');
          }

          currentInstance = this;

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var outerParams = Object.freeze(this.constructor.argsToParams(args));
          Object.defineProperties(this, {
            params: {
              value: outerParams,
              writable: false,
              enumerable: true,
              configurable: true
            }
          });

          var promise = this._main(this.params);

          privateProps.promise.set(this, promise);
        } // `catch` cannot be the name of a module export, so we define our thenable methods here instead


        _createClass(SweetAlert, [{
          key: "then",
          value: function then(onFulfilled) {
            var promise = privateProps.promise.get(this);
            return promise.then(onFulfilled);
          }
        }, {
          key: "finally",
          value: function _finally(onFinally) {
            var promise = privateProps.promise.get(this);
            return promise["finally"](onFinally);
          }
        }]);

        return SweetAlert;
      }(); // Assign instance methods from src/instanceMethods/*.js to prototype


      _extends(SweetAlert.prototype, instanceMethods); // Assign static methods from src/staticMethods/*.js to constructor


      _extends(SweetAlert, staticMethods); // Proxy to instance methods to constructor, for now, for backwards compatibility


      Object.keys(instanceMethods).forEach(function (key) {
        SweetAlert[key] = function () {
          if (currentInstance) {
            var _currentInstance;

            return (_currentInstance = currentInstance)[key].apply(_currentInstance, arguments);
          }
        };
      });
      SweetAlert.DismissReason = DismissReason;
      SweetAlert.version = '10.8.1';

      var Swal = SweetAlert;
      Swal["default"] = Swal;

      return Swal;

    }));
    if (typeof commonjsGlobal !== 'undefined' && commonjsGlobal.Sweetalert2){  commonjsGlobal.swal = commonjsGlobal.sweetAlert = commonjsGlobal.Swal = commonjsGlobal.SweetAlert = commonjsGlobal.Sweetalert2;}

    "undefined"!=typeof document&&function(e,t){var n=e.createElement("style");if(e.getElementsByTagName("head")[0].appendChild(n),n.styleSheet)n.styleSheet.disabled||(n.styleSheet.cssText=t);else try{n.innerHTML=t;}catch(e){n.innerText=t;}}(document,".swal2-popup.swal2-toast{flex-direction:row;align-items:center;width:auto;padding:.625em;overflow-y:hidden;background:#fff;box-shadow:0 0 .625em #d9d9d9}.swal2-popup.swal2-toast .swal2-header{flex-direction:row;padding:0}.swal2-popup.swal2-toast .swal2-title{flex-grow:1;justify-content:flex-start;margin:0 .6em;font-size:1em}.swal2-popup.swal2-toast .swal2-footer{margin:.5em 0 0;padding:.5em 0 0;font-size:.8em}.swal2-popup.swal2-toast .swal2-close{position:static;width:.8em;height:.8em;line-height:.8}.swal2-popup.swal2-toast .swal2-content{justify-content:flex-start;padding:0;font-size:1em}.swal2-popup.swal2-toast .swal2-icon{width:2em;min-width:2em;height:2em;margin:0}.swal2-popup.swal2-toast .swal2-icon .swal2-icon-content{display:flex;align-items:center;font-size:1.8em;font-weight:700}@media all and (-ms-high-contrast:none),(-ms-high-contrast:active){.swal2-popup.swal2-toast .swal2-icon .swal2-icon-content{font-size:.25em}}.swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line]{top:.875em;width:1.375em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left]{left:.3125em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right]{right:.3125em}.swal2-popup.swal2-toast .swal2-actions{flex-basis:auto!important;width:auto;height:auto;margin:0 .3125em;padding:0}.swal2-popup.swal2-toast .swal2-styled{margin:0 .3125em;padding:.3125em .625em;font-size:1em}.swal2-popup.swal2-toast .swal2-styled:focus{box-shadow:0 0 0 1px #fff,0 0 0 3px rgba(50,100,150,.4)}.swal2-popup.swal2-toast .swal2-success{border-color:#a5dc86}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line]{position:absolute;width:1.6em;height:3em;transform:rotate(45deg);border-radius:50%}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=left]{top:-.8em;left:-.5em;transform:rotate(-45deg);transform-origin:2em 2em;border-radius:4em 0 0 4em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=right]{top:-.25em;left:.9375em;transform-origin:0 1.5em;border-radius:0 4em 4em 0}.swal2-popup.swal2-toast .swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-popup.swal2-toast .swal2-success .swal2-success-fix{top:0;left:.4375em;width:.4375em;height:2.6875em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line]{height:.3125em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line][class$=tip]{top:1.125em;left:.1875em;width:.75em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line][class$=long]{top:.9375em;right:.1875em;width:1.375em}.swal2-popup.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-tip{-webkit-animation:swal2-toast-animate-success-line-tip .75s;animation:swal2-toast-animate-success-line-tip .75s}.swal2-popup.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-long{-webkit-animation:swal2-toast-animate-success-line-long .75s;animation:swal2-toast-animate-success-line-long .75s}.swal2-popup.swal2-toast.swal2-show{-webkit-animation:swal2-toast-show .5s;animation:swal2-toast-show .5s}.swal2-popup.swal2-toast.swal2-hide{-webkit-animation:swal2-toast-hide .1s forwards;animation:swal2-toast-hide .1s forwards}.swal2-container{display:flex;position:fixed;z-index:1060;top:0;right:0;bottom:0;left:0;flex-direction:row;align-items:center;justify-content:center;padding:.625em;overflow-x:hidden;transition:background-color .1s;-webkit-overflow-scrolling:touch}.swal2-container.swal2-backdrop-show,.swal2-container.swal2-noanimation{background:rgba(0,0,0,.4)}.swal2-container.swal2-backdrop-hide{background:0 0!important}.swal2-container.swal2-top{align-items:flex-start}.swal2-container.swal2-top-left,.swal2-container.swal2-top-start{align-items:flex-start;justify-content:flex-start}.swal2-container.swal2-top-end,.swal2-container.swal2-top-right{align-items:flex-start;justify-content:flex-end}.swal2-container.swal2-center{align-items:center}.swal2-container.swal2-center-left,.swal2-container.swal2-center-start{align-items:center;justify-content:flex-start}.swal2-container.swal2-center-end,.swal2-container.swal2-center-right{align-items:center;justify-content:flex-end}.swal2-container.swal2-bottom{align-items:flex-end}.swal2-container.swal2-bottom-left,.swal2-container.swal2-bottom-start{align-items:flex-end;justify-content:flex-start}.swal2-container.swal2-bottom-end,.swal2-container.swal2-bottom-right{align-items:flex-end;justify-content:flex-end}.swal2-container.swal2-bottom-end>:first-child,.swal2-container.swal2-bottom-left>:first-child,.swal2-container.swal2-bottom-right>:first-child,.swal2-container.swal2-bottom-start>:first-child,.swal2-container.swal2-bottom>:first-child{margin-top:auto}.swal2-container.swal2-grow-fullscreen>.swal2-modal{display:flex!important;flex:1;align-self:stretch;justify-content:center}.swal2-container.swal2-grow-row>.swal2-modal{display:flex!important;flex:1;align-content:center;justify-content:center}.swal2-container.swal2-grow-column{flex:1;flex-direction:column}.swal2-container.swal2-grow-column.swal2-bottom,.swal2-container.swal2-grow-column.swal2-center,.swal2-container.swal2-grow-column.swal2-top{align-items:center}.swal2-container.swal2-grow-column.swal2-bottom-left,.swal2-container.swal2-grow-column.swal2-bottom-start,.swal2-container.swal2-grow-column.swal2-center-left,.swal2-container.swal2-grow-column.swal2-center-start,.swal2-container.swal2-grow-column.swal2-top-left,.swal2-container.swal2-grow-column.swal2-top-start{align-items:flex-start}.swal2-container.swal2-grow-column.swal2-bottom-end,.swal2-container.swal2-grow-column.swal2-bottom-right,.swal2-container.swal2-grow-column.swal2-center-end,.swal2-container.swal2-grow-column.swal2-center-right,.swal2-container.swal2-grow-column.swal2-top-end,.swal2-container.swal2-grow-column.swal2-top-right{align-items:flex-end}.swal2-container.swal2-grow-column>.swal2-modal{display:flex!important;flex:1;align-content:center;justify-content:center}.swal2-container.swal2-no-transition{transition:none!important}.swal2-container:not(.swal2-top):not(.swal2-top-start):not(.swal2-top-end):not(.swal2-top-left):not(.swal2-top-right):not(.swal2-center-start):not(.swal2-center-end):not(.swal2-center-left):not(.swal2-center-right):not(.swal2-bottom):not(.swal2-bottom-start):not(.swal2-bottom-end):not(.swal2-bottom-left):not(.swal2-bottom-right):not(.swal2-grow-fullscreen)>.swal2-modal{margin:auto}@media all and (-ms-high-contrast:none),(-ms-high-contrast:active){.swal2-container .swal2-modal{margin:0!important}}.swal2-popup{display:none;position:relative;box-sizing:border-box;flex-direction:column;justify-content:center;width:32em;max-width:100%;padding:1.25em;border:none;border-radius:.3125em;background:#fff;font-family:inherit;font-size:1rem}.swal2-popup:focus{outline:0}.swal2-popup.swal2-loading{overflow-y:hidden}.swal2-header{display:flex;flex-direction:column;align-items:center;padding:0 1.8em}.swal2-title{position:relative;max-width:100%;margin:0 0 .4em;padding:0;color:#595959;font-size:1.875em;font-weight:600;text-align:center;text-transform:none;word-wrap:break-word}.swal2-actions{display:flex;z-index:1;box-sizing:border-box;flex-wrap:wrap;align-items:center;justify-content:center;width:100%;margin:1.25em auto 0;padding:0 1.6em}.swal2-actions:not(.swal2-loading) .swal2-styled[disabled]{opacity:.4}.swal2-actions:not(.swal2-loading) .swal2-styled:hover{background-image:linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.1))}.swal2-actions:not(.swal2-loading) .swal2-styled:active{background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))}.swal2-loader{display:none;align-items:center;justify-content:center;width:2.2em;height:2.2em;margin:0 1.875em;-webkit-animation:swal2-rotate-loading 1.5s linear 0s infinite normal;animation:swal2-rotate-loading 1.5s linear 0s infinite normal;border-width:.25em;border-style:solid;border-radius:100%;border-color:#2778c4 transparent #2778c4 transparent}.swal2-styled{margin:.3125em;padding:.625em 2em;box-shadow:none;font-weight:500}.swal2-styled:not([disabled]){cursor:pointer}.swal2-styled.swal2-confirm{border:0;border-radius:.25em;background:initial;background-color:#2778c4;color:#fff;font-size:1.0625em}.swal2-styled.swal2-deny{border:0;border-radius:.25em;background:initial;background-color:#d14529;color:#fff;font-size:1.0625em}.swal2-styled.swal2-cancel{border:0;border-radius:.25em;background:initial;background-color:#757575;color:#fff;font-size:1.0625em}.swal2-styled:focus{outline:0;box-shadow:0 0 0 1px #fff,0 0 0 3px rgba(50,100,150,.4)}.swal2-styled::-moz-focus-inner{border:0}.swal2-footer{justify-content:center;margin:1.25em 0 0;padding:1em 0 0;border-top:1px solid #eee;color:#545454;font-size:1em}.swal2-timer-progress-bar-container{position:absolute;right:0;bottom:0;left:0;height:.25em;overflow:hidden;border-bottom-right-radius:.3125em;border-bottom-left-radius:.3125em}.swal2-timer-progress-bar{width:100%;height:.25em;background:rgba(0,0,0,.2)}.swal2-image{max-width:100%;margin:1.25em auto}.swal2-close{position:absolute;z-index:2;top:0;right:0;align-items:center;justify-content:center;width:1.2em;height:1.2em;padding:0;overflow:hidden;transition:color .1s ease-out;border:none;border-radius:0;background:0 0;color:#ccc;font-family:serif;font-size:2.5em;line-height:1.2;cursor:pointer}.swal2-close:hover{transform:none;background:0 0;color:#f27474}.swal2-close::-moz-focus-inner{border:0}.swal2-content{z-index:1;justify-content:center;margin:0;padding:0 1.6em;color:#545454;font-size:1.125em;font-weight:400;line-height:normal;text-align:center;word-wrap:break-word}.swal2-checkbox,.swal2-file,.swal2-input,.swal2-radio,.swal2-select,.swal2-textarea{margin:1em auto}.swal2-file,.swal2-input,.swal2-textarea{box-sizing:border-box;width:100%;transition:border-color .3s,box-shadow .3s;border:1px solid #d9d9d9;border-radius:.1875em;background:inherit;box-shadow:inset 0 1px 1px rgba(0,0,0,.06);color:inherit;font-size:1.125em}.swal2-file.swal2-inputerror,.swal2-input.swal2-inputerror,.swal2-textarea.swal2-inputerror{border-color:#f27474!important;box-shadow:0 0 2px #f27474!important}.swal2-file:focus,.swal2-input:focus,.swal2-textarea:focus{border:1px solid #b4dbed;outline:0;box-shadow:0 0 3px #c4e6f5}.swal2-file::-moz-placeholder,.swal2-input::-moz-placeholder,.swal2-textarea::-moz-placeholder{color:#ccc}.swal2-file:-ms-input-placeholder,.swal2-input:-ms-input-placeholder,.swal2-textarea:-ms-input-placeholder{color:#ccc}.swal2-file::placeholder,.swal2-input::placeholder,.swal2-textarea::placeholder{color:#ccc}.swal2-range{margin:1em auto;background:#fff}.swal2-range input{width:80%}.swal2-range output{width:20%;color:inherit;font-weight:600;text-align:center}.swal2-range input,.swal2-range output{height:2.625em;padding:0;font-size:1.125em;line-height:2.625em}.swal2-input{height:2.625em;padding:0 .75em}.swal2-input[type=number]{max-width:10em}.swal2-file{background:inherit;font-size:1.125em}.swal2-textarea{height:6.75em;padding:.75em}.swal2-select{min-width:50%;max-width:100%;padding:.375em .625em;background:inherit;color:inherit;font-size:1.125em}.swal2-checkbox,.swal2-radio{align-items:center;justify-content:center;background:#fff;color:inherit}.swal2-checkbox label,.swal2-radio label{margin:0 .6em;font-size:1.125em}.swal2-checkbox input,.swal2-radio input{margin:0 .4em}.swal2-input-label{display:flex;justify-content:center;margin:1em auto}.swal2-validation-message{display:none;align-items:center;justify-content:center;margin:0 -2.7em;padding:.625em;overflow:hidden;background:#f0f0f0;color:#666;font-size:1em;font-weight:300}.swal2-validation-message::before{content:\"!\";display:inline-block;width:1.5em;min-width:1.5em;height:1.5em;margin:0 .625em;border-radius:50%;background-color:#f27474;color:#fff;font-weight:600;line-height:1.5em;text-align:center}.swal2-icon{position:relative;box-sizing:content-box;justify-content:center;width:5em;height:5em;margin:1.25em auto 1.875em;border:.25em solid transparent;border-radius:50%;font-family:inherit;line-height:5em;cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.swal2-icon .swal2-icon-content{display:flex;align-items:center;font-size:3.75em}.swal2-icon.swal2-error{border-color:#f27474;color:#f27474}.swal2-icon.swal2-error .swal2-x-mark{position:relative;flex-grow:1}.swal2-icon.swal2-error [class^=swal2-x-mark-line]{display:block;position:absolute;top:2.3125em;width:2.9375em;height:.3125em;border-radius:.125em;background-color:#f27474}.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left]{left:1.0625em;transform:rotate(45deg)}.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right]{right:1em;transform:rotate(-45deg)}.swal2-icon.swal2-error.swal2-icon-show{-webkit-animation:swal2-animate-error-icon .5s;animation:swal2-animate-error-icon .5s}.swal2-icon.swal2-error.swal2-icon-show .swal2-x-mark{-webkit-animation:swal2-animate-error-x-mark .5s;animation:swal2-animate-error-x-mark .5s}.swal2-icon.swal2-warning{border-color:#facea8;color:#f8bb86}.swal2-icon.swal2-info{border-color:#9de0f6;color:#3fc3ee}.swal2-icon.swal2-question{border-color:#c9dae1;color:#87adbd}.swal2-icon.swal2-success{border-color:#a5dc86;color:#a5dc86}.swal2-icon.swal2-success [class^=swal2-success-circular-line]{position:absolute;width:3.75em;height:7.5em;transform:rotate(45deg);border-radius:50%}.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=left]{top:-.4375em;left:-2.0635em;transform:rotate(-45deg);transform-origin:3.75em 3.75em;border-radius:7.5em 0 0 7.5em}.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=right]{top:-.6875em;left:1.875em;transform:rotate(-45deg);transform-origin:0 3.75em;border-radius:0 7.5em 7.5em 0}.swal2-icon.swal2-success .swal2-success-ring{position:absolute;z-index:2;top:-.25em;left:-.25em;box-sizing:content-box;width:100%;height:100%;border:.25em solid rgba(165,220,134,.3);border-radius:50%}.swal2-icon.swal2-success .swal2-success-fix{position:absolute;z-index:1;top:.5em;left:1.625em;width:.4375em;height:5.625em;transform:rotate(-45deg)}.swal2-icon.swal2-success [class^=swal2-success-line]{display:block;position:absolute;z-index:2;height:.3125em;border-radius:.125em;background-color:#a5dc86}.swal2-icon.swal2-success [class^=swal2-success-line][class$=tip]{top:2.875em;left:.8125em;width:1.5625em;transform:rotate(45deg)}.swal2-icon.swal2-success [class^=swal2-success-line][class$=long]{top:2.375em;right:.5em;width:2.9375em;transform:rotate(-45deg)}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-tip{-webkit-animation:swal2-animate-success-line-tip .75s;animation:swal2-animate-success-line-tip .75s}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-long{-webkit-animation:swal2-animate-success-line-long .75s;animation:swal2-animate-success-line-long .75s}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-circular-line-right{-webkit-animation:swal2-rotate-success-circular-line 4.25s ease-in;animation:swal2-rotate-success-circular-line 4.25s ease-in}.swal2-progress-steps{flex-wrap:wrap;align-items:center;max-width:100%;margin:0 0 1.25em;padding:0;background:inherit;font-weight:600}.swal2-progress-steps li{display:inline-block;position:relative}.swal2-progress-steps .swal2-progress-step{z-index:20;flex-shrink:0;width:2em;height:2em;border-radius:2em;background:#2778c4;color:#fff;line-height:2em;text-align:center}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step{background:#2778c4}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step{background:#add8e6;color:#fff}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step-line{background:#add8e6}.swal2-progress-steps .swal2-progress-step-line{z-index:10;flex-shrink:0;width:2.5em;height:.4em;margin:0 -1px;background:#2778c4}[class^=swal2]{-webkit-tap-highlight-color:transparent}.swal2-show{-webkit-animation:swal2-show .3s;animation:swal2-show .3s}.swal2-hide{-webkit-animation:swal2-hide .15s forwards;animation:swal2-hide .15s forwards}.swal2-noanimation{transition:none}.swal2-scrollbar-measure{position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll}.swal2-rtl .swal2-close{right:auto;left:0}.swal2-rtl .swal2-timer-progress-bar{right:0;left:auto}@supports (-ms-accelerator:true){.swal2-range input{width:100%!important}.swal2-range output{display:none}}@media all and (-ms-high-contrast:none),(-ms-high-contrast:active){.swal2-range input{width:100%!important}.swal2-range output{display:none}}@-moz-document url-prefix(){.swal2-close:focus{outline:2px solid rgba(50,100,150,.4)}}@-webkit-keyframes swal2-toast-show{0%{transform:translateY(-.625em) rotateZ(2deg)}33%{transform:translateY(0) rotateZ(-2deg)}66%{transform:translateY(.3125em) rotateZ(2deg)}100%{transform:translateY(0) rotateZ(0)}}@keyframes swal2-toast-show{0%{transform:translateY(-.625em) rotateZ(2deg)}33%{transform:translateY(0) rotateZ(-2deg)}66%{transform:translateY(.3125em) rotateZ(2deg)}100%{transform:translateY(0) rotateZ(0)}}@-webkit-keyframes swal2-toast-hide{100%{transform:rotateZ(1deg);opacity:0}}@keyframes swal2-toast-hide{100%{transform:rotateZ(1deg);opacity:0}}@-webkit-keyframes swal2-toast-animate-success-line-tip{0%{top:.5625em;left:.0625em;width:0}54%{top:.125em;left:.125em;width:0}70%{top:.625em;left:-.25em;width:1.625em}84%{top:1.0625em;left:.75em;width:.5em}100%{top:1.125em;left:.1875em;width:.75em}}@keyframes swal2-toast-animate-success-line-tip{0%{top:.5625em;left:.0625em;width:0}54%{top:.125em;left:.125em;width:0}70%{top:.625em;left:-.25em;width:1.625em}84%{top:1.0625em;left:.75em;width:.5em}100%{top:1.125em;left:.1875em;width:.75em}}@-webkit-keyframes swal2-toast-animate-success-line-long{0%{top:1.625em;right:1.375em;width:0}65%{top:1.25em;right:.9375em;width:0}84%{top:.9375em;right:0;width:1.125em}100%{top:.9375em;right:.1875em;width:1.375em}}@keyframes swal2-toast-animate-success-line-long{0%{top:1.625em;right:1.375em;width:0}65%{top:1.25em;right:.9375em;width:0}84%{top:.9375em;right:0;width:1.125em}100%{top:.9375em;right:.1875em;width:1.375em}}@-webkit-keyframes swal2-show{0%{transform:scale(.7)}45%{transform:scale(1.05)}80%{transform:scale(.95)}100%{transform:scale(1)}}@keyframes swal2-show{0%{transform:scale(.7)}45%{transform:scale(1.05)}80%{transform:scale(.95)}100%{transform:scale(1)}}@-webkit-keyframes swal2-hide{0%{transform:scale(1);opacity:1}100%{transform:scale(.5);opacity:0}}@keyframes swal2-hide{0%{transform:scale(1);opacity:1}100%{transform:scale(.5);opacity:0}}@-webkit-keyframes swal2-animate-success-line-tip{0%{top:1.1875em;left:.0625em;width:0}54%{top:1.0625em;left:.125em;width:0}70%{top:2.1875em;left:-.375em;width:3.125em}84%{top:3em;left:1.3125em;width:1.0625em}100%{top:2.8125em;left:.8125em;width:1.5625em}}@keyframes swal2-animate-success-line-tip{0%{top:1.1875em;left:.0625em;width:0}54%{top:1.0625em;left:.125em;width:0}70%{top:2.1875em;left:-.375em;width:3.125em}84%{top:3em;left:1.3125em;width:1.0625em}100%{top:2.8125em;left:.8125em;width:1.5625em}}@-webkit-keyframes swal2-animate-success-line-long{0%{top:3.375em;right:2.875em;width:0}65%{top:3.375em;right:2.875em;width:0}84%{top:2.1875em;right:0;width:3.4375em}100%{top:2.375em;right:.5em;width:2.9375em}}@keyframes swal2-animate-success-line-long{0%{top:3.375em;right:2.875em;width:0}65%{top:3.375em;right:2.875em;width:0}84%{top:2.1875em;right:0;width:3.4375em}100%{top:2.375em;right:.5em;width:2.9375em}}@-webkit-keyframes swal2-rotate-success-circular-line{0%{transform:rotate(-45deg)}5%{transform:rotate(-45deg)}12%{transform:rotate(-405deg)}100%{transform:rotate(-405deg)}}@keyframes swal2-rotate-success-circular-line{0%{transform:rotate(-45deg)}5%{transform:rotate(-45deg)}12%{transform:rotate(-405deg)}100%{transform:rotate(-405deg)}}@-webkit-keyframes swal2-animate-error-x-mark{0%{margin-top:1.625em;transform:scale(.4);opacity:0}50%{margin-top:1.625em;transform:scale(.4);opacity:0}80%{margin-top:-.375em;transform:scale(1.15)}100%{margin-top:0;transform:scale(1);opacity:1}}@keyframes swal2-animate-error-x-mark{0%{margin-top:1.625em;transform:scale(.4);opacity:0}50%{margin-top:1.625em;transform:scale(.4);opacity:0}80%{margin-top:-.375em;transform:scale(1.15)}100%{margin-top:0;transform:scale(1);opacity:1}}@-webkit-keyframes swal2-animate-error-icon{0%{transform:rotateX(100deg);opacity:0}100%{transform:rotateX(0);opacity:1}}@keyframes swal2-animate-error-icon{0%{transform:rotateX(100deg);opacity:0}100%{transform:rotateX(0);opacity:1}}@-webkit-keyframes swal2-rotate-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}@keyframes swal2-rotate-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown){overflow:hidden}body.swal2-height-auto{height:auto!important}body.swal2-no-backdrop .swal2-container{top:auto;right:auto;bottom:auto;left:auto;max-width:calc(100% - .625em * 2);background-color:transparent!important}body.swal2-no-backdrop .swal2-container>.swal2-modal{box-shadow:0 0 10px rgba(0,0,0,.4)}body.swal2-no-backdrop .swal2-container.swal2-top{top:0;left:50%;transform:translateX(-50%)}body.swal2-no-backdrop .swal2-container.swal2-top-left,body.swal2-no-backdrop .swal2-container.swal2-top-start{top:0;left:0}body.swal2-no-backdrop .swal2-container.swal2-top-end,body.swal2-no-backdrop .swal2-container.swal2-top-right{top:0;right:0}body.swal2-no-backdrop .swal2-container.swal2-center{top:50%;left:50%;transform:translate(-50%,-50%)}body.swal2-no-backdrop .swal2-container.swal2-center-left,body.swal2-no-backdrop .swal2-container.swal2-center-start{top:50%;left:0;transform:translateY(-50%)}body.swal2-no-backdrop .swal2-container.swal2-center-end,body.swal2-no-backdrop .swal2-container.swal2-center-right{top:50%;right:0;transform:translateY(-50%)}body.swal2-no-backdrop .swal2-container.swal2-bottom{bottom:0;left:50%;transform:translateX(-50%)}body.swal2-no-backdrop .swal2-container.swal2-bottom-left,body.swal2-no-backdrop .swal2-container.swal2-bottom-start{bottom:0;left:0}body.swal2-no-backdrop .swal2-container.swal2-bottom-end,body.swal2-no-backdrop .swal2-container.swal2-bottom-right{right:0;bottom:0}@media print{body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown){overflow-y:scroll!important}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown)>[aria-hidden=true]{display:none}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) .swal2-container{position:static!important}}body.swal2-toast-shown .swal2-container{background-color:transparent}body.swal2-toast-shown .swal2-container.swal2-top{top:0;right:auto;bottom:auto;left:50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-top-end,body.swal2-toast-shown .swal2-container.swal2-top-right{top:0;right:0;bottom:auto;left:auto}body.swal2-toast-shown .swal2-container.swal2-top-left,body.swal2-toast-shown .swal2-container.swal2-top-start{top:0;right:auto;bottom:auto;left:0}body.swal2-toast-shown .swal2-container.swal2-center-left,body.swal2-toast-shown .swal2-container.swal2-center-start{top:50%;right:auto;bottom:auto;left:0;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-center{top:50%;right:auto;bottom:auto;left:50%;transform:translate(-50%,-50%)}body.swal2-toast-shown .swal2-container.swal2-center-end,body.swal2-toast-shown .swal2-container.swal2-center-right{top:50%;right:0;bottom:auto;left:auto;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-left,body.swal2-toast-shown .swal2-container.swal2-bottom-start{top:auto;right:auto;bottom:0;left:0}body.swal2-toast-shown .swal2-container.swal2-bottom{top:auto;right:auto;bottom:0;left:50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-end,body.swal2-toast-shown .swal2-container.swal2-bottom-right{top:auto;right:0;bottom:0;left:auto}body.swal2-toast-column .swal2-toast{flex-direction:column;align-items:stretch}body.swal2-toast-column .swal2-toast .swal2-actions{flex:1;align-self:stretch;height:2.2em;margin-top:.3125em}body.swal2-toast-column .swal2-toast .swal2-loading{justify-content:center}body.swal2-toast-column .swal2-toast .swal2-input{height:2em;margin:.3125em auto;font-size:1em}body.swal2-toast-column .swal2-toast .swal2-validation-message{font-size:1em}");
    });

    //const _host = "http://192.168.1.124:91";
    const _host = "https://medapp-api.cthrics.com";
    //const _host = "http://172.20.1.12:303";
    //const _host = "https://odyssey-api.cmsiglo21.app";

    const axiosInstance = axios$1.create({
      baseURL: _host + "/api"
    });

    const axios$2 = writable(axiosInstance);
    const connection = writable(new HubConnectionBuilder()
      .withUrl(_host + "/hub", {
        accessTokenFactory: () => localStorage.getItem('access_token'),
      }).build());

    const session = writable(new Session(window.localStorage));

    const activePage = writable("home.index");
    const dataCita = writable({});
    const host = readable(_host + "/api");

    const errorConn = () => {
      sweetalert2_all.fire({
        title: 'Error',
        text: 'Ocurrio un problema al intentar conectar, intente de nuevo',
        icon: 'error'
      });
    };

    const notification = (time) => {
      return sweetalert2_all.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: time,
        timerProgressBar: true,
        onOpen: (toast) => {
          toast.addEventListener('mouseenter', sweetalert2_all.stopTimer);
          toast.addEventListener('mouseleave', sweetalert2_all.resumeTimer);
        }
      })
    };

    const errorConexion = readable(errorConn);
    const toast = readable(notification);

    //const url = "http://192.168.1.124:91";
    const url = "https://medapp-api.cthrics.com/api";
    //const url = "http://172.20.1.12:303";
    //const url = "https://odyssey-api.cmsiglo21.app";

    const isLogin = () => { 
        if(localStorage.getItem('access_token') ){
            return true
        }
        return false
    };

    /* src/Pages/Home/Login.svelte generated by Svelte v3.23.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/Pages/Home/Login.svelte";

    function create_fragment$4(ctx) {
    	let div9;
    	let div8;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let p0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p1;
    	let t2;
    	let h3;
    	let t4;
    	let form;
    	let div3;
    	let div1;
    	let label0;
    	let t6;
    	let input0;
    	let t7;
    	let div2;
    	let label1;
    	let t9;
    	let input1;
    	let t10;
    	let button;
    	let t12;
    	let p2;
    	let a;
    	let t14;
    	let div7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			img = element("img");
    			t0 = space();
    			p1 = element("p");
    			p1.textContent = "atmos";
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Login";
    			t4 = space();
    			form = element("form");
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			button = element("button");
    			button.textContent = "Login";
    			t12 = space();
    			p2 = element("p");
    			a = element("a");
    			a.textContent = "Forgot Password?";
    			t14 = space();
    			div7 = element("div");
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "80");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 38, 26, 927);
    			add_location(p0, file$3, 37, 22, 897);
    			attr_dev(p1, "class", "admin-brand-content");
    			add_location(p1, file$3, 41, 22, 1027);
    			attr_dev(div0, "class", "p-b-20 text-center");
    			add_location(div0, file$3, 36, 18, 842);
    			attr_dev(h3, "class", "text-center p-b-20 fw-400");
    			add_location(h3, file$3, 45, 18, 1161);
    			add_location(label0, file$3, 49, 30, 1444);
    			attr_dev(input0, "type", "email");
    			input0.required = "";
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Email");
    			add_location(input0, file$3, 50, 30, 1495);
    			attr_dev(div1, "class", "form-group floating-label col-md-12");
    			add_location(div1, file$3, 48, 26, 1364);
    			add_location(label1, file$3, 53, 30, 1730);
    			attr_dev(input1, "type", "password");
    			input1.required = "";
    			attr_dev(input1, "class", "form-control ");
    			add_location(input1, file$3, 54, 30, 1784);
    			attr_dev(div2, "class", "form-group floating-label col-md-12");
    			add_location(div2, file$3, 52, 26, 1650);
    			attr_dev(div3, "class", "form-row");
    			add_location(div3, file$3, 47, 22, 1315);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary btn-block btn-lg");
    			add_location(button, file$3, 58, 22, 1949);
    			attr_dev(form, "class", "needs-validation");
    			add_location(form, file$3, 46, 18, 1228);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-underline");
    			add_location(a, file$3, 62, 22, 2124);
    			attr_dev(p2, "class", "text-right p-t-10");
    			add_location(p2, file$3, 61, 18, 2072);
    			attr_dev(div4, "class", "mx-auto col-md-8");
    			add_location(div4, file$3, 35, 14, 793);
    			attr_dev(div5, "class", "row align-items-center m-h-100");
    			add_location(div5, file$3, 34, 10, 734);
    			attr_dev(div6, "class", "col-lg-4  bg-white");
    			add_location(div6, file$3, 33, 6, 691);
    			attr_dev(div7, "class", "col-lg-8 d-none d-md-block bg-cover");
    			set_style(div7, "background-image", "url('assets/img/login.svg')");
    			add_location(div7, file$3, 68, 6, 2262);
    			attr_dev(div8, "class", "row ");
    			add_location(div8, file$3, 32, 2, 666);
    			attr_dev(div9, "class", "container-fluid");
    			add_location(div9, file$3, 31, 0, 634);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(p0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p1);
    			append_dev(div4, t2);
    			append_dev(div4, h3);
    			append_dev(div4, t4);
    			append_dev(div4, form);
    			append_dev(form, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t6);
    			append_dev(div1, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t9);
    			append_dev(div2, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(form, t10);
    			append_dev(form, button);
    			append_dev(div4, t12);
    			append_dev(div4, p2);
    			append_dev(p2, a);
    			append_dev(div8, t14);
    			append_dev(div8, div7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", prevent_default(/*login*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let username = "";
    	let password = "";

    	const login = () => {
    		const data = { username, password };

    		const config = {
    			method: "post",
    			url: `${url}/users/login`,
    			data
    		};

    		axios$1(config).then(res => {
    			console.log(res.data);
    			localStorage.setItem("access_token", res.data.access_token);

    			if (localStorage.getItem("access_token")) {
    				push("/");
    			}
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		push,
    		url,
    		username,
    		password,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [username, password, login, input0_input_handler, input1_input_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Pages/Home/Error404.svelte generated by Svelte v3.23.0 */

    const file$4 = "src/Pages/Home/Error404.svelte";

    function create_fragment$5(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Error 404";
    			add_location(h1, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error404> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Error404", $$slots, []);
    	return [];
    }

    class Error404 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error404",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Pages/Home/Unauthorized.svelte generated by Svelte v3.23.0 */

    const file$5 = "src/Pages/Home/Unauthorized.svelte";

    function create_fragment$6(ctx) {
    	let h2;
    	let t1;
    	let a;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Unathorized 401";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Ir a inicio";
    			attr_dev(h2, "class", "ml-2 mt-2");
    			add_location(h2, file$5, 0, 0, 0);
    			attr_dev(a, "class", "ml-2 mt-2");
    			attr_dev(a, "href", "#/");
    			add_location(a, file$5, 2, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Unauthorized> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Unauthorized", $$slots, []);
    	return [];
    }

    class Unauthorized extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Unauthorized",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Pages/Citas/Gestion.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$1, console: console_1$2 } = globals;
    const file$6 = "src/Pages/Citas/Gestion.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    // (314:20) {#each consultorios as consultorio}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*consultorio*/ ctx[43].consultorio + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*consultorio*/ ctx[43].consultorioId;
    			option.value = option.__value;
    			add_location(option, file$6, 315, 20, 7921);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*consultorios*/ 256 && t_value !== (t_value = /*consultorio*/ ctx[43].consultorio + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*consultorios*/ 256 && option_value_value !== (option_value_value = /*consultorio*/ ctx[43].consultorioId)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(314:20) {#each consultorios as consultorio}",
    		ctx
    	});

    	return block;
    }

    // (325:20) {#each estados as estado}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*estado*/ ctx[40].descripcion + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*estado*/ ctx[40].id;
    			option.value = option.__value;
    			add_location(option, file$6, 326, 20, 8509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*estados*/ 16 && t_value !== (t_value = /*estado*/ ctx[40].descripcion + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*estados*/ 16 && option_value_value !== (option_value_value = /*estado*/ ctx[40].id)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(325:20) {#each estados as estado}",
    		ctx
    	});

    	return block;
    }

    // (340:16) {#if !citas}
    function create_if_block_4(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "No hay cita";
    			add_location(h4, file$6, 341, 19, 9020);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(340:16) {#if !citas}",
    		ctx
    	});

    	return block;
    }

    // (349:16) {#if citas}
    function create_if_block_1(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t12;
    	let tbody;
    	let each_value = /*citas*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Estado";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Fecha";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Hora";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Celular";
    			t11 = space();
    			th6 = element("th");
    			t12 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$6, 353, 25, 9510);
    			add_location(th1, file$6, 354, 25, 9546);
    			add_location(th2, file$6, 355, 25, 9587);
    			add_location(th3, file$6, 356, 25, 9628);
    			add_location(th4, file$6, 357, 25, 9668);
    			add_location(th5, file$6, 358, 25, 9707);
    			add_location(th6, file$6, 359, 25, 9749);
    			add_location(tr, file$6, 352, 23, 9480);
    			add_location(thead, file$6, 351, 21, 9449);
    			add_location(tbody, file$6, 362, 21, 9836);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$6, 350, 19, 9379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(tr, t7);
    			append_dev(tr, th4);
    			append_dev(tr, t9);
    			append_dev(tr, th5);
    			append_dev(tr, t11);
    			append_dev(tr, th6);
    			append_dev(table, t12);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cambiarEstado, citas, editarPaciente*/ 6145) {
    				each_value = /*citas*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(349:16) {#if citas}",
    		ctx
    	});

    	return block;
    }

    // (393:30) {#if cita.estadoId !== "X"}
    function create_if_block_3(ctx) {
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[28](/*cita*/ ctx[37], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-close");
    			add_location(i, file$6, 396, 32, 11685);
    			attr_dev(button, "class", "btn btn-danger btn-sm mb-1 svelte-frc5v8");
    			add_location(button, file$6, 393, 32, 11493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(393:30) {#if cita.estadoId !== \\\"X\\\"}",
    		ctx
    	});

    	return block;
    }

    // (400:30) {#if cita.estadoId !== "C"}
    function create_if_block_2(ctx) {
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[29](/*cita*/ ctx[37], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-check-outline");
    			add_location(i, file$6, 404, 35, 12138);
    			attr_dev(button, "class", "btn btn-success btn-sm mb-1 svelte-frc5v8");
    			attr_dev(button, "title", "Confirmar");
    			add_location(button, file$6, 400, 33, 11882);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(400:30) {#if cita.estadoId !== \\\"C\\\"}",
    		ctx
    	});

    	return block;
    }

    // (364:23) {#each citas as cita, i}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*i*/ ctx[39] + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*cita*/ ctx[37].nombre + "";
    	let t2;
    	let t3;
    	let t4_value = /*cita*/ ctx[37].apellidos + "";
    	let t4;
    	let t5;
    	let td2;
    	let span;
    	let t6_value = /*cita*/ ctx[37].estado + "";
    	let t6;
    	let span_class_value;
    	let t7;
    	let td3;
    	let t8_value = new Date(/*cita*/ ctx[37].fecha).toLocaleDateString("es-DO") + "";
    	let t8;
    	let t9;
    	let td4;
    	let t10_value = new Date(/*cita*/ ctx[37].fecha).toLocaleTimeString("es-DO") + "";
    	let t10;
    	let t11;
    	let td5;
    	let t12_value = /*cita*/ ctx[37].celular + "";
    	let t12;
    	let t13;
    	let td6;
    	let t14;
    	let td7;
    	let button;
    	let i_1;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[27](/*cita*/ ctx[37], ...args);
    	}

    	let if_block0 = /*cita*/ ctx[37].estadoId !== "X" && create_if_block_3(ctx);
    	let if_block1 = /*cita*/ ctx[37].estadoId !== "C" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td4 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td5 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td6 = element("td");
    			t14 = space();
    			td7 = element("td");
    			button = element("button");
    			i_1 = element("i");
    			t15 = text("\n                                Ver cita");
    			t16 = space();
    			if (if_block0) if_block0.c();
    			t17 = space();
    			if (if_block1) if_block1.c();
    			t18 = space();
    			add_location(td0, file$6, 366, 28, 10020);
    			add_location(td1, file$6, 367, 28, 10063);
    			attr_dev(span, "class", span_class_value = "badge " + colorEstado(/*cita*/ ctx[37].estado) + " svelte-frc5v8");
    			add_location(span, file$6, 369, 30, 10166);
    			add_location(td2, file$6, 368, 28, 10131);
    			add_location(td3, file$6, 371, 28, 10296);
    			add_location(td4, file$6, 372, 28, 10384);
    			add_location(td5, file$6, 373, 28, 10472);
    			add_location(td6, file$6, 374, 28, 10524);
    			attr_dev(i_1, "class", "mdi mdi-account-search-outline");
    			add_location(i_1, file$6, 381, 32, 10917);
    			attr_dev(button, "class", "btn btn-primary btn-sm mb-1 svelte-frc5v8");
    			attr_dev(button, "data-toggle", "modal");
    			attr_dev(button, "data-target", "#modalPaciente");
    			add_location(button, file$6, 376, 30, 10621);
    			set_style(td7, "text-align", "right");
    			add_location(td7, file$6, 375, 28, 10559);
    			attr_dev(tr, "class", "cursor-table");
    			add_location(tr, file$6, 365, 26, 9966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, span);
    			append_dev(span, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(td4, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td5);
    			append_dev(td5, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td6);
    			append_dev(tr, t14);
    			append_dev(tr, td7);
    			append_dev(td7, button);
    			append_dev(button, i_1);
    			append_dev(button, t15);
    			append_dev(td7, t16);
    			if (if_block0) if_block0.m(td7, null);
    			append_dev(td7, t17);
    			if (if_block1) if_block1.m(td7, null);
    			append_dev(tr, t18);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*citas*/ 1 && t2_value !== (t2_value = /*cita*/ ctx[37].nombre + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*citas*/ 1 && t4_value !== (t4_value = /*cita*/ ctx[37].apellidos + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*citas*/ 1 && t6_value !== (t6_value = /*cita*/ ctx[37].estado + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*citas*/ 1 && span_class_value !== (span_class_value = "badge " + colorEstado(/*cita*/ ctx[37].estado) + " svelte-frc5v8")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty[0] & /*citas*/ 1 && t8_value !== (t8_value = new Date(/*cita*/ ctx[37].fecha).toLocaleDateString("es-DO") + "")) set_data_dev(t8, t8_value);
    			if (dirty[0] & /*citas*/ 1 && t10_value !== (t10_value = new Date(/*cita*/ ctx[37].fecha).toLocaleTimeString("es-DO") + "")) set_data_dev(t10, t10_value);
    			if (dirty[0] & /*citas*/ 1 && t12_value !== (t12_value = /*cita*/ ctx[37].celular + "")) set_data_dev(t12, t12_value);

    			if (/*cita*/ ctx[37].estadoId !== "X") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(td7, t17);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*cita*/ ctx[37].estadoId !== "C") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(td7, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(364:23) {#each citas as cita, i}",
    		ctx
    	});

    	return block;
    }

    // (418:14) {#if cargando}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$6, 420, 22, 12638);
    			attr_dev(div0, "class", "spinner-border text-secondary");
    			attr_dev(div0, "role", "status");
    			add_location(div0, file$6, 419, 18, 12558);
    			attr_dev(div1, "class", "col-lg-12 text-center");
    			add_location(div1, file$6, 418, 16, 12504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(418:14) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let section;
    	let div16;
    	let div15;
    	let div14;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div2;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let div3;
    	let button0;
    	let t12;
    	let a;
    	let i0;
    	let t13;
    	let a_href_value;
    	let t14;
    	let div8;
    	let div7;
    	let div6;
    	let div4;
    	let label3;
    	let t16;
    	let select0;
    	let t17;
    	let div5;
    	let label4;
    	let t19;
    	let select1;
    	let option0;
    	let option1;
    	let option1_value_value;
    	let t22;
    	let div9;
    	let h1;
    	let t24;
    	let div13;
    	let div12;
    	let t25;
    	let div10;
    	let button1;
    	let t27;
    	let div11;
    	let t28;
    	let t29;
    	let form;
    	let div36;
    	let div35;
    	let div34;
    	let div17;
    	let h50;
    	let i1;
    	let t30;
    	let t31;
    	let button2;
    	let span0;
    	let t33;
    	let div32;
    	let input3;
    	let t34;
    	let div19;
    	let div18;
    	let label5;
    	let t36;
    	let input4;
    	let t37;
    	let div21;
    	let div20;
    	let label6;
    	let t39;
    	let input5;
    	let t40;
    	let div23;
    	let div22;
    	let label7;
    	let t42;
    	let input6;
    	let t43;
    	let div25;
    	let div24;
    	let label8;
    	let t45;
    	let input7;
    	let t46;
    	let div27;
    	let div26;
    	let label9;
    	let t48;
    	let input8;
    	let t49;
    	let div29;
    	let div28;
    	let label10;
    	let t51;
    	let input9;
    	let t52;
    	let div31;
    	let div30;
    	let label11;
    	let t54;
    	let textarea;
    	let t55;
    	let br;
    	let t56;
    	let div33;
    	let button3;
    	let t58;
    	let div52;
    	let div51;
    	let div50;
    	let div37;
    	let h51;
    	let i2;
    	let t59;
    	let t60;
    	let button4;
    	let span1;
    	let t62;
    	let div49;
    	let div42;
    	let div39;
    	let div38;
    	let label12;
    	let t64;
    	let input10;
    	let t65;
    	let div41;
    	let div40;
    	let label13;
    	let t67;
    	let select2;
    	let option2;
    	let option2_value_value;
    	let option3;
    	let option3_value_value;
    	let option4;
    	let option4_value_value;
    	let t71;
    	let div48;
    	let div43;
    	let t73;
    	let div47;
    	let div45;
    	let div44;
    	let t75;
    	let div46;
    	let button5;
    	let current;
    	let mounted;
    	let dispose;
    	const aside = new Aside({ $$inline: true });
    	const header = new Header({ $$inline: true });
    	let each_value_2 = /*consultorios*/ ctx[8];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*estados*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block0 = !/*citas*/ ctx[0] && create_if_block_4(ctx);
    	let if_block1 = /*citas*/ ctx[0] && create_if_block_1(ctx);
    	let if_block2 = /*cargando*/ ctx[10] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Buscar por paciente";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Desde";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Hasta";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Filtros";
    			t12 = space();
    			a = element("a");
    			i0 = element("i");
    			t13 = text(" Cita");
    			t14 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Especialista";
    			t16 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Estados";
    			t19 = space();
    			select1 = element("select");
    			option0 = element("option");
    			option0.textContent = "- Buscar por estado -";
    			option1 = element("option");
    			option1.textContent = "Todos";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			div9 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Listado de Citas";
    			t24 = space();
    			div13 = element("div");
    			div12 = element("div");
    			if (if_block0) if_block0.c();
    			t25 = space();
    			div10 = element("div");
    			button1 = element("button");
    			button1.textContent = "Imprimir";
    			t27 = space();
    			div11 = element("div");
    			if (if_block1) if_block1.c();
    			t28 = space();
    			if (if_block2) if_block2.c();
    			t29 = space();
    			form = element("form");
    			div36 = element("div");
    			div35 = element("div");
    			div34 = element("div");
    			div17 = element("div");
    			h50 = element("h5");
    			i1 = element("i");
    			t30 = text("\n          Paciente");
    			t31 = space();
    			button2 = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t33 = space();
    			div32 = element("div");
    			input3 = element("input");
    			t34 = space();
    			div19 = element("div");
    			div18 = element("div");
    			label5 = element("label");
    			label5.textContent = "Nombre";
    			t36 = space();
    			input4 = element("input");
    			t37 = space();
    			div21 = element("div");
    			div20 = element("div");
    			label6 = element("label");
    			label6.textContent = "Apellido";
    			t39 = space();
    			input5 = element("input");
    			t40 = space();
    			div23 = element("div");
    			div22 = element("div");
    			label7 = element("label");
    			label7.textContent = "Cedula";
    			t42 = space();
    			input6 = element("input");
    			t43 = space();
    			div25 = element("div");
    			div24 = element("div");
    			label8 = element("label");
    			label8.textContent = "Telefono";
    			t45 = space();
    			input7 = element("input");
    			t46 = space();
    			div27 = element("div");
    			div26 = element("div");
    			label9 = element("label");
    			label9.textContent = "Celular";
    			t48 = space();
    			input8 = element("input");
    			t49 = space();
    			div29 = element("div");
    			div28 = element("div");
    			label10 = element("label");
    			label10.textContent = "Correo electronico";
    			t51 = space();
    			input9 = element("input");
    			t52 = space();
    			div31 = element("div");
    			div30 = element("div");
    			label11 = element("label");
    			label11.textContent = "Motivo de consulta";
    			t54 = space();
    			textarea = element("textarea");
    			t55 = space();
    			br = element("br");
    			t56 = space();
    			div33 = element("div");
    			button3 = element("button");
    			button3.textContent = "Cerrar";
    			t58 = space();
    			div52 = element("div");
    			div51 = element("div");
    			div50 = element("div");
    			div37 = element("div");
    			h51 = element("h5");
    			i2 = element("i");
    			t59 = text("\n          Reprogramacion de cita");
    			t60 = space();
    			button4 = element("button");
    			span1 = element("span");
    			span1.textContent = "×";
    			t62 = space();
    			div49 = element("div");
    			div42 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			label12 = element("label");
    			label12.textContent = "Fecha";
    			t64 = space();
    			input10 = element("input");
    			t65 = space();
    			div41 = element("div");
    			div40 = element("div");
    			label13 = element("label");
    			label13.textContent = "Especialista";
    			t67 = space();
    			select2 = element("select");
    			option2 = element("option");
    			option2.textContent = "- Seleccionar -";
    			option3 = element("option");
    			option3.textContent = "Dr. Ramon Mena";
    			option4 = element("option");
    			option4.textContent = "Dra. Lourde Rivas";
    			t71 = space();
    			div48 = element("div");
    			div43 = element("div");
    			div43.textContent = "No hay disponibilidad en este horario";
    			t73 = space();
    			div47 = element("div");
    			div45 = element("div");
    			div44 = element("div");
    			div44.textContent = "Hora";
    			t75 = space();
    			div46 = element("div");
    			button5 = element("button");
    			button5.textContent = "Seleccionar";
    			attr_dev(label0, "class", "svelte-frc5v8");
    			add_location(label0, file$6, 290, 12, 6456);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control svelte-frc5v8");
    			attr_dev(input0, "placeholder", "Buscar paciente");
    			add_location(input0, file$6, 291, 12, 6503);
    			attr_dev(div0, "class", "col-lg-4 mt-2");
    			add_location(div0, file$6, 289, 10, 6416);
    			attr_dev(label1, "class", "svelte-frc5v8");
    			add_location(label1, file$6, 295, 12, 6712);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "class", "form-control svelte-frc5v8");
    			add_location(input1, file$6, 296, 12, 6745);
    			attr_dev(div1, "class", "col-lg-3 col-md-3 mt-2");
    			add_location(div1, file$6, 294, 10, 6663);
    			attr_dev(label2, "class", "svelte-frc5v8");
    			add_location(label2, file$6, 299, 12, 6910);
    			attr_dev(input2, "type", "date");
    			attr_dev(input2, "class", "form-control svelte-frc5v8");
    			add_location(input2, file$6, 300, 12, 6943);
    			attr_dev(div2, "class", "col-lg-3 col-md-3 mt-2");
    			add_location(div2, file$6, 298, 10, 6861);
    			attr_dev(button0, "class", "btn btn-primary svelte-frc5v8");
    			attr_dev(button0, "id", "btnFiltro");
    			set_style(button0, "margin-top", "38px");
    			add_location(button0, file$6, 304, 12, 7102);
    			attr_dev(i0, "class", "mdi mdi-plus");
    			add_location(i0, file$6, 305, 151, 7364);
    			attr_dev(a, "class", "btn btn-primary svelte-frc5v8");
    			attr_dev(a, "target", "_blank");
    			set_style(a, "margin-top", "38px");
    			attr_dev(a, "href", a_href_value = `https://medapp.nxt-pro.com/solicitud/cita/${/*sltConsultorios*/ ctx[9]}`);
    			add_location(a, file$6, 305, 12, 7225);
    			attr_dev(div3, "class", "col-lg-2");
    			add_location(div3, file$6, 303, 10, 7067);
    			attr_dev(label3, "class", "svelte-frc5v8");
    			add_location(label3, file$6, 311, 18, 7638);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltMedicos");
    			set_style(select0, "width", "100%");
    			if (/*sltConsultorios*/ ctx[9] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[24].call(select0));
    			add_location(select0, file$6, 312, 18, 7684);
    			attr_dev(div4, "class", "col-lg-4");
    			add_location(div4, file$6, 310, 16, 7597);
    			attr_dev(label4, "class", "svelte-frc5v8");
    			add_location(label4, file$6, 320, 18, 8143);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.disabled = true;
    			option0.selected = true;
    			add_location(option0, file$6, 322, 20, 8281);
    			option1.__value = option1_value_value = "";
    			option1.value = option1.__value;
    			add_location(option1, file$6, 323, 20, 8367);
    			attr_dev(select1, "class", "form-control");
    			if (/*sltEstado*/ ctx[5] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[25].call(select1));
    			add_location(select1, file$6, 321, 18, 8184);
    			attr_dev(div5, "class", "col-lg-3 col-md-6");
    			add_location(div5, file$6, 319, 16, 8093);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$6, 309, 14, 7563);
    			attr_dev(div7, "class", "alert alert-secondary svelte-frc5v8");
    			add_location(div7, file$6, 308, 12, 7513);
    			attr_dev(div8, "id", "filtroAvanzado");
    			attr_dev(div8, "class", "col-lg-12 mt-2");
    			set_style(div8, "display", "none");
    			add_location(div8, file$6, 307, 10, 7429);
    			attr_dev(h1, "class", "titulo svelte-frc5v8");
    			set_style(h1, "color", "black");
    			add_location(h1, file$6, 334, 12, 8752);
    			attr_dev(div9, "class", "col-lg-12 mt-2");
    			add_location(div9, file$6, 333, 10, 8711);
    			attr_dev(button1, "class", "btn btn-success btn-sm svelte-frc5v8");
    			add_location(button1, file$6, 344, 18, 9133);
    			attr_dev(div10, "class", "col-lg-12 text-right");
    			add_location(div10, file$6, 343, 16, 9080);
    			attr_dev(div11, "class", "table-responsive");
    			add_location(div11, file$6, 347, 14, 9260);
    			attr_dev(div12, "class", "alert alert-primary svelte-frc5v8");
    			attr_dev(div12, "role", "alert");
    			add_location(div12, file$6, 338, 12, 8884);
    			attr_dev(div13, "class", "col-md-12 mt-3");
    			add_location(div13, file$6, 337, 10, 8843);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$6, 288, 8, 6388);
    			attr_dev(div15, "class", "col-md-12");
    			add_location(div15, file$6, 287, 6, 6356);
    			attr_dev(div16, "class", "container mt-3");
    			add_location(div16, file$6, 286, 4, 6321);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$6, 285, 2, 6285);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$6, 283, 0, 6244);
    			attr_dev(i1, "class", "mdi mdi-account-search-outline");
    			add_location(i1, file$6, 446, 10, 13249);
    			attr_dev(h50, "class", "modal-title");
    			attr_dev(h50, "id", "modalPacienteLabel");
    			add_location(h50, file$6, 445, 8, 13190);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$6, 454, 10, 13462);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "close svelte-frc5v8");
    			attr_dev(button2, "data-dismiss", "modal");
    			attr_dev(button2, "aria-label", "Close");
    			add_location(button2, file$6, 449, 8, 13335);
    			attr_dev(div17, "class", "modal-header");
    			add_location(div17, file$6, 444, 6, 13155);
    			attr_dev(input3, "type", "hidden");
    			attr_dev(input3, "name", "IdUser");
    			input3.value = "0";
    			attr_dev(input3, "class", "svelte-frc5v8");
    			add_location(input3, file$6, 458, 10, 13568);
    			attr_dev(label5, "for", "");
    			attr_dev(label5, "class", "svelte-frc5v8");
    			add_location(label5, file$6, 461, 14, 13710);
    			attr_dev(input4, "type", "name");
    			attr_dev(input4, "class", "form-control svelte-frc5v8");
    			attr_dev(input4, "name", "Name");
    			attr_dev(input4, "maxlength", "200");
    			input4.readOnly = true;
    			add_location(input4, file$6, 462, 14, 13753);
    			attr_dev(div18, "class", "form-group col-md-12");
    			add_location(div18, file$6, 460, 12, 13661);
    			attr_dev(div19, "class", "form-row");
    			add_location(div19, file$6, 459, 10, 13626);
    			attr_dev(label6, "for", "");
    			attr_dev(label6, "class", "svelte-frc5v8");
    			add_location(label6, file$6, 472, 14, 14076);
    			attr_dev(input5, "type", "name");
    			attr_dev(input5, "class", "form-control svelte-frc5v8");
    			attr_dev(input5, "name", "Name");
    			attr_dev(input5, "maxlength", "200");
    			input5.readOnly = true;
    			add_location(input5, file$6, 473, 14, 14121);
    			attr_dev(div20, "class", "form-group col-md-12");
    			add_location(div20, file$6, 471, 12, 14027);
    			attr_dev(div21, "class", "form-row");
    			add_location(div21, file$6, 470, 10, 13992);
    			attr_dev(label7, "for", "");
    			attr_dev(label7, "class", "svelte-frc5v8");
    			add_location(label7, file$6, 483, 14, 14447);
    			attr_dev(input6, "type", "name");
    			attr_dev(input6, "class", "form-control svelte-frc5v8");
    			attr_dev(input6, "name", "Name");
    			attr_dev(input6, "maxlength", "200");
    			input6.readOnly = true;
    			add_location(input6, file$6, 484, 14, 14490);
    			attr_dev(div22, "class", "form-group col-md-12");
    			add_location(div22, file$6, 482, 12, 14398);
    			attr_dev(div23, "class", "form-row");
    			add_location(div23, file$6, 481, 10, 14363);
    			attr_dev(label8, "for", "");
    			attr_dev(label8, "class", "svelte-frc5v8");
    			add_location(label8, file$6, 493, 14, 14797);
    			attr_dev(input7, "type", "tel");
    			attr_dev(input7, "class", "form-control svelte-frc5v8");
    			attr_dev(input7, "name", "Name");
    			attr_dev(input7, "maxlength", "200");
    			input7.readOnly = true;
    			add_location(input7, file$6, 494, 14, 14842);
    			attr_dev(div24, "class", "form-group col-md-12");
    			add_location(div24, file$6, 492, 12, 14748);
    			attr_dev(div25, "class", "form-row");
    			add_location(div25, file$6, 491, 10, 14713);
    			attr_dev(label9, "for", "");
    			attr_dev(label9, "class", "svelte-frc5v8");
    			add_location(label9, file$6, 504, 14, 15166);
    			attr_dev(input8, "type", "tel");
    			attr_dev(input8, "class", "form-control svelte-frc5v8");
    			attr_dev(input8, "name", "Name");
    			attr_dev(input8, "maxlength", "200");
    			input8.readOnly = true;
    			add_location(input8, file$6, 505, 14, 15210);
    			attr_dev(div26, "class", "form-group col-md-12");
    			add_location(div26, file$6, 503, 12, 15117);
    			attr_dev(div27, "class", "form-row");
    			add_location(div27, file$6, 502, 10, 15082);
    			attr_dev(label10, "for", "");
    			attr_dev(label10, "class", "svelte-frc5v8");
    			add_location(label10, file$6, 515, 14, 15533);
    			attr_dev(input9, "type", "email");
    			attr_dev(input9, "class", "form-control svelte-frc5v8");
    			attr_dev(input9, "name", "Name");
    			attr_dev(input9, "maxlength", "200");
    			input9.readOnly = true;
    			add_location(input9, file$6, 516, 14, 15588);
    			attr_dev(div28, "class", "form-group col-md-12");
    			add_location(div28, file$6, 514, 12, 15484);
    			attr_dev(div29, "class", "form-row");
    			add_location(div29, file$6, 513, 10, 15449);
    			attr_dev(label11, "for", "");
    			attr_dev(label11, "class", "svelte-frc5v8");
    			add_location(label11, file$6, 525, 14, 15895);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "rows", "3");
    			textarea.readOnly = true;
    			add_location(textarea, file$6, 526, 14, 15950);
    			attr_dev(div30, "class", "form-group col-md-12");
    			add_location(div30, file$6, 524, 12, 15846);
    			attr_dev(div31, "class", "form-row");
    			add_location(div31, file$6, 523, 10, 15811);
    			add_location(br, file$6, 532, 10, 16120);
    			attr_dev(div32, "class", "modal-body svelte-frc5v8");
    			add_location(div32, file$6, 457, 6, 13533);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-outline-danger svelte-frc5v8");
    			attr_dev(button3, "data-dismiss", "modal");
    			add_location(button3, file$6, 535, 10, 16187);
    			attr_dev(div33, "class", "modal-footer");
    			add_location(div33, file$6, 534, 8, 16150);
    			attr_dev(div34, "class", "modal-content");
    			add_location(div34, file$6, 443, 4, 13121);
    			attr_dev(div35, "class", "modal-dialog svelte-frc5v8");
    			attr_dev(div35, "role", "document");
    			add_location(div35, file$6, 442, 2, 13074);
    			attr_dev(div36, "class", "modal fade modal-slide-right svelte-frc5v8");
    			attr_dev(div36, "id", "modalPaciente");
    			attr_dev(div36, "tabindex", "-1");
    			attr_dev(div36, "role", "dialog");
    			attr_dev(div36, "aria-labelledby", "modalPacienteLabel");
    			set_style(div36, "display", "none");
    			set_style(div36, "padding-right", "16px");
    			attr_dev(div36, "aria-modal", "true");
    			add_location(div36, file$6, 434, 0, 12869);
    			attr_dev(form, "id", "frmPaciente");
    			add_location(form, file$6, 433, 0, 12844);
    			attr_dev(i2, "class", "mdi mdi-calendar-plus");
    			add_location(i2, file$6, 564, 10, 16957);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "modalCrearCitaLabel");
    			add_location(h51, file$6, 563, 8, 16897);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$6, 572, 10, 17175);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "close svelte-frc5v8");
    			attr_dev(button4, "data-dismiss", "modal");
    			attr_dev(button4, "aria-label", "Close");
    			add_location(button4, file$6, 567, 8, 17048);
    			attr_dev(div37, "class", "modal-header");
    			add_location(div37, file$6, 562, 6, 16862);
    			attr_dev(label12, "for", "inputAddress");
    			attr_dev(label12, "class", "svelte-frc5v8");
    			add_location(label12, file$6, 580, 14, 17428);
    			attr_dev(input10, "type", "date");
    			attr_dev(input10, "class", "form-control form-control-sm svelte-frc5v8");
    			add_location(input10, file$6, 581, 14, 17482);
    			attr_dev(div38, "class", "form-group");
    			add_location(div38, file$6, 579, 12, 17389);
    			attr_dev(div39, "class", "col-lg-6");
    			add_location(div39, file$6, 578, 10, 17354);
    			attr_dev(label13, "class", "font-secondary svelte-frc5v8");
    			add_location(label13, file$6, 588, 14, 17693);
    			option2.__value = option2_value_value = 0;
    			option2.value = option2.__value;
    			option2.disabled = true;
    			add_location(option2, file$6, 591, 16, 17847);
    			option3.__value = option3_value_value = 1;
    			option3.value = option3.__value;
    			add_location(option3, file$6, 592, 16, 17915);
    			option4.__value = option4_value_value = 2;
    			option4.value = option4.__value;
    			add_location(option4, file$6, 593, 16, 17973);
    			attr_dev(select2, "class", "form-control form-control-sm js-select2");
    			add_location(select2, file$6, 589, 14, 17758);
    			attr_dev(div40, "class", "form-group ");
    			add_location(div40, file$6, 587, 12, 17653);
    			attr_dev(div41, "class", "col-lg-6");
    			add_location(div41, file$6, 586, 10, 17618);
    			attr_dev(div42, "class", "row");
    			add_location(div42, file$6, 577, 8, 17326);
    			attr_dev(div43, "class", "alert alert-success svelte-frc5v8");
    			attr_dev(div43, "role", "alert");
    			add_location(div43, file$6, 599, 12, 18143);
    			attr_dev(div44, "class", "name");
    			add_location(div44, file$6, 605, 16, 18403);
    			attr_dev(div45, "class", "");
    			add_location(div45, file$6, 604, 14, 18372);
    			attr_dev(button5, "class", "btn btn-outline-success btn-sm svelte-frc5v8");
    			add_location(button5, file$6, 608, 16, 18505);
    			attr_dev(div46, "class", "ml-auto");
    			add_location(div46, file$6, 607, 14, 18467);
    			attr_dev(div47, "class", "list-group-item d-flex align-items-center svelte-1nu1nbu");
    			add_location(div47, file$6, 602, 12, 18273);
    			attr_dev(div48, "class", "list-group list");
    			add_location(div48, file$6, 598, 8, 18101);
    			attr_dev(div49, "class", "modal-body svelte-frc5v8");
    			set_style(div49, "height", "100%");
    			set_style(div49, "top", "0");
    			set_style(div49, "overflow", "auto");
    			add_location(div49, file$6, 575, 6, 17246);
    			attr_dev(div50, "class", "modal-content");
    			add_location(div50, file$6, 561, 4, 16828);
    			attr_dev(div51, "class", "modal-dialog svelte-frc5v8");
    			attr_dev(div51, "role", "document");
    			add_location(div51, file$6, 560, 2, 16781);
    			attr_dev(div52, "class", "modal fade modal-slide-right svelte-frc5v8");
    			attr_dev(div52, "id", "modalCambiarCita");
    			attr_dev(div52, "tabindex", "-1");
    			attr_dev(div52, "role", "dialog");
    			attr_dev(div52, "aria-labelledby", "modalCrearCitaLabel");
    			set_style(div52, "display", "none");
    			set_style(div52, "padding-right", "16px");
    			attr_dev(div52, "aria-modal", "true");
    			add_location(div52, file$6, 552, 0, 16572);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*buscarPaciente*/ ctx[1]);
    			append_dev(div14, t4);
    			append_dev(div14, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*fechaInicio*/ ctx[2]);
    			append_dev(div14, t7);
    			append_dev(div14, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t9);
    			append_dev(div2, input2);
    			set_input_value(input2, /*fechaFin*/ ctx[3]);
    			append_dev(div14, t10);
    			append_dev(div14, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t12);
    			append_dev(div3, a);
    			append_dev(a, i0);
    			append_dev(a, t13);
    			append_dev(div14, t14);
    			append_dev(div14, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t16);
    			append_dev(div4, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*sltConsultorios*/ ctx[9]);
    			append_dev(div6, t17);
    			append_dev(div6, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t19);
    			append_dev(div5, select1);
    			append_dev(select1, option0);
    			append_dev(select1, option1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*sltEstado*/ ctx[5]);
    			append_dev(div14, t22);
    			append_dev(div14, div9);
    			append_dev(div9, h1);
    			append_dev(div14, t24);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			if (if_block0) if_block0.m(div12, null);
    			append_dev(div12, t25);
    			append_dev(div12, div10);
    			append_dev(div10, button1);
    			append_dev(div12, t27);
    			append_dev(div12, div11);
    			if (if_block1) if_block1.m(div11, null);
    			append_dev(div12, t28);
    			if (if_block2) if_block2.m(div12, null);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div36);
    			append_dev(div36, div35);
    			append_dev(div35, div34);
    			append_dev(div34, div17);
    			append_dev(div17, h50);
    			append_dev(h50, i1);
    			append_dev(h50, t30);
    			append_dev(div17, t31);
    			append_dev(div17, button2);
    			append_dev(button2, span0);
    			append_dev(div34, t33);
    			append_dev(div34, div32);
    			append_dev(div32, input3);
    			append_dev(div32, t34);
    			append_dev(div32, div19);
    			append_dev(div19, div18);
    			append_dev(div18, label5);
    			append_dev(div18, t36);
    			append_dev(div18, input4);
    			set_input_value(input4, /*pacienteModal*/ ctx[7].nombre);
    			append_dev(div32, t37);
    			append_dev(div32, div21);
    			append_dev(div21, div20);
    			append_dev(div20, label6);
    			append_dev(div20, t39);
    			append_dev(div20, input5);
    			set_input_value(input5, /*pacienteModal*/ ctx[7].apellidos);
    			append_dev(div32, t40);
    			append_dev(div32, div23);
    			append_dev(div23, div22);
    			append_dev(div22, label7);
    			append_dev(div22, t42);
    			append_dev(div22, input6);
    			set_input_value(input6, /*pacienteModal*/ ctx[7].cedula);
    			append_dev(div32, t43);
    			append_dev(div32, div25);
    			append_dev(div25, div24);
    			append_dev(div24, label8);
    			append_dev(div24, t45);
    			append_dev(div24, input7);
    			set_input_value(input7, /*pacienteModal*/ ctx[7].telefono);
    			append_dev(div32, t46);
    			append_dev(div32, div27);
    			append_dev(div27, div26);
    			append_dev(div26, label9);
    			append_dev(div26, t48);
    			append_dev(div26, input8);
    			set_input_value(input8, /*pacienteModal*/ ctx[7].celular);
    			append_dev(div32, t49);
    			append_dev(div32, div29);
    			append_dev(div29, div28);
    			append_dev(div28, label10);
    			append_dev(div28, t51);
    			append_dev(div28, input9);
    			set_input_value(input9, /*pacienteModal*/ ctx[7].email);
    			append_dev(div32, t52);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, label11);
    			append_dev(div30, t54);
    			append_dev(div30, textarea);
    			set_input_value(textarea, /*detallesCita*/ ctx[6].observaciones);
    			append_dev(div32, t55);
    			append_dev(div32, br);
    			append_dev(div34, t56);
    			append_dev(div34, div33);
    			append_dev(div33, button3);
    			insert_dev(target, t58, anchor);
    			insert_dev(target, div52, anchor);
    			append_dev(div52, div51);
    			append_dev(div51, div50);
    			append_dev(div50, div37);
    			append_dev(div37, h51);
    			append_dev(h51, i2);
    			append_dev(h51, t59);
    			append_dev(div37, t60);
    			append_dev(div37, button4);
    			append_dev(button4, span1);
    			append_dev(div50, t62);
    			append_dev(div50, div49);
    			append_dev(div49, div42);
    			append_dev(div42, div39);
    			append_dev(div39, div38);
    			append_dev(div38, label12);
    			append_dev(div38, t64);
    			append_dev(div38, input10);
    			append_dev(div42, t65);
    			append_dev(div42, div41);
    			append_dev(div41, div40);
    			append_dev(div40, label13);
    			append_dev(div40, t67);
    			append_dev(div40, select2);
    			append_dev(select2, option2);
    			append_dev(select2, option3);
    			append_dev(select2, option4);
    			append_dev(div49, t71);
    			append_dev(div49, div48);
    			append_dev(div48, div43);
    			append_dev(div48, t73);
    			append_dev(div48, div47);
    			append_dev(div47, div45);
    			append_dev(div45, div44);
    			append_dev(div47, t75);
    			append_dev(div47, div46);
    			append_dev(div46, button5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[21]),
    					listen_dev(input0, "input", /*cargarCitas*/ ctx[13], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[22]),
    					listen_dev(input1, "input", /*cargarCitas*/ ctx[13], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[23]),
    					listen_dev(input2, "input", /*cargarCitas*/ ctx[13], false, false, false),
    					listen_dev(button0, "click", btnFiltro, false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[24]),
    					listen_dev(select0, "change", /*cargarCitas*/ ctx[13], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[25]),
    					listen_dev(select1, "change", /*cargarCitas*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[26], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[30]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[31]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[32]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[33]),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[34]),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[35]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[36])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buscarPaciente*/ 2 && input0.value !== /*buscarPaciente*/ ctx[1]) {
    				set_input_value(input0, /*buscarPaciente*/ ctx[1]);
    			}

    			if (dirty[0] & /*fechaInicio*/ 4) {
    				set_input_value(input1, /*fechaInicio*/ ctx[2]);
    			}

    			if (dirty[0] & /*fechaFin*/ 8) {
    				set_input_value(input2, /*fechaFin*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*sltConsultorios*/ 512 && a_href_value !== (a_href_value = `https://medapp.nxt-pro.com/solicitud/cita/${/*sltConsultorios*/ ctx[9]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty[0] & /*consultorios*/ 256) {
    				each_value_2 = /*consultorios*/ ctx[8];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*sltConsultorios, consultorios*/ 768) {
    				select_option(select0, /*sltConsultorios*/ ctx[9]);
    			}

    			if (dirty[0] & /*estados*/ 16) {
    				each_value_1 = /*estados*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty[0] & /*sltEstado, estados*/ 48) {
    				select_option(select1, /*sltEstado*/ ctx[5]);
    			}

    			if (!/*citas*/ ctx[0]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div12, t25);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*citas*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div11, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*cargando*/ ctx[10]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div12, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*pacienteModal*/ 128) {
    				set_input_value(input4, /*pacienteModal*/ ctx[7].nombre);
    			}

    			if (dirty[0] & /*pacienteModal*/ 128) {
    				set_input_value(input5, /*pacienteModal*/ ctx[7].apellidos);
    			}

    			if (dirty[0] & /*pacienteModal*/ 128) {
    				set_input_value(input6, /*pacienteModal*/ ctx[7].cedula);
    			}

    			if (dirty[0] & /*pacienteModal*/ 128) {
    				set_input_value(input7, /*pacienteModal*/ ctx[7].telefono);
    			}

    			if (dirty[0] & /*pacienteModal*/ 128) {
    				set_input_value(input8, /*pacienteModal*/ ctx[7].celular);
    			}

    			if (dirty[0] & /*pacienteModal*/ 128 && input9.value !== /*pacienteModal*/ ctx[7].email) {
    				set_input_value(input9, /*pacienteModal*/ ctx[7].email);
    			}

    			if (dirty[0] & /*detallesCita*/ 64) {
    				set_input_value(textarea, /*detallesCita*/ ctx[6].observaciones);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t58);
    			if (detaching) detach_dev(div52);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function filtroObjeto(obj) {
    	let a = new Object();

    	for (const i in obj) {
    		if (obj[i] != null && obj[i] != "") {
    			a[i] = obj[i];
    		}
    	}

    	return a;
    }

    function colorEstado(code) {
    	if (code == "p") {
    		return "badge-secondary";
    	}

    	if (code == "t") {
    		return "badge-primary";
    	}

    	if (code == "Nueva") {
    		return "badge-success";
    	}

    	if (code == "Cancelada / Renegada") {
    		return "badge-danger";
    	}

    	if (code == "Confirmada") {
    		return "badge-primary";
    	}
    }

    function btnFiltro() {
    	jQuery("#filtroAvanzado").slideToggle(500);
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $axios;
    	let $session;
    	let $activePage;
    	let $errorConexion;
    	validate_store(axios$2, "axios");
    	component_subscribe($$self, axios$2, $$value => $$invalidate(14, $axios = $$value));
    	validate_store(session, "session");
    	component_subscribe($$self, session, $$value => $$invalidate(15, $session = $$value));
    	validate_store(activePage, "activePage");
    	component_subscribe($$self, activePage, $$value => $$invalidate(16, $activePage = $$value));
    	validate_store(errorConexion, "errorConexion");
    	component_subscribe($$self, errorConexion, $$value => $$invalidate(17, $errorConexion = $$value));
    	let citas = [];
    	let buscarPaciente = "";
    	let tiempoRecarga = 1800000;
    	let fechaInicio = new Date().toISOString().split("T")[0];
    	let fechaFin = new Date().toISOString().split("T")[0];
    	let estados = [];
    	let sltEstado = "";
    	let detallesCita = [];
    	let pacienteModal = [];
    	let consultorios = [];
    	let sltConsultorios = "";
    	let cargando = false;

    	set_store_value(
    		axios$2,
    		$axios.defaults.headers.common = {
    			Authorization: $session.authorizationHeader.Authorization
    		},
    		$axios
    	);

    	set_store_value(activePage, $activePage = "citasProgramadas");

    	onMount(() => {
    		cargarConsultorios();
    		moment.locale("es-DO");

    		setInterval(
    			() => {
    				cargarCitas();
    				console.log("Refrescando");
    			},
    			tiempoRecarga
    		);

    		cargarEstados();
    	});

    	function cargarConsultorios() {
    		$axios.get(`users/consultorios`).then(res => {
    			$$invalidate(8, consultorios = res.data);
    			$$invalidate(9, sltConsultorios = consultorios[0].consultorioId);
    			cargarCitas();
    		});
    	}

    	function cambiarEstado(idCita, estado) {
    		switch (estado) {
    			case "eliminar":
    				sweetalert2_all.fire({
    					title: "Estas seguro?",
    					text: "Estas a punto de cancelar una cita!",
    					icon: "warning",
    					showCancelButton: true,
    					confirmButtonColor: "#3085d6",
    					cancelButtonColor: "#d33",
    					confirmButtonText: "Si!",
    					cancelButtonText: "No"
    				}).then(result => {
    					if (result.isConfirmed) {
    						$axios.put(`/citas/${idCita}/establecerEstado`, { estadoId: "X" }).then(res => {
    							cargarCitas();
    							sweetalert2_all.fire("Cancelada!", "La cita se ha cancelado con exito", "success");
    						});
    					}
    				});
    				break;
    			case "confirmar":
    				sweetalert2_all.fire({
    					title: "Estas seguro?",
    					text: "Deseas confirmar la cita!",
    					icon: "warning",
    					showCancelButton: true,
    					confirmButtonColor: "#3085d6",
    					cancelButtonColor: "#d33",
    					confirmButtonText: "Si!",
    					cancelButtonText: "No"
    				}).then(result => {
    					if (result.isConfirmed) {
    						$axios.put(`/citas/${idCita}/establecerEstado`, { estadoId: "C" }).then(res => {
    							cargarCitas();
    							sweetalert2_all.fire("Confirmada!", "Se ha realizado la cita", "success");
    						});
    					}
    				});
    				break;
    		}
    	}

    	function editarPaciente(idCita) {
    		$axios.get(`citas/${idCita}`).then(res => {
    			$$invalidate(6, detallesCita = res.data);
    			$$invalidate(7, pacienteModal = res.data.paciente);
    		});
    	}

    	function cargarEstados() {
    		$axios.get("estadosCita").then(res => {
    			$$invalidate(4, estados = res.data);
    		});
    	}

    	function cargarCitas() {
    		$$invalidate(10, cargando = true);

    		let filtro = {
    			consultorioId: sltConsultorios,
    			paciente: buscarPaciente,
    			aseguradoraId: null,
    			fechaInicio,
    			fechaFin,
    			estadoId: sltEstado
    		};

    		let filtrado = filtroObjeto(filtro);
    		let qs = new URLSearchParams(filtrado).toString();

    		setTimeout(
    			() => {
    				$axios.get("citas?" + qs).then(res => {
    					$$invalidate(0, citas = res.data);

    					if (res.data) {
    						$$invalidate(10, cargando = false);
    					}
    				}).catch(err => {
    					$$invalidate(10, cargando = false);
    					console.error(err);
    					$errorConexion();
    				});
    			},
    			1000
    		);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Gestion> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Gestion", $$slots, []);

    	function input0_input_handler() {
    		buscarPaciente = this.value;
    		$$invalidate(1, buscarPaciente);
    	}

    	function input1_input_handler() {
    		fechaInicio = this.value;
    		$$invalidate(2, fechaInicio);
    	}

    	function input2_input_handler() {
    		fechaFin = this.value;
    		$$invalidate(3, fechaFin);
    	}

    	function select0_change_handler() {
    		sltConsultorios = select_value(this);
    		$$invalidate(9, sltConsultorios);
    		$$invalidate(8, consultorios);
    	}

    	function select1_change_handler() {
    		sltEstado = select_value(this);
    		$$invalidate(5, sltEstado);
    		$$invalidate(4, estados);
    	}

    	const click_handler = () => window.print();
    	const click_handler_1 = cita => editarPaciente(cita.id);
    	const click_handler_2 = cita => cambiarEstado(cita.id, "eliminar");
    	const click_handler_3 = cita => cambiarEstado(cita.id, "confirmar");

    	function input4_input_handler() {
    		pacienteModal.nombre = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function input5_input_handler() {
    		pacienteModal.apellidos = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function input6_input_handler() {
    		pacienteModal.cedula = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function input7_input_handler() {
    		pacienteModal.telefono = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function input8_input_handler() {
    		pacienteModal.celular = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function input9_input_handler() {
    		pacienteModal.email = this.value;
    		$$invalidate(7, pacienteModal);
    	}

    	function textarea_input_handler() {
    		detallesCita.observaciones = this.value;
    		$$invalidate(6, detallesCita);
    	}

    	$$self.$capture_state = () => ({
    		Aside,
    		Header,
    		connection,
    		activePage,
    		session,
    		axios: axios$2,
    		dataCita,
    		errorConexion,
    		toast,
    		onMount,
    		push,
    		moment,
    		Swal: sweetalert2_all,
    		citas,
    		buscarPaciente,
    		tiempoRecarga,
    		fechaInicio,
    		fechaFin,
    		estados,
    		sltEstado,
    		detallesCita,
    		pacienteModal,
    		consultorios,
    		sltConsultorios,
    		cargando,
    		filtroObjeto,
    		colorEstado,
    		cargarConsultorios,
    		cambiarEstado,
    		editarPaciente,
    		cargarEstados,
    		cargarCitas,
    		btnFiltro,
    		$axios,
    		$session,
    		$activePage,
    		$errorConexion
    	});

    	$$self.$inject_state = $$props => {
    		if ("citas" in $$props) $$invalidate(0, citas = $$props.citas);
    		if ("buscarPaciente" in $$props) $$invalidate(1, buscarPaciente = $$props.buscarPaciente);
    		if ("tiempoRecarga" in $$props) tiempoRecarga = $$props.tiempoRecarga;
    		if ("fechaInicio" in $$props) $$invalidate(2, fechaInicio = $$props.fechaInicio);
    		if ("fechaFin" in $$props) $$invalidate(3, fechaFin = $$props.fechaFin);
    		if ("estados" in $$props) $$invalidate(4, estados = $$props.estados);
    		if ("sltEstado" in $$props) $$invalidate(5, sltEstado = $$props.sltEstado);
    		if ("detallesCita" in $$props) $$invalidate(6, detallesCita = $$props.detallesCita);
    		if ("pacienteModal" in $$props) $$invalidate(7, pacienteModal = $$props.pacienteModal);
    		if ("consultorios" in $$props) $$invalidate(8, consultorios = $$props.consultorios);
    		if ("sltConsultorios" in $$props) $$invalidate(9, sltConsultorios = $$props.sltConsultorios);
    		if ("cargando" in $$props) $$invalidate(10, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		citas,
    		buscarPaciente,
    		fechaInicio,
    		fechaFin,
    		estados,
    		sltEstado,
    		detallesCita,
    		pacienteModal,
    		consultorios,
    		sltConsultorios,
    		cargando,
    		cambiarEstado,
    		editarPaciente,
    		cargarCitas,
    		$axios,
    		$session,
    		$activePage,
    		$errorConexion,
    		tiempoRecarga,
    		cargarConsultorios,
    		cargarEstados,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler,
    		textarea_input_handler
    	];
    }

    class Gestion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gestion",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Pages/Mantenimiento/Consultorios.svelte generated by Svelte v3.23.0 */
    const file$7 = "src/Pages/Mantenimiento/Consultorios.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (73:36) {#each consultorios as consultorio}
    function create_each_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let div1;
    	let div0;
    	let span0;
    	let t0_value = /*consultorio*/ ctx[15].descripcion[0] + "";
    	let t0;
    	let t1_value = /*consultorio*/ ctx[15].descripcion[1] + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*consultorio*/ ctx[15].descripcion + "";
    	let t3;
    	let t4;
    	let td1;
    	let t5_value = (/*consultorio*/ ctx[15].empresa || "N/A") + "";
    	let t5;
    	let t6;
    	let td2;
    	let a;
    	let i;
    	let t7;
    	let a_href_value;
    	let link_action;
    	let t8;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			td1 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td2 = element("td");
    			a = element("a");
    			i = element("i");
    			t7 = text(" Horario");
    			t8 = space();
    			attr_dev(span0, "class", "avatar-title rounded-circle ");
    			add_location(span0, file$7, 78, 53, 2802);
    			attr_dev(div0, "class", "avatar avatar-sm");
    			add_location(div0, file$7, 77, 51, 2718);
    			attr_dev(div1, "class", "avatar avatar-sm mr-2 d-block-sm");
    			add_location(div1, file$7, 76, 49, 2620);
    			add_location(span1, file$7, 81, 49, 3072);
    			add_location(td0, file$7, 75, 45, 2566);
    			add_location(td1, file$7, 83, 45, 3209);
    			attr_dev(i, "class", "mdi mdi-calendar-multiselect");
    			add_location(i, file$7, 84, 144, 3393);
    			attr_dev(a, "class", "btn btn-primary btn-sm");
    			attr_dev(a, "href", a_href_value = "/Mantenimiento/Consultorios/" + /*consultorio*/ ctx[15].id);
    			add_location(a, file$7, 84, 49, 3298);
    			add_location(td2, file$7, 84, 45, 3294);
    			add_location(tr, file$7, 74, 41, 2516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(td0, t2);
    			append_dev(td0, span1);
    			append_dev(span1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td1);
    			append_dev(td1, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(td2, a);
    			append_dev(a, i);
    			append_dev(a, t7);
    			append_dev(tr, t8);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*consultorios*/ 1 && t0_value !== (t0_value = /*consultorio*/ ctx[15].descripcion[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*consultorios*/ 1 && t1_value !== (t1_value = /*consultorio*/ ctx[15].descripcion[1] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*consultorios*/ 1 && t3_value !== (t3_value = /*consultorio*/ ctx[15].descripcion + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*consultorios*/ 1 && t5_value !== (t5_value = (/*consultorio*/ ctx[15].empresa || "N/A") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*consultorios*/ 1 && a_href_value !== (a_href_value = "/Mantenimiento/Consultorios/" + /*consultorio*/ ctx[15].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(73:36) {#each consultorios as consultorio}",
    		ctx
    	});

    	return block;
    }

    // (141:24) {#each empresas as empresa}
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = /*empresa*/ ctx[12].nombre + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*empresa*/ ctx[12].id;
    			option.value = option.__value;
    			add_location(option, file$7, 142, 29, 5641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*empresas*/ 2 && t_value !== (t_value = /*empresa*/ ctx[12].nombre + "")) set_data_dev(t, t_value);

    			if (dirty & /*empresas*/ 2 && option_value_value !== (option_value_value = /*empresa*/ ctx[12].id)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(141:24) {#each empresas as empresa}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let section;
    	let div5;
    	let h4;
    	let t2;
    	let button0;
    	let i;
    	let t3;
    	let t4;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t9;
    	let tbody;
    	let t10;
    	let form;
    	let div14;
    	let div13;
    	let div12;
    	let div6;
    	let h5;
    	let t12;
    	let button1;
    	let span;
    	let t14;
    	let div10;
    	let input0;
    	let t15;
    	let div9;
    	let div7;
    	let label0;
    	let t17;
    	let input1;
    	let t18;
    	let div8;
    	let label1;
    	let t20;
    	let select;
    	let option;
    	let t22;
    	let div11;
    	let button2;
    	let t24;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	const aside = new Aside({ $$inline: true });
    	const header = new Header({ $$inline: true });
    	let each_value_1 = /*consultorios*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*empresas*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div5 = element("div");
    			h4 = element("h4");
    			t2 = text("Consultorios ");
    			button0 = element("button");
    			i = element("i");
    			t3 = text(" AGREGAR CONSULTORIO");
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Nombre";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Empresa";
    			t8 = space();
    			th2 = element("th");
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			form = element("form");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div6 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Nuevo Consultorio";
    			t12 = space();
    			button1 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t14 = space();
    			div10 = element("div");
    			input0 = element("input");
    			t15 = space();
    			div9 = element("div");
    			div7 = element("div");
    			label0 = element("label");
    			label0.textContent = "Descripcion";
    			t17 = space();
    			input1 = element("input");
    			t18 = space();
    			div8 = element("div");
    			label1 = element("label");
    			label1.textContent = "Empresa";
    			t20 = space();
    			select = element("select");
    			option = element("option");
    			option.textContent = "- Seleccionar -";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			div11 = element("div");
    			button2 = element("button");
    			button2.textContent = "Cerrar";
    			t24 = space();
    			button3 = element("button");
    			button3.textContent = "Guardar";
    			attr_dev(i, "class", "mdi mdi-briefcase-plus");
    			add_location(i, file$7, 56, 51, 1635);
    			attr_dev(button0, "class", "btn btn-primary btn-sm");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalAgregarConsultorio");
    			add_location(button0, file$7, 55, 38, 1525);
    			attr_dev(h4, "class", "mb-3");
    			add_location(h4, file$7, 55, 8, 1495);
    			add_location(th0, file$7, 66, 40, 2094);
    			add_location(th1, file$7, 67, 40, 2150);
    			add_location(th2, file$7, 68, 40, 2207);
    			add_location(tr, file$7, 65, 36, 2049);
    			add_location(thead, file$7, 64, 32, 2005);
    			add_location(tbody, file$7, 71, 32, 2332);
    			attr_dev(table, "class", "table table-hover ");
    			add_location(table, file$7, 63, 28, 1938);
    			attr_dev(div0, "class", "table-responsive");
    			add_location(div0, file$7, 61, 24, 1878);
    			attr_dev(div1, "class", "col-lg-12 mt-3");
    			add_location(div1, file$7, 60, 20, 1825);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$7, 59, 16, 1787);
    			attr_dev(div3, "class", "card-body");
    			add_location(div3, file$7, 58, 12, 1747);
    			attr_dev(div4, "class", "card");
    			add_location(div4, file$7, 57, 8, 1716);
    			attr_dev(div5, "class", "container mt-3");
    			add_location(div5, file$7, 54, 6, 1458);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$7, 53, 4, 1420);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$7, 51, 2, 1375);
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalAgregarConsultorioLabel");
    			add_location(h5, file$7, 109, 12, 4251);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$7, 115, 14, 4491);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$7, 110, 12, 4344);
    			attr_dev(div6, "class", "modal-header");
    			add_location(div6, file$7, 108, 10, 4212);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "IdUser");
    			input0.value = "0";
    			add_location(input0, file$7, 120, 14, 4673);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$7, 124, 18, 4842);
    			attr_dev(input1, "type", "name");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Dr. Juan Perez");
    			attr_dev(input1, "maxlength", "200");
    			input1.required = true;
    			add_location(input1, file$7, 125, 18, 4894);
    			attr_dev(div7, "class", "form-group col-md-12");
    			add_location(div7, file$7, 123, 16, 4789);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$7, 135, 20, 5262);
    			option.__value = "";
    			option.value = option.__value;
    			option.disabled = true;
    			option.selected = true;
    			add_location(option, file$7, 139, 22, 5449);
    			attr_dev(select, "class", "form-control");
    			select.required = true;
    			if (/*empresaConsultorio*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[11].call(select));
    			add_location(select, file$7, 136, 20, 5312);
    			attr_dev(div8, "class", "form-group col-md-12");
    			add_location(div8, file$7, 134, 16, 5207);
    			attr_dev(div9, "class", "form-row");
    			add_location(div9, file$7, 122, 14, 4750);
    			attr_dev(div10, "class", "modal-body");
    			set_style(div10, "height", "100%", 1);
    			set_style(div10, "top", "0");
    			set_style(div10, "overflow", "auto");
    			add_location(div10, file$7, 118, 10, 4574);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-secondary");
    			attr_dev(button2, "data-dismiss", "modal");
    			add_location(button2, file$7, 150, 14, 5875);
    			attr_dev(button3, "type", "submit");
    			attr_dev(button3, "class", "btn btn-success");
    			add_location(button3, file$7, 155, 14, 6038);
    			attr_dev(div11, "class", "modal-footer");
    			add_location(div11, file$7, 149, 12, 5834);
    			attr_dev(div12, "class", "modal-content");
    			add_location(div12, file$7, 107, 8, 4174);
    			attr_dev(div13, "class", "modal-dialog");
    			attr_dev(div13, "role", "document");
    			add_location(div13, file$7, 106, 6, 4123);
    			attr_dev(div14, "class", "modal fade modal-slide-right");
    			attr_dev(div14, "id", "modalAgregarConsultorio");
    			attr_dev(div14, "tabindex", "-1");
    			attr_dev(div14, "role", "dialog");
    			attr_dev(div14, "aria-labelledby", "modalAgregarConsultorioLabel");
    			set_style(div14, "display", "none");
    			set_style(div14, "padding-right", "16px");
    			attr_dev(div14, "aria-modal", "true");
    			add_location(div14, file$7, 99, 4, 3872);
    			attr_dev(form, "id", "frmUsuario");
    			attr_dev(form, "autocomplete", "off");
    			add_location(form, file$7, 98, 2, 3782);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div5);
    			append_dev(div5, h4);
    			append_dev(h4, t2);
    			append_dev(h4, button0);
    			append_dev(button0, i);
    			append_dev(button0, t3);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody, null);
    			}

    			insert_dev(target, t10, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div6);
    			append_dev(div6, h5);
    			append_dev(div6, t12);
    			append_dev(div6, button1);
    			append_dev(button1, span);
    			append_dev(div12, t14);
    			append_dev(div12, div10);
    			append_dev(div10, input0);
    			append_dev(div10, t15);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, label0);
    			append_dev(div7, t17);
    			append_dev(div7, input1);
    			set_input_value(input1, /*descripcionConsultorio*/ ctx[2]);
    			append_dev(div9, t18);
    			append_dev(div9, div8);
    			append_dev(div8, label1);
    			append_dev(div8, t20);
    			append_dev(div8, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*empresaConsultorio*/ ctx[3]);
    			append_dev(div12, t22);
    			append_dev(div12, div11);
    			append_dev(div11, button2);
    			append_dev(div11, t24);
    			append_dev(div11, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*crearConsultorio*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*consultorios*/ 1) {
    				each_value_1 = /*consultorios*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*descripcionConsultorio*/ 4) {
    				set_input_value(input1, /*descripcionConsultorio*/ ctx[2]);
    			}

    			if (dirty & /*empresas*/ 2) {
    				each_value = /*empresas*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*empresaConsultorio, empresas*/ 10) {
    				select_option(select, /*empresaConsultorio*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $axios;
    	let $session;
    	let $toast;
    	validate_store(axios$2, "axios");
    	component_subscribe($$self, axios$2, $$value => $$invalidate(5, $axios = $$value));
    	validate_store(session, "session");
    	component_subscribe($$self, session, $$value => $$invalidate(6, $session = $$value));
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(7, $toast = $$value));
    	let consultorios = [];
    	let empresas = [];
    	let descripcionConsultorio = "";
    	let empresaConsultorio = "";

    	set_store_value(
    		axios$2,
    		$axios.defaults.headers.common = {
    			Authorization: $session.authorizationHeader.Authorization
    		},
    		$axios
    	);

    	onMount(() => {
    		cargarConsultorios();
    		cargarEmpresas();
    	});

    	function cargarConsultorios() {
    		$axios.get("/consultorios").then(res => {
    			$$invalidate(0, consultorios = res.data);
    		});
    	}

    	function cargarEmpresas() {
    		$axios.get("/empresas").then(res => {
    			$$invalidate(1, empresas = res.data);
    		});
    	}

    	function crearConsultorio() {
    		let consultorio = {
    			empresaId: empresaConsultorio,
    			descripcion: descripcionConsultorio
    		};

    		$axios.post("/consultorios", consultorio).then(res => {
    			cargarConsultorios();

    			$toast(5000).fire({
    				icon: "success",
    				title: "Se agrego el consultorio"
    			});

    			jQuery("#modalAgregarConsultorio").modal("hide");
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Consultorios> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Consultorios", $$slots, []);

    	function input1_input_handler() {
    		descripcionConsultorio = this.value;
    		$$invalidate(2, descripcionConsultorio);
    	}

    	function select_change_handler() {
    		empresaConsultorio = select_value(this);
    		$$invalidate(3, empresaConsultorio);
    		$$invalidate(1, empresas);
    	}

    	$$self.$capture_state = () => ({
    		Aside,
    		Header,
    		activePage,
    		session,
    		axios: axios$2,
    		toast,
    		onMount,
    		push,
    		link,
    		consultorios,
    		empresas,
    		descripcionConsultorio,
    		empresaConsultorio,
    		cargarConsultorios,
    		cargarEmpresas,
    		crearConsultorio,
    		$axios,
    		$session,
    		$toast
    	});

    	$$self.$inject_state = $$props => {
    		if ("consultorios" in $$props) $$invalidate(0, consultorios = $$props.consultorios);
    		if ("empresas" in $$props) $$invalidate(1, empresas = $$props.empresas);
    		if ("descripcionConsultorio" in $$props) $$invalidate(2, descripcionConsultorio = $$props.descripcionConsultorio);
    		if ("empresaConsultorio" in $$props) $$invalidate(3, empresaConsultorio = $$props.empresaConsultorio);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		consultorios,
    		empresas,
    		descripcionConsultorio,
    		empresaConsultorio,
    		crearConsultorio,
    		$axios,
    		$session,
    		$toast,
    		cargarConsultorios,
    		cargarEmpresas,
    		input1_input_handler,
    		select_change_handler
    	];
    }

    class Consultorios extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Consultorios",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Pages/Mantenimiento/Consultorio.svelte generated by Svelte v3.23.0 */
    const file$8 = "src/Pages/Mantenimiento/Consultorio.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    // (160:40) {#each usuarios as usuario}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*usuario*/ ctx[32].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*usuario*/ ctx[32].id;
    			option.value = option.__value;
    			add_location(option, file$8, 161, 45, 5857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*usuarios*/ 64 && t_value !== (t_value = /*usuario*/ ctx[32].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*usuarios*/ 64 && option_value_value !== (option_value_value = /*usuario*/ ctx[32].id)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(160:40) {#each usuarios as usuario}",
    		ctx
    	});

    	return block;
    }

    // (179:48) {#each asistentes as asistente}
    function create_each_block_2$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*asistente*/ ctx[29].prefix + "";
    	let t0;
    	let t1;
    	let t2_value = /*asistente*/ ctx[29].name + "";
    	let t2;
    	let t3;
    	let td1;
    	let button;
    	let i;
    	let t4;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			td1 = element("td");
    			button = element("button");
    			i = element("i");
    			t4 = space();
    			add_location(td0, file$8, 181, 57, 7031);
    			attr_dev(i, "class", "mdi mdi-trash-can-outline");
    			add_location(i, file$8, 182, 118, 7194);
    			attr_dev(button, "class", "btn btn-danger btn-sm");
    			add_location(button, file$8, 182, 80, 7156);
    			attr_dev(td1, "class", "text-right");
    			add_location(td1, file$8, 182, 57, 7133);
    			add_location(tr, file$8, 180, 53, 6969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(td0, t1);
    			append_dev(td0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(td1, button);
    			append_dev(button, i);
    			append_dev(tr, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*asistentes*/ 32 && t0_value !== (t0_value = /*asistente*/ ctx[29].prefix + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*asistentes*/ 32 && t2_value !== (t2_value = /*asistente*/ ctx[29].name + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(179:48) {#each asistentes as asistente}",
    		ctx
    	});

    	return block;
    }

    // (258:48) {#each horarios as horario}
    function create_each_block_1$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*horario*/ ctx[26].diaSemana + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = convertirHora(/*horario*/ ctx[26].horaInicio) + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = convertirHora(/*horario*/ ctx[26].horaFin) + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6;
    	let t7_value = /*horario*/ ctx[26].intervalo + "";
    	let t7;
    	let t8;
    	let t9;
    	let th;
    	let t10;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text("Cada ");
    			t7 = text(t7_value);
    			t8 = text("/min");
    			t9 = space();
    			th = element("th");
    			t10 = space();
    			add_location(td0, file$8, 260, 57, 11352);
    			add_location(td1, file$8, 261, 57, 11438);
    			add_location(td2, file$8, 262, 57, 11540);
    			add_location(td3, file$8, 263, 57, 11639);
    			add_location(th, file$8, 264, 57, 11734);
    			add_location(tr, file$8, 259, 53, 11290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(td3, t7);
    			append_dev(td3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, th);
    			append_dev(tr, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*horarios*/ 8 && t0_value !== (t0_value = /*horario*/ ctx[26].diaSemana + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*horarios*/ 8 && t2_value !== (t2_value = convertirHora(/*horario*/ ctx[26].horaInicio) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*horarios*/ 8 && t4_value !== (t4_value = convertirHora(/*horario*/ ctx[26].horaFin) + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*horarios*/ 8 && t7_value !== (t7_value = /*horario*/ ctx[26].intervalo + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(258:48) {#each horarios as horario}",
    		ctx
    	});

    	return block;
    }

    // (317:32) {#each dias as dia}
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*dia*/ ctx[8].descripcion + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*dia*/ ctx[8].id;
    			option.value = option.__value;
    			add_location(option, file$8, 318, 36, 13919);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(317:32) {#each dias as dia}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let section;
    	let div23;
    	let div22;
    	let div7;
    	let div6;
    	let div0;
    	let t2;
    	let div5;
    	let div3;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t3;
    	let h3;
    	let t4;
    	let t5;
    	let div4;
    	let t6;
    	let p0;
    	let t7;
    	let p1;
    	let t8;
    	let p2;
    	let t9;
    	let div15;
    	let div14;
    	let h50;
    	let t11;
    	let div9;
    	let div8;
    	let select0;
    	let option0;
    	let t13;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let table0;
    	let thead0;
    	let tr0;
    	let th0;
    	let t15;
    	let th1;
    	let t16;
    	let tbody0;
    	let t17;
    	let div21;
    	let div20;
    	let h51;
    	let t18;
    	let button0;
    	let i;
    	let t19;
    	let t20;
    	let div19;
    	let div18;
    	let div17;
    	let div16;
    	let table1;
    	let thead1;
    	let tr1;
    	let th2;
    	let t22;
    	let th3;
    	let t24;
    	let th4;
    	let t26;
    	let th5;
    	let t28;
    	let th6;
    	let t29;
    	let tbody1;
    	let t30;
    	let form;
    	let div34;
    	let div33;
    	let div32;
    	let div24;
    	let h52;
    	let t32;
    	let button1;
    	let span;
    	let t34;
    	let div30;
    	let input0;
    	let t35;
    	let div29;
    	let div25;
    	let label0;
    	let t37;
    	let select1;
    	let option1;
    	let t39;
    	let div26;
    	let label1;
    	let t41;
    	let input1;
    	let t42;
    	let div27;
    	let label2;
    	let t44;
    	let input2;
    	let t45;
    	let div28;
    	let label3;
    	let t47;
    	let input3;
    	let t48;
    	let div31;
    	let button2;
    	let t50;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	const aside = new Aside({ $$inline: true });
    	const header = new Header({ $$inline: true });
    	let each_value_3 = /*usuarios*/ ctx[6];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*asistentes*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*horarios*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*dias*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div23 = element("div");
    			div22 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t3 = space();
    			h3 = element("h3");
    			t4 = text(/*nombreConsultorio*/ ctx[4]);
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			p0 = element("p");
    			t7 = space();
    			p1 = element("p");
    			t8 = space();
    			p2 = element("p");
    			t9 = space();
    			div15 = element("div");
    			div14 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Asistentes";
    			t11 = space();
    			div9 = element("div");
    			div8 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "- seleccionar usuario - ";

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t13 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			table0 = element("table");
    			thead0 = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Nombre";
    			t15 = space();
    			th1 = element("th");
    			t16 = space();
    			tbody0 = element("tbody");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t17 = space();
    			div21 = element("div");
    			div20 = element("div");
    			h51 = element("h5");
    			t18 = text("Horarios ");
    			button0 = element("button");
    			i = element("i");
    			t19 = text(" AGREGAR");
    			t20 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			table1 = element("table");
    			thead1 = element("thead");
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Dia";
    			t22 = space();
    			th3 = element("th");
    			th3.textContent = "Inicia";
    			t24 = space();
    			th4 = element("th");
    			th4.textContent = "Termina";
    			t26 = space();
    			th5 = element("th");
    			th5.textContent = "Intervalo";
    			t28 = space();
    			th6 = element("th");
    			t29 = space();
    			tbody1 = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t30 = space();
    			form = element("form");
    			div34 = element("div");
    			div33 = element("div");
    			div32 = element("div");
    			div24 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Agregar horario";
    			t32 = space();
    			button1 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t34 = space();
    			div30 = element("div");
    			input0 = element("input");
    			t35 = space();
    			div29 = element("div");
    			div25 = element("div");
    			label0 = element("label");
    			label0.textContent = "Dia";
    			t37 = space();
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "- Seleccionar -";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t39 = space();
    			div26 = element("div");
    			label1 = element("label");
    			label1.textContent = "Hora de inicio";
    			t41 = space();
    			input1 = element("input");
    			t42 = space();
    			div27 = element("div");
    			label2 = element("label");
    			label2.textContent = "Hora fin";
    			t44 = space();
    			input2 = element("input");
    			t45 = space();
    			div28 = element("div");
    			label3 = element("label");
    			label3.textContent = "Intervalo (minutos)";
    			t47 = space();
    			input3 = element("input");
    			t48 = space();
    			div31 = element("div");
    			button2 = element("button");
    			button2.textContent = "Cerrar";
    			t50 = space();
    			button3 = element("button");
    			button3.textContent = "Guardar";
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$8, 124, 24, 3492);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "assets/img/users/user-5.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "name");
    			add_location(img, file$8, 128, 80, 3744);
    			attr_dev(div1, "class", "avatar avatar-xl avatar-online");
    			add_location(div1, file$8, 128, 36, 3700);
    			add_location(div2, file$8, 127, 32, 3658);
    			attr_dev(h3, "class", "p-t-10 searchBy-name");
    			add_location(h3, file$8, 131, 32, 3950);
    			attr_dev(div3, "class", "text-center");
    			add_location(div3, file$8, 126, 28, 3600);
    			attr_dev(div4, "class", "text-muted text-center");
    			add_location(div4, file$8, 133, 28, 4071);
    			attr_dev(p0, "class", "text-muted text-center");
    			set_style(p0, "margin-bottom", "0px");
    			add_location(p0, file$8, 134, 28, 4142);
    			attr_dev(p1, "class", "text-muted text-center");
    			set_style(p1, "margin-bottom", "0px");
    			add_location(p1, file$8, 135, 28, 4237);
    			attr_dev(p2, "class", "text-muted text-center");
    			add_location(p2, file$8, 136, 28, 4332);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$8, 125, 24, 3548);
    			attr_dev(div6, "class", "card m-b-30");
    			add_location(div6, file$8, 123, 20, 3442);
    			attr_dev(div7, "class", "col-sm-12 col-lg-4");
    			add_location(div7, file$8, 122, 16, 3389);
    			attr_dev(h50, "class", "card-header");
    			add_location(h50, file$8, 152, 24, 5211);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			option0.disabled = true;
    			add_location(option0, file$8, 158, 40, 5607);
    			attr_dev(select0, "id", "");
    			attr_dev(select0, "class", "form-control form-control-sm");
    			if (/*sltAsistente*/ ctx[7] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[19].call(select0));
    			add_location(select0, file$8, 157, 36, 5451);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$8, 156, 32, 5390);
    			attr_dev(div9, "class", "card-controls");
    			add_location(div9, file$8, 155, 24, 5330);
    			add_location(th0, file$8, 173, 52, 6527);
    			add_location(th1, file$8, 174, 52, 6595);
    			add_location(tr0, file$8, 172, 48, 6470);
    			add_location(thead0, file$8, 171, 44, 6414);
    			add_location(tbody0, file$8, 177, 44, 6753);
    			attr_dev(table0, "class", "table table-hover ");
    			add_location(table0, file$8, 170, 40, 6335);
    			attr_dev(div10, "class", "table-responsive");
    			add_location(div10, file$8, 169, 36, 6264);
    			attr_dev(div11, "class", "col-lg-12 mt-3");
    			add_location(div11, file$8, 168, 32, 6199);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$8, 167, 28, 6149);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$8, 166, 24, 6097);
    			attr_dev(div14, "class", "card mb-4");
    			add_location(div14, file$8, 151, 20, 5163);
    			attr_dev(div15, "class", "col-lg-8");
    			add_location(div15, file$8, 150, 16, 5120);
    			attr_dev(i, "class", "mdi mdi-calendar-plus");
    			add_location(i, file$8, 240, 33, 10110);
    			attr_dev(button0, "class", "btn btn-primary btn-sm");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalAgregarHorario");
    			add_location(button0, file$8, 236, 37, 9887);
    			attr_dev(h51, "class", "card-header");
    			add_location(h51, file$8, 235, 24, 9825);
    			add_location(th2, file$8, 249, 52, 10647);
    			add_location(th3, file$8, 250, 52, 10712);
    			add_location(th4, file$8, 251, 52, 10780);
    			add_location(th5, file$8, 252, 52, 10849);
    			add_location(th6, file$8, 253, 52, 10920);
    			add_location(tr1, file$8, 248, 48, 10590);
    			add_location(thead1, file$8, 247, 44, 10534);
    			add_location(tbody1, file$8, 256, 44, 11078);
    			attr_dev(table1, "class", "table table-hover ");
    			add_location(table1, file$8, 246, 40, 10455);
    			attr_dev(div16, "class", "table-responsive");
    			add_location(div16, file$8, 245, 36, 10384);
    			attr_dev(div17, "class", "col-lg-12 mt-3");
    			add_location(div17, file$8, 244, 32, 10319);
    			attr_dev(div18, "class", "row");
    			add_location(div18, file$8, 243, 28, 10269);
    			attr_dev(div19, "class", "card-body");
    			add_location(div19, file$8, 242, 24, 10217);
    			attr_dev(div20, "class", "card mb-4");
    			add_location(div20, file$8, 234, 20, 9777);
    			attr_dev(div21, "class", "col-lg-6 mt-4");
    			add_location(div21, file$8, 233, 16, 9729);
    			attr_dev(div22, "class", "row");
    			add_location(div22, file$8, 121, 12, 3355);
    			attr_dev(div23, "class", "container mt-3");
    			add_location(div23, file$8, 120, 8, 3314);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$8, 119, 4, 3274);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$8, 117, 0, 3229);
    			attr_dev(h52, "class", "modal-title");
    			attr_dev(h52, "id", "modalAgregarHorarioLabel");
    			add_location(h52, file$8, 292, 20, 12713);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$8, 300, 24, 13051);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$8, 295, 20, 12854);
    			attr_dev(div24, "class", "modal-header");
    			add_location(div24, file$8, 291, 16, 12666);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "IdUser");
    			input0.value = "0";
    			add_location(input0, file$8, 306, 20, 13296);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$8, 310, 28, 13475);
    			option1.__value = "";
    			option1.value = option1.__value;
    			option1.disabled = true;
    			option1.selected = true;
    			add_location(option1, file$8, 315, 32, 13713);
    			attr_dev(select1, "class", "form-control");
    			select1.required = true;
    			if (/*dia*/ ctx[8] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[20].call(select1));
    			add_location(select1, file$8, 311, 28, 13529);
    			attr_dev(div25, "class", "form-group col-md-12");
    			add_location(div25, file$8, 309, 24, 13412);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$8, 324, 28, 14206);
    			attr_dev(input1, "class", "form-control");
    			input1.required = true;
    			attr_dev(input1, "type", "time");
    			add_location(input1, file$8, 325, 28, 14271);
    			attr_dev(div26, "class", "form-group col-md-12");
    			add_location(div26, file$8, 323, 24, 14143);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$8, 331, 28, 14560);
    			attr_dev(input2, "class", "form-control");
    			input2.required = true;
    			attr_dev(input2, "type", "time");
    			add_location(input2, file$8, 332, 28, 14619);
    			attr_dev(div27, "class", "form-group col-md-12");
    			add_location(div27, file$8, 330, 24, 14497);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$8, 338, 28, 14905);
    			attr_dev(input3, "class", "form-control");
    			input3.required = true;
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$8, 339, 28, 14975);
    			attr_dev(div28, "class", "form-group col-md-12");
    			add_location(div28, file$8, 337, 24, 14842);
    			attr_dev(div29, "class", "form-row");
    			add_location(div29, file$8, 308, 20, 13365);
    			attr_dev(div30, "class", "modal-body");
    			set_style(div30, "height", "100%", 1);
    			set_style(div30, "top", "0");
    			set_style(div30, "overflow", "auto");
    			add_location(div30, file$8, 303, 16, 13154);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-secondary");
    			attr_dev(button2, "data-dismiss", "modal");
    			add_location(button2, file$8, 347, 20, 15291);
    			attr_dev(button3, "type", "submit");
    			attr_dev(button3, "class", "btn btn-success");
    			add_location(button3, file$8, 353, 20, 15514);
    			attr_dev(div31, "class", "modal-footer");
    			add_location(div31, file$8, 346, 16, 15244);
    			attr_dev(div32, "class", "modal-content");
    			add_location(div32, file$8, 290, 12, 12622);
    			attr_dev(div33, "class", "modal-dialog");
    			attr_dev(div33, "role", "document");
    			add_location(div33, file$8, 289, 8, 12567);
    			attr_dev(div34, "class", "modal fade modal-slide-right");
    			attr_dev(div34, "id", "modalAgregarHorario");
    			attr_dev(div34, "tabindex", "-1");
    			attr_dev(div34, "role", "dialog");
    			attr_dev(div34, "aria-labelledby", "modalAgregarHorarioLabel");
    			set_style(div34, "display", "none");
    			set_style(div34, "padding-right", "16px");
    			attr_dev(div34, "aria-modal", "true");
    			add_location(div34, file$8, 281, 4, 12302);
    			attr_dev(form, "id", "frmUsuario");
    			attr_dev(form, "autocomplete", "off");
    			add_location(form, file$8, 280, 0, 12214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div3, t3);
    			append_dev(div3, h3);
    			append_dev(h3, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div5, t6);
    			append_dev(div5, p0);
    			append_dev(div5, t7);
    			append_dev(div5, p1);
    			append_dev(div5, t8);
    			append_dev(div5, p2);
    			append_dev(div22, t9);
    			append_dev(div22, div15);
    			append_dev(div15, div14);
    			append_dev(div14, h50);
    			append_dev(div14, t11);
    			append_dev(div14, div9);
    			append_dev(div9, div8);
    			append_dev(div8, select0);
    			append_dev(select0, option0);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(select0, null);
    			}

    			select_option(select0, /*sltAsistente*/ ctx[7]);
    			append_dev(div14, t13);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, table0);
    			append_dev(table0, thead0);
    			append_dev(thead0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t15);
    			append_dev(tr0, th1);
    			append_dev(table0, t16);
    			append_dev(table0, tbody0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tbody0, null);
    			}

    			append_dev(div22, t17);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, h51);
    			append_dev(h51, t18);
    			append_dev(h51, button0);
    			append_dev(button0, i);
    			append_dev(button0, t19);
    			append_dev(div20, t20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, table1);
    			append_dev(table1, thead1);
    			append_dev(thead1, tr1);
    			append_dev(tr1, th2);
    			append_dev(tr1, t22);
    			append_dev(tr1, th3);
    			append_dev(tr1, t24);
    			append_dev(tr1, th4);
    			append_dev(tr1, t26);
    			append_dev(tr1, th5);
    			append_dev(tr1, t28);
    			append_dev(tr1, th6);
    			append_dev(table1, t29);
    			append_dev(table1, tbody1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody1, null);
    			}

    			insert_dev(target, t30, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div32);
    			append_dev(div32, div24);
    			append_dev(div24, h52);
    			append_dev(div24, t32);
    			append_dev(div24, button1);
    			append_dev(button1, span);
    			append_dev(div32, t34);
    			append_dev(div32, div30);
    			append_dev(div30, input0);
    			append_dev(div30, t35);
    			append_dev(div30, div29);
    			append_dev(div29, div25);
    			append_dev(div25, label0);
    			append_dev(div25, t37);
    			append_dev(div25, select1);
    			append_dev(select1, option1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*dia*/ ctx[8]);
    			append_dev(div29, t39);
    			append_dev(div29, div26);
    			append_dev(div26, label1);
    			append_dev(div26, t41);
    			append_dev(div26, input1);
    			set_input_value(input1, /*horaInicio*/ ctx[1]);
    			append_dev(div29, t42);
    			append_dev(div29, div27);
    			append_dev(div27, label2);
    			append_dev(div27, t44);
    			append_dev(div27, input2);
    			set_input_value(input2, /*horaFin*/ ctx[0]);
    			append_dev(div29, t45);
    			append_dev(div29, div28);
    			append_dev(div28, label3);
    			append_dev(div28, t47);
    			append_dev(div28, input3);
    			set_input_value(input3, /*intervalo*/ ctx[2]);
    			append_dev(div32, t48);
    			append_dev(div32, div31);
    			append_dev(div31, button2);
    			append_dev(div31, t50);
    			append_dev(div31, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[19]),
    					listen_dev(select0, "change", /*agregarUsuarioConsultorio*/ ctx[10], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[20]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[22]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[23]),
    					listen_dev(form, "submit", prevent_default(/*agregarHorario*/ ctx[11]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*nombreConsultorio*/ 16) set_data_dev(t4, /*nombreConsultorio*/ ctx[4]);

    			if (dirty[0] & /*usuarios*/ 64) {
    				each_value_3 = /*usuarios*/ ctx[6];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*sltAsistente, usuarios*/ 192) {
    				select_option(select0, /*sltAsistente*/ ctx[7]);
    			}

    			if (dirty[0] & /*asistentes*/ 32) {
    				each_value_2 = /*asistentes*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tbody0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*horarios*/ 8) {
    				each_value_1 = /*horarios*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*dias*/ 512) {
    				each_value = /*dias*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*dia, dias*/ 768) {
    				select_option(select1, /*dia*/ ctx[8]);
    			}

    			if (dirty[0] & /*horaInicio*/ 2) {
    				set_input_value(input1, /*horaInicio*/ ctx[1]);
    			}

    			if (dirty[0] & /*horaFin*/ 1) {
    				set_input_value(input2, /*horaFin*/ ctx[0]);
    			}

    			if (dirty[0] & /*intervalo*/ 4 && to_number(input3.value) !== /*intervalo*/ ctx[2]) {
    				set_input_value(input3, /*intervalo*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function convertirHora(time) {
    	time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    	if (time.length > 1) {
    		time = time.slice(1);
    		time[5] = +time[0] < 12 ? " AM" : " PM";
    		time[0] = +time[0] % 12 || 12;
    	}

    	return time.join("");
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $axios;
    	let $toast;
    	validate_store(axios$2, "axios");
    	component_subscribe($$self, axios$2, $$value => $$invalidate(13, $axios = $$value));
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(14, $toast = $$value));
    	let { params = [] } = $$props;

    	set_store_value(
    		axios$2,
    		$axios.defaults.headers.common = {
    			Authorization: `Bearer ${localStorage.getItem("access_token")}`
    		},
    		$axios
    	);

    	let horaFin = [];
    	let horaInicio = [];
    	let intervalo = "";
    	let dia = "";
    	let horarios = [];
    	let nombreConsultorio = "";

    	let dias = [
    		{ id: 1, descripcion: "Lunes" },
    		{ id: 2, descripcion: "Martes" },
    		{ id: 3, descripcion: "Miercoles" },
    		{ id: 4, descripcion: "Jueves" },
    		{ id: 5, descripcion: "Viernes" },
    		{ id: 6, descripcion: "Sabado" },
    		{ id: 7, descripcion: "Domingo" }
    	];

    	let citas = [];
    	let asistentes = [];
    	let usuarios = [];
    	let sltAsistente = "";

    	onMount(() => {
    		cargarHorario();

    		// cargarCitas()
    		cargarAsistentes();

    		cargarUsuarios();
    	});

    	function agregarUsuarioConsultorio(event) {
    		let usuarioId = event.target.value;

    		let user = {
    			consultorioId: params.idConsultorio,
    			userId: usuarioId
    		};

    		$axios.post(`consultoriosUsuarios`, user).then(res => {
    			cargarAsistentes();
    			$$invalidate(7, sltAsistente = "");
    		});
    	}

    	function cargarAsistentes() {
    		$axios.get(`consultorios/${params.idConsultorio}/usuarios`).then(res => {
    			$$invalidate(5, asistentes = res.data);
    		});
    	}

    	function cargarUsuarios() {
    		$axios.get("users").then(res => {
    			$$invalidate(6, usuarios = res.data);
    		});
    	}

    	function agregarHorario() {
    		let horario = {
    			consultorioId: params.idConsultorio,
    			dia,
    			horaInicio,
    			horaFin,
    			intervalo,
    			limiteSimultaneo: 1,
    			limite: 0
    		};

    		$axios.post("/horarios", horario).then(res => {
    			$toast(5000).fire({
    				icon: "success",
    				title: "Se agrego el consultorio"
    			});

    			jQuery("#modalAgregarHorario").modal("hide");
    			cargarHorario();
    		});
    	}

    	function cargarHorario() {
    		$axios.get(`/horarios?consultorioId=${params.idConsultorio}`).then(res => {
    			$$invalidate(3, horarios = res.data);

    			if (horarios.length !== 0) {
    				$$invalidate(4, nombreConsultorio = horarios[0].consultorio);
    			}
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Consultorio> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Consultorio", $$slots, []);

    	function select0_change_handler() {
    		sltAsistente = select_value(this);
    		$$invalidate(7, sltAsistente);
    		$$invalidate(6, usuarios);
    	}

    	function select1_change_handler() {
    		dia = select_value(this);
    		$$invalidate(8, dia);
    		$$invalidate(9, dias);
    	}

    	function input1_input_handler() {
    		horaInicio = this.value;
    		$$invalidate(1, horaInicio);
    	}

    	function input2_input_handler() {
    		horaFin = this.value;
    		$$invalidate(0, horaFin);
    	}

    	function input3_input_handler() {
    		intervalo = to_number(this.value);
    		$$invalidate(2, intervalo);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(12, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Aside,
    		Header,
    		activePage,
    		session,
    		axios: axios$2,
    		toast,
    		onMount,
    		push,
    		link,
    		params,
    		horaFin,
    		horaInicio,
    		intervalo,
    		dia,
    		horarios,
    		nombreConsultorio,
    		dias,
    		citas,
    		asistentes,
    		usuarios,
    		sltAsistente,
    		agregarUsuarioConsultorio,
    		cargarAsistentes,
    		cargarUsuarios,
    		agregarHorario,
    		cargarHorario,
    		convertirHora,
    		$axios,
    		$toast
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(12, params = $$props.params);
    		if ("horaFin" in $$props) $$invalidate(0, horaFin = $$props.horaFin);
    		if ("horaInicio" in $$props) $$invalidate(1, horaInicio = $$props.horaInicio);
    		if ("intervalo" in $$props) $$invalidate(2, intervalo = $$props.intervalo);
    		if ("dia" in $$props) $$invalidate(8, dia = $$props.dia);
    		if ("horarios" in $$props) $$invalidate(3, horarios = $$props.horarios);
    		if ("nombreConsultorio" in $$props) $$invalidate(4, nombreConsultorio = $$props.nombreConsultorio);
    		if ("dias" in $$props) $$invalidate(9, dias = $$props.dias);
    		if ("citas" in $$props) citas = $$props.citas;
    		if ("asistentes" in $$props) $$invalidate(5, asistentes = $$props.asistentes);
    		if ("usuarios" in $$props) $$invalidate(6, usuarios = $$props.usuarios);
    		if ("sltAsistente" in $$props) $$invalidate(7, sltAsistente = $$props.sltAsistente);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		horaFin,
    		horaInicio,
    		intervalo,
    		horarios,
    		nombreConsultorio,
    		asistentes,
    		usuarios,
    		sltAsistente,
    		dia,
    		dias,
    		agregarUsuarioConsultorio,
    		agregarHorario,
    		params,
    		$axios,
    		$toast,
    		citas,
    		cargarAsistentes,
    		cargarUsuarios,
    		cargarHorario,
    		select0_change_handler,
    		select1_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class Consultorio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { params: 12 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Consultorio",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get params() {
    		throw new Error("<Consultorio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Consultorio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pages/Usuario/Index.svelte generated by Svelte v3.23.0 */

    const { console: console_1$3 } = globals;
    const file$9 = "src/Pages/Usuario/Index.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[30] = list;
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    // (172:22) {#each usuarios as usuario}
    function create_each_block_2$2(ctx) {
    	let tr;
    	let td0;
    	let div1;
    	let div0;
    	let span0;
    	let t0_value = /*usuario*/ ctx[35].name[0] + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*usuario*/ ctx[35].name + "";
    	let t2;
    	let t3;
    	let td1;
    	let t4_value = /*usuario*/ ctx[35].email + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = (/*usuario*/ ctx[35].phoneNumber || "N/A") + "";
    	let t6;
    	let t7;
    	let td3;
    	let div2;
    	let a0;
    	let i0;
    	let t8;
    	let a1;
    	let i1;
    	let t9;
    	let a2;
    	let i2;
    	let t10;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[21](/*usuario*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			td1 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			div2 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t8 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t9 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t10 = space();
    			attr_dev(span0, "class", "avatar-title rounded-circle ");
    			add_location(span0, file$9, 177, 33, 4584);
    			attr_dev(div0, "class", "avatar avatar-sm");
    			add_location(div0, file$9, 176, 31, 4520);
    			attr_dev(div1, "class", "avatar avatar-sm mr-2 d-block-sm");
    			add_location(div1, file$9, 175, 29, 4442);
    			add_location(span1, file$9, 180, 29, 4755);
    			add_location(td0, file$9, 174, 27, 4408);
    			add_location(td1, file$9, 182, 27, 4843);
    			add_location(td2, file$9, 183, 27, 4895);
    			attr_dev(i0, "class", " mdi-24px mdi mdi-doctor");
    			add_location(i0, file$9, 187, 33, 5153);
    			attr_dev(a0, "href", "#/Medico/Perfil/id");
    			add_location(a0, file$9, 186, 31, 5090);
    			attr_dev(i1, "class", " mdi-24px mdi mdi-circle-edit-outline");
    			add_location(i1, file$9, 196, 33, 5670);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "data-toggle", "modal");
    			set_style(a1, "cursor", "pointer");
    			attr_dev(a1, "data-placement", "top");
    			attr_dev(a1, "data-target", "#modalUsuario");
    			attr_dev(a1, "data-original-title", "Modificar usuario");
    			attr_dev(a1, "class", "icon-table hover-cursor");
    			add_location(a1, file$9, 189, 31, 5259);
    			attr_dev(i2, "class", " mdi-24px mdi mdi-security");
    			add_location(i2, file$9, 205, 33, 6189);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "data-toggle", "modal");
    			attr_dev(a2, "data-target", "#modalRoles");
    			attr_dev(a2, "data-placement", "bottom");
    			attr_dev(a2, "title", "Asignar Roles");
    			attr_dev(a2, "class", "icon-rol svelte-knkxw1");
    			add_location(a2, file$9, 198, 31, 5789);
    			set_style(div2, "width", "150px");
    			set_style(div2, "text-align", "right");
    			attr_dev(div2, "class", "ml-auto");
    			add_location(div2, file$9, 185, 29, 4996);
    			add_location(td3, file$9, 184, 27, 4962);
    			add_location(tr, file$9, 173, 25, 4376);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(td0, t1);
    			append_dev(td0, span1);
    			append_dev(span1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, div2);
    			append_dev(div2, a0);
    			append_dev(a0, i0);
    			append_dev(div2, t8);
    			append_dev(div2, a1);
    			append_dev(a1, i1);
    			append_dev(div2, t9);
    			append_dev(div2, a2);
    			append_dev(a2, i2);
    			append_dev(tr, t10);

    			if (!mounted) {
    				dispose = listen_dev(a2, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*usuarios*/ 32 && t0_value !== (t0_value = /*usuario*/ ctx[35].name[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*usuarios*/ 32 && t2_value !== (t2_value = /*usuario*/ ctx[35].name + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*usuarios*/ 32 && t4_value !== (t4_value = /*usuario*/ ctx[35].email + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*usuarios*/ 32 && t6_value !== (t6_value = (/*usuario*/ ctx[35].phoneNumber || "N/A") + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(172:22) {#each usuarios as usuario}",
    		ctx
    	});

    	return block;
    }

    // (259:18) {#each prefijos as prefijo}
    function create_each_block_1$3(ctx) {
    	let option;
    	let t_value = /*prefijo*/ ctx[32].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*prefijo*/ ctx[32].value;
    			option.value = option.__value;
    			add_location(option, file$9, 260, 21, 7900);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(259:18) {#each prefijos as prefijo}",
    		ctx
    	});

    	return block;
    }

    // (377:12) {#each filterRoles as rol}
    function create_each_block$3(ctx) {
    	let div;
    	let label;
    	let span0;
    	let t0_value = /*rol*/ ctx[29].displayName + "";
    	let t0;
    	let t1;
    	let input;
    	let input_value_value;
    	let t2;
    	let span1;
    	let t3;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[27].call(input, /*rol*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			attr_dev(span0, "class", "cstm-switch-description mr-auto bd-highlight");
    			add_location(span0, file$9, 380, 19, 11848);
    			attr_dev(input, "type", "checkbox");
    			input.__value = input_value_value = /*rol*/ ctx[29].id;
    			input.value = input.__value;
    			attr_dev(input, "class", "cstm-switch-input");
    			/*$$binding_groups*/ ctx[28][0].push(input);
    			add_location(input, file$9, 384, 22, 12040);
    			attr_dev(span1, "class", "cstm-switch-indicator bg-success bd-highlight");
    			add_location(span1, file$9, 390, 19, 12340);
    			attr_dev(label, "class", "cstm-switch d-flex bd-highlight");
    			add_location(label, file$9, 379, 17, 11781);
    			attr_dev(div, "class", "lista-rol m-b-10");
    			add_location(div, file$9, 378, 15, 11733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, span0);
    			append_dev(span0, t0);
    			append_dev(label, t1);
    			append_dev(label, input);
    			input.checked = ~/*rol*/ ctx[29].name.indexOf(input.__value);
    			input.checked = /*rol*/ ctx[29].checked;
    			append_dev(label, t2);
    			append_dev(label, span1);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", input_change_handler),
    					listen_dev(
    						input,
    						"change",
    						function () {
    							if (is_function(/*cambiarRol*/ ctx[8](/*rol*/ ctx[29].name, /*rol*/ ctx[29].checked))) /*cambiarRol*/ ctx[8](/*rol*/ ctx[29].name, /*rol*/ ctx[29].checked).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*filterRoles*/ 64 && t0_value !== (t0_value = /*rol*/ ctx[29].displayName + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*filterRoles*/ 64 && input_value_value !== (input_value_value = /*rol*/ ctx[29].id)) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty[0] & /*filterRoles*/ 64) {
    				input.checked = ~/*rol*/ ctx[29].name.indexOf(input.__value);
    			}

    			if (dirty[0] & /*filterRoles*/ 64) {
    				input.checked = /*rol*/ ctx[29].checked;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[28][0].splice(/*$$binding_groups*/ ctx[28][0].indexOf(input), 1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(377:12) {#each filterRoles as rol}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let section;
    	let div13;
    	let div12;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let input0;
    	let t2;
    	let div1;
    	let div0;
    	let span0;
    	let t3;
    	let button0;
    	let i;
    	let t4;
    	let t5;
    	let div11;
    	let div10;
    	let div6;
    	let h50;
    	let t7;
    	let div9;
    	let div8;
    	let div7;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t9;
    	let th1;
    	let t11;
    	let th2;
    	let t13;
    	let th3;
    	let t14;
    	let tbody;
    	let t15;
    	let form0;
    	let div30;
    	let div29;
    	let div28;
    	let div14;
    	let h51;
    	let t17;
    	let button1;
    	let span1;
    	let t19;
    	let div26;
    	let input1;
    	let t20;
    	let div16;
    	let div15;
    	let label0;
    	let t22;
    	let select;
    	let option;
    	let t24;
    	let div18;
    	let div17;
    	let label1;
    	let t26;
    	let input2;
    	let t27;
    	let div21;
    	let div19;
    	let label2;
    	let t29;
    	let input3;
    	let t30;
    	let div20;
    	let label3;
    	let t32;
    	let input4;
    	let t33;
    	let div23;
    	let div22;
    	let label4;
    	let t35;
    	let input5;
    	let t36;
    	let div25;
    	let div24;
    	let label5;
    	let t38;
    	let input6;
    	let t39;
    	let br;
    	let t40;
    	let div27;
    	let button2;
    	let t42;
    	let button3;
    	let t44;
    	let div37;
    	let div36;
    	let div35;
    	let div31;
    	let h52;
    	let t46;
    	let button4;
    	let span2;
    	let t48;
    	let div34;
    	let form1;
    	let input7;
    	let t49;
    	let p;
    	let span3;
    	let t50;
    	let div32;
    	let label6;
    	let t52;
    	let input8;
    	let t53;
    	let div33;
    	let current;
    	let mounted;
    	let dispose;
    	const aside = new Aside({ $$inline: true });
    	const header = new Header({ $$inline: true });
    	let each_value_2 = /*usuarios*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*prefijos*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	let each_value = /*filterRoles*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div13 = element("div");
    			div12 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t3 = space();
    			button0 = element("button");
    			i = element("i");
    			t4 = text("\n              Nuevo usuario");
    			t5 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div6 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Usuarios";
    			t7 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Nombres";
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "Correo";
    			t11 = space();
    			th2 = element("th");
    			th2.textContent = "Telefono";
    			t13 = space();
    			th3 = element("th");
    			t14 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t15 = space();
    			form0 = element("form");
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			div14 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Usuario";
    			t17 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "×";
    			t19 = space();
    			div26 = element("div");
    			input1 = element("input");
    			t20 = space();
    			div16 = element("div");
    			div15 = element("div");
    			label0 = element("label");
    			label0.textContent = "Prefijo";
    			t22 = space();
    			select = element("select");
    			option = element("option");
    			option.textContent = "- Seleccionar -";

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t24 = space();
    			div18 = element("div");
    			div17 = element("div");
    			label1 = element("label");
    			label1.textContent = "Nombre Completo";
    			t26 = space();
    			input2 = element("input");
    			t27 = space();
    			div21 = element("div");
    			div19 = element("div");
    			label2 = element("label");
    			label2.textContent = "Usuario";
    			t29 = space();
    			input3 = element("input");
    			t30 = space();
    			div20 = element("div");
    			label3 = element("label");
    			label3.textContent = "Email";
    			t32 = space();
    			input4 = element("input");
    			t33 = space();
    			div23 = element("div");
    			div22 = element("div");
    			label4 = element("label");
    			label4.textContent = "Contraseña";
    			t35 = space();
    			input5 = element("input");
    			t36 = space();
    			div25 = element("div");
    			div24 = element("div");
    			label5 = element("label");
    			label5.textContent = "Telefono";
    			t38 = space();
    			input6 = element("input");
    			t39 = space();
    			br = element("br");
    			t40 = space();
    			div27 = element("div");
    			button2 = element("button");
    			button2.textContent = "Cerrar";
    			t42 = space();
    			button3 = element("button");
    			button3.textContent = "Guardar";
    			t44 = space();
    			div37 = element("div");
    			div36 = element("div");
    			div35 = element("div");
    			div31 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Roles";
    			t46 = space();
    			button4 = element("button");
    			span2 = element("span");
    			span2.textContent = "×";
    			t48 = space();
    			div34 = element("div");
    			form1 = element("form");
    			input7 = element("input");
    			t49 = space();
    			p = element("p");
    			span3 = element("span");
    			t50 = space();
    			div32 = element("div");
    			label6 = element("label");
    			label6.textContent = "Buscar";
    			t52 = space();
    			input8 = element("input");
    			t53 = space();
    			div33 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input0, "type", "search");
    			attr_dev(input0, "class", "form-control form-control-appended");
    			attr_dev(input0, "placeholder", "Buscar");
    			add_location(input0, file$9, 131, 16, 2905);
    			attr_dev(span0, "class", "mdi mdi-magnify");
    			add_location(span0, file$9, 137, 20, 3165);
    			attr_dev(div0, "class", "input-group-text");
    			add_location(div0, file$9, 136, 18, 3114);
    			attr_dev(div1, "class", "input-group-append");
    			add_location(div1, file$9, 135, 16, 3063);
    			attr_dev(div2, "class", "input-group input-group-flush mb-3");
    			add_location(div2, file$9, 130, 14, 2840);
    			attr_dev(div3, "class", "col-md-5");
    			add_location(div3, file$9, 129, 12, 2803);
    			attr_dev(i, "class", "mdi mdi-account-plus");
    			add_location(i, file$9, 145, 14, 3443);
    			attr_dev(button0, "class", "btn m-b-30 ml-2 mr-2 ml-3 btn-primary");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalUsuario");
    			add_location(button0, file$9, 142, 12, 3298);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$9, 128, 10, 2773);
    			attr_dev(div5, "class", "mt-4 col-md-12");
    			add_location(div5, file$9, 127, 8, 2734);
    			attr_dev(h50, "class", "m-b-0");
    			add_location(h50, file$9, 154, 14, 3681);
    			attr_dev(div6, "class", "card-header");
    			add_location(div6, file$9, 153, 12, 3641);
    			add_location(th0, file$9, 163, 24, 3986);
    			add_location(th1, file$9, 165, 24, 4077);
    			add_location(th2, file$9, 166, 24, 4117);
    			add_location(th3, file$9, 167, 24, 4159);
    			add_location(tr, file$9, 162, 22, 3957);
    			add_location(thead, file$9, 161, 20, 3927);
    			add_location(tbody, file$9, 170, 20, 4246);
    			attr_dev(table, "class", "table align-td-middle");
    			add_location(table, file$9, 160, 18, 3869);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$9, 159, 16, 3820);
    			attr_dev(div8, "class", "m-b-30");
    			add_location(div8, file$9, 158, 14, 3783);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$9, 157, 12, 3745);
    			attr_dev(div10, "class", "card m-b-30");
    			add_location(div10, file$9, 152, 10, 3603);
    			attr_dev(div11, "class", "col-lg-12");
    			add_location(div11, file$9, 151, 8, 3569);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$9, 125, 6, 2707);
    			attr_dev(div13, "class", "container");
    			add_location(div13, file$9, 124, 4, 2677);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$9, 123, 2, 2641);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$9, 121, 0, 2600);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "modalUsuarioLabel");
    			add_location(h51, file$9, 239, 10, 7034);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$9, 245, 12, 7241);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$9, 240, 10, 7104);
    			attr_dev(div14, "class", "modal-header");
    			add_location(div14, file$9, 238, 8, 6997);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "IdUser");
    			input1.value = "0";
    			add_location(input1, file$9, 250, 12, 7413);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$9, 253, 16, 7561);
    			option.__value = "";
    			option.value = option.__value;
    			option.disabled = true;
    			add_location(option, file$9, 257, 18, 7739);
    			attr_dev(select, "class", "form-control");
    			attr_dev(select, "name", "prefijo");
    			select.required = true;
    			if (/*sltPrefijo*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[22].call(select));
    			add_location(select, file$9, 254, 16, 7607);
    			attr_dev(div15, "class", "form-group col-md-12");
    			add_location(div15, file$9, 252, 14, 7510);
    			attr_dev(div16, "class", "form-row");
    			add_location(div16, file$9, 251, 12, 7473);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$9, 267, 16, 8146);
    			attr_dev(input2, "type", "name");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "placeholder", "Ing. John Doe");
    			attr_dev(input2, "name", "Name");
    			attr_dev(input2, "maxlength", "200");
    			input2.required = true;
    			add_location(input2, file$9, 268, 16, 8200);
    			attr_dev(div17, "class", "form-group col-md-12");
    			add_location(div17, file$9, 266, 14, 8095);
    			attr_dev(div18, "class", "form-row");
    			add_location(div18, file$9, 265, 12, 8058);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$9, 279, 16, 8602);
    			attr_dev(input3, "type", "email");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "autocomplete", "off");
    			attr_dev(input3, "name", "UserName");
    			attr_dev(input3, "id", "");
    			attr_dev(input3, "maxlength", "100");
    			add_location(input3, file$9, 280, 16, 8648);
    			attr_dev(div19, "class", "form-group col-md-12");
    			set_style(div19, "display", "none");
    			add_location(div19, file$9, 278, 14, 8528);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$9, 289, 16, 8943);
    			attr_dev(input4, "type", "email");
    			input4.required = true;
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "placeholder", "usuario@correo.com");
    			attr_dev(input4, "autocomplete", "off");
    			attr_dev(input4, "name", "Email");
    			attr_dev(input4, "id", "txtCorreo");
    			attr_dev(input4, "maxlength", "100");
    			add_location(input4, file$9, 290, 16, 8987);
    			attr_dev(div20, "class", "form-group col-md-12");
    			add_location(div20, file$9, 288, 14, 8892);
    			attr_dev(div21, "class", "form-row");
    			add_location(div21, file$9, 277, 12, 8491);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$9, 303, 16, 9442);
    			attr_dev(input5, "type", "password");
    			attr_dev(input5, "class", "form-control");
    			input5.required = true;
    			attr_dev(input5, "name", "PasswordHash");
    			attr_dev(input5, "maxlength", "50");
    			add_location(input5, file$9, 304, 16, 9491);
    			attr_dev(div22, "class", "form-group col-md-12");
    			add_location(div22, file$9, 302, 14, 9391);
    			attr_dev(div23, "class", "form-row");
    			add_location(div23, file$9, 301, 12, 9354);
    			attr_dev(label5, "for", "");
    			add_location(label5, file$9, 315, 16, 9838);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "data-mask", "(000) 000-0000");
    			attr_dev(input6, "data-mask-clearifnotmatch", "true");
    			attr_dev(input6, "autocomplete", "off");
    			attr_dev(input6, "maxlength", "14");
    			attr_dev(input6, "placeholder", "(809) 000-0000");
    			add_location(input6, file$9, 316, 16, 9885);
    			attr_dev(div24, "class", "form-group col-md-12");
    			add_location(div24, file$9, 314, 14, 9787);
    			attr_dev(div25, "class", "form-row");
    			add_location(div25, file$9, 313, 12, 9750);
    			add_location(br, file$9, 326, 12, 10253);
    			attr_dev(div26, "class", "modal-body");
    			set_style(div26, "height", "100%", 1);
    			set_style(div26, "top", "0");
    			set_style(div26, "overflow", "auto");
    			add_location(div26, file$9, 248, 8, 7318);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-secondary");
    			attr_dev(button2, "data-dismiss", "modal");
    			add_location(button2, file$9, 329, 12, 10326);
    			attr_dev(button3, "type", "submit");
    			attr_dev(button3, "class", "btn btn-success");
    			add_location(button3, file$9, 334, 12, 10479);
    			attr_dev(div27, "class", "modal-footer");
    			add_location(div27, file$9, 328, 10, 10287);
    			attr_dev(div28, "class", "modal-content");
    			add_location(div28, file$9, 237, 6, 6961);
    			attr_dev(div29, "class", "modal-dialog");
    			attr_dev(div29, "role", "document");
    			add_location(div29, file$9, 236, 4, 6912);
    			attr_dev(div30, "class", "modal fade modal-slide-right");
    			attr_dev(div30, "id", "modalUsuario");
    			attr_dev(div30, "tabindex", "-1");
    			attr_dev(div30, "role", "dialog");
    			attr_dev(div30, "aria-labelledby", "modalUsuarioLabel");
    			set_style(div30, "display", "none");
    			set_style(div30, "padding-right", "16px");
    			attr_dev(div30, "aria-modal", "true");
    			add_location(div30, file$9, 229, 2, 6697);
    			attr_dev(form0, "id", "frmUsuario");
    			add_location(form0, file$9, 228, 0, 6629);
    			attr_dev(h52, "class", "modal-title");
    			attr_dev(h52, "id", "modalRolesLabel");
    			add_location(h52, file$9, 352, 8, 10914);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$9, 358, 10, 11106);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "close");
    			attr_dev(button4, "data-dismiss", "modal");
    			attr_dev(button4, "aria-label", "Close");
    			add_location(button4, file$9, 353, 8, 10979);
    			attr_dev(div31, "class", "modal-header");
    			add_location(div31, file$9, 351, 6, 10879);
    			attr_dev(input7, "type", "hidden");
    			attr_dev(input7, "name", "idPaciente");
    			input7.value = "";
    			add_location(input7, file$9, 364, 10, 11228);
    			attr_dev(span3, "class", "badge badge-soft-primary");
    			set_style(span3, "font-size", "17px");
    			add_location(span3, file$9, 366, 12, 11305);
    			add_location(p, file$9, 365, 10, 11289);
    			add_location(label6, file$9, 369, 12, 11449);
    			attr_dev(input8, "type", "text");
    			attr_dev(input8, "class", "form-control");
    			attr_dev(input8, "placeholder", "Buscar roles");
    			add_location(input8, file$9, 370, 12, 11483);
    			attr_dev(div32, "class", "form-group floating-label");
    			add_location(div32, file$9, 368, 10, 11397);
    			attr_dev(div33, "class", "roles");
    			add_location(div33, file$9, 375, 10, 11622);
    			add_location(form1, file$9, 363, 8, 11211);
    			attr_dev(div34, "class", "modal-body");
    			add_location(div34, file$9, 361, 6, 11177);
    			attr_dev(div35, "class", "modal-content");
    			add_location(div35, file$9, 350, 4, 10845);
    			attr_dev(div36, "class", "modal-dialog");
    			attr_dev(div36, "role", "document");
    			add_location(div36, file$9, 349, 2, 10798);
    			attr_dev(div37, "class", "modal fade modal-slide-right");
    			attr_dev(div37, "id", "modalRoles");
    			attr_dev(div37, "tabindex", "-1");
    			attr_dev(div37, "role", "dialog");
    			attr_dev(div37, "aria-labelledby", "modalRolesLabel");
    			set_style(div37, "display", "none");
    			set_style(div37, "padding-right", "16px");
    			attr_dev(div37, "aria-modal", "true");
    			add_location(div37, file$9, 341, 0, 10599);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, input0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div4, t3);
    			append_dev(div4, button0);
    			append_dev(button0, i);
    			append_dev(button0, t4);
    			append_dev(div12, t5);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div6);
    			append_dev(div6, h50);
    			append_dev(div10, t7);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t9);
    			append_dev(tr, th1);
    			append_dev(tr, t11);
    			append_dev(tr, th2);
    			append_dev(tr, t13);
    			append_dev(tr, th3);
    			append_dev(table, t14);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tbody, null);
    			}

    			insert_dev(target, t15, anchor);
    			insert_dev(target, form0, anchor);
    			append_dev(form0, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div14);
    			append_dev(div14, h51);
    			append_dev(div14, t17);
    			append_dev(div14, button1);
    			append_dev(button1, span1);
    			append_dev(div28, t19);
    			append_dev(div28, div26);
    			append_dev(div26, input1);
    			append_dev(div26, t20);
    			append_dev(div26, div16);
    			append_dev(div16, div15);
    			append_dev(div15, label0);
    			append_dev(div15, t22);
    			append_dev(div15, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, /*sltPrefijo*/ ctx[0]);
    			append_dev(div26, t24);
    			append_dev(div26, div18);
    			append_dev(div18, div17);
    			append_dev(div17, label1);
    			append_dev(div17, t26);
    			append_dev(div17, input2);
    			set_input_value(input2, /*inpNombre*/ ctx[1]);
    			append_dev(div26, t27);
    			append_dev(div26, div21);
    			append_dev(div21, div19);
    			append_dev(div19, label2);
    			append_dev(div19, t29);
    			append_dev(div19, input3);
    			append_dev(div21, t30);
    			append_dev(div21, div20);
    			append_dev(div20, label3);
    			append_dev(div20, t32);
    			append_dev(div20, input4);
    			set_input_value(input4, /*inpEmail*/ ctx[2]);
    			append_dev(div26, t33);
    			append_dev(div26, div23);
    			append_dev(div23, div22);
    			append_dev(div22, label4);
    			append_dev(div22, t35);
    			append_dev(div22, input5);
    			set_input_value(input5, /*inpPassword*/ ctx[4]);
    			append_dev(div26, t36);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, label5);
    			append_dev(div24, t38);
    			append_dev(div24, input6);
    			set_input_value(input6, /*inpTelefono*/ ctx[3]);
    			append_dev(div26, t39);
    			append_dev(div26, br);
    			append_dev(div28, t40);
    			append_dev(div28, div27);
    			append_dev(div27, button2);
    			append_dev(div27, t42);
    			append_dev(div27, button3);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, div37, anchor);
    			append_dev(div37, div36);
    			append_dev(div36, div35);
    			append_dev(div35, div31);
    			append_dev(div31, h52);
    			append_dev(div31, t46);
    			append_dev(div31, button4);
    			append_dev(button4, span2);
    			append_dev(div35, t48);
    			append_dev(div35, div34);
    			append_dev(div34, form1);
    			append_dev(form1, input7);
    			append_dev(form1, t49);
    			append_dev(form1, p);
    			append_dev(p, span3);
    			append_dev(form1, t50);
    			append_dev(form1, div32);
    			append_dev(div32, label6);
    			append_dev(div32, t52);
    			append_dev(div32, input8);
    			append_dev(form1, t53);
    			append_dev(form1, div33);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div33, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[22]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[23]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[24]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[25]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[26]),
    					listen_dev(form0, "submit", prevent_default(/*guardarUsuario*/ ctx[10]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cargarRolUsuario, usuarios*/ 544) {
    				each_value_2 = /*usuarios*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*prefijos*/ 128) {
    				each_value_1 = /*prefijos*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*sltPrefijo, prefijos*/ 129) {
    				select_option(select, /*sltPrefijo*/ ctx[0]);
    			}

    			if (dirty[0] & /*inpNombre*/ 2) {
    				set_input_value(input2, /*inpNombre*/ ctx[1]);
    			}

    			if (dirty[0] & /*inpEmail*/ 4 && input4.value !== /*inpEmail*/ ctx[2]) {
    				set_input_value(input4, /*inpEmail*/ ctx[2]);
    			}

    			if (dirty[0] & /*inpPassword*/ 16 && input5.value !== /*inpPassword*/ ctx[4]) {
    				set_input_value(input5, /*inpPassword*/ ctx[4]);
    			}

    			if (dirty[0] & /*inpTelefono*/ 8 && input6.value !== /*inpTelefono*/ ctx[3]) {
    				set_input_value(input6, /*inpTelefono*/ ctx[3]);
    			}

    			if (dirty[0] & /*filterRoles, cambiarRol*/ 320) {
    				each_value = /*filterRoles*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div33, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(form0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(div37);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $axios;
    	let $session;
    	let $activePage;
    	let $toast;
    	let $errorConexion;
    	validate_store(axios$2, "axios");
    	component_subscribe($$self, axios$2, $$value => $$invalidate(14, $axios = $$value));
    	validate_store(session, "session");
    	component_subscribe($$self, session, $$value => $$invalidate(15, $session = $$value));
    	validate_store(activePage, "activePage");
    	component_subscribe($$self, activePage, $$value => $$invalidate(16, $activePage = $$value));
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(17, $toast = $$value));
    	validate_store(errorConexion, "errorConexion");
    	component_subscribe($$self, errorConexion, $$value => $$invalidate(18, $errorConexion = $$value));
    	let sltPrefijo = "";
    	let inpNombre = "";
    	let inpEmail = "";
    	let inpTelefono = "";
    	let inpPassword = "";
    	let roles = [];
    	let rolUsuario = [];
    	let usuarioId = "";

    	set_store_value(
    		axios$2,
    		$axios.defaults.headers.common = {
    			Authorization: $session.authorizationHeader.Authorization
    		},
    		$axios
    	);

    	set_store_value(activePage, $activePage = "mantenimiento.usuarios.index");

    	let prefijos = [
    		{ value: "Dr", name: "Dr." },
    		{ value: "Dra", name: "Dra." },
    		{ value: "Lic", name: "Lic." },
    		{ value: "Lida", name: "Lida." },
    		{ value: "Sr", name: "Sr." },
    		{ value: "Sra", name: "Sra." }
    	];

    	let usuarios = [];

    	onMount(() => {
    		cargarUsuarios();
    		cargarRoles();
    	});

    	function cambiarRol(item, check) {
    		let rol = { Name: item };

    		if (check) {
    			$axios.post(`/users/${usuarioId}/EliminarRol`, rol).then(res => {
    				cargarUsuarios();
    				cargarRolUsuario(usuarioId);
    			});
    		} else {
    			$axios.post(`/users/${usuarioId}/AgregarRol`, rol).then(res => {
    				cargarUsuarios();
    				cargarRolUsuario(usuarioId);
    			});
    		}
    	}

    	function cargarUsuarios() {
    		$axios.get("/Users").then(res => {
    			$$invalidate(5, usuarios = res.data);
    		});
    	}

    	function cargarRolUsuario(idUsuario) {
    		usuarioId = idUsuario;

    		$axios.get(`/users/${usuarioId}/roles`).then(res => {
    			$$invalidate(12, rolUsuario = res.data);
    		});
    	}

    	function cargarRoles() {
    		$axios.get("/roles").then(res => {
    			$$invalidate(11, roles = res.data);
    		});
    	}

    	function guardarUsuario() {
    		let usuario = {
    			Prefix: sltPrefijo,
    			Name: inpNombre,
    			Email: inpEmail,
    			PhoneNumber: inpTelefono,
    			PasswordHash: inpPassword
    		};

    		$axios.post("/users", usuario).then(res => {
    			if (res.data) {
    				$toast(5000).fire({
    					icon: "success",
    					title: "Usuario guardado con exito"
    				});

    				jQuery("#modalUsuario").modal("hide");
    				cargarUsuarios();
    			}
    		}).catch(err => {
    			console.error(err);
    			$errorConexion();
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Index", $$slots, []);
    	const $$binding_groups = [[]];
    	const click_handler = usuario => cargarRolUsuario(usuario.id);

    	function select_change_handler() {
    		sltPrefijo = select_value(this);
    		$$invalidate(0, sltPrefijo);
    		$$invalidate(7, prefijos);
    	}

    	function input2_input_handler() {
    		inpNombre = this.value;
    		$$invalidate(1, inpNombre);
    	}

    	function input4_input_handler() {
    		inpEmail = this.value;
    		$$invalidate(2, inpEmail);
    	}

    	function input5_input_handler() {
    		inpPassword = this.value;
    		$$invalidate(4, inpPassword);
    	}

    	function input6_input_handler() {
    		inpTelefono = this.value;
    		$$invalidate(3, inpTelefono);
    	}

    	function input_change_handler(rol) {
    		rol.name = get_binding_group_value($$binding_groups[0]);
    		rol.checked = this.checked;
    		(($$invalidate(6, filterRoles), $$invalidate(11, roles)), $$invalidate(12, rolUsuario));
    	}

    	$$self.$capture_state = () => ({
    		Aside,
    		Header,
    		push,
    		activePage,
    		host,
    		axios: axios$2,
    		session,
    		errorConexion,
    		toast,
    		onMount,
    		sltPrefijo,
    		inpNombre,
    		inpEmail,
    		inpTelefono,
    		inpPassword,
    		roles,
    		rolUsuario,
    		usuarioId,
    		prefijos,
    		usuarios,
    		cambiarRol,
    		cargarUsuarios,
    		cargarRolUsuario,
    		cargarRoles,
    		guardarUsuario,
    		$axios,
    		$session,
    		$activePage,
    		filterRoles,
    		$toast,
    		$errorConexion
    	});

    	$$self.$inject_state = $$props => {
    		if ("sltPrefijo" in $$props) $$invalidate(0, sltPrefijo = $$props.sltPrefijo);
    		if ("inpNombre" in $$props) $$invalidate(1, inpNombre = $$props.inpNombre);
    		if ("inpEmail" in $$props) $$invalidate(2, inpEmail = $$props.inpEmail);
    		if ("inpTelefono" in $$props) $$invalidate(3, inpTelefono = $$props.inpTelefono);
    		if ("inpPassword" in $$props) $$invalidate(4, inpPassword = $$props.inpPassword);
    		if ("roles" in $$props) $$invalidate(11, roles = $$props.roles);
    		if ("rolUsuario" in $$props) $$invalidate(12, rolUsuario = $$props.rolUsuario);
    		if ("usuarioId" in $$props) usuarioId = $$props.usuarioId;
    		if ("prefijos" in $$props) $$invalidate(7, prefijos = $$props.prefijos);
    		if ("usuarios" in $$props) $$invalidate(5, usuarios = $$props.usuarios);
    		if ("filterRoles" in $$props) $$invalidate(6, filterRoles = $$props.filterRoles);
    	};

    	let filterRoles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*roles, rolUsuario*/ 6144) {
    			 $$invalidate(6, filterRoles = roles.map(x => {
    				return {
    					id: x.id,
    					name: x.name,
    					displayName: x.displayName,
    					checked: rolUsuario.some(y => y == x.name)
    				};
    			}));
    		}
    	};

    	return [
    		sltPrefijo,
    		inpNombre,
    		inpEmail,
    		inpTelefono,
    		inpPassword,
    		usuarios,
    		filterRoles,
    		prefijos,
    		cambiarRol,
    		cargarRolUsuario,
    		guardarUsuario,
    		roles,
    		rolUsuario,
    		usuarioId,
    		$axios,
    		$session,
    		$activePage,
    		$toast,
    		$errorConexion,
    		cargarUsuarios,
    		cargarRoles,
    		click_handler,
    		select_change_handler,
    		input2_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const routes = {
        "/": wrap({
            component: Index,
            conditions: [
                async (detail) => {
                    if (isLogin()) {
                        return true
                    }
                    else {
                        return push('/home/login')
                    }
                }
            ]
        }),
        "/home/login": wrap({
            asyncComponent: () => Login,
            conditions: [
                (detail) => {
                    if (!isLogin()) {
                        return true;
                    } else {
                        return false;
                    }
                },
            ]
        }),
        "/citas/gestion": wrap({
            component: Gestion,
            conditions: [
                async (detail) => {
                    if (isLogin()) {
                        return true
                    }
                    else {
                        return push('/home/login')
                    }
                }
            ]
        }),
        "/mantenimiento/consultorios": wrap({
            component: Consultorios,
            conditions: [
                async (detail) => {
                    if (isLogin()) {
                        return true
                    }
                    else {
                        return push('/home/login')
                    }
                }
            ]
        }),
        "/mantenimiento/consultorios/:idConsultorio": wrap({
            component: Consultorio,
            conditions: [
                async (detail) => {
                    if (isLogin()) {
                        return true
                    }
                    else {
                        return push('/home/login')
                    }
                }
            ]
        }),
        "/usuario/index": wrap({
            component: Index$1,
            conditions: [
                async (detail) => {
                    if (isLogin()) {
                        return true
                    }
                    else {
                        return push('/home/login')
                    }
                }
            ]
        }),
        "/Home/Unauthorized": wrap({
            asyncComponent: () => Unauthorized,
            conditions: [() => $session.isValid]
        }),
        "*": wrap({
            asyncComponent: () => Error404
        })
    };

    /* src/App.svelte generated by Svelte v3.23.0 */

    function create_fragment$b(ctx) {
    	let current;
    	const router = new Router({ props: { routes }, $$inline: true });
    	router.$on("routeLoaded", event);

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function event(e) {
    	jQuery("body").removeClass("sidebar-open");
    }

    function instance$b($$self, $$props, $$invalidate) {
    	onMount(() => {
    		
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Home: Index,
    		Router,
    		push,
    		connection,
    		session,
    		routes,
    		onMount,
    		event
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.querySelector("#app"),
    	props: {}
    });

    return app;

}(moment));
//# sourceMappingURL=bundle.js.map
