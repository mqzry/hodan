define(["js/data/DataSource", "js/data/Model", "underscore", "flow", "JSON", "js/data/Collection", "require", "js/lib/query/composer/RestQueryComposer"], function (DataSource, Model, _, flow, JSON, Collection, requirejs, RestQueryComposer) {

    var rIdExtractor = /http.+\/([^/]+)$/;

    var RestDataProcessor = DataSource.Processor.inherit('js.data.RestDataSource.RestDataProcessor', {
        _composeSubModel: function (model, action, options, scope) {
            if (scope instanceof Model) {
                var contextDistance = 0;
                var configuration = this.$dataSource.$dataSourceConfiguration.getConfigurationForModelClass(model.factory);
                var parent = contextDistance.$parent;
                var subModelStack = [];
                while (configuration && configuration.$.path) {
                    subModelStack.unshift(configuration);
                    configuration = configuration.$parent;
                }
                var scopeStack = [];
                configuration = this.$dataSource.$dataSourceConfiguration.getConfigurationForModelClass(scope.factory);
                while (configuration && configuration.$.path) {
                    scopeStack.unshift(configuration);
                    configuration = configuration.$parent;
                }
                var i = 0;
                while (scopeStack[i] && subModelStack[i] && scopeStack[i].$.path === subModelStack[i].$.path) {
                    i++;
                }
                contextDistance = subModelStack.length - i;

                if (contextDistance > 0) {
                    var path = [];
                    parent = model;
                    while (contextDistance > 0) {
                        path.unshift(parent.identifier());
                        parent = parent.$context.$contextModel;
                        contextDistance--;
                    }
                    var hash = {};
                    hash[model.idField] = path.join("/");
                    return hash;
                }
            }

            var ret = {};

            ret[model.idField] = model.identifier();

            return ret;
        }
    });

    var RestDataSource = DataSource.inherit("js.data.RestDataSource", {

        defaults: {
            /**
             * The endPoint of the REST API
             * @type String
             */
            endPoint: null,
            /**
             *
             * If needed, the gateway of the REST API
             * @type String
             */
            gateway: null,
            /***
             * Tells the RestDataSource which attribute field to use for context determination of the fetched resources
             * @type Boolean
             */
            determinateContextAttribute: "href",

            determinateContextByGateway: true,

            /**
             * If true the returned payload of a POST get's parsed and written back in the Model
             * @type Boolean
             */
            parsePayloadOnCreate: true,
            /***
             * If true the returned payload of a PUT get's parsed and written back in the Model
             * @type Boolean
             */
            parsePayloadOnUpdate: true,
            /***
             * Sends the used HTTP method as a query parameter and uses the POST method
             * @type Boolean
             */
            useSafeHttpMethods: false,
            /**
             *
             * Set's the default collection page size for fetching collection
             * @type Number
             */
            collectionPageSize: 100,

            /***
             * a suffix like `.json` to add to each request
             * @type String
             */
            suffix: null
        },

        ctor: function () {
            this.$endPointCache = {};
            this.callBase();
        },

        $defaultProcessorFactory: RestDataProcessor,

        initialize: function () {

            if (!this.$.endPoint) {
                this.log("No end-point for RestDataSource defined", "warn");
            }

            if (!this.$.gateway) {
                this.$.gateway = this.$.endPoint;
            }

        },

        _validateConfiguration: function () {
            if (!this.$dataSourceConfiguration) {
                throw "No DataSourceConfiguration specified";
            }
        },

        initializeFormatProcessors: function () {

            var jsonProcessor = new DataSource.JsonFormatProcessor();
            jsonProcessor.regex = /json/;

            this.$formatProcessors.push(jsonProcessor);

        },

        /***
         * creates the context as RestContext
         *
         * @param properties
         * @param parentContext
         * @return {js.core.RestDataSource.RestContext}
         */
        createContext: function (contextModel, properties, parentContext) {
            return new RestDataSource.RestContext(this, contextModel, properties, parentContext);
        },

        /***
         * global query parameter for each REST action
         * @param action {String} Rest action [GET, PUT, DELETE, POST]
         * @param resource {js.data.Model|js.data.Collection} model or collection which gets loaded
         * @param options {Object} options for the request
         * @return {Object}
         */
        getQueryParameters: function (action, resource, options) {

            var params = {};

            if (this.$.useSafeHttpMethods) {
                if (action === RestDataSource.METHOD.DELETE) {
                    params.method = "delete";
                } else if (action === RestDataSource.METHOD.PUT) {
                    params.method = "put";
                }
            }

            if (resource instanceof Collection) {
                _.defaults(params, resource.getQueryParameters(action), resource.getRoot().$context.getQueryParameters());
                if (resource.$.query) {
                    _.defaults(params, this.getQueryComposer().compose(resource.$.query));
                }
            }

            return params;
        },
        /**
         * Returns the header parameter for a request
         * @param {String} method - PUT, POST, DELETE OR GET
         * @param {js.data.Model|js.data.Collection} resource - A model or a collection
         * @returns {Object}
         */
        getHeaderParameters: function (method, resource) {
            return {};
        },

        getQueryComposer: function () {
            return RestQueryComposer.RestQueryComposer;
        },


        _getHttpMethod: function (method) {

            if (this.$.useSafeHttpMethods) {
                if (method === RestDataSource.METHOD.PUT || method === RestDataSource.METHOD.DELETE) {
                    return RestDataSource.METHOD.POST;
                }
            }

            return method;
        },


        getPathComponentsForResource: function (resource) {

            if (resource instanceof Collection) {
                return this.getPathComponentsForModelClass(resource.$modelFactory, resource.$context);
            } else if (resource instanceof Model) {
                return this.getPathComponentsForModel(resource);
            }

            return null;
        },

        getPathComponentsForModel: function (model) {

            if (model) {
                var path = this.getPathComponentsForModelClass(model.factory, model.$context);
                if (path) {
                    if (!model.isNew() && !model.$isDependentObject) {
                        path.push(model.identifier());
                    }

                    return path;
                }

            }

            return null;
        },

        getPathComponentsForModelClass: function (modelClass, context) {

            if (modelClass) {
                var baseConfig = this.$dataSourceConfiguration;
                if (context) {
                    var parents = [];
                    while (context.$contextModel) {
                        parents.push(context.$contextModel);
                        context = context.$contextModel.$context;
                    }
                    while (parents.length) {
                        baseConfig = baseConfig.getConfigurationForModelClass(parents.pop().factory);
                    }
                }

                var config = baseConfig.getConfigurationForModelClass(modelClass);

                if (config) {

                    var path = config.$.path;
                    if (path) {
                        return [path];
                    }
                }
            }

            return null;
        },

        _buildUriForResource: function (resource, endPoint) {


            // map resource to url
            var pathComponents = this.getPathComponentsForResource(resource);

            if (!pathComponents) {
                throw new Error("path for resource unknown");
            }

            // build resourcePath
            var resourcePath = [endPoint || this.$.gateway];
            resourcePath = resourcePath.concat(resource.$context.getPathComponents());
            resourcePath = resourcePath.concat(pathComponents);

            if (this.$.suffix) {
                resourcePath[resourcePath.length - 1] = resourcePath[resourcePath.length - 1] + "." + this.$.suffix;
            }

            return this._resourcePathToUri(resourcePath, resource);

        },

        _resourcePathToUri: function (resourcePath, resource) {
            return resourcePath.join("/");
        },

        /**
         *
         * @param model
         * @param options
         * @param callback function(err, model, options)
         */
        loadModel: function (model, options, callback) {
            var self = this;

            // create url
            var url = this._buildUriForResource(model);

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameters(),
                this.getQueryParameters(RestDataSource.METHOD.GET, model, options));

            if (options.noCache) {
                params.timestamp = (new Date().getTime());
            }

            var headers = {};

            flow()
                .seq("xhr", function (cb) {
                    _.defaults(headers, (options || {}).headers, self.getHeaderParameters(RestDataSource.METHOD.GET, model));
                    // send request
                    self.$stage.$applicationContext.ajax(url, {
                        type: RestDataSource.METHOD.GET,
                        queryParameter: params,
                        headers: headers
                    }, cb);
                })
                .seq(function (cb) {
                    var xhr = this.vars.xhr;

                    if (xhr.status === 200 || xhr.status === 304) {
                        // find processor that matches the content-type
                        self._parseModelPayload(xhr, model, options);

                        cb(null, model, options);

                    } else {
                        self._handleXHRError({
                            url: url,
                            xhr: xhr,
                            queryParameter: params,
                            model: model,
                            options: options
                        }, callback);
                    }
                })
                .exec(function (err) {
                    if (callback) {
                        callback(err, model, options);
                    }
                });

        },

        _parseModelPayload: function (xhr, model, options) {
            var contentType = xhr.getResponseHeader("Content-Type");

            var formatProcessor = this.getFormatProcessorForContentType(contentType);

            if (!formatProcessor) {
                throw new Error("No formatProcessor for content type '" + contentType + "' found", null, options);
            }

            // deserialize data with format processor
            var data = formatProcessor.deserialize(xhr.responses.text);

            var processor = this.getProcessorForModel(model, options);

            // parse data inside processor
            data = processor.parse(model, data, DataSource.ACTION.LOAD, options);

            // set data
            model.set(data);

        },

        /***
         *
         * @param request.url
         * @param request.queryParameter
         * @param request.model
         * @param request.options
         * @param xhr
         * @param callback
         */
        handleCreationSuccess: function (request, xhr, callback) {

            var model = request.model;

            var cb = function (err) {
                if (callback) {
                    callback(err, model, request.options);
                }
            };

            var self = this;

            try { // get location header
                var location = xhr.getResponseHeader('Location');

                if (location) {

                    if (self._parsePayloadOnCreate(request, xhr)) {
                        self._parseModelPayload(xhr, model, request.options);
                    }

                    // extract id
                    var id = this.extractIdFromLocation(location, request);

                    if (id || id === 0) {
                        model.set(model.idField, id);
                        if (model.hrefField) {
                            model.set(model.hrefField, location);
                        }
                        var schema = model.schema, schemaType;
                        for (var schemaKey in schema) {
                            if (schema.hasOwnProperty(schemaKey)) {
                                schemaType = schema[schemaKey];
                                if (schemaType.classof && schemaType.classof(Collection)) {
                                    var contextForChildren = model.getContextForChild(schemaType);
                                    model.set(schemaKey, contextForChildren.createCollection(schemaType, null));
                                }

                            }
                        }

                        model.$context.addEntityToCache(model);

                        // TODO: ask processor if i should call save again to put content
                        cb(null);
                    } else {
                        cb("Id couldn't be extracted");
                    }

                } else {
                    cb('Location header not found');
                }

            } catch (e) {
                cb(e || true);
            }
        },

        _handleResultSuccess: function (request, xhr, cb) {
            var model = request.model;

            var resultType = model.resultType;


            try {
                if (resultType) {
                    var result = model.createEntity(resultType);
                    this._parseModelPayload(xhr, result, request.options);

                    cb(null, result);
                } else {
                    cb("No Result Type defined");
                }
            } catch (e) {
                cb(e);
            }

        },

        _getContext: function (factory, parent, data) {
            if (this.$.determinateContextAttribute) {

                if (!data) {
                    return null;
                }

                if (data.hasOwnProperty(this.$.determinateContextAttribute)) {
                    var path,
                        components,
                        configuration,
                        context = this.root(),
                        contextFactory,
                        id,
                        pathElement, endPoint, gatewayComponents;

                    var href = data[this.$.determinateContextAttribute],
                        match = /(http(s)?:\/\/.+?)\//i.exec(href),
                        gateway = null;

                    if (this.$.determinateContextByGateway === true) {
                        gateway = this.$.gateway;
                    }

                    if (match) {
                        endPoint = match[1];

                        if (!gateway) {

                            path = href.substr(endPoint.length + 1);

                            if (this.$endPointCache.hasOwnProperty(endPoint)) {
                                gateway = this.$endPointCache[endPoint];
                            } else {

                                components = path.split("/");
                                gatewayComponents = [];

                                while (components.length) {
                                    var pathComponent = components.shift();

                                    if (this.$dataSourceConfiguration.getConfigurationByKeyValue("path", pathComponent)) {
                                        gateway = "/" + gatewayComponents.join("/");
                                        this.$endPointCache[endPoint] = gateway;
                                        break;
                                    }

                                    gatewayComponents.push(pathComponent);
                                }
                            }
                        }
                    }

                    gateway = gateway || "";
                    path = href.substr((endPoint || "").length + gateway.length + 1);
                    components = path.split("/");

                    for (var i = 0; i < components.length - 2; i = i + 2) {
                        pathElement = components[i];
                        id = components[i + 1];

                        if (!configuration) {
                            configuration = this.$dataSourceConfiguration.getConfigurationByKeyValue("path", pathElement);
                        } else {
                            configuration = configuration.getConfigurationByKeyValue("path", pathElement);
                        }
                        if (!configuration) {
                            throw new Error("Couldn't find configuration for path element " + i + " of " + components.join("/") + " ");
                        }

                        contextFactory = requirejs(configuration.$.modelClassName.replace(/\./g, "/"));

                        var entity = context.createEntity(contextFactory, id);
                        context = context.getContext(entity);

                    }

                    return context;
                }
            }

            return this.callBase();
        },

        /***
         *
         * @param request.url
         * @param request.queryParameter
         * @param request.model
         * @param request.options
         * @param xhr
         * @param callback
         */
        handleUpdateSuccess: function (request, xhr, callback) {

            var model = request.model;

            if (this._parsePayloadOnUpdate(request, xhr)) {
                this._parseModelPayload(xhr, model, request.options);
            }

            if (callback) {
                callback(null, model, request.options);
            }
        },


        /***
         * @hook
         * @param request
         * @param xhr
         * @returns {Boolean}
         * @private
         */
        _parsePayloadOnCreate: function(request, xhr) {
            return this.$.parsePayloadOnCreate;
        },


        /***
         * @hook
         * @param request
         * @param xhr
         * @returns {Boolean}
         * @private
         */
        _parsePayloadOnUpdate: function(request, xhr) {
            return this.$.parsePayloadOnUpdate;
        },

        extractIdFromLocation: function (location, request) {
            var param = rIdExtractor.exec(location);

            if (param) {
                return param[1];
            }

            return null;
        },

        _saveModel: function (model, options, callback) {
            options = options || {};

            var action = DataSource.ACTION.UPDATE,
                method = RestDataSource.METHOD.PUT;

            if (model._status() === Model.STATE.NEW) {
                action = DataSource.ACTION.CREATE;
                method = RestDataSource.METHOD.POST;
            }

            var processor = this.getProcessorForModel(model, options);
            var formatProcessor = this.getFormatProcessor(action, model);
            var self = this;

            // call save of the processor to save sub models
            flow()
                .seq(function (cb) {
                    processor.saveSubModels(model, options, cb);
                })
                .seq("result", function (cb) {
                    // create url
                    var url = self._buildUriForResource(model);
                    var headers = {};
                    // get queryParameter
                    var params = _.defaults(model.$context.getQueryParameters(),
                        self.getQueryParameters(method, model));
                    _.defaults(headers, (options || {}).headers, self.getHeaderParameters(method, model));

                    method = self._getHttpMethod(method);

                    var data = processor.compose(model, action, options);

                    // format payload
                    var payload = formatProcessor.serialize(data);

                    // send request
                    self.$stage.$applicationContext.ajax(url, {
                        type: method,
                        queryParameter: params,
                        data: payload,
                        headers: headers,
                        xhrCreated: options.xhrCreated,
                        xhrBeforeSend: options.xhrBeforeSend,
                        contentType: formatProcessor.getContentType()
                    }, function (err, xhr) {

                        if (!err) {
                            var request = {
                                xhr: xhr,
                                url: url,
                                queryParameter: params,
                                model: model,
                                options: options
                            };

                            if (action === DataSource.ACTION.CREATE && model.resultType && xhr.status === 200) {
                                self._handleResultSuccess(request, xhr, cb);
                            } else if (action === DataSource.ACTION.CREATE && xhr.status === 201) {
                                self.handleCreationSuccess(request, xhr, cb);
                            } else if (action === DataSource.ACTION.UPDATE && xhr.status === 200) {
                                self.handleUpdateSuccess(request, xhr, cb);
                            } else {
                                self._handleXHRError(request, cb);
                            }
                        } else {
                            cb(err);
                        }

                    });
                })
                .exec(function (err, results) {
                    callback && callback(err, results.result || model, options);
                });


        },
        extractListMetaData: function (collectionPage, payload, options, xhr) {
            return payload;
        },

        extractListData: function (collectionPage, payload, options, xhr) {
            for (var key in payload) {
                if (payload.hasOwnProperty(key)) {
                    if (_.isArray(payload[key])) {
                        return payload[key];
                    }
                }
            }
        },

        loadCollectionPage: function (collectionPage, options, callback) {

            var rootCollection = collectionPage.getRoot(),
                baseConfig = this.$dataSourceConfiguration;
            if (rootCollection.$context && rootCollection.$context.$contextModel) {
                baseConfig = baseConfig.getConfigurationForModelClass(rootCollection.$context.$contextModel.factory);
            }
            var config = baseConfig.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!config) {
                throw new Error("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }
            var modelPathComponents = [config.$.path];


            if (!modelPathComponents) {
                callback("path for model unknown", null, options);
                return;
            }

            var params = {},
                headers = {};

            _.defaults(params, (options || {}).params, this.getQueryParameters(RestDataSource.METHOD.GET, collectionPage.$collection));
            _.defaults(headers, (options || {}).headers, this.getHeaderParameters(RestDataSource.METHOD.GET, collectionPage.$collection));
            _.extend(params, this._getPagingParameterForCollectionPage(collectionPage));

            if (options.noCache) {
                params.timestamp = (new Date()).getTime();
            }
            params.fullData = params.fullData || options.fullData || false;

            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    if (_.isObject(params[key])) {
                        params[key] = JSON.stringify(params[key]);
                    }
                }
            }

            // create url
            var url = this._buildUriForResource(rootCollection);
            var self = this;

            // send request
            this.$stage.$applicationContext.ajax(url, {
                type: RestDataSource.METHOD.GET,
                queryParameter: params,
                headers: headers
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find formatProcessor that matches the content-type
                    var contentType = xhr.getResponseHeader("Content-Type");
                    var formatProcessor = self.getFormatProcessorForContentType(contentType);

                    if (!formatProcessor) {
                        callback("No formatProcessor for content type '" + contentType + "' found", null, options);
                        return;
                    }

                    try {
                        // deserialize data with formatProcessor
                        var payload = formatProcessor.deserialize(xhr.responses.text);

                        // extract meta data
                        var metaData = self.extractListMetaData(collectionPage, payload, options, xhr);

                        collectionPage.setMetaData(metaData);
                        
                        // extract data from list result
                        var data = self.extractListData(collectionPage, payload, options, xhr);

                        var processor = self.getProcessorForCollection(collectionPage);

                        data = processor.parseCollection(collectionPage.getRoot(), data, DataSource.ACTION.LOAD, options);

                        collectionPage.add(data);
                        console.log(collectionPage);
                        callback(null, collectionPage, options);

                    } catch (e) {
                        self.log(e, 'error');
                        callback(e, collectionPage, options);
                    }

                } else {
                    self._handleXHRError({
                        url: url,
                        xhr: xhr,
                        queryParameter: params,
                        collection: rootCollection,
                        options: options
                    }, callback);
                }
            });
        },
        /***
         *
         * @param err.url
         * @param err.xhr
         * @param err.queryParameter
         * @param err.model
         * @param err.options
         * @param callback
         */
        _handleXHRError: function (err, callback) {
            this.trigger('on:xhrError', err);

            callback && callback(err);
        },

        _createSortParameter: function (sortParameters) {
            var parameters = null,
                sortFields = [];
            for (var key in sortParameters) {
                if (sortParameters.hasOwnProperty(key)) {
                    parameters = parameters || {};
                    sortFields.push((sortParameters[key] === -1 ? "+" : "-") + key);
                }
            }
            if (sortFields.length > 0) {
                parameters = {
                    sort: "(" + sortFields.join(",") + ")"
                };
            }
            return parameters;
        },

        _getPagingParameterForCollectionPage: function (collectionPage) {
            var ret = {};
            if (collectionPage.$offset) {
                ret.offset = collectionPage.$offset;
            }
            if (collectionPage.$limit) {
                ret.limit = collectionPage.$limit;
            }
            return ret;

        },

        removeModel: function (model, options, callback) {
            callback = callback || function () {

            };

            // create url
            var url = this._buildUriForResource(model);

            var method = RestDataSource.METHOD.DELETE;

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameters(),
                this.getQueryParameters(method, model));

            method = this._getHttpMethod(method);

            var headers = {};

            _.defaults(headers, (options || {}).headers, this.getHeaderParameters(RestDataSource.METHOD.DELETE, model));

            this.$stage.$applicationContext.ajax(url, {
                type: method,
                queryParameter: params,
                headers: headers
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304 || xhr.status == 202 || xhr.status == 204)) {
                    callback(null, model);
                } else {
                    // TODO: better error handling
                    err = err || "wrong status code";
                    callback(err, model);
                }
            });
        },
        getFormatProcessorForContentType: function (contentType) {
            for (var i = 0; i < this.$formatProcessors.length; i++) {
                var processorEntry = this.$formatProcessors[i];
                if (processorEntry.regex.test(contentType)) {
                    return processorEntry;
                }
            }

            return null;
        }

    });

    RestDataSource.RestContext = DataSource.Context.inherit("js.data.RestDataSource.Context", {

        getPathComponents: function () {

            var path = [];

            if (this.$parent) {
                path = this.$parent.getPathComponents();
            } else {
                return [];
            }

            if (!this.$contextModel) {
                throw new Error("ContextModel missing for non-root-Context");
            }

            var configuration = this.$dataSource.getConfigurationForModelClass(this.$contextModel.factory, this);
            path.push(configuration.$.path, this.$contextModel.identifier());

            return path;

        },

        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$dataSource.$.collectionPageSize || 100
            });

            return this.callBase(factory, options, type);
        },

        getQueryParameters: function () {
            return {};
        }
    });


    RestDataSource.METHOD = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    };

    // TODO: implement XmlProcessor
    RestDataSource.XmlFormatProcessor = DataSource.FormatProcessor.inherit("js.data.RestDataSource.XmlFormatProcessor", {
        serialize: function (data) {
            throw "not implemented";
        },
        deserialize: function (responses) {
            throw "not implemented";
        }
    });

    RestDataSource.RestDataProcessor = RestDataProcessor;

    return RestDataSource;
});