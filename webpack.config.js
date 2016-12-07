module.exports = {

    entry: {

        main: [
            `core-js`,
            `expose-loader?React!react`,
            `main`
        ]

    },

    output: {

        path: `${__dirname}/build/demo`,
        filename: `main.js`

    },

    module: {

        rules: [ {

            test: /\.js$/,
            loader: `babel-loader`,
            include: [ `${__dirname}/demo` ],
            options: { babelrc: false, presets: [ `es2015`, `react` ], plugins: [ `react-require`, `transform-decorators-legacy`, `transform-class-properties` ] }

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
            ohui: `${__dirname}/sources`
        },

    },

    node: {

        [`fs`]: `empty`,
        [`module`]: `empty`

    },

    plugins: [

        new (require(`webpack`).DefinePlugin)({ [`process.env.TERM_FEATURES`]: JSON.stringify(`true-colors`) }),
        new (require(`extract-text-webpack-plugin`))(`style.css`),
        new (require(`html-webpack-plugin`))()

    ]

}
