module.exports = {

    devtool: process.env.NODE_ENV === `production`
       ? `source-map`
       : `cheap-eval-source-map`,

    entry: {

        main: [
            `core-js`,
            `expose-loader?React!react`,
            `main`
        ]

    },

    output: {

        path: `${__dirname}/docs/demo`,
        filename: `main.js`

    },

    module: {

        rules: [ {

            test: /\.js$/,
            loader: `source-map-loader`,
            enforce: `pre`

        }, {

            test: /\.map$/,
            loader: `ignore-loader`

        }, {

            test: /\.js$/,
            loader: `babel-loader`,
            include: [ `${__dirname}/demo` ]

        }, {

            test: /\.js$/,
            loader: `text-loader`,
            include: [ `${__dirname}/examples` ]

        }, {

            test: /\.js$/,
            loader: `babel-loader`,
            include: [ `${__dirname}/sources` ]

        }, {

            test: /\.json$/,
            loader: `json-loader`

        }, {

            test: /\.css$/,
            loader: require(`extract-text-webpack-plugin`).extract({
                fallbackLoader: `style-loader`,
                loader: `css-loader`
            })

        } ]

    },

    resolve: {

        modules: [
            `node_modules`,
            `${__dirname}/demo`
        ],

        alias: {
            [`@manaflair/mylittledom`]: `${__dirname}/sources`
        },

    },

    externals: {

        [`pathwatcher`]: `{}`,
        [`ws`]: true

    },

    node: {

        [`fs`]: `empty`,
        [`module`]: `empty`

    },

    plugins: [

        new (require(`webpack`).DefinePlugin)({ [`process.env.NODE_ENV`]: JSON.stringify(process.env.NODE_ENV), [`process.env.TERM_FEATURES`]: JSON.stringify(`true-colors`), [`ENVIRONMENT_IS_WEB`]: `true` }),
        new (require(`extract-text-webpack-plugin`))(`style.css`),
        new (require(`html-webpack-plugin`))()

    ]

}
