'use strict';

/**
 * Requirements
 * @ignore
 */
const EntitiesTask = require('entoj-system').task.EntitiesTask;
const GlobalRepository = require('entoj-system').model.GlobalRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const ContentType = require('entoj-system').model.ContentType;
const CliLogger = require('entoj-system').cli.CliLogger;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const VinylFile = require('vinyl');
const co = require('co');
const babel = require('babel-core');


/**
 * @memberOf task
 */
class JspmPrecompileTask extends EntitiesTask
{
    /**
     * @param {cli.CliLogger} cliLogger
     * @param {model.configuration.PathesConfiguration} pathesConfiguration
     * @param {model.GlobalRepository} globalRepository
     */
    constructor(cliLogger, pathesConfiguration, globalRepository)
    {
        super(cliLogger, globalRepository);

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);

        // Assign options
        this._pathesConfiguration = pathesConfiguration;
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, GlobalRepository] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/JspmPrecompileTask';
    }


    /**
     * @inheritDocs
     */
    get sectionName()
    {
        return 'Precompiling js files';
    }


    /**
     * @type {model.configuration.PathesConfiguration}
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @returns {Promise<Array<VinylFile>>}
     */
    processEntity(entity, buildConfiguration, parameters)
    {
        /* istanbul ignore next */
        if (!entity)
        {
            this.logger.warn(this.className + '::processEntity - No entity given');
            return Promise.resolve(false);
        }

        const scope = this;
        const promise = co(function *()
        {
            const result = [];

            // Iterate all js files
            const sourceFiles = entity.files.filter((file) => file.contentType == ContentType.JS);
            for (const sourceFile of sourceFiles)
            {
                // Transpile file
                const filename = yield scope.pathesConfiguration.relativeToSites(sourceFile.filename);
                const work = scope.cliLogger.work('Transpiling <' + filename + '>');
                const options =
                {
                    presets: [require('babel-preset-es2015')],
                    babelrc: false
                };
                const contents = babel.transform(sourceFile.contents.toString(), options).code;
                const resultFile = new VinylFile(
                    {
                        path: filename,
                        contents: new Buffer(contents)
                    });
                scope.cliLogger.end(work);
                result.push(resultFile);
            }
            return result;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.JspmPrecompileTask = JspmPrecompileTask;
