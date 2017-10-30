var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var BUILD_DIR = path.resolve(__dirname, './public');
var APP_DIR = path.resolve(__dirname, './app');


const extractLess = new ExtractTextPlugin({
    filename: "styles.css"
});
module.exports = {
    watch: true,
    devtool: 'source-map',
    entry: APP_DIR + '/index.jsx',
    output: {
        path: BUILD_DIR, filename: 'bundle.js'
    }
    ,
    module: {
        rules: [
            {
                test: /\.jsx?/,
                include: APP_DIR,
                exclude: /node_modules/,
                use: [
                    { loader: 'babel-loader' }
                ]
            },
            {
                test: /\.less$/,
                use: extractLess.extract({
                    use: [
                        { loader: "css-loader" },
                        { loader: "less-loader" }
                    ],
                    // use style-loader in development
                    fallback: "style-loader"
                }),
            }
        ]
    },
    plugins: [
        extractLess, // new webpack.optimize.UglifyJsPlugin({ minimize: true })
    ]
};