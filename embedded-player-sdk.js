/**
 * # Ceros Embedded Player SDK
 *
 * The Ceros Embedded Player SDK provides functions and events to integrate directly with the Ceros Player experience from
 * custom hosted code.
 *
 * @version 1.0.0
 * @support support@ceros.com
 * @copyright (c) 2015 Ceros Inc. http://www.ceros.com/
 */

/**
 * Initialize module depending on environment. This module supports CommonJS, AMD, and standard JavaScript script tag
 * include.
 *
 * CommonJS Example:
 *
 *     ```javascript
 *     var CerosSDK = require('CerosSDK');
 *     CerosSDK.findExperience('my-experience-id').done(function(experience){...});
 *     ```
 *
 * RequireJS (AMD) Example:
 *
 *     ```javascript
 *     define('path/to/CerosSDK',function(CerosSDK){
 *     CerosSDK.findExperience('my-experience-id').done(function(experience){...});
 *     });
 *     ```
 *
 * Standard Example:
 *
 *     ```html
 *     <script type="text/javascript" src="path/to/CerosSDK.js"></script>
 *     <script type="text/javascript">
 *     CerosSDK.findExperience('my-experience-id').done(function(experience){...});
 *     </script>
 *     ```
 *
 * @param root - The root context. This is used when not loaded as a managed module (i.e. standard script include).
 * @param factory - The factory function that creates the module class and returns or exports the interface.
 */
(function (root, factory) {

    // --- CommonJS ---
    //
    // The "exports" variable will exist in the global scope in CommonJS environments.
    if (typeof exports !== 'undefined') {
        factory(exports);
    }

    // --- RequireJS (AMD) ---
    //
    // The "define" function is created in the global scope by RequireJS. The
    // "exports" dependency can be injected into an AMD module; it is provided
    // by RequireJS as a compatibility feature for CommonJS.
    else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    }

    // --- Standard ---
    //
    // The "root" variable represents the global scope in this
    // context; any object exported onto this variable becomes part of the
    // global scope. In this module, "this" is passed as root, which equates to
    // "window".
    else {
        factory(root);
    }

}(this, function(exports) {

    /**
     * Constant which provides the version of the SDK. If your code depends on
     * a specific version of the SDK, use this constant to perform validation.
     * @type {String}
     */
    var VERSION = '1.0.0';


    /**
     * Ceros SDK Namespace
     * NOTE: This must be prepended to all message names!
     * @type {String}
     */
    var NAMESPACE = 'ceros.sdk.player:';

    /**
     * Ceros SDK Events
     */
    var EVENTS = {
        PAGE_CHANGE : 'page.changed',
        PAGE_CHANGING : 'page.changing',
        COMPONENT_CLICKED : 'component.clicked',
        LAYER_SHOWN : 'layer.shown',
        LAYER_HIDDEN : 'layer.hidden',
        SOCIAL_SHARE : 'social.share',
        ANIMATION_STARTED : 'animation.started',
        ANIMATION_ENDED : 'animation.ended',
        VIDEO_PLAYED : 'video.played'
    };

    var PAGESTATE = {
        ENABLED : 'enabled',
        DISABLED : 'disabled'
    };

    var SHARING_TYPES = {
        FACEBOOK  : 'facebook',
        TWITTER   : 'twitter',
        PINTEREST : 'pinterest',
        EMAIL     : 'email'
    };

    var INTERNAL_SHARE_TYPES = {};
    INTERNAL_SHARE_TYPES['share-facebook']  = SHARING_TYPES.FACEBOOK;
    INTERNAL_SHARE_TYPES['share-twitter']   = SHARING_TYPES.TWITTER;
    INTERNAL_SHARE_TYPES['share-pinterest'] = SHARING_TYPES.PINTEREST;
    INTERNAL_SHARE_TYPES['share-email']     = SHARING_TYPES.EMAIL;

    /**
     * Don't log anything - default
     * @type {Number}
     */
    var LOG_NONE = 0;


    /**
     * Only log errors/failures
     * @type {Number}
     */
    var LOG_ERROR = 1;


    /**
     * Log warnings and errors
     * @type {Number}
     */
    var LOG_WARN = 2;


    /**
     * Log general info, warnings and errors
     * @type {Number}
     */
    var LOG_INFO = 3;


    /**
     * Log everything, including low level debug info
     * @type {Number}
     */
    var LOG_DEBUG = 4;


    /**************************************************************************
     * Private Methods
     **************************************************************************/

    /**
     * Check script tags on the page and find the one that includes this file. Grab the 'data-debug' attribute
     * and use it to determine and return the logging level.
     * @return {Number} - Default to LOG_NONE
     * @private
     */
    var _getLogLevel = function() {
        var scripts = document.getElementsByTagName("script");
        for (var i = 0, len = scripts.length; i < len; i++) {
            var script = scripts[i];
            var src = script.getAttribute("src");

            if(src && src.indexOf('embedded-player-sdk') !== -1) {
                var dataDebug = script.getAttribute("data-debug");

                if(dataDebug)
                    return _checkLogLevel(dataDebug);
            }
        }

        return LOG_NONE;
    };

    /**
     * Validates the log level string and returns a valid log level value
     * @param val String The log level value
     * @returns {String} A valid log level
     * @private
     */
    var _checkLogLevel = function(val) {
        var log = LOG_NONE;

        if(typeof val === 'string') {
            switch(val.toLowerCase()) {
                case 'debug':
                    log = LOG_DEBUG;
                    break;
                case 'info':
                    log = LOG_INFO;
                    break;
                case 'warn':
                    log = LOG_WARN;
                    break;
                case 'error':
                    log = LOG_ERROR;
                    break;
                default:
                    log = LOG_NONE;
                    break;
            }
        }

        return log;
    };

    /**
     * Console Polyfill
     * @type {}
     * @private
     */
    var _console = {
        log : window.console && typeof console.log === 'function' ? function(){console.log.apply(console,arguments)} : function(){}
    };
    _console.info = window.console && typeof console.info === 'function' ? function(){console.info.apply(console,arguments)} : _console.log;
    _console.warn = window.console && typeof console.warn === 'function' ? function(){console.warn.apply(console,arguments)} : _console.log;
    _console.error = window.console && typeof console.error === 'function' ? function(){console.error.apply(console,arguments)} : _console.log;


    /**
     * Set the log level based upon the scripts 'data-debug' attribute. If it doesn't exist, default to LOG_NONE.
     * @type {*}
     */
    var logLevel = _getLogLevel();


    /**
     * Internal logging function
     * @param msg - Message to output to the console
     * @param level - Highest logging level to display the message for
     * @private
     */
    var _log = function(msg, level) {
        if(logLevel < level)
            return;

        msg = 'Ceros Player SDK :: ' + msg;
        switch(level) {
            case LOG_DEBUG:
                _console.log(msg);
                break;
            case LOG_INFO:
                _console.info(msg);
                break;
            case LOG_WARN:
                _console.warn(msg);
                break;
            case LOG_ERROR:
                _console.error(msg);
                break;
        }
    };

    /**
     * Post a message to an iframe.  Pass in the iframe and a payload to
     * send to it.
     *
     * @access  private
     * @param frameContentWindow
     * @param   {Object}    payload     The JSON object to pass as a payload.
     *
     * @return  void
     */
    var postMessage = function(frameContentWindow, payload) {
        payload = JSON.stringify(payload);
        _log('Posting message to an iframe: ' + payload, LOG_DEBUG);
        frameContentWindow.postMessage(payload,'*');
    };

    /**
     * Acts as a wrapper around an iframes contentWindow and allows us to send
     * messages and events to it.
     *
     * @param   {contentWindow}    frameContentWindow  The iframe's content window.  We
     *      will use this content window when sending messages.
     */
    var CrossFrameMessenger = function(frameContentWindow) {
        this.frameContentWindow = frameContentWindow;
    };

    CrossFrameMessenger.prototype = {

        /**
         * Send a message to an iframe's content window.  Use this function to
         * communicate with Ceros Experiences embedded on the same page as the SDK
         * in iframes.  First find the iframe and get its contentWindow.  Name will
         * be the name of the event (namespaced), parameters are a JSON object of
         * parameters to send along with the event.
         *
         * @access public
         *
         * @param   {string}    name    The name of the event we are sending to the experience.
         * @param   {object}    parameters  A JSON object to be encoded and sent with the message
         *      containing any parameters we wish to send with the event.
         *
         *
         * @return {void}
         */
        send: function(name, parameters) {

            var payload =  {
                name : NAMESPACE+name, // This needs to be populated with a [namespace + message name]
                version: VERSION,
                params: parameters
            };

            postMessage(this.frameContentWindow, payload);
        }
    };


    var EventHandler = function() {
        /**
         * Event handlers for events that need to be handled absent the context of an experience.
         * Namely, the 'ready' event.
         */
        this.globalEventHandlers = {};

        this.experienceSpecificEventHandlers = {};

        this.objectSpecificEventHandlers = {};
    }

    EventHandler.prototype = {

        /**
         * Registers an global event handler for a given event.
         *
         * @param {string} eventName  name of the event, matching one of the CerosSDK.EVENTS constants
         * @param {function} callback   the event handler
         *
         */
        registerGlobalHandler: function(eventName, callback) {
            if (typeof callback != 'function') {
                _log('Attempt to register a non-function event handler.', LOG_WARN);
                return;
            }

            if ( ! this.globalEventHandlers.hasOwnProperty(eventName)) {
                this.globalEventHandlers[eventName] = [];
            }
            this.globalEventHandlers[eventName].push(callback);
        },

        /**
         * Registers an experience-wide event handler for a given event, scoped to a particular experience.
         *
         * @param {string} experienceId
         * @param {string} eventName  name of the event, matching one of the CerosSDK.EVENTS constants
         * @param {function} callback   the event handler
         *
         */
        registerExperienceSpecificHandler: function(experienceId, eventName, callback) {
            if (typeof callback != 'function') {
                _log('Attempt to register a non-function event handler.', LOG_WARN);
                return;
            }

            if (! this.experienceSpecificEventHandlers[experienceId]){
                this.experienceSpecificEventHandlers[experienceId] = {};
            }

            if ( ! this.experienceSpecificEventHandlers[experienceId].hasOwnProperty(eventName)) {
                this.experienceSpecificEventHandlers[experienceId][eventName] = [];
            }
            this.experienceSpecificEventHandlers[experienceId][eventName].push(callback);
        },

        /**
         * Registers an event handler for a given event, scoped to a particular page, layer, or component.
         * This does not need to take an experienceId, because object IDs are unique across all experiences.
         *
         * @param {string} experienceId  the id of the experience
         * @param {string} objectId   the id of the page, layer, or component
         * @param {string} eventName  name of the event, matching one of the CerosSDK.EVENTS constants
         * @param {function} callback   the event handler
         *
         */
        registerObjectSpecificHandler: function(experienceId, objectId, eventName, callback){
            if (typeof callback != 'function') {
                _log('Attempt to register a non-function event handler.', LOG_WARN);
                return;
            }

            if (! this.objectSpecificEventHandlers.hasOwnProperty(experienceId)){
                this.objectSpecificEventHandlers[experienceId] = {};
            }

            if (! this.objectSpecificEventHandlers[experienceId].hasOwnProperty(eventName)) {
                this.objectSpecificEventHandlers[experienceId][eventName] = {};
            }

            if (! this.objectSpecificEventHandlers[experienceId][eventName].hasOwnProperty(objectId)){
                this.objectSpecificEventHandlers[experienceId][eventName][objectId] = [];
            }

            this.objectSpecificEventHandlers[experienceId][eventName][objectId].push(callback);
        },

        /**
         * Any event (cross-window message) we receive is processed here.
         */
        handleEvent: function(source, name, params) {
            var experienceId = params.experienceId;

            if (this.globalEventHandlers.hasOwnProperty(name)){
                for (var z = 0; z < this.globalEventHandlers[name].length; z++){
                    this.globalEventHandlers[name][z](params, source);
                }
            }

            if (this.experienceSpecificEventHandlers[experienceId] && this.experienceSpecificEventHandlers[experienceId].hasOwnProperty(name)) {
                for(var i = 0; i < this.experienceSpecificEventHandlers[experienceId][name].length; i++) {
                    this.experienceSpecificEventHandlers[experienceId][name][i](params, source);
                }
            }

            if (this.objectSpecificEventHandlers[experienceId] && this.objectSpecificEventHandlers[experienceId].hasOwnProperty(name)) {
                if (params.layerId) {
                    var layerId = params.layerId;
                    if (this.objectSpecificEventHandlers[experienceId][name][layerId]) {
                        var callbacksForThisLayer = this.objectSpecificEventHandlers[experienceId][name][layerId];
                        for (var k = 0; k < callbacksForThisLayer.length; k++) {
                            callbacksForThisLayer[k](params);
                        }
                    }
                }

                if (params.componentId){
                    var componentId = params.componentId;
                    if (this.objectSpecificEventHandlers[experienceId][name][componentId]){
                        var callbacksForThisComponent = this.objectSpecificEventHandlers[experienceId][name][componentId];
                        for (var x = 0; x < callbacksForThisComponent.length; x++){
                            callbacksForThisComponent[x](params);
                        }
                    }
                }
            }
        },

        /**
         *
         */
        stripNamespace: function(name) {
            var re = new RegExp("^" + NAMESPACE);
            return name.replace(re, '');
        },

        /**
         * Process a message recieved through window.postMessage().
         *
         * @param   {object}    message The message received from postMessage.
         */
        processMessage: function(message) {
            try {
                var data = JSON.parse(message.data);

                if (data.name) {
                    if (data.name.indexOf(NAMESPACE) !== 0){
                        _log("Received a message that wasn't namespaced to the Ceros SDK: " + data.name, LOG_DEBUG);
                        return;
                    }
                    data.name = this.stripNamespace(data.name);
                    _log('Received message: ' + data.name, LOG_DEBUG);

                    this.handleEvent(message.source, data.name, data.params);
                }
            }
            catch(e){
                _log('Error processing message: ' + e, LOG_WARN)
            }
        }

    };


    /**************************************************************************
     * Class Definitions
     **************************************************************************/

    /**
     * Deferred
     *
     * An implementation of JQuery's Deferred object.  We want to be able to
     * return a deferred with out relying on the precense of JQuery.  So we're
     * simply implementing the required functionality.  The interface and behavior
     * is as close to JQuery as we can make it.  With luck, users won't even notice
     * the difference.
     */
    var Deferred = function() {
        this._doneCallbacks = [];
        this._failCallbacks = [];
        this._alwaysCallbacks = [];

        this.STATE =  {
                PENDING: 'pending',
                RESOLVED: 'resolved',
                REJECTED: 'rejected'
        };

        this._state = this.STATE.PENDING;

        this._arguments = null;
    };

    Deferred.prototype = {

        executeCallbacks: function(list, args) {
            this._arguments = Array.prototype.slice.call(args);

            var index = 0;
            for(index = 0; index < list.length; index++) {
                list[index].apply(null, this._arguments);
            }
        },

        done: function(callback) {
            if (this._state == this.STATE.RESOLVED) {
                callback.apply(null, this._arguments);
                return this;
            }

            this._doneCallbacks.push(callback);
            return this;
        },

        fail: function(callback) {
            if (this._state == this.STATE.REJECTED) {
                callback.apply(null, this._arguments);
                return this;
            }

            this._failCallbacks.push(callback);
            return this;
        },

        always: function(callback) {
            if (this._state != this.STATE.PENDING) {
                callback.apply(null, this._arguments);
                return this;
            }

            this._alwaysCallbacks.push(callback);
            return this;
        },

        resolve: function() {
            this._state = this.STATE.RESOLVED;
            this.executeCallbacks(this._doneCallbacks, arguments);
            this.executeCallbacks(this._alwaysCallbacks, arguments);
            return this;
        },

        reject: function() {
            this._state = this.STATE.REJECTED;
            this.executeCallbacks(this._failCallbacks, arguments);
            this.executeCallbacks(this._alwaysCallbacks, arguments);
            return this;
        },

        state: function() {
            return this._state;
        }


    };

    /**
     * CerosExperience
     *
     * Our experience object, wrapping and providing access to a CerosExperience on
     * the page.
     *
     * @param {string}  experienceId   the ID of this experience
     * @param {object}  experienceData  contains all the data we will need about the experience - sent from the player
     * @param {CrossFrameMessenger}  messenger   what we use to talk to the embedded experience
     */
    var CerosExperience = function(experienceId, experienceData, messenger, experienceTracker) {
        this.experienceId = experienceId;
        this.window = experienceData.source;
        this.experienceTitle = experienceData.experienceTitle;
        this.allPageData = experienceData.allPageData;
        this.documentVersion = experienceData.documentVersion;
        this.currentPageNumber = experienceData.currentPageNumber;
        this.tags = experienceData.tags;
        this.messenger = messenger;
        this.experienceTracker = experienceTracker;

        var _this = this;
        CerosSDK.eventHandler.registerExperienceSpecificHandler(this.experienceId, 'page.changed', function(data){
            if (_this.experienceTracker.cerosExperienceObjects[data.experienceId]) {
                _this.experienceTracker.cerosExperienceObjects[data.experienceId].currentPageNumber = data.pageNum;
            }
        });

        var componentMap = {};
        var layerMap = {};
        var pageMap = {};

        for (var i = 0; i < this.allPageData.length; i++){
            var page = this.allPageData[i];
            for (var j = 0; j < page.layers.length; j++){
                var layer = page.layers[j];
                layerMap[layer.id] = layer;
                for (var k = 0; k < layer.objects.length; k++){
                    componentMap[layer.objects[k].id] = layer.objects[k];
                }
            }
            pageMap[page.pageSlug] = page;
        }

        this.componentMap = componentMap;
        this.layerMap = layerMap;
        this.pageMap = pageMap;
    };

    CerosExperience.prototype = {
        /**
         * Returns a string that contains the title of the Ceros experience.
         *
         * @return  {string}    Title   The title of the experience.
         */
        getTitle: function() {
            return this.experienceTitle;
        },

        /**
         * Returns a CerosPage representing only the current page of the
         * experience.
         *
         * @return  {CerosPage} CerosPage   A CerosPage object representing
         *      the page the Experience is currently on.
         */
        getCurrentPage: function() {
            return new CerosPage(this.allPageData[this.currentPageNumber - 1], this.messenger, this.experienceId);
        },

        /**
         * Returns a CerosPage representing either the single page that has
         * ID pageID, or null if the ID can not be found.
         *
         * @param   {string}    pageId The SDK ID of the page to retrieve.
         *
         * @return  {CerosPage}    CerosPage  A CerosPage object representing
         *      the page retrieved or null if no page is found.
         */
        findPageById: function(pageId) {
            if (this.pageMap[pageId]){
                return new CerosPage(this.pageMap[pageId], this.messenger, this.experienceId);
            }

            return null;
        },

        /**
         * Returns a CerosPageCollection containing all pages in the
         * experience that have been tagged with tagName in the Studio.
         *
         * @param {string} tagName   The name of the tag to use for retrieval.
         * @returns {CerosPageCollection}    A CerosPageCollection object
         *    containing the pages tagged with the given tag.
         */
        findPagesByTag: function(tagName){
            var pages = [];

            if (this.tags[tagName]) {
                for (var i = 0; i < this.tags[tagName].pages.length; i++) {
                    for (var j = 0; j < this.allPageData.length; j++) {
                        if (this.allPageData[j].pageSlug === this.tags[tagName].pages[i]) {
                            pages.push(new CerosPage(this.allPageData[j], this.messenger, this.experienceId));
                        }
                    }
                }
            }

            return new CerosPageCollection(pages, this.messenger);
        },

        /**
         * Navigates the experience to the page specified by pageNum. If
         * pageNum is not a valid page in the experience, the command will do
         * nothing.
         *
         * @param   {number}    pageNum  The number of the page to go to. Must
         *      be between 1 and the total number of pages in the experience,
         *      inclusive.
         *
         * @return  {void}
         */
        goToPage: function(pageNum) {
            this.messenger.send('sdk.experience.page.goto', {pageNum: pageNum});
        },

        /**
         * Navigates the experience to the page directly after the one the user
         * is currently on. If the user is on the last page (if the experience
         * is not a carousel), or if the experience only has one page, the
         * command will do nothing.
         *
         * @return {void}
         */
        goToNextPage: function() {
            this.messenger.send('sdk.experience.page.next', {});
        },

        /**
         * Navigates the experience to the page directly before the one the
         * user is currently on. If the user is on the first page (if the
         * experience is not a carousel), or if the experience only has one
         * page, the command will do nothing.
         *
         * @return  {void}
         */
        goToPreviousPage: function() {
            this.messenger.send('sdk.experience.page.previous', {});
        },

        /**
         * Returns a CerosLayerCollection. All layers in the experience are
         * returned.
         *
         * @return  {CerosLayerCollection}  CerosLayerCollection    A
         *      collection of CerosLayer objects representing the layers
         *      contained in the Experience.
         */
        findAllLayers: function() {
            var layers = [];
            for (var i = 0; i < this.allPageData.length; i++){
                var page = this.allPageData[i];
                for (var j = 0; j < page.layers.length; j++){
                    layers.push(this.findLayerById(page.layers[j].id));
                }
            }

            return new CerosLayerCollection(layers, this.messenger);
        },

        /**
         * Returns a CerosLayer representing either the single layer that has
         * ID layerId, or null if the ID can not be found.
         *
         * @param   {string}    layerId The SDK ID of the layer to retrieve.
         *
         * @return  {CerosLayer}    CerosLayer  A CerosLayer object representing
         *      the layer retrieved or null if no layer is found.
         */
        findLayerById: function(layerId) {
            if (this.layerMap[layerId]){
                return new CerosLayer(this.layerMap[layerId], this.messenger, this.experienceId);
            }

            return null;
        },

        /**
         * Returns a CerosLayerCollection containing all layers in the
         * experience that have been tagged with tagName in the Studio.
         *
         * @param {string} tagName   The name of the tag to use for retrieval.
         * @returns {CerosLayerCollection}    A CerosLayerCollection object
         *    containing the layers tagged with the given tag.
         */
        findLayersByTag: function(tagName){
            var layers = [];
            if (this.tags[tagName]){
                for (var i = 0; i < this.tags[tagName].layers.length; i++){
                    layers.push(this.findLayerById(this.tags[tagName].layers[i]));
                }
            }

            return new CerosLayerCollection(layers, this.messenger);
        },

        /**
         * Returns a CerosComponent that represents the component with ID
         * componentId. If there is no component with this ID, the command
         * will return null.
         *
         * @param   {string}   componentId  the SDK ID of the component to retrieve
         *
         * @return  {CerosComponent}    CerosComponent  An object representing the
         *      component corresponding to the given ID or null if no component is
         *      found.
         */
        findComponentById: function(componentId) {
            if (this.componentMap[componentId]){
                return new CerosComponent(this.componentMap[componentId], this.messenger, this.experienceId);
            }

            return null;
        },

        /**
         * Returns a CerosComponentCollection containing all components in the
         * experience that have been tagged with tagName in the Studio.
         *
         * @param   {string}    tagName The name of the tag to use for retrieval.
         *
         * @return  {CerosComponentCollection}    A CerosComponentCollection object
         *    containing the components tagged with the given tag.
         */
        findComponentsByTag: function(tagName) {
            var components = [];
            if (this.tags[tagName]){
                for (var i = 0; i < this.tags[tagName].components.length; i++){
                    components.push(this.findComponentById(this.tags[tagName].components[i]));
                }
            }

            return new CerosComponentCollection(components, this.messenger);
        },

        /**
         * Subscribe to an event on the experience
         *
         * @param {CerosSDK.EVENTS}  event   The event to subscribe to
         * @param {function}  callback   A callback function to be called when the event is fired
         */
        subscribe : function(event, callback){
            var _this = this;

            if (event === EVENTS.PAGE_CHANGE || event === EVENTS.PAGE_CHANGING){
                CerosSDK.eventHandler.registerExperienceSpecificHandler(this.experienceId, event, function(callbackData){
                    var newPage = new CerosPage(_this.allPageData[_this.currentPageNumber - 1], _this.messenger, this.experienceId);
                    callback(newPage);
                });
            }
            else if (event === EVENTS.SOCIAL_SHARE){
                CerosSDK.eventHandler.registerExperienceSpecificHandler(this.experienceId, event, function(callbackData){
                    var theComponent = _this.findComponentById(callbackData.componentId);
                    var shareType = INTERNAL_SHARE_TYPES[callbackData.shareType];
                    callback(theComponent, shareType);
                });
            }
            else if (event === EVENTS.COMPONENT_CLICKED || event === EVENTS.VIDEO_PLAYED ||
                     event === EVENTS.ANIMATION_STARTED ||
                event === EVENTS.ANIMATION_ENDED){
                CerosSDK.eventHandler.registerExperienceSpecificHandler(this.experienceId, event, function(callbackData){
                    var theComponent = _this.findComponentById(callbackData.componentId);
                    callback(theComponent);
                });
            }
            else if (event === EVENTS.LAYER_SHOWN || event === EVENTS.LAYER_HIDDEN){
                CerosSDK.eventHandler.registerExperienceSpecificHandler(this.experienceId, event, function(callbackData){
                    var layer = _this.findLayerById(callbackData.layerId);
                    callback(new CerosLayer(layer, _this.messenger));
                })
            }
        }
    };

    var CerosComponent = function(componentData, messenger, experienceId) {
        this.id = componentData.id;
        this.type = componentData.type;
        this.tags = componentData.tags;
        this.payload = componentData.payload;
        this.messenger = messenger;
        this.experienceId = experienceId;
    };

    CerosComponent.prototype = {
        /**
         * Returns any payload you have configured for the component in the Studio.
         *
         * @returns {string}  The payload of the component
         */
        getPayload: function() {
            return this.payload;
        },

        /**
         * If this component is a video, this will start video playback.
         */
        startVideo: function() {
            if (this.type === "video"){
                this.messenger.send('sdk.component.video.start', {componentId: this.id});
            }
        },

        /**
         * If this component is a video, this will stop video playback.
         */
        stopVideo: function() {
            if (this.type === "video"){
                this.messenger.send('sdk.component.video.stop', {componentId: this.id});
            }
        },

        /**
         * Simulates the user clicking on this component. Any click interactions that
         * have been configured for this component in the studio will be triggered.
         */
        click: function(){
            this.messenger.send('sdk.component.click', {componentId: this.id}, null);
        },

        /**
         * Makes this component visible, and runs any entry animations that have been
         * configured for this component in the studio. If the component is already visible,
         * this will only have the effect of running entry animations.
         */
        show: function(){
            this.messenger.send('sdk.component.show', {componentId: this.id}, null);
        },

        /**
         * Hides the component. If the component is already hidden, this will have no effect.
         */
        hide: function(){
            this.messenger.send('sdk.component.hide', {componentId: this.id}, null);
        },

        /**
         * Subscribes to events fired on this specific component.
         *
         * @param {CerosSDK.EVENTS} event  The event to subscribe to.
         * @param {function} callback    A callback function to be called when the event is fired.
         */
        subscribe : function(event, callback){
            var _this = this;

            if (event === EVENTS.SOCIAL_SHARE){
                CerosSDK.eventHandler.registerObjectSpecificHandler(this.experienceId, this.id, event, function(callbackData){
                    var shareType = INTERNAL_SHARE_TYPES[callbackData.shareType];
                    callback(_this, shareType);
                });
            }
            else if (event === EVENTS.COMPONENT_CLICKED || event === EVENTS.ANIMATION_STARTED ||
                event === EVENTS.ANIMATION_ENDED){
                CerosSDK.eventHandler.registerObjectSpecificHandler(this.experienceId, this.id, event, function(callbackData){
                    callback(_this);
                });
            }

            else if (event === EVENTS.VIDEO_PLAYED){
                if (this.type === "video"){
                    CerosSDK.eventHandler.registerObjectSpecificHandler(this.experienceId, this.id, event, function(callbackData){
                        callback(_this);
                    });
                }
            }
        }
    };


    var CerosComponentCollection = function(components, messenger) {
        this.components = components;
        this.messenger = messenger;
    };

    CerosComponentCollection.prototype = {
        /**
         * Simulates the user clicking on all components in this collection. Any interactions that have been
         * configured in the Studio for these components will be triggered.
         */
        click: function(){
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].click();
            }
        },

        /**
         * If any of these components are videos, this will start video playback on them.
         */
        startVideo: function() {
            for (var i = 0; i < this.components.length; i++) {
                if (this.components[i].type === "video") {
                    this.components[i].startVideo();
                }
            }
        },

        /**
         * If any of these components are videos, this will stop video playback on them.
         */
        stopVideo: function() {
            for (var i = 0; i < this.components.length; i++) {
                if (this.components[i].type === "video") {
                    this.components[i].stopVideo();
                }
            }
        },

        /**
         * Makes these components visible, and runs any entry animations that have been
         * configured for these components in the studio. If a component is already visible,
         * this will only have the effect of running entry animations on that component.
         */
        show: function(){
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].show();
            }
        },

        /**
         * Hides the components. If a component is already hidden, this will have no effect on that component.
         */
        hide: function(){
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].hide();
            }
        },

        /**
         * Subscribes to events fired on these specific components.
         *
         * @param {CerosSDK.EVENTS} event  The event to subscribe to.
         * @param {function} callback    A callback function to be called when the event is fired.
         */
        subscribe: function(event, callback){
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].subscribe(event, callback);
            }
        }

    };

    var CerosLayer = function(layerData, messenger, experienceId) {
        this.id = layerData.id;
        this.tags = layerData.tags;
        this.payload = layerData.payload;
        this.objects = layerData.objects;
        this.messenger = messenger;
        this.experienceId = experienceId;
    };

    CerosLayer.prototype = {
        /**
         * Retrieves any payload that has been configured for this layer in the Studio.
         *
         * @returns {string}  The payload of the layer
         */
        getPayload: function() {
            return this.payload;
        },

        /**
         * Makes this layer visible.
         */
        show: function() {
            this.messenger.send('sdk.layer.show', {layerId: this.id});
        },

        /**
         * Hides this layer.
         */
        hide: function() {
            this.messenger.send('sdk.layer.hide', {layerId: this.id});
        },

        /**
         * Retrieves all components in the layer.
         *
         * @returns {CerosComponentCollection}
         */
        findAllComponents: function() {
            var components = [];
            for (var i = 0; i < this.objects.length; i++){
                components.push(new CerosComponent(this.objects[i], this.messenger, this.experienceId));
            }
            return new CerosComponentCollection(components, this.messenger);
        },

        /**
         * Subscribes to events fired on this specific layer.
         *
         * @param {CerosSDK.EVENTS} event  The event to subscribe to.
         * @param {function} callback    A callback function to be called when the event is fired.
         */
        subscribe : function(event, callback){
            if (event === EVENTS.LAYER_SHOWN || event === EVENTS.LAYER_HIDDEN){
                var _this = this;
                CerosSDK.eventHandler.registerObjectSpecificHandler(this.experienceId, this.id, event, function(callbackData){
                    callback(_this);
                });
            }
        }
    };


    var CerosLayerCollection = function(layers, messenger) {
        this.layers = layers;
        this.messenger = messenger;
    };

    CerosLayerCollection.prototype = {
        /**
         * Makes all layers in this collection visible.
         */
        show: function() {
            for (var i = 0; i < this.layers.length; i++){
                this.layers[i].show();
            }
        },

        /**
         * Hides all layers in this collection.
         */
        hide: function() {
            for (var i = 0; i < this.layers.length; i++){
                this.layers[i].hide();
            }
        },

        /**
         * Subscribes to events fired on these specific layers.
         *
         * @param {CerosSDK.EVENTS} event  The event to subscribe to.
         * @param {function} callback    A callback function to be called when the event is fired.
         */
        subscribe : function(event, callback){
            for (var i = 0; i < this.layers.length; i++) {
                this.layers[i].subscribe(event, callback);
            }
        }
    };

    var CerosPage = function(pageData, messenger, experienceId) {
        this.pageNumber = pageData.pageNumber;
        this.pageSlug = pageData.pageSlug;
        this.tags = pageData.tags;
        this.payload = pageData.payload;
        this.layers = pageData.layers;
        this.enabled = true;
        this.messenger = messenger;
        this.experienceId = experienceId;
    };

    CerosPage.prototype = {
        /**
         * Retrieves any payload that has been configured for this page in the Studio.
         *
         * @returns {string}   The payload that has been configured in the Studio.
         */
        getPayload: function() {
            return this.payload;
        },

        /**
         * Disables this page. A disabled page will not be able to be navigated to until re-enabled.
         */
        disable: function() {
            this.messenger.send('sdk.page.disable', {pageNum: this.pageNumber});
            this.enabled = false;
        },

        /**
         * Enables this page if it has been previously disabled.
         */
        enable: function() {
            this.messenger.send('sdk.page.enable', {pageNum: this.pageNumber});
            this.enabled = true;
        },

        /**
         * Retrieves all layers on this page
         *
         * @returns {CerosLayerCollection}  The collection of layers on this page.
         */
        findAllLayers: function() {
            var layers = [];
            for (var i = 0; i < this.layers.length; i++){
                layers.push(new CerosLayer(this.layers[i], this.messenger, this.experienceId));
            }
            return new CerosLayerCollection(layers, this.messenger);
        },

        /**
         * Starts all entry animations that have been configured on this page
         */
        startAnimations: function() {
            this.messenger.send('sdk.page.animations.start', {pageSlug: this.pageSlug});
        },

        /**
         * Pauses any running animations on this page.
         */
        pauseAnimations: function() {
            this.messenger.send('sdk.page.animations.pause', {pageSlug: this.pageSlug});
        },

        /**
         * Returns a value representing whether this page is enabled or disabled.
         *
         * @returns {PAGESTATE}  The state of this page.
         */
        getPageState: function() {
            if (this.enabled){
                return PAGESTATE.ENABLED;
            }
            else{
                return PAGESTATE.DISABLED;
            }
        }
    };

    var CerosPageCollection = function(pages, messenger) {
        this.pages = pages;
        this.messenger = messenger;
    };

    CerosPageCollection.prototype = {
        /**
         * Disables all pages in this collection. A disabled page can not be navigated to.
         */
        disable: function() {
            for (var i = 0; i < this.pages.length; i++) {
                this.pages[i].disable();
            }
        },

        /**
         * Enables all pages in this collection that have been previously disabled.
         */
        enable: function() {
            for (var i = 0; i < this.pages.length; i++) {
                this.pages[i].enable();
            }
        }
    };

    /**************************************************************************
     * CerosSDK
     **************************************************************************/

    /**
     * A list of experiences in iframes on the page that have finished loading
     * and declared themselves to be ready.
     */
    var ExperienceTracker = function() {
        this.frameWindows = [];
        this.loadedExperiences = {};
        this.cerosExperienceObjects = {};
        this.experienceDeferreds = {};
        this.finishedLoadingAllExperiences = false;

    };

    ExperienceTracker.prototype = {

        initialize: function() {
            var experiences = document.getElementsByClassName('ceros-experience');
            for(var i = 0; i < experiences.length; i++) {
                this.frameWindows.push(experiences[i].contentWindow);
            }
        },

        /**
         * Once an experience has finished loading (sent us the 'ready' message), we match it
         * up with a DOM element we identified earlier and push it into the loadedExperiences
         * collection. Once all the DOM elements that are supposed to contain experiences
         * have let us know they're ready, we kick off their initial callbacks.
         *
         * @param {object} experienceData   all the experience data we get from the player on initial load
         * @param {string} source   the frame window that the experienceData came from
         */
        addLoadedExperience: function(experienceData, source) {
            var found = false;
            var experienceId = experienceData.experienceId;
            for(var i = 0; i < this.frameWindows.length; i++) {
                if (this.frameWindows[i] == source) {
                    experienceData.source = source;
                    this.loadedExperiences[experienceId] = experienceData;
                    found = true;
                }
            }

            // always make sure a deferred has been created for an experience that has announced itself as ready,
            // even if the experience does not have a ceros-experience class
            if (!this.experienceDeferreds[experienceId]){
                this.experienceDeferreds[experienceId] = new Deferred();
            }

            // If an experience reports itself as ready that we weren't expecting to
            // it's probably because the ceros-experience class was removed from its
            // iframe.  In any case, we have to ignore it or it screws up our ready state.
            if ( ! found ) {
                _log('Make sure you add a class="ceros-experience" attribute on the iframe that contains your Ceros experience!', LOG_ERROR);
                this.experienceDeferreds[experienceId].reject(new Error('Experience "' + experienceId + '" not found.'));
                return;
            }

            _log('Successfully loaded experience "' + experienceId + '"', LOG_DEBUG);

            this.experienceDeferreds[experienceId].resolve(this.generateCerosExperience(experienceId));

            var numLoadedExperiences = 0;
            for (var loadedExperience in this.loadedExperiences){
                if (this.loadedExperiences.hasOwnProperty(loadedExperience)){
                    numLoadedExperiences++;
                }
            }

            //if we've finished loading all the experiences, reject any deferreds that have not been resolved
            if (numLoadedExperiences === this.frameWindows.length){
                this.finishedLoadingAllExperiences = true;
                for (var id in this.experienceDeferreds){
                    if (this.experienceDeferreds.hasOwnProperty(id) &&
                        !(this.experienceDeferreds[id]._state === this.experienceDeferreds[id].STATE.RESOLVED)){

                        this.experienceDeferreds[id].reject(new Error('Experience "' + experienceId + '" not found.'));
                    }
                }
            }
        },

        /**
         * Used by findExperience get the correct experience out of loadedExperiences
         *
         * @param {string} experienceId
         */
        getExperience: function(experienceId) {
            if (!this.experienceDeferreds[experienceId]){
                if (this.finishedLoadingAllExperiences){
                    var deferred = new Deferred();
                    deferred.reject(new Error('Experience "' + experienceId + '" not found.'));
                    return deferred;
                }
                else {
                    this.experienceDeferreds[experienceId] = new Deferred();
                }
            }

            return this.experienceDeferreds[experienceId];
        },

        /**
         * Creates a new CerosExperience object and tracks it
         *
         * @param {string} experienceId
         * @param {object} experienceData OPTIONAL
         * @returns {CerosExperience}
         */
        generateCerosExperience: function(experienceId, experienceData){
            var _this = this;
            var experience = experienceData || _this.loadedExperiences[experienceId];
            if (!experience){
                _log("Experience with ID " + experienceId +
                    " could not be found, but was supposed to have finished loading already.", LOG_ERROR);
            }
            var cerosExperience = new CerosExperience(experienceId, experience, new Messenger(experience.source), _this);
            _this.cerosExperienceObjects[experienceId] = cerosExperience;
            return cerosExperience;
        }
    };

    // This may be extended by injected mocks.  Hacky?
    // Yeah, probably.  But it lets us test with out using
    // a singleton.
    var Messenger = CrossFrameMessenger;

    /**
     * Public Interface
     * @type {Object}
     */
    var CerosSDK = {

        VERSION: VERSION,
        EVENTS: EVENTS,
        SHARING_TYPES: SHARING_TYPES,
        PAGESTATE: PAGESTATE,

        domain: 'view.ceros.com',

        experienceTracker: new ExperienceTracker(),
        eventHandler: new EventHandler(),

        /**
         * Inject a Messenger mock object in to our scope.  It will be used to
         * extend CrossFrameMessenger and then set as the Messenger class.
         *
         * @param   {object}    messenger   A constructor to be used in extending
         *      CrossFrameMessenger.
         *
         * @return {this}
         */
        setMessenger: function(messengerExtension) {
            for(key in messengerExtension.prototype) {
                if (Object.prototype.hasOwnProperty.call(messengerExtension.prototype, key)) {
                    Messenger.prototype[key] = messengerExtension.prototype[key];
                }
            }
            Messenger.prototype.constructor = messengerExtension;
            return Messenger;
        },

        /**
         * Allows us to spy on the eventhandler and trigger messages
         * for testing.
         */
        setEventSpy: function(eventSpy) {
            eventSpy.setEventHandler(this.eventHandler);
            eventSpy.setNamespace(NAMESPACE);
            eventSpy.setVersion(VERSION);
            return this;
        },

        /**
         * Sets the domain to use for dynamically inserted experiences, if they don't live at view.ceros.com
         * @param {string}  domain
         */
        setDomain: function(domain){
            this.domain = domain;
        },

        /**
         * Inserts an experience dynamically into a given DOM element
         *
         * @param {string} accountSlug
         * @param {string} experienceAlias   this is the player alias, aka what you see in the URL
         * @param {Element} containerId
         * @returns {Deferred}
         */
        insertExperience: function(accountSlug, experienceAlias, containerId){
            var _this = this;
            var deferred = new Deferred();
            var container = document.getElementById(containerId);
            if (container) {
                var iframe = document.createElement("iframe");
                iframe.src = window.location.protocol + "//" + this.domain + "/" + accountSlug + "/" + experienceAlias;
                iframe.setAttribute('style', 'display:none');
                iframe.setAttribute('class', 'ceros-experience');
                iframe.setAttribute('allowfullscreen', '');
                container.appendChild(iframe);

                CerosSDK.eventHandler.registerGlobalHandler('ready', function (experienceData, source) {
                    if (experienceData.experienceAlias === experienceAlias) {
                        var aspectRatio = experienceData.documentVersion.viewportWidth / experienceData.documentVersion.viewportHeight;
                        container.setAttribute('style', _this.generateContainerStyleString(aspectRatio));

                        var cerosExperience = _this.experienceTracker.generateCerosExperience(experienceData.experienceId, experienceData);
                        var styleAttributeValue = _this.generateFrameStyleString();
                        iframe.setAttribute('style', styleAttributeValue);
                        deferred.resolve(cerosExperience);
                    }
                });
            }
            return deferred;
        },

        generateContainerStyleString : function(aspectRatio) {
            // The resulting code will have a div that is width auto and therefore adjusts to the width of its
            // container and a bottom padding of the inverse of the aspect ratio.  This will force the dimensions
            // of the div -- including padding -- to have the same aspect ratio of the experience.  Inside it
            // goes the iframe which has 100% width and height.  The reset of the properties are to insulate the
            // styles from the page it is embedded in.

            var bottomPaddingPercentage = (100 / aspectRatio).toFixed(2);

            // we will be outputting will be a compact mess of HTML

            var divStyle = {
                position : 'relative',
                width    : 'auto',
                padding  : '0 0 ' + bottomPaddingPercentage + '%',

                height   : '0',
                top      : '0',
                left     : '0',
                bottom   : '0',
                right    : '0',
                margin   : '0',
                border   : '0 none'
            };

            var divStyleString = "";

            for (var prop in divStyle){
                divStyleString = divStyleString.concat(prop + ":" + divStyle[prop] + ";");
            }

            return divStyleString;
        },

        generateFrameStyleString : function() {
            var frameStyle = {
                position : 'absolute',
                width    : '100%',
                height   : '100%',
                display  : 'inline',
                top      : '0',
                left     : '0',
                bottom   : '0',
                right    : '0',
                margin   : '0',
                padding  : '0',
                border   : '0 none'
            };

            var frameStyleString = "";

            for (var prop in frameStyle){
                frameStyleString = frameStyleString.concat(prop + ":" + frameStyle[prop] + ";");
            }

            return frameStyleString;
        },

        /**
         * Find an experience object on the page.
         *
         * @param   {string}    experienceId    The experience's ID, taken from the
         *      SDK panel.
         */
        findExperience: function(experienceId) {
            return this.experienceTracker.getExperience(experienceId);
        },

        /**
         * Sets the SDK log level. This function can be called at anytime.
         *
         * @param {String} level The log level. Valid levels are:
         *      'debug','info','warn','error','none'.
         */
        setLogLevel: function(level) {
            logLevel = _checkLogLevel(level);
        }
    };

    // Export the interface.
    exports.CerosSDK = CerosSDK;

    // Do we have add event listener?
    if(typeof exports.addEventListener === 'function') {
        exports.addEventListener("DOMContentLoaded", function() {
            CerosSDK.experienceTracker.initialize();
            CerosSDK.eventHandler.registerGlobalHandler('ready', function(experienceData, source) {
                CerosSDK.experienceTracker.addLoadedExperience(experienceData, source);
            });
            exports.addEventListener('message', function(event) {
                CerosSDK.eventHandler.processMessage(event);
            }, false);
        });
    } else {
        _log('The SDK could not attach a message listener to the window! addEventListener() not found!',LOG_WARN);
    }


    return exports.CerosSDK;

}));